from collections import defaultdict
from neomodel import (
    StringProperty,
    StructuredNode,
    UniqueIdProperty,
    db,
    RelationshipTo,
)
from pypher import Pypher, __


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty()
    label = StringProperty()

    def save(self):
        self.real_type = type(self).__name__.lower()
        super().save()

    def __hash__(self):
        return hash(self.uid)

    @property
    def properties(self):
        properties = {}
        for k, v in self.__dict__.items():
            if k not in dict(self.__all_relationships__):
                properties[k] = v
        return properties

    def all_related(self):
        q = Pypher()
        q.Match.node("s").rel("p").node("o")
        q.WHERE.s.property("uid") == self.uid
        q.RETURN(__.p, __.o)

        db_results, meta = db.cypher_query(str(q), q.bound_params)

        results = defaultdict(list)
        for r in db_results:
            rel, obj = r
            results[rel.type.lower()].append({**dict(obj), "relData": {}})

        return results
