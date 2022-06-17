from collections import defaultdict
from email.policy import default

from neomodel import StructuredNode, UniqueIdProperty, StringProperty, db


def unpack_result(result):
    relation, node = result
    return relation.type.lower(), node._properties


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty()
    label = StringProperty()

    def save(self):
        self.real_type = type(self).__name__.lower()
        super().save()

    def get_all_related(self):
        """DOES NOT REALLY DO WHAT IS WANTED"""
        results, meta = self.cypher("MATCH (p)<-[r]->(q) WHERE id(p)=$self RETURN r,q")
        unpacked_results = defaultdict(list)
        for result in results:
            relation, node = unpack_result(result)
            unpacked_results[relation].append(node)

        return unpacked_results
