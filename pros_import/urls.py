import inspect
from django.urls import path

from pros_core.setup_app import PROS_MODELS
from pros_import.viewsets import base_view_set_factory
from pros_import.models import ProsImporter

from icecream import ic

urlpatterns = []

for model_name, model in PROS_MODELS.items():
    importers = [
        i
        for i in model.model.__dict__.values()
        if inspect.isclass(i) and issubclass(i, ProsImporter)
    ]
    if importers:
        PROS_MODELS[model_name].meta["importers"] = {
            importer.importer_name.lower().replace(" ", "_"): importer.importer_name
            for importer in importers
        }
    for importer in importers:

        urlpatterns.append(
            path(
                f"{model.app}/{model.model_name.lower()}/{importer.importer_name.lower()}/",
                base_view_set_factory(model.model, importer).as_view(
                    {"get": "list", "post": "create"}
                ),
            )
        )
