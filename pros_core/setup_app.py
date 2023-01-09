from collections import namedtuple


import inspect
from icecream import ic

from neomodel.properties import Property, UniqueIdProperty
from neomodel.relationship_manager import RelationshipDefinition
from pros_core.models import ProsNode, REVERSE_RELATIONS, InlineRelation

from django.apps import apps

PROS_APPS = [
    app for app, conf in apps.app_configs.items() if getattr(conf, "pros_app", False)
]
ic(PROS_APPS)


AppModel = namedtuple(
    "AppModels",
    [
        "app",
        "model",
        "model_name",
        "meta",
        "properties",
        "relations",
        "inline_relations",
        "reverse_relations",
        "fields",
        "subclasses",
        "subclasses_as_list",
    ],
)


def build_field(p):
    if isinstance(p, Property):

        return {
            "type": "property",
            "property_type": p.__class__.__name__,
            "default_value": p.default,
            "required": p.required,
            "help_text": p.help_text or None,
        }

    if isinstance(p, RelationshipDefinition) and p.definition["direction"] == 1:

        return {
            "type": "relation",
            "relation_type": p.__dict__["definition"]["relation_type"],
            "relation_to": p.__dict__["_raw_class"],
            "relation_fields": {
                k: build_field(v)
                for k, v in p.definition["model"].__dict__.items()
                if isinstance(v, Property) and k != "reverse_name"
            },
            "inline_relation": issubclass(p.definition["model"], InlineRelation)
            if p.definition.get("model")
            else {},
            "cardinality": p.__dict__["manager"].__name__,
            "default_value": [],
        }


import re


def camel_case_split(str):

    return " ".join(re.findall(r"[A-Z](?:[a-z]+|[A-Z]*(?=[A-Z]|$))", str))


def build_meta(model):
    meta = (
        {
            k: v
            for k, v in model.__dict__["Meta"].__dict__.items()
            if not k.startswith("__")
        }
        if "Meta" in model.__dict__
        else {}
    )
    meta["display_name"] = meta.get("display_name", None) or camel_case_split(
        model.__name__
    )
    return meta


def build_subclasses_as_list(
    model,
):
    subclasses = []

    if not model.__subclasses__():
        return subclasses

    for subclass in model.__subclasses__():
        subclasses.append(subclass)
        subclasses += build_subclasses_as_list(subclass)
    return subclasses


def get_all_reverse_relations(model, model_name):
    """Reverse relations are defined in REVERSE RELATIONS but we need
    to also get the parent reverse relations"""

    parent_reverse_relations = {}
    for parent_model in inspect.getmro(model):
        if parent_model is ProsNode:
            break
        parent_reverse_relations = {
            **parent_reverse_relations,
            **REVERSE_RELATIONS[parent_model.__name__],
        }

    return {**REVERSE_RELATIONS[model_name], **parent_reverse_relations}


def build_app_model(app_name, model, model_name):
    return AppModel(
        app=app_name,
        model=model,
        model_name=model_name,
        meta=build_meta(model),
        properties={
            n: p
            for n, p in model.__all_properties__
            if not isinstance(p, UniqueIdProperty)
        },
        relations={
            n: p
            for n, p in model.__all_relationships__
            if p.definition["direction"] == 1
            and not issubclass(p.definition["model"], InlineRelation)
        },  # This check for direction is so we can only set on the TO side
        inline_relations={
            n: p
            for n, p in model.__all_relationships__
            if p.definition["direction"] == 1
            and issubclass(p.definition["model"], InlineRelation)
        },
        fields={
            n: build_field(p)
            for n, p in (
                *model.__all_properties__,
                *model.__all_relationships__,
            )
            if not isinstance(p, UniqueIdProperty)
            and n
            not in [
                "real_type",
                "is_deleted",
                "createdBy",
                "createdWhen",
                "modifiedBy",
                "modifiedWhen",
            ]
            if build_field(p)
        },
        reverse_relations=get_all_reverse_relations(model, model_name),
        subclasses={
            m.__name__: build_app_model(app_name, m, m.__name__)
            for m in model.__subclasses__()
        },
        subclasses_as_list=[
            build_app_model(app_name, m, m.__name__)
            for m in build_subclasses_as_list(model)
        ],
    )


def inheritors(klass):
    subclasses = set()
    work = [klass]
    while work:
        parent = work.pop()
        for child in parent.__subclasses__():
            if child not in subclasses:
                subclasses.add(child)
                work.append(child)
    return subclasses


def build_models(PROS_APPS):
    pros_models = {}
    from .models import ProsNode

    """for c in inheritors(ProsNode):
        app_name = c.__module__.split(".")[0]
        model = c
        model_name = c.__name__
        pros_models[model_name.lower()] = build_app_model(app_name, model, model_name)

    """
    for app_name in PROS_APPS:
        app = __import__(app_name)
        app_model_classes = {}

        # Get models
        for m in inspect.getmembers(app.models, inspect.isclass):
            model = getattr(app.models, m[0])
            model_name = model.__name__

            # Check if it's a class defined in this model (not imported from somewhere)
            # and that it's a top-level node
            if m[1].__module__ == f"{app_name}.models" and issubclass(model, ProsNode):

                app_model_classes[model_name.lower()] = build_app_model(
                    app_name, model, model_name
                )
        pros_models = {
            **pros_models,
            **app_model_classes,
        }

    return pros_models


def build_viewsets(PROS_APPS):
    from importlib.machinery import SourceFileLoader

    viewsets = {}

    for app_name in PROS_APPS:
        app = __import__(app_name)
        ic(dir(app), app.__path__)
        try:
            module = SourceFileLoader(
                "viewsets", f"{app.__path__[0]}/viewsets.py"
            ).load_module()

        except FileNotFoundError:
            pass

    from .viewsets import ProsAbstractViewSet, ProsDefaultViewSet

    for c in inheritors(ProsAbstractViewSet):
        if c is not ProsDefaultViewSet:
            viewsets[c.__model_class__.__name__.lower()] = c

    return viewsets


PROS_MODELS = build_models(PROS_APPS)
PROS_VIEWSET_MAP = build_viewsets(PROS_APPS)
