from collections import namedtuple
from distutils.command.build import build

import inspect
from unicodedata import name

from neomodel import StructuredNode
from neomodel.properties import Property, UniqueIdProperty
from neomodel.relationship_manager import RelationshipDefinition

from django.apps import apps

PROS_APPS = [
    app for app, conf in apps.app_configs.items() if getattr(conf, "pros_app", False)
]

PROS_MODELS = {}

AppModel = namedtuple(
    "AppModels", ["app", "model", "model_name", "properties", "relations", "fields"]
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


for app_name in PROS_APPS:
    app = __import__(app_name)
    app_model_classes = {
        getattr(app.models, m[0]).__name__: AppModel(
            app=app_name,
            model=getattr(app.models, m[0]),
            model_name=getattr(app.models, m[0]).__name__,
            properties={
                n
                for n, p in getattr(app.models, m[0]).__dict__.items()
                if (isinstance(p, Property)) and not isinstance(p, UniqueIdProperty)
            },
            relations={
                n
                for n, p in getattr(app.models, m[0]).__dict__.items()
                if isinstance(p, RelationshipDefinition)
            },
            fields={
                n: build_field(p)
                for n, p in getattr(app.models, m[0]).__dict__.items()
                if (isinstance(p, Property) or isinstance(p, RelationshipDefinition))
                and not isinstance(p, UniqueIdProperty)
            },
        )
        for m in inspect.getmembers(app.models, inspect.isclass)
        if m[1].__module__ == "test_app.models"
        and issubclass(getattr(app.models, m[0]), StructuredNode)
    }
    PROS_MODELS = {**PROS_MODELS, **app_model_classes}
