import datetime

from typing import Type, Callable

from django.urls import path
from rest_framework.permissions import IsAuthenticated, AllowAny


from neomodel.exceptions import DoesNotExist
from neomodel import db
from neomodel.properties import DateTimeProperty, DateProperty
import neomodel
from neo4j.time import DateTime as neo4jDateTime

from pros_core.setup_app import PROS_MODELS

from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.request import Request
from pros_core.models import ProsNode, DeletedNode
from pros_core.filters import icontains

from pypher import Pypher, __

from icecream import ic

from dataclasses import dataclass


@dataclass
class ResponseValue:
    """Wrapper around data and HTTP status, to be unpacked into DRF Response object
    or for treatment separately"""

    data: dict
    status: int = 200

    def keys(self):
        return ["data", "status"]

    def __getitem__(self, key):
        return self.__dict__.get(key)

    def __iter__(self):
        yield from (self.data, self.status)


# Utility functions


def delete_all_inline_nodes(instance):
    q = Pypher()
    q.MATCH.node("s", uid=instance.uid).rel_out("p").node(
        "o", labels="ProsInlineOnlyNode"
    )
    q.DETACH.DELETE(__.o)
    results, meta = db.cypher_query(str(q), q.bound_params)


def prepare_data_value(properties, k, v):

    if properties[k].__class__ is DateProperty:
        v = datetime.date.fromisoformat(v)
    if properties[k].__class__ is DateTimeProperty:
        if v:
            return v
        else:
            None

    return v


def get_property_and_relation_data(data, model_class):
    properties = PROS_MODELS[model_class.__name__.lower()].properties
    property_data = {
        k: prepare_data_value(properties, k, v)
        for k, v in data.items()
        if k in properties
    }

    relation_data = {
        k: v
        for k, v in data.items()
        if k in PROS_MODELS[model_class.__name__.lower()].relations
    }
    # print("RDI", request.data.items())

    inline_relations = {
        k: v
        for k, v in data.items()
        if k in PROS_MODELS[model_class.__name__.lower()].inline_relations
    }

    return property_data, relation_data, inline_relations


def add_related_nodes(
    model_class: Type[ProsNode], instance: ProsNode, relation_data: dict
):
    for related_name, related in relation_data.items():
        related_values = [r for r in related]
        rel_manager = getattr(instance, related_name)
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


def add_inline_related_nodes(
    model_class: Type[ProsNode], instance: ProsNode, data: dict
):

    for inline_field_name, inline_field_data in data.items():
        inline_related_type = inline_field_data.pop("type")
        inline_class = PROS_MODELS[inline_related_type]
        related_model = inline_class.model
        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(inline_field_data, related_model)

        rel_manager = getattr(instance, inline_field_name)

        new_related_node = related_model(**property_data)
        new_related_node.save()
        rel_manager.connect(new_related_node)
        add_related_nodes(related_model, new_related_node, relation_data)


def get_non_default_fields(node):
    node_dict = node.__dict__
    return {k: v for k, v in node_dict.items() if k not in ["uid", "real_type", "id"]}


def update_related_nodes(
    model_class: Type[ProsNode], instance: ProsNode, relation_data: dict
):
    for related_name, related in relation_data.items():
        # (related_name)
        related_values = [r for r in related]
        rel_manager = getattr(instance, related_name)
        related_model = PROS_MODELS[
            PROS_MODELS[model_class.__name__.lower()]
            .fields[related_name]["relation_to"]
            .lower()
        ].model

        # If it's a cardinality-One relation, can't simply disconnect all
        # as it's not allowed... instead, get the old node from the rel_manager,
        # look up the new node by uid, and then reconnect the rel_manager
        if isinstance(rel_manager, neomodel.cardinality.One):
            old_node = rel_manager.get()
            new_node = related_model.nodes.get(uid=related_values[0]["uid"])
            rel_manager.reconnect(old_node, new_node)

        # Otherwise, do the nice easy brute-force technique of dropping all connections
        # and recreating them.
        # #TODO: Maybe this can be made more efficient on DB?
        else:
            # Remove all relations
            for related in rel_manager.all():
                rel_manager.disconnect(related_model.nodes.get(uid=related.uid))

            # And recreate them again so that the data is updated
            for related_value in related_values:
                rel_manager.connect(
                    related_model.nodes.get(uid=related_value["uid"]),
                    related_value.get("relData") or {},
                )


