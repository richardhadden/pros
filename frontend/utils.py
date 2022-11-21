from collections import namedtuple
from distutils.command.build import build

import inspect
from unicodedata import name

from neomodel import StructuredNode
from neomodel.properties import Property, UniqueIdProperty
from neomodel.relationship_manager import RelationshipDefinition
from pros_core.models import ProsNode, REVERSE_RELATIONS
from django.apps import apps

PROS_APPS = [
    app for app, conf in apps.app_configs.items() if getattr(conf, "pros_app", False)
]

PROS_MODELS = {}

AppModel = namedtuple(
    "AppModels",
    [
        "app",
        "model",
        "model_name",
        "meta",
        "properties",
        "relations",
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
        # print(p.definition["model"], p.definition["model"].__dict__)
        return {
            "type": "relation",
            "relation_type": p.__dict__["definition"]["relation_type"],
            "relation_to": p.__dict__["_raw_class"],
            "relation_fields": {
                k: build_field(v)
                for k, v in p.definition["model"].__dict__.items()
                if isinstance(v, Property) and k != "reverse_name"
            },
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
        },  # This check for direction is so we can only set on the TO side
        fields={
            n: build_field(p)
            for n, p in (
                *model.__all_properties__,
                *model.__all_relationships__,
            )
            if not isinstance(p, UniqueIdProperty) and n != "real_type"
            if build_field(p)
        },
        reverse_relations=REVERSE_RELATIONS[model_name],
        subclasses={
            m.__name__: build_app_model(app_name, m, m.__name__)
            for m in model.__subclasses__()
        },
        subclasses_as_list=[
            build_app_model(app_name, m, m.__name__)
            for m in build_subclasses_as_list(model)
        ],
    )


for app_name in PROS_APPS:
    app = __import__(app_name)
    app_model_classes = {}
    for m in inspect.getmembers(app.models, inspect.isclass):
        model = getattr(app.models, m[0])
        model_name = model.__name__

        # Check if it's a class defined in this model (not imported from somewhere)
        # and that it's a top-level node
        if m[1].__module__ == f"{app_name}.models" and issubclass(model, ProsNode):

            app_model_classes[model_name] = build_app_model(app_name, model, model_name)

    PROS_MODELS = {**PROS_MODELS, **app_model_classes}
