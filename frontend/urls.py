from django.urls import path

from .utils import PROS_MODELS

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pros_core.models import ProsNode


from frontend.views import (
    create_view_factory,
    autocomplete_view_factory,
    retrieve_view_factory,
    list_view_factory,
    update_view_factory,
    delete_view_factory,
)

urlpatterns = []


def build_viewset_functions(model):
    viewset_functions = {
        "list": list_view_factory(model.model),
        "autocomplete": autocomplete_view_factory(model.model),
    }
    if not model.meta.get("abstract"):
        viewset_functions["retrieve"] = retrieve_view_factory(model.model)
        viewset_functions["create"] = create_view_factory(model.model)
        viewset_functions["put"] = update_view_factory(model.model)
        viewset_functions["delete"] = delete_view_factory(model.model)

    return viewset_functions


def build_url_patterns(model, vs):
    patterns = [
        path(f"{model.app}/{model.model_name.lower()}/", vs.as_view({"get": "list"})),
        path(
            f"{model.app}/autocomplete/{model.model_name.lower()}/",
            vs.as_view({"get": "autocomplete"}),
        ),
    ]
    if not model.meta.get("abstract"):
        patterns += [
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


from rest_framework.permissions import IsAuthenticated, AllowAny


def get_permissions(self):
    if self.request.method == "GET":
        permission_classes = [AllowAny]
    else:
        permission_classes = [IsAuthenticated]
    return [permission() for permission in permission_classes]


for _, model in PROS_MODELS.items():
    if model.meta.get("inline_only"):
        continue
    vs = type(
        f"{model.model_name}ViewSet",
        (viewsets.ViewSet,),
        build_viewset_functions(model),
    )

    vs.get_permissions = get_permissions
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