def update_inline_related_nodes(instance, data):
    for inline_related_name, inline_field_data in data.items():

        rel_manager = getattr(instance, inline_related_name)
        related_model = PROS_MODELS[inline_field_data["type"]].model

        new_type = inline_field_data.pop("type")
        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(inline_field_data, related_model)
        try:  # If there is already a node related here...

            old_related_node = rel_manager.all()[0]  # Get it...
            # (there should only be one node to get, due to One cardinality)

            # Create a new node with the data
            new_related_node = related_model(**property_data)
            new_related_node.save()

            # Reconnect from the old node to the new node
            rel_manager.reconnect(old_related_node, new_related_node)

            # Disconnect the old inline related node from its
            # current outbound relations
            for k, v in relation_data.items():
                old_node_rel_manager = getattr(old_related_node, k)
                for i in v:
                    i_related_model = PROS_MODELS[i["real_type"]].model
                    i_node = i_related_model.nodes.get(uid=i["uid"])
                    old_node_rel_manager.disconnect(i_node)

            # Add the relation to the new node
            update_related_nodes(related_model, new_related_node, relation_data)

            # If the old node is not related to anything else
            # delete it
            if not old_related_node.has_relations():
                old_related_node.delete()

        except IndexError:
            # Otherwise, this node does not exist
            new_related_node = related_model(**property_data)
            new_related_node.save()
            rel_manager.connect(new_related_node)
            update_related_nodes(related_model, new_related_node, relation_data)


# Viewset methods
class ProsBlankViewSet(ViewSet):
    pass


class ProsAbstractViewSet(ProsBlankViewSet):
    """ViewSet for abstract Pros models. Allows listing of entities, but nothing else."""

    __model_class__ = None

    def __init_subclass__(cls):
        if cls.__name__ != "ProsDefaultViewSet" and cls.__model_class__ is None:
            raise TypeError(
                "ProsDefaultViewSet requires __model_class__ attribute to be "
                "set to an instance of <pros_core.models.ProsNode>"
            )

    def do_list(self, request: Request) -> ResponseValue:
        # If a text filter is set...
        filter = request.query_params.get("filter")
        if filter:

            x = icontains("s", "label")(filter)
            y = icontains("s", "label")(filter)
            for additional_filter in PROS_MODELS[
                self.__model_class__.__name__.lower()
            ].meta.get("text_filter_fields", []):
                # print(additional_filter)
                if isinstance(additional_filter, str):
                    x = x.OR(icontains("s", additional_filter)(filter))

                else:
                    f = additional_filter(filter)
                    if isinstance(f, Pypher):
                        y = y.OR(f)

            q = Pypher()
            q.Match.node("s", labels=self.__model_class__.__name__)
            q.WHERE(x)
            q.RETURN(__.DISTINCT((__.s)))
            q.UNION
            q.MATCH.node("s", labels=self.__model_class__.__name__).rel("p").node("o")
            q.WHERE(y)
            q.RETURN(__.DISTINCT(__.s))

            results, meta = db.cypher_query(str(q), q.bound_params)

            node_data = [r[0] for r in results]

        else:
            last_refreshed_timestamp_string = request.query_params.get(
                "lastRefreshedTimestamp"
            )

            if last_refreshed_timestamp_string:
                d = datetime.datetime.fromisoformat(
                    last_refreshed_timestamp_string.replace("Z", "")
                )

                resp_data = {
                    "created_modified": [
                        {
                            "real_type": b.real_type,
                            "uid": b.uid,
                            "label": b.label,
                            "is_deleted": b.is_deleted,
                            "deleted_and_has_dependent_nodes": b.is_deleted
                            and b.has_dependent_relations(),
                        }
                        for b in self.__model_class__.nodes.filter(modifiedWhen__gt=d)
                    ],
                    "deleted": [
                        {"uid": b.uid}
                        for b in DeletedNode.nodes.filter(
                            deletedWhen__gt=d, type=self.__model_class__.__name__
                        )
                    ],
                }

                return ResponseValue(resp_data)
            else:
                node_data = [
                    {
                        "real_type": b.real_type,
                        "uid": b.uid,
                        "label": b.label,
                        "is_deleted": b.is_deleted,
                        "deleted_and_has_dependent_nodes": b.is_deleted
                        and b.has_dependent_relations(),
                    }
                    for b in self.__model_class__.nodes.order_by("real_type", "label")
                ]
        return ResponseValue(node_data)

    def list(self, request: Request) -> Response:
        return Response(**self.do_list(request))


