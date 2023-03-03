import pros.django_initializer

from test_app.models import Person, Factoid

from pypher import Pypher

from icecream import ic


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


def flatten_dict(dd, separator="|", prefix=""):
    return (
        {
            prefix + separator + k if prefix else k: v
            for kk, vv in dd.items()
            for k, v in flatten_dict(vv, separator, kk).items()
        }
        if isinstance(dd, dict)
        else {prefix: dd}
    )


def build_nested_call(fields, current_node="n", key=None, n=0):

    # ic(select_values_string)
    res = ""
    if isinstance(fields, set):
        return res
    for k1, v1 in fields.items():
        select_values_string = ""
        if not isinstance(v1, set):
            select_values = v1.get("_")
            if select_values:
                select_values_string = "{"
                select_values_string += ", ".join(f".{v}" for v in select_values)
                select_values_string += "}"
        if isinstance(v1, set):
            select_values_string = "{"
            select_values_string += ", ".join(f".{v}" for v in v1)
            select_values_string += "}"
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
                res += f"RETURN COLLECT(apoc.map.setValues(o_{k1}{select_values_string}, [{', '.join(f''''{k}', {k}''' for k in v1 if k!='_')}])) AS {k1}}}"
            else:
                res += f"RETURN o_{k1}{select_values_string} AS {k1} }}"
    return res


print(build_nested_call(fields))

# from neomodel import db

# results, meta = db.cypher_query(q, {})

# ic(results)
