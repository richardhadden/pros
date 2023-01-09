from django.urls import path

from pros_core.setup_app import PROS_MODELS, PROS_VIEWSET_MAP

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from pros_core.models import ProsNode


from pros_core.viewsets import (
    generic_viewset_factory,
    ProsAbstractViewSet,
)

from icecream import ic

urlpatterns = []


def build_url_patterns(model, vs):
    patterns = [
        path(f"{model.app}/{model.model_name.lower()}/", vs.as_view({"get": "list"})),
    ]
    if not model.meta.get("abstract"):
        patterns += [
            path(
                f"{model.app}/{model.model_name.lower()}/<str:pk>",
                vs.as_view({"get": "retrieve", "put": "update"}),
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


for model_name, model in PROS_MODELS.items():
    if model.meta.get("inline_only"):
        continue
    if viewset := PROS_VIEWSET_MAP.get(model_name):
        vs: type[ProsAbstractViewSet] = viewset
    else:
        vs: type[ProsAbstractViewSet] = generic_viewset_factory(model)
    urlpatterns += build_url_patterns(model, vs)


@api_view(["GET"])
def schema(request):
    import time

    # time.sleep(20)
    resp_data = build_schema_from_pros_model(PROS_MODELS, {})
    return Response(resp_data)


urlpatterns.append(path("schema/", schema))
