q = """
    MATCH (a)
    WHERE $type in labels(a)
    OPTIONAL MATCH path = (a)-[r:MERGED*]-(b)
  
    CALL {
        WITH a
        WITH a
        WHERE a.is_deleted
        RETURN false as has_inbound_a

        UNION

        MATCH (a)<-[in_r]-()
        WHERE NOT in_r:MERGED
        RETURN COUNT(a) > 0  as has_inbound_a
    }
    CALL {
        WITH b
        WITH b
        WHERE b.is_deleted
        RETURN false as has_inbound_b

        UNION

        MATCH (b)<-[in_r]-()
        WHERE NOT in_r:MERGED
        RETURN COUNT(b) > 0  as has_inbound_b
    }

    RETURN a{.label, .uid, .real_type, .is_deleted, deleted_and_has_dependent_relations:has_inbound_a AND a.is_deleted},
           b{.label, .uid, .real_type, .is_deleted, deleted_and_has_dependent_relations:has_inbound_b AND b.is_deleted}
    ORDER BY a.real_type, a.label
"""
import pros.django_initializer


from icecream import ic

from multilookupdict import MultiLookupDict
from collections import defaultdict
from frozendict import frozendict

from neomodel import db

results, meta = db.cypher_query(q, {"type": "Person"})

R = MultiLookupDict()
for p1, p2 in results:

    p1_p = p1
    p1_uid = p1_p["uid"]
    if not p2:
        if not p1_uid in R:
            R[p1_uid] = {p1_uid: p1_p}
        else:
            R[p1_uid][p1_uid] = p1_p
        continue

    p2_p = p2
    p2_uid = p2_p["uid"]
    if p1_uid not in R and p2_uid not in R:
        R[(p1_uid, p2_uid)] = {p1_uid: p1_p, p2_uid: p2_p}
        continue

    if p1_uid not in R:
        R.map_key(p2_uid, p1_uid)
        R[p1_uid][p1_uid] = p1_p

    if p2_uid not in R:
        R.map_key(p1_uid, p2_uid)
        R[p2_uid][p2_uid] = p2_p

return_values = []

for k, v in R.items():
    vals = list(v.values())
    if len(vals) == 1:
        return_values.append(vals[0])
    else:
        ic(vals)
        for i in range(len(vals)):

            selection = vals[i]
            rest = filter(lambda item: item["uid"] != selection["uid"], vals)
            return_values.append({"item": selection, "merged": list(rest)})


# ic(return_values)
