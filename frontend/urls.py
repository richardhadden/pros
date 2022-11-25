import datetime
from rest_framework import routers

from django.urls import path

from neomodel.exceptions import DoesNotExist
from neomodel import db, Q, DateProperty
from neomodel.properties import DateTimeProperty
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
            for additional_filter in PROS_MODELS[model_class.__name__.lower()].meta.get(
                "text_filter_fields", []
            ):
                # print(additional_filter)
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

            # print(q)
            results, meta = db.cypher_query(str(q), q.bound_params)

            node_data = [r[0] for r in results]

        else:
            # TODO: fix as this is a lot of DB thrashing!!
            node_data = [
                {
                    "real_type": b.real_type,
                    "uid": b.uid,
                    "label": b.label,
                    "is_deleted": b.is_deleted,
                    "deleted_and_has_dependent_nodes": b.is_deleted
                    and b.has_dependent_relations(),
                }
                for b in model_class.nodes.all()
            ]
        # print(node_data)
        return Response(node_data)

    return list


def create_autocomplete(model_class):
    def list(self, request):
        node_data = [
            {
                "uid": b.uid,
                "label": b.label,
                "real_type": b.real_type,
                "is_deleted": b.is_deleted,
            }
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

        data = {
            **this.properties,
            "deleted_and_has_dependent_nodes": this.is_deleted
            and this.has_dependent_relations(),
            **this.direct_relations_as_data(),
        }

        return Response(data)

    return retrieve


def prepare_data_value(properties, k, v):
    if isinstance(properties[k], DateProperty):
        v = datetime.date.fromisoformat(v)
    if isinstance(properties[k], DateTimeProperty):
        if v:
            v = datetime.datetime.fromisoformat(v.replace("Z", ""))
        else:
            None

    return v


def get_property_and_relation_data(request, model_class):
    properties = PROS_MODELS[model_class.__name__.lower()].properties
    property_data = {
        k: prepare_data_value(properties, k, v)
        for k, v in request.data.items()
        if k in properties
    }

    relation_data = {
        k: v
        for k, v in request.data.items()
        if k in PROS_MODELS[model_class.__name__.lower()].relations
    }
    # print("RDI", request.data.items())
    inline_relations = {
        k: v
        for k, v in request.data.items()
        if k in PROS_MODELS[model_class.__name__.lower()].inline_relations
    }

    return property_data, relation_data, inline_relations


def create_create(model_class):
    @db.write_transaction
    def create(self, request):

        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(request, model_class)

        object = model_class(**property_data)

        object.save()

        for related_name, related in relation_data.items():
            related_values = [r for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__.lower()]
                .fields[related_name]["relation_to"]
                .lower()
            ].model
            for related_value in related_values:
                rel_manager.connect(
                    related_model.nodes.get(uid=related_value["uid"]),
                    related_value.get("relData") or {},
                )
        for inline_related_name, inline_related in inline_relation_data.items():

            rel_manager = getattr(object, inline_related_name)
            related_model = PROS_MODELS[inline_related["type"]].model

            inline_related.pop("type")

            new_related_node = related_model(**inline_related)
            new_related_node.save()
            rel_manager.connect(new_related_node)

        return Response({"uid": object.uid, "label": object.label, "saved": True})

    return create


def get_non_default_fields(node):
    node_dict = node.__dict__
    return {k: v for k, v in node_dict.items() if k not in ["uid", "real_type", "id"]}


def create_update(model_class):
    @db.write_transaction
    def update(self, request, pk=None):
        # print("REQ", request.data)

        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(request, model_class)

        model_class.create_or_update({"uid": pk, **property_data})

        object = model_class.nodes.get(uid=pk)

        for related_name, related in relation_data.items():
            # (related_name)
            related_values = [r for r in related]
            rel_manager = getattr(object, related_name)
            related_model = PROS_MODELS[
                PROS_MODELS[model_class.__name__.lower()]
                .fields[related_name]["relation_to"]
                .lower()
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

        for inline_related_name, inline_related in inline_relation_data.items():

            rel_manager = getattr(object, inline_related_name)
            related_model = PROS_MODELS[inline_related["type"]].model

            new_type = inline_related.pop("type")

            try:  # If there is already a node related here...
                old_related_node = rel_manager.get()  # Get it...

                # If the data sent by the update is the same as the old node,
                # and they are the same type, no need to replace or delete
                if (
                    old_related_node.real_type != new_type
                    or get_non_default_fields(old_related_node) != inline_related
                ):
                    # But if the types differ, or the data differs...

                    # Create a new node with the data
                    new_related_node = related_model(**inline_related)
                    new_related_node.save()

                    # Reconnect from the old node to the new node
                    rel_manager.reconnect(old_related_node, new_related_node)

                    # If the old node is not related to anything else
                    # delete it
                    if not old_related_node.has_relations():
                        old_related_node.delete()
            except DoesNotExist:
                # Otherwise, this node does not exist
                new_related_node = related_model(**inline_related)
                new_related_node.save()
                rel_manager.connect(new_related_node)

        return Response({"uid": pk, "saved": True})

    return update


def create_delete(model_class: ProsNode):
    @db.write_transaction
    def delete(self, request, pk=None):
        print(request.query_params)
        if request.query_params.get("restore"):
            instance: ProsNode = model_class.nodes.get(uid=pk)
            if instance.is_deleted:
                instance.is_deleted = False
                instance.save()
            print("RESTORED")
            return Response(
                {
                    "detail": f"Deleted {model_class.__name__} '{instance.label}' restored.",
                }
            )

        try:
            instance: ProsNode = model_class.nodes.get(uid=pk)
            if instance.has_dependent_relations():
                instance.is_deleted = True
                instance.save()
                return Response(
                    {
                        "detail": (
                            f"Marked {model_class.__name__} '{instance.label}' as deletion desired,"
                            " pending removal of references from dependent entities"
                        )
                    }
                )
            else:
                instance.delete()
                return Response(
                    {
                        "detail": f"Deleted {model_class.__name__} {pk} as it has no dependencies"
                    }
                )
        except DoesNotExist:
            return Response({"detail": "Not found"})

    return delete


urlpatterns = []


def build_viewset_functions(model):
    viewset_functions = {
        "list": create_list(model.model),
    }
    if not model.meta.get("abstract"):
        viewset_functions["retrieve"] = create_retrieve(model.model)
        viewset_functions["create"] = create_create(model.model)
        viewset_functions["put"] = create_update(model.model)
        viewset_functions["autocomplete"] = create_autocomplete(model.model)
        viewset_functions["delete"] = create_delete(model.model)

    return viewset_functions


def build_url_patterns(model, vs):
    patterns = [
        path(f"{model.app}/{model.model_name.lower()}/", vs.as_view({"get": "list"})),
    ]
    if not model.meta.get("abstract"):
        patterns += [
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
            path(
                f"{model.app}/{model.model_name.lower()}/<str:pk>/",
                vs.as_view({"delete": "delete"}),
            ),
        ]
    return patterns


for _, model in PROS_MODELS.items():
    if model.meta.get("inline_only"):
        continue
    vs = type(
        f"{model.model_name}ViewSet",
        (viewsets.ViewSet,),
        build_viewset_functions(model),
    )

    urlpatterns += build_url_patterns(model, vs)


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
