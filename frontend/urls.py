from rest_framework import routers

from django.urls import path


from .utils import PROS_APPS, PROS_MODELS

from test_app.models import Book
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer


def create_list(model_class):
    def list(self, request):
        data = [b.__dict__ for b in model_class.nodes.all()]
        return Response(data)

    return list


def create_retrieve(model_class):
    def retrieve(self, request, pk=None):
        data = model_class.nodes.get(pk).__dict__
        return Response(data)

    return retrieve


def create_create(model_class):
    def create(self, request):
        print(request.data)
        object = model_class(**request.data)
        object.save()

        return Response({"id": object.id, "saved": True})

    return create


urlpatterns = []

for model in PROS_MODELS:
    vs = type(
        f"{model.model_name}ViewSet",
        (viewsets.ViewSet,),
        {
            "list": create_list(model.model),
            "retrieve": create_retrieve(model.model),
            "create": create_create(model.model),
        },
    )

    urlpatterns += [
        path(f"{model.app}/{model.model_name.lower()}/", vs.as_view({"get": "list"})),
        path(
            f"{model.app}/{model.model_name.lower()}/<int:pk>",
            vs.as_view({"get": "retrieve"}),
        ),
        path(
            f"{model.app}/{model.model_name.lower()}/new/",
            vs.as_view({"post": "create"}),
        ),
    ]


@api_view(["GET"])
def schema(request):
    resp_data = {
        model.model_name.lower(): {"fields": model.properties, "app": model.app}
        for model in PROS_MODELS
    }
    return Response(resp_data)


urlpatterns.append(path("schema/", schema))
