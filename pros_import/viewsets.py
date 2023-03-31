from collections import namedtuple
import datetime

from django.utils.http import urlencode
from neomodel import db
from neomodel.exceptions import UniqueProperty
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from pros_core.models import ProsNode
from icecream import ic

from test_app.models import Person
from pros_uris.models import URI

import requests


ImporterViewSets = namedtuple("ImporterViewsets", ["list"])


def build_label_extra(item):
    label = ""
    if poo := item.get("professionOrOccupation"):
        label += f"{poo[0]['label']}"
    if item.get("dateOfBirth", []) or item.get("dateOfDeath", []):
        if label:
            label += ", "
        dob = item.get("dateOfBirth")
        dod = item.get("dateOfDeath")
        pob = item.get("placeOfBirth", [{"label": ""}])
        pod = item.get("placeofDeath", [{"label": ""}])
        label += " "
        if dob:
            label += f"b. {dob[0][0:4]} {pob[0]['label']}"
        if dob and dod:
            label += ", "
        if dod:
            label += f"d. {dod[0][0:4]} {pod[0]['label']}"
        label += ""
    return label


def base_view_set_factory(model_class: ProsNode):
    class ImportViewSet(ViewSet):
        importer_class = model_class.Importer

        def list(self, request):
            if not request.query_params.get("q"):
                return Response("No query provided for Importer", status=400)

            search_url = f"https://lobid.org/gnd/search?format=json&size=20&q={request.query_params.get('q')}&filter=type:{request.query_params.get('entity_type').capitalize()}"
            ic(search_url)
            gnd_response = requests.get(search_url)
            gnd_data = gnd_response.json()

            response = {
                "data": [
                    {
                        "uri": item["id"],
                        "id": item["gndIdentifier"],
                        "label": item["preferredName"],
                        "label_extra": build_label_extra(item),
                        "already_in_db": bool(URI.nodes.get_or_none(uri=item["id"])),
                    }
                    for item in gnd_data["member"]
                ],
                "totalItems": gnd_data["totalItems"],
            }

            return Response(response)

        @staticmethod
        def get_entity_or_none_by_gnd(gnd_uri):
            q = """MATCH (e)--(uri:URI {uri: $uri})
                RETURN e
            """
            results, meta = db.cypher_query(
                q, params={"uri": gnd_uri}, resolve_objects=True
            )
            if results:
                return results[0][0]
            return None

        @db.write_transaction
        def import_person(
            self, request: Request, person_id: str
        ):  # RETURN a PERSON REFERENCE AS DICT
            req_url = f"https://lobid.org/gnd/{person_id}.json"

            gnd_response = requests.get(req_url)
            gnd_data = gnd_response.json()

            # Try to get person by GND id if already exists
            person: Person | None = self.get_entity_or_none_by_gnd(gnd_data["id"])
            if person:
                # If person exists already, just return
                return {
                    "uid": person.uid,
                    "label": person.label,
                    "real_type": person.real_type,
                }

            # Otherwise, import the person
            person = Person(
                **{
                    "label": gnd_data["preferredName"],
                    "createdBy": request.user.username,
                    "createdWhen": datetime.datetime.now(datetime.timezone.utc),
                    "modifiedBy": request.user.username,
                    "modifiedWhen": datetime.datetime.now(datetime.timezone.utc),
                }
            )
            person.save()

            gnd_uri = URI(uri=gnd_data["id"], internal=False)
            gnd_uri.save()
            person.uris.connect(gnd_uri)

            for same_as in gnd_data["sameAs"]:
                ic(same_as["id"])
                same_as_uri_from_db = URI.nodes.get_or_none(uri=same_as["id"])
                ic(same_as_uri_from_db)
                if same_as_uri_from_db:
                    person.uris.connect(same_as_uri_from_db)
                else:
                    uri = URI(uri=same_as["id"], internal=False)
                    uri.save()
                    person.uris.connect(uri)

            return {
                "uid": person.uid,
                "label": person.label,
                "real_type": person.real_type,
            }

        def create(self, request):
            persons_imported = []

            for item_id in request.data:
                person_resp = self.import_person(request, item_id)
                persons_imported.append(person_resp)

            return Response(persons_imported)

    return ImportViewSet
