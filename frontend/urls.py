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
from pros_core.filters import icontains

from pypher import Pypher, __


def create_list(model_class):
    def list(self, request):

        # If a text filter is set...
        filter = request.query_params.get("filter")
        if filter:

            x = icontains("s", "label")(filter)
            y = icontains("s", "label")(filter)
            for additional_filter in PROS_MODELS[model_class.__name__].meta.get(
                "text_filter_fields", []
            ):
                print(additional_filter)
                if isinstance(additional_filter, str):
                    x = x.OR(icontains("s", additional_filter)(filter))

                else:
                    f = additional_filter(filter)
                    if isinstance(f, Pypher):
                        y = y.OR(f)

            q = Pypher()
            q.Match.node("s", labels=model_class.__name__)
            q.WHERE(x)
            q.RETURN(__.DISTINCT((__.s)))
            q.UNION
            q.MATCH.node("s", labels=model_class.__name__).rel("p").node("o")
            q.WHERE(y)
            q.RETURN(__.DISTINCT(__.s))

            print(q)
            results, meta = db.cypher_query(str(q), q.bound_params)

            node_data = [r[0] for r in results]

        else:

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
        try:
            this = model_class.nodes.get(uid=pk)
        except Exception:
            return Response(
                status=404, data=f"<{model_class.__name__} uid={pk}> not found"
            )

        data = {**this.properties, **this.direct_relations_as_data()}

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
            related_values = [r for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__].fields[related_name]["relation_to"]
            ].model
            for related_value in related_values:
                rel_manager.connect(
                    related_model.nodes.get(uid=related_value["uid"]),
                    related_value.get("relData") or {},
                )

        return Response({"uid": object.uid, "label": object.label, "saved": True})

    return create


def create_update(model_class):
    @db.write_transaction
    def update(self, request, pk=None):
        # print("REQ", request.data)

        property_data, relation_data = get_property_and_relation_data(
            request, model_class
        )

        model_class.create_or_update({"uid": pk, **property_data})

        object = model_class.nodes.get(uid=pk)
        print(relation_data)
        for related_name, related in relation_data.items():
            print("RELATED", related)
            related_values = [r for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__].fields[related_name]["relation_to"]
            ].model

            # Remove all relations
            for related in rel_manager.all():
                rel_manager.disconnect(related_model.nodes.get(uid=related.uid))

            # And recreate them again so that the data is updated
            for related_value in related_values:
                rel_manager.connect(
                    related_model.nodes.get(uid=related_value["uid"]),
                    related_value.get("relData") or {},
                )
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
            "meta": {
                k: v for k, v in model.meta.items() if not k == "text_filter_fields"
            },
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
