from collections import namedtuple

from django.utils.http import urlencode
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from pros_core.models import ProsNode
from icecream import ic

import requests


ImporterViewSets = namedtuple("ImporterViewsets", ["list"])


def base_view_set_factory(model_class: ProsNode):
    class ListViewSet(ViewSet):
        importer_class = model_class.Importer

        def list(self, request):
            if not request.query_params.get("q"):
                return Response("No query provided for Importer", status=400)

            gnd_response = requests.get(
                f"https://lobid.org/gnd/search?format=json&size=100&q={request.query_params.get('q')}"
            )
            gnd_data = gnd_response.json()

            response = {
                "data": [
                    {
                        "uri": item["id"],
                        "gndIdentifier": item["gndIdentifier"],
                        "label": item["preferredName"],
                    }
                    for item in gnd_data["member"]
                ],
                "totalItems": gnd_data["totalItems"],
            }

            return Response(response)

    return ImporterViewSets(list=ListViewSet)
