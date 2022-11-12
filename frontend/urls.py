from rest_framework import routers

from django.urls import path

from neomodel import db, Q
from .utils import PROS_APPS, PROS_MODELS

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from neomodel.relationship_manager import ZeroOrMore
from pros_core.models import ProsNode


def create_list(model_class):
    def list(self, request):
        def get_rel_data(data):
            data["type"] = model_class.__name__
            for k, v in model_class.nodes.get(uid=data["uid"]).__dict__.items():
                if k in dict(model_class.__all_relationships__):
                    data[k] = [{"label": x.label, "uid": x.uid} for x in v.all()]
                else:
                    data[k] = v
            return data

        # If a text filter is set...
        filter = request.query_params.get("filter")
        if filter:
            # Add `label`` by default
            q = Q(label__icontains=filter)
            if filter_fields := PROS_MODELS[model_class.__name__].meta.get(
                "text_filter_fields"
            ):
                for filter_field in filter_fields:
                    q |= Q(**{f"{filter_field}__icontains": filter})

            nodes = set(model_class.nodes.filter(q))

            # Iterate all the subclasses of the viewed model
            for model in PROS_MODELS[model_class.__name__].subclasses_as_list:

                # If any text_filter_fields are set...
                if filter_fields := model.meta.get("text_filter_fields"):
                    # Bung them together in a Q object with OR
                    sub_q = Q(label__icontains=filter)
                    for filter_field in filter_fields:
                        sub_q |= Q(**{f"{filter_field}__icontains": filter})

                    # Look them up, and add to matched nodes
                    for match in model.model.nodes.filter(sub_q):
                        nodes.add(match)
            # Then get the right fields to return
            node_data = [
                {"real_type": b.real_type, "uid": b.uid, "label": b.label}
                for b in nodes
            ]
        else:
            print(model_class)
            node_data = [
                {"real_type": b.real_type, "uid": b.uid, "label": b.label}
                for b in model_class.nodes.all()
            ]
        # print(node_data)
        return Response(node_data)

    return list


def create_autocomplete(model_class):
    def list(self, request):
        node_data = [
            {"uid": b.uid, "label": b.label, "real_type": b.real_type}
            for b in model_class.nodes.all()
        ]
        return Response(node_data)

    return list


def create_retrieve(model_class: ProsNode):
    def retrieve(self, request, pk=None):
        data = {}
        for k, v in model_class.nodes.get(uid=pk).__dict__.items():
            if k in dict(model_class.__all_relationships__):
                # print("is rel", k)
                data[k] = [
                    {"label": x.label, "uid": x.uid, "real_type": x.real_type}
                    for x in v.all()
                ]
                # print(data[k])
            else:
                # print("is not rel", k)
                data[k] = v
                # print(data[k])

        this = model_class.nodes.get(uid=pk)
        data["properties"] = this.properties
        data["all_related"] = this.all_related()

        data = {**this.properties, **this.all_related()}

        return Response(data)

    return retrieve


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
            related_ids = [r["uid"] for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__].fields[related_name]["relation_to"]
            ].model
            for related_id in related_ids:
                rel_manager.connect(related_model.nodes.get(uid=related_id))

        return Response({"uid": object.uid, "label": object.label, "saved": True})

    return create


def create_update(model_class):
    @db.write_transaction
    def update(self, request, pk=None):
        # #print("REQ", request.data)

        property_data, relation_data = get_property_and_relation_data(
            request, model_class
        )

        model_class.create_or_update({"uid": pk, **property_data})

        object = model_class.nodes.get(uid=pk)

        for related_name, related in relation_data.items():
            related_ids = [r["uid"] for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__].fields[related_name]["relation_to"]
            ].model

            for related in rel_manager.all():
                # ("RELATEDID", related, related_ids, related.uid not in related_ids)
                if related.uid not in related_ids:
                    rel_manager.disconnect(related_model.nodes.get(uid=related.uid))

            for related_id in related_ids:
                rel_manager.connect(related_model.nodes.get(uid=related_id))

        return Response({"uid": pk, "saved": True})

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
            "autocomplete": create_autocomplete(model.model),
        },
    )

    urlpatterns += [
        path(f"{model.app}/{model.model_name.lower()}/", vs.as_view({"get": "list"})),
        path(
            f"{model.app}/autocomplete/{model.model_name.lower()}/",
            vs.as_view({"get": "autocomplete"}),
        ),
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


def construct_subclass_hierarchy(model):
    if model.subclasses:
        return {
            "subclasses": {
                name.lower(): construct_subclass_hierarchy(subclasses)
                for name, subclasses in model.subclasses.items()
            }
        }
    return {}


def build_schema_from_pros_model(models, schema):
    # (models.items())
    for _, model in models.items():
        schema[model.model_name.lower()] = {
            "top_level": True if model.model.__bases__ == (ProsNode,) else False,
            "fields": model.fields,
            "reverse_relations": model.reverse_relations,
            "app": model.app,
            "meta": model.meta,
            **construct_subclass_hierarchy(model),
            "subclasses_list": [m.model_name for m in model.subclasses_as_list],
        }
    return schema


@api_view(["GET"])
def schema(request):
    import time

    # time.sleep(20)
    resp_data = build_schema_from_pros_model(PROS_MODELS, {})
    return Response(resp_data)


urlpatterns.append(path("schema/", schema))