class ProsDefaultViewSet(ProsAbstractViewSet):
    """Default ViewSet for Pros models."""

    def do_retrieve(self, request: Request, pk: str | None) -> ResponseValue:
        try:
            this = self.__model_class__.nodes.get(uid=pk)
        except Exception:
            return ResponseValue(
                status=404, data=f"<{self.__model_class__.__name__} uid={pk}> not found"
            )
        data = {
            **this.properties,
            "deleted_and_has_dependent_nodes": this.is_deleted
            and this.has_dependent_relations(),
            **this.direct_relations_as_data(),
        }
        # ic(data)
        return ResponseValue(data)

    def retrieve(self, request: Request, pk: str | None = None) -> Response:
        return Response(**self.do_retrieve(request, pk))

    @db.write_transaction
    def do_create(self, request: Request) -> ResponseValue:
        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(request.data, self.__model_class__)

        property_data = {
            **property_data,
            "createdBy": request.user.username,
            "createdWhen": datetime.datetime.now(datetime.timezone.utc),
            "modifiedBy": request.user.username,
            "modifiedWhen": datetime.datetime.now(datetime.timezone.utc),
        }

        instance = self.__model_class__(**property_data)
        instance.save()

        add_related_nodes(self.__model_class__, instance, relation_data)
        add_inline_related_nodes(self.__model_class__, instance, inline_relation_data)

        return ResponseValue(
            {"uid": instance.uid, "label": instance.label, "saved": True}
        )

    def create(self, request: Request) -> Response:
        return Response(**self.do_create(request))

    @db.write_transaction
    def do_update(self, request: Request, pk: str | None) -> ResponseValue:
        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(request.data, self.__model_class__)
        property_data.pop("createdWhen")
        property_data.pop("createdBy")
        property_data = {
            **property_data,
            "modifiedBy": request.user.username,
            "modifiedWhen": datetime.datetime.now(datetime.timezone.utc),
        }

        self.__model_class__.create_or_update({"uid": pk, **property_data})

        instance: ProsNode = self.__model_class__.nodes.get(uid=pk)

        update_related_nodes(self.__model_class__, instance, relation_data)
        update_inline_related_nodes(instance, inline_relation_data)

        return ResponseValue({"uid": pk, "saved": True})

    def update(self, request, pk=None):
        return Response(**self.do_update(request, pk))

    @db.write_transaction
    def do_delete(self, request: Request, pk: str | None) -> ResponseValue:
        if request.query_params.get("restore"):
            instance: ProsNode = self.__model_class__.nodes.get(uid=pk)
            if instance.is_deleted:
                instance.is_deleted = False
                instance.save()

            return ResponseValue(
                {
                    "result": "success",
                    "detail": f"Deleted {self.__model_class__.__name__} '{instance.label}' restored.",
                }
            )

        try:
            instance: ProsNode = self.__model_class__.nodes.get(uid=pk)
            if instance.has_dependent_relations():

                instance.is_deleted = True
                instance.save()
                return ResponseValue(
                    {
                        "detail": (
                            f"Marked {self.__model_class__.__name__} '{instance.label}' as deletion desired,"
                            " pending removal of references from dependent entities"
                        ),
                        "result": "pending",
                    }
                )
            else:
                delete_all_inline_nodes(instance)
                d = DeletedNode(
                    uid=instance.uid,
                    type=self.__model_class__.__name__,
                    deletedWhen=datetime.datetime.now(datetime.timezone.utc),
                )
                d.save()
                instance.delete()

                return ResponseValue(
                    {
                        "detail": f"Deleted {self.__model_class__.__name__} {pk} as it has no dependencies",
                        "result": "success",
                    }
                )
        except DoesNotExist:
            return ResponseValue({"detail": "Not found", "result": "fail"}, status=404)

    def delete(self, request: Request, pk: str | None = None):
        return Response(**self.do_delete(request, pk))


def generic_viewset_factory(
    app_model,
) -> type[ProsAbstractViewSet] | type[ProsDefaultViewSet]:
    def get_permissions(self):
        ic(self)
        if self.request.method == "GET":
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    """Produces named ViewSet for a Pros model."""
    if app_model.meta.get("abstract"):

        return type(
            f"{app_model.model.__name__}ViewSet",
            (ProsAbstractViewSet,),
            {
                "__model_class__": app_model.model,
                "get_permissions": get_permissions,
            },
        )
    else:
        return type(
            f"{app_model.model.__name__}ViewSet",
            (ProsDefaultViewSet,),
            {
                "__model_class__": app_model.model,
                "get_permissions": get_permissions,
            },
        )
