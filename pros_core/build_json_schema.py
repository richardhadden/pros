from icecream import ic


def build_property_field(field):
    F = {}
    if field["property_type"] == "StringProperty":
        F["type"] = "string"
        if field["required"]:
            F["minLength"] = 1

    return F


def build_relation_field(field):
    ic(field)
    F = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "label": {"type": "string"},
                "uri": {"type": "string"},
            },
        },
    }

    if field["cardinality"] in {"One", "OneOrMore"}:
        F["minLength"] = 0

    if field["relation_fields"]:
        F["relData"] = {
            f_name: build_property_field(f)
            for f_name, f in field["relation_fields"].items()
        }
    return F


def build_field_schema(field):
    if field["type"] == "property":
        return build_property_field(field)
    elif field["type"] == "relation" and not field["inline_relation"]:
        return build_relation_field(field)


def build_json_schema(models):

    for model_name, model in models.items():
        if model_name == "birth":
            S = {
                "$id": "https://example.com/product.schema.json",
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "properties": {
                    field_name: build_field_schema(field)
                    for field_name, field in model.fields.items()
                },
            }

            ic(S)
