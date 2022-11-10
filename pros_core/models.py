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

    def all_related(self):
        q = Pypher()
        q.Match.node("s", labels="Person").rel("p").node("o")
        q.WHERE.s.property("uid") == self.uid
        q.RETURN(__.p, __.o)

        results, meta = db.cypher_query(str(q), q.bound_params)
        return results
