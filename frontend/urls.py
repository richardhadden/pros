from statistics import mode
from rest_framework import routers

from django.urls import path

from neomodel import db
from .utils import PROS_APPS, PROS_MODELS

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from neomodel.relationship_manager import ZeroOrMore


def create_list(model_class):
    def list(self, request):
        def get_rel_data(data):
            for k, v in model_class.nodes.get(uid=data["uid"]).__dict__.items():
                if isinstance(v, ZeroOrMore):
                    data[k] = [x.__dict__ for x in v.all()]
                else:
                    data[k] = v
            return data

        node_data = [get_rel_data(b.__dict__) for b in model_class.nodes.all()]
        return Response(node_data)

    return list


def create_retrieve(model_class):
    def retrieve(self, request, pk=None):
        data = {}
        for k, v in model_class.nodes.get(uid=pk).__dict__.items():
            if isinstance(v, ZeroOrMore):
                data[k] = [x.__dict__ for x in v.all()]
            else:
                data[k] = v
        return Response(data)

    return retrieve


"""
    {'Book': AppModels(app='test_app', model=<class 'test_app.models.Book'>, model_name='Book', fields={'title': {'type': 'property', 'property_type': 'StringProperty', 'default_value': None, 'required': False}, 'published': {'type': 'property', 'property_type': 'DateProperty', 'default_value': None, 'required': False}, 'author': {'type': 'relation', 'relation_type': 'HAS_AUTHOR', 'relation_to': 'Person', 'cardinality': 'ZeroOrMore', 'default_value': []}}),
 'Person': AppModels(app='test_app', model=<class 'test_app.models.Person'>, model_name='Person', fields={'name': {'type': 'property', 'property_type': 'StringProperty', 'default_value': 'John', 'required': False}, 'age': {'type': 'property', 'property_type': 'IntegerProperty', 'default_value': 0, 'required': False}}),
 'Stuff': AppModels(app='test_app', model=<class 'test_app.models.Stuff'>, model_name='Stuff', fields={'stuff_type': {'type': 'property', 'property_type': 'StringProperty', 'default_value': None, 'required': True}}),
 'Thing': AppModels(app='test_app', model=<class 'test_app.models.Thing'>, model_name='Thing', fields={'name': {'type': 'property', 'property_type': 'StringProperty', 'default_value': None, 'required': True}, 'other_fact': {'type': 'property', 'property_type': 'StringProperty', 'default_value': None, 'required': True}})}
"""


def get_property_and_relation_data(request, model_class):
    property_data = {
        k: v
        for k, v in request.data.items()
        if k in PROS_MODELS[model_class.__name__].properties
    }

    relation_data = {
        k: v
        for k, v in request.data.items()
        if k in PROS_MODELS[model_class.__name__].relations
    }
    return property_data, relation_data


def create_create(model_class):
    @db.write_transaction
    def create(self, request):

        property_data, relation_data = get_property_and_relation_data(
            request, model_class
        )

        object = model_class(**property_data)

        object.save()

        for related_name, related in relation_data.items():
            related_ids = [r["id"] for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__].fields[related_name]["relation_to"]
            ].model
            for related_id in related_ids:
                rel_manager.connect(related_model.nodes.get(uid=related_id))

        return Response({"id": object.uid, "saved": True})

    return create


def create_update(model_class):
    @db.write_transaction
    def update(self, request, pk=None):
        print("REQ", request.data)

        property_data, relation_data = get_property_and_relation_data(
            request, model_class
        )

        model_class.create_or_update({"uid": pk, **property_data})

        object = model_class.nodes.get(uid=pk)

        for related_name, related in relation_data.items():
            related_ids = [r["id"] for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__].fields[related_name]["relation_to"]
            ].model

            for related in rel_manager.all():
                print("RELATEDID", related, related_ids, related.uid not in related_ids)
                if related.uid not in related_ids:
                    rel_manager.disconnect(related_model.nodes.get(uid=related.uid))

            for related_id in related_ids:
                rel_manager.connect(related_model.nodes.get(uid=related_id))

        return Response({"id": pk, "saved": True})

    return update


urlpatterns = []

for _, model in PROS_MODELS.items():
    vs = type(
        f"{model.model_name}ViewSet",
        (viewsets.ViewSet,),
        {
            "list": create_list(model.model),
            "retrieve": create_retrieve(model.model),
            "create": create_create(model.model),
            "put": create_update(model.model),
        },
    )

    urlpatterns += [
        path(f"{model.app}/{model.model_name.lower()}/", vs.as_view({"get": "list"})),
        path(
            f"{model.app}/{model.model_name.lower()}/<str:pk>",
            vs.as_view({"get": "retrieve"}),
        ),
        path(
            f"{model.app}/{model.model_name.lower()}/<str:pk>",
            vs.as_view({"put": "put"}),
        ),
        path(
            f"{model.app}/{model.model_name.lower()}/new/",
            vs.as_view({"post": "create"}),
        ),
    ]


@api_view(["GET"])
def schema(request):
    import time

    # time.sleep(1)
    resp_data = {
        model.model_name.lower(): {"fields": model.fields, "app": model.app}
        for _, model in PROS_MODELS.items()
    }
    return Response(resp_data)


urlpatterns.append(path("schema/", schema))
