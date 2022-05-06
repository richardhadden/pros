from collections import namedtuple

import inspect
from unicodedata import name

from neomodel import StructuredNode
from neomodel.properties import Property, UniqueIdProperty

from django.apps import apps

PROS_APPS = [
    app for app, conf in apps.app_configs.items() if getattr(conf, "pros_app", False)
]

PROS_MODELS = []

AppModel = namedtuple("AppModels", ["app", "model", "model_name", "properties"])

for app_name in PROS_APPS:
    app = __import__(app_name)
    app_model_classes = [
        AppModel(
            app=app_name,
            model=getattr(app.models, m[0]),
            model_name=getattr(app.models, m[0]).__name__,
            properties={
                n: {
                    "type": p.__class__.__name__,
                    "default_value": p.default,
                    "required": p.required,
                }
                for n, p in getattr(app.models, m[0]).__dict__.items()
                if isinstance(p, Property) and not isinstance(p, UniqueIdProperty)
            },
        )
        for m in inspect.getmembers(app.models, inspect.isclass)
        if m[1].__module__ == "test_app.models"
        and issubclass(getattr(app.models, m[0]), StructuredNode)
    ]
    PROS_MODELS += app_model_classes
