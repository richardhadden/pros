from collections import namedtuple
from distutils.command.build import build

import inspect
from unicodedata import name

from neomodel import StructuredNode
from neomodel.properties import Property, UniqueIdProperty
from neomodel.relationship_manager import RelationshipDefinition
from pros_core.models import ProsNode
from django.apps import apps

PROS_APPS = [
    app for app, conf in apps.app_configs.items() if getattr(conf, "pros_app", False)
]

PROS_MODELS = {}

AppModel = namedtuple(
    "AppModels",
    ["app", "model", "model_name", "properties", "relations", "fields", "subclasses"],
)


def build_field(p):
    if isinstance(p, Property):
        return {
            "type": "property",
            "property_type": p.__class__.__name__,
            "default_value": p.default,
            "required": p.required,
        }
    if isinstance(p, RelationshipDefinition):
        print(p.__dict__)
        return {
            "type": "relation",
            "relation_type": p.__dict__["definition"]["relation_type"],
            "relation_to": p.__dict__["_raw_class"],
            "cardinality": p.__dict__["manager"].__name__,
            "default_value": [],
        }


def build_app_model(app_name, model, model_name):
    return AppModel(
        app=app_name,
        model=model,
        model_name=model_name,
        properties={
            n
            for n, p in model.__all_properties__
            if not isinstance(p, UniqueIdProperty)
        },
        relations={n for n, p in model.__all_relationships__},
        fields={
            n: build_field(p)
            for n, p in (
                *model.__all_properties__,
                *model.__all_relationships__,
            )
            if not isinstance(p, UniqueIdProperty) and n != "real_type"
        },
        subclasses={
            m.__name__: build_app_model(app_name, m, m.__name__)
            for m in model.__subclasses__()
        },
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
