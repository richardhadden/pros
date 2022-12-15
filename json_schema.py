import pros.django_initializer


from icecream import ic
from pros_core.models import InlineRelation
from test_app.models import Birth

from frontend.utils import PROS_MODELS


INTERNAL_FIELDS = {
    "uid",
    "real_type",
    "is_deleted",
    "createdBy",
    "createdWhen",
    "modifiedBy",
    "modifiedWhen",
}


def internal_fields(p):
    prop_name, _ = p
    if prop_name in INTERNAL_FIELDS:
        return False
    return True


def string_property(prop):
    s = {
        "type": "string",
    }
    if prop.required:
        s["minLength"] = 1
    return s


def integer_property(prop):
    s = {"type": "string", "pattern": r"^\d*$"}
    if prop.required:
        s["minLength"] = 1
    return s


def float_property(prop):
    s = {"type": "string"}
    if prop.required:
        s["minLength"] = 1
    return s


def date_property(prop):
    s = {
        "type": "string",
        "format": "date",
    }
    if prop.required:
        s["minLength"] = 1
    return s


def date_time_property(prop):
    s = {
        "type": "string",
        "format": "date-time",
    }
    if prop.required:
        s["minLength"] = 1
    return s


def email_property(prop):
    s = {
        "type": "string",
        "format": "email",
    }
    if prop.required:
        s["minLength"] = 1
    return s


PROPERTY_TO_FUNCTION_MAP = {
    "StringProperty": string_property,
    "IntegerProperty": integer_property,
    "FloatProperty": float_property,
    "DateProperty": date_property,
    "DateTimeProperty": date_time_property,
    "EmailProperty": email_property,
}


def build_rel(rel):

    s = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "uri": {"type": "string"},
                "label": {"type": "string"},
            },
        },
    }
    if rel.manager.__name__ == "ZeroOrMore":
        s["minLength"] = 0
    elif rel.manager.__name__ == "OneOrMore":
        s["minLength"] = 1
    elif rel.manager.__name__ == "ZeroOrOne":
        s["maxLength"] = 1
    elif rel.manager.__name__ == "One":
        s["minLength"] = 1
        s["maxLength"] = 1

    rel_props = rel.definition["model"].defined_properties()
    rel_props.pop("reverse_name")
    if rel_props:
        s["relData"] = {}
        for prop_name, prop in rel_props.items():
            prop_func = PROPERTY_TO_FUNCTION_MAP.get(prop.__class__.__name__)
            if prop_func:
                s["relData"][prop_name] = prop_func(prop)

    return s


def build_inline_rel(rel):
    # ic(rel.__dict__)
    inline_model = PROS_MODELS[rel.__dict__["_raw_class"].lower()].model
    s = {"type": rel.__dict__["_raw_class"].lower(), "properties": {}}
    ic(s)
    s = build_properties_from_model(inline_model, s)
    ic(s)
    return s
    # TODO: Need to make all the different subtypes as options...


def build_properties_from_model(model, schema):

    for prop_name, prop in filter(internal_fields, model.__all_properties__):
        prop_func = PROPERTY_TO_FUNCTION_MAP.get(prop.__class__.__name__)
        if prop_func:
            schema["properties"][prop_name] = prop_func(prop)
    for rel_name, rel in model.__all_relationships__:
        if issubclass(rel.definition["model"], InlineRelation):
            ic(rel_name)
            schema["properties"][rel_name] = build_inline_rel(rel)

        else:
            schema["properties"][rel_name] = build_rel(rel)

    return schema


def build_json_schema(model):
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://example.com/product.schema.json",
        "title": f"Validate {model.__name__}",
        "type": "object",
        "properties": {},
    }
    return build_properties_from_model(model, schema)


schema = build_json_schema(Birth)
ic(schema)
