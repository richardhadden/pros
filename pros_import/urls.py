from django.urls import path

from pros_core.setup_app import PROS_MODELS
from pros_import.viewsets import base_view_set_factory

urlpatterns = []

for model_name, model in PROS_MODELS.items():
    if getattr(model.model, "Importer", None):
        urlpatterns.append(
            path(
                f"{model.app}/{model.model_name.lower()}/",
                base_view_set_factory(model.model).as_view(
                    {"get": "list", "post": "create"}
                ),
            )
        )
