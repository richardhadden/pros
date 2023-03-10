import pros.django_initializer

from test_app.models import Person, Factoid

from pros_core.setup_app import PROS_MODELS

from icecream import ic

from neomodel import db


fields = {
    "birth_event": {
        "_": {"label"},
        "date": {"earliest_possible", "earliest_possible_conservative"},
        "location": {"label"},
    },
    "death_event": {
        "_": {"label"},
        "date": {"earliest_possible", "earliest_possible_conservative"},
        "location": {"label"},
    },
}


def build_select_value_string(select_values, unpack_values):
    select_value_string = "{"
    select_value_string += ", ".join(f".{v}" for v in select_values)
    if unpack_values:
        select_value_string += ","
        select_value_string += ", ".join(f"{k}: {k}" for k in unpack_values if k != "_")
    select_value_string += "}"
    return select_value_string


def build_nested_call(fields, current_node="a", key=None, n=0):

    # ic(select_values_string)
    res = ""
    if isinstance(fields, set):
        return res
    for k1, v1 in fields.items():

        select_values = {}
        if not isinstance(v1, set):
            select_values = v1.get("_")
        if isinstance(v1, set):
            select_values = v1
        if k1 == "_":
            pass
        if k1 != "_":
            res += f"""
CALL {{
WITH {current_node}
OPTIONAL MATCH ({current_node})-[r_{k1}]-(o_{k1})
WHERE type(r_{k1}) = '{k1.upper()}' OR r_{k1}.reverse_name = '{k1.upper()}'
"""

            res += build_nested_call(v1, current_node=f"o_{k1}", key=k1, n=n + 1)
            if not isinstance(v1, set):
                res += f"RETURN COLLECT(o_{k1}{build_select_value_string(select_values, v1)}) AS {k1} }}"
            else:
                res += f"RETURN o_{k1}{build_select_value_string(select_values, {})} AS {k1} }}"
    return res


def get_relations(entity_type):
    return {
        k: v
        for k, v in PROS_MODELS[entity_type].fields.items()
        if v["type"] == "relation" and not v["inline_relation"]
    }


def get_inline_relations(entity_type):
    return {
        k.lower(): v
        for k, v in PROS_MODELS[entity_type].fields.items()
        if v["type"] == "relation" and v["inline_relation"]
    }


def build_query(entity_type):
    outgoing_relations = get_relations(entity_type)

    outgoing_query = ""
    return_unpacking_strings = []
    for relation_name, relation_dict in outgoing_relations.items():
        relation_type = relation_dict["relation_type"]
        relation_to = relation_dict["relation_to"]
        outgoing_query += f"""
        OPTIONAL MATCH (n)-[{relation_name}_rel:{relation_type}]->({relation_name}_node:{relation_to})
        """
        return_unpacking_strings.append(f'"{relation_name}", {relation_name}_nodes')

    return_unpacking_string = ", ".join(return_unpacking_strings)
    return_string = f"RETURN apoc.map.setValues(n, [{return_unpacking_string}])"
    q = f"""
    MATCH (n:{entity_type.capitalize()} {{uid:"b736fb96ca624d0f8e5268d47e754813"}})
    {outgoing_query}
    {return_string}
    """
    return q


print(build_query("birth"))

"""results, meta = db.cypher_query(
    build_query("birth"), {"uid": "b736fb96ca624d0f8e5268d47e754813"}
)

r = PROS_MODELS["birth"].model.inflate(results[0][0])

ic(r)
"""

ic(get_relations("birth"))
