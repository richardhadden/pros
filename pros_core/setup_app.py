from collections import namedtuple
from dataclasses import dataclass, asdict

from django.conf import settings

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


@dataclass
class AppModel:
    app: str
    model: ProsNode
    model_name: str
    meta: dict
    properties: dict
    relations: dict
    inline_relations: dict
    reverse_relations: dict
    fields: dict
    subclasses: dict
    subclasses_as_list: list
    model_docstring: str
    json_schema: dict = dict


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
            if not k.startswith("__") and not callable(v)
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
        model_docstring=model.__doc__,
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
        try:
            module = SourceFileLoader(
                "viewsets", f"{app.__path__[0]}/viewsets.py"
            ).load_module()

        except FileNotFoundError:
            pass

    from .viewsets import ProsBlankViewSet, ProsAbstractViewSet, ProsDefaultViewSet

    for c in inheritors(ProsBlankViewSet):
        if c not in {ProsDefaultViewSet, ProsAbstractViewSet}:
            viewsets[c.__model_class__.__name__.lower()] = c

    return viewsets


def get_components(path):
    file_dict = {}
    for filepath in path.glob("*.tsx"):
        with open(filepath) as f:
            for line in f.readlines():
                if line.startswith("export default"):
                    l = line.replace("export default ", "").replace(";", "").strip()
                    file_dict[l] = (
                        str(filepath)
                        .replace(str(settings.BASE_DIR), "..")
                        .replace(".tsx", "")
                    )
                    break
    return file_dict


def gather_interface_components(apps):
    from pathlib import Path
    import os

    ic(settings.BASE_DIR)

    edit_fields = {}
    field_rows = {}
    list_view_pages = {}

    for app_name in apps:
        app = __import__(app_name)

        path = Path(app.__path__[0])
        interface = path / "interface"

        edit_fields_path = interface / "edit_fields"
        edit_fields = {**edit_fields, **get_components(edit_fields_path)}

        list_view_pages_path = interface / "view_pages"
        list_view_pages = {**list_view_pages, **get_components(list_view_pages_path)}

        with open("interface/interface-config.tsx", "w") as f:
            f.writelines(
                f"import {comp} from '{fil}';\n"
                for comp, fil in list_view_pages.items()
            )
            f.writelines(
                f"import {comp} from '{fil}';\n" for comp, fil in edit_fields.items()
            )
            f.write("\n\n")
            f.write(
                f"""
export const CUSTOM_LIST_VIEW_PAGES = {{ {", ".join(f"'{page.lower()}': {page}" for page in list_view_pages)}  }};
export const CUSTOM_EDIT_FIELDS = {{ {", ".join(f"'{field}': {field}" for field in edit_fields)}  }};
export const CUSTOM_VIEW_PAGES = {{}};
"""
            )


PROS_MODELS = build_models(PROS_APPS)
PROPERTY_VALIDATORS = {
    p.__name__: getattr(
        p,
        "json_schema_validation",
    )
    for p in inheritors(Property)
    if getattr(p, "json_schema_validation", False)
}
ic(PROPERTY_VALIDATORS)


def build_property_field(field):
    F = {}
    if field["property_type"] in PROPERTY_VALIDATORS:
        F = PROPERTY_VALIDATORS[field["property_type"]]
    elif field["property_type"] == "StringProperty":
        F["type"] = "string"
        if field["required"]:
            F["minLength"] = 1
    elif field["property_type"] == "IntegerProperty":
        F["type"] = "integer"
    elif field["property_type"] == "FloatProperty":
        F["type"] = "number"
    elif field["property_type"] == "BooleanProperty":
        F["type"] = "boolean"
    elif field["property_type"] == "DateProperty":
        F["type"] = "string"
        F["format"] = "date"
    elif field["property_type"] == "DateTimeProperty":
        F["type"] = "string"
        F["format"] = "date-time"
    elif field["property_type"] == "EmailProperty":
        F["type"] = "string"
        F["format"] = "email"

    return F


def build_relation_field(field):
    # ic(field)
    F = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "label": {"type": "string"},
                "uid": {"type": "string"},
            },
        },
    }

    if field["cardinality"] in {"One", "OneOrMore"}:
        F["minItems"] = 1

    if field["relation_fields"]:
        F["items"]["properties"]["relData"] = {
            f_name: build_property_field(f)
            for f_name, f in field["relation_fields"].items()
        }
    return F


def build_inline_relation_field(field):
    related_model = PROS_MODELS[field["relation_to"].lower()]
    subclasses = related_model.subclasses_as_list

    internal_fields = related_model.meta.get("internal_fields", [])

    subclasses = [sc for sc in subclasses if not sc.meta.get("abstract", False)]
    if not related_model.meta.get("abstract", False):
        subclasses.append(related_model)

    F = {
        "type": "object",
        "oneOf": [
            {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "const": subclass_type.model_name.lower(),
                    },
                    **{
                        f_name: build_field_schema(f)
                        for f_name, f in subclass_type.fields.items()
                        if f_name not in internal_fields
                    },
                },
            }
            for subclass_type in subclasses
        ],
    }
    return F


"""
 [{
          type: "object",
          properties: {
            type: { type: "string", const: "precisedate" },
            date: {
              type: "string",
              pattern:
                "^\\d*(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
          },
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "imprecisedate" },
            not_before: {
              type: "string",
              pattern:
                "^\\d*(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
            not_after: {
              type: "string",
              pattern:
                "^\\d*(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
          },
          required: ["not_before", "not_after"],
        },]
"""


def build_field_schema(field):
    if field["type"] == "property":
        return build_property_field(field)
    elif field["type"] == "relation" and not field["inline_relation"]:
        return build_relation_field(field)
    elif field["type"] == "relation" and field["inline_relation"]:
        return build_inline_relation_field(field)


# Iterate models and add json schema
for model_name, model in PROS_MODELS.items():
    internal_fields = model.meta.get("internal_fields", [])
    S = {
        "$id": "https://example.com/product.schema.json",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
            field_name: build_field_schema(field)
            for field_name, field in model.fields.items()
            if field_name not in internal_fields
        },
        "required": [
            field_name
            for field_name, field in model.fields.items()
            if field.get("required")
        ]
        + [
            field_name
            for field_name, field in model.fields.items()
            if field.get("cardinality") in {"One", "OneOrMore"}
        ],
    }

    PROS_MODELS[model_name].json_schema = S
    # ic(PROS_MODELS[model_name])

PROS_VIEWSET_MAP = build_viewsets(PROS_APPS)
INTERFACE_COMPONENTS = gather_interface_components(PROS_APPS)
