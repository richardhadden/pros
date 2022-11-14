from collections import defaultdict
from neomodel import (
    StringProperty,
    StructuredNode,
    UniqueIdProperty,
    db,
    RelationshipTo,
    StructuredRel,
    ZeroOrMore,
)
from neomodel.relationship_manager import RelationshipDefinition
from pypher import Pypher, __


REVERSE_RELATIONS = defaultdict(lambda: defaultdict(dict))


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty()
    label = StringProperty()

    def __init_subclass__(cls) -> None:
        """On subclassing ProsNode, search through all RelationshipDefinitions attached
        and update the key of the relation as the relation_type.

        Also, add reverse relation to REVERSE_RELATIONS dict for lookup elsewhere."""
        for k, v in cls.__dict__.items():
            if isinstance(v, RelationshipDefinition):
                v.definition["relation_type"] = k.upper()
                REVERSE_RELATIONS[v._raw_class][
                    v.definition["model"].__dict__["reverse_name"].default.lower()
                ]["relation_to"] = cls.__name__

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

    def direct_relations_as_data(self):
        q = Pypher()
        q.Match.node("s").rel("p").node("o")
        q.WHERE.s.property("uid") == self.uid
        q.RETURN(__.s, __.p, __.o)

        db_results, meta = db.cypher_query(str(q), q.bound_params)

        results = defaultdict(list)

        for r in db_results:
            subj, rel, obj = r

            if (
                rel.start_node.__dict__["_properties"]["real_type"]
                == self.__class__.__name__.lower()
            ):
                results[rel.type.lower()].append({**dict(obj), "relData": rel})
            else:
                results[rel["reverse_name"].lower()].append(
                    {**dict(obj), "relData": rel}
                )

        return results


class ProsRelationBase(StructuredRel):
    reverse_name = StringProperty(required=True)


def ProsRelationTo(
    cls_name, reverse_name: str | None = None, cardinality=None, model=None
):
    m: ProsRelationBase = type(
        model.__name__ if model else "ProsRelation",
        (model if model else ProsRelationBase,),
        {"reverse_name": StringProperty(default=reverse_name.upper()), **model.__dict__}
        if model
        else {"reverse_name": StringProperty(default=reverse_name.upper())},
    )
    REVERSE_RELATIONS[cls_name][reverse_name.lower()]
    return RelationshipTo(
        cls_name,
        f"{cls_name}{reverse_name}",
        cardinality=cardinality or ZeroOrMore,
        model=m,
    )
