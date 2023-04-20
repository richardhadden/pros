import datetime

from neomodel import db
from neomodel.exceptions import UniqueProperty
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from pros_core.models import ProsNode
from icecream import ic

from pros_uris.models import URI
from pros_import.models import ProsImporter, ImportedDataDict

import requests


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


def base_view_set_factory(model_class: ProsNode, importer: ProsImporter):
    class ImportViewSet(ViewSet):
        __Importer = importer

        def list(self, request):
            if not request.query_params.get("q"):
                return Response("No query provided for Importer", status=400)

            search_url = self.__Importer.search_url.format(
                search_term=request.query_params.get("q")
            )
            ic(search_url)

            endpoint_response = requests.get(search_url)
            endpoint_data = endpoint_response.json()

            response = self.__Importer.build_list_data(self.__Importer, endpoint_data)

            return Response(response)

        def import_entity(self, request: Request, id: str) -> ImportedDataDict:
            import_request_url = self.__Importer.import_url.format(entity_id=id)
            ic(import_request_url)
            import_response = requests.get(import_request_url)
            import_data = import_response.json()
            ic(import_response)
            ic(import_data)

            imported_entity_data = self.__Importer.do_entity_import(
                self.__Importer, request=request, api_data=import_data
            )
            ic(imported_entity_data)
            return imported_entity_data

        def create(self, request):
            persons_imported = []
            ic(request.data)
            for item_id in request.data:
                person_resp = self.import_entity(request, item_id)
                persons_imported.append(person_resp)
            ic(persons_imported)
            return Response(persons_imported)

    return ImportViewSet
