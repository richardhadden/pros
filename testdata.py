import pros.django_initializer
from neomodel import db
from collections import defaultdict
import pprint
from icecream import ic

from pros_core.models import ProsNode

PN = ProsNode()

pp = pprint.PrettyPrinter(indent=4)

BOOK = "a1b89b1be7144c78b99f6d180f2b38d0"
BIRTH = "d97d712ef513454787c56a4cf0087113"
TEST = "ee86e37f01f84acd8332cefcfa3dc30f"

from pypher import Pypher, __

q = Pypher()
q.MATCH.node("s", uid=BOOK).rel("p").node("o")
q.OPTIONAL.MATCH.node("o").rel("p2").node("o2")
q.WHERE.CONDITIONALOR(
    __.p.property("inline").operator("=", True),
    __.p2.property("inline").operator("=", True),
)
q.AND(__.s).property("uid").operator("<>", __.o2.property("uid"))

q.RETURN(__.s, __.p, __.o, __.p2, __.o2)


db_results, meta = db.cypher_query(str(q), q.bound_params)

R = defaultdict(list)

CCN = "Book"


for i, result in enumerate(db_results):
    s, p, o, p2, o2 = result
    print("R", i)

    if p.get("inline"):  # Get the inline data of this node
        ic("p inline")

        # this is just inline and has no relations... just unpack
        if p.type.lower() not in R:  # If we have already found it, don't replace it
            # Should not have any relData
            R[p.type.lower()] = dict(o)
        if p2:  # If the inline has any related nodes, get those too...
            if p2.type.lower() not in R[p.type.lower()]:
                R[p.type.lower()][p2.type.lower()] = []
            ic(p2._properties, o2.get("label"))
            R[p.type.lower()][p2.type.lower()].append(
                {
                    **dict(o2),
                    "deleted_and_has_dependent_nodes": PN.has_dependent_relations(
                        dict(o2)["uid"]
                    ),
                    "relData": {k: v for k, v in p2.items() if k != "reverse_name"},
                }
            )

    else:
        ic("p not inline")
        # This result should be treated as an associated inline
        # and redirected

        if p2 and p2.get("inline") and p2.start_node == o2:
            dict_key = p["reverse_name"].lower()
            if dict_key not in R:  # If we have already found it, don't replace it
                R[dict_key] = []
            R[dict_key].append(
                {
                    **dict(o2),
                    "deleted_and_has_dependent_nodes": PN.has_dependent_relations(
                        dict(o2)["uid"]
                    ),
                    "relData": {k: v for k, v in p.items() if k != "reverse_name"},
                }
            )

        else:
            if CCN.lower() == p.start_node.get("real_type"):
                dict_key = p.type.lower()
            else:
                dict_key = p["reverse_name"].lower()

            if dict_key not in R:  # If we have already found it, don't replace it
                R[dict_key] = []
            R[dict_key].append(
                {
                    **dict(o),
                    "deleted_and_has_dependent_nodes": PN.has_dependent_relations(
                        dict(o)["uid"]
                    ),
                    "relData": {k: v for k, v in p.items() if k != "reverse_name"},
                }
            )

    print("=====")


ic(dict(R))
