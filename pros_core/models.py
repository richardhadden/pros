from collections import defaultdict, namedtuple
from neomodel import (
    StringProperty,
    StructuredNode,
    UniqueIdProperty,
    db,
    RelationshipTo,
    StructuredRel,
    ZeroOrMore,
    One,
)
from neomodel.properties import BooleanProperty
from neomodel.relationship_manager import (
    RelationshipDefinition,
    RelationshipManager,
    is_direct_subclass,
    RelationshipClassRedefined,
    OUTGOING,
)
from pypher import Pypher, __
import inspect
import sys

REVERSE_RELATIONS = defaultdict(lambda: defaultdict(dict))

OverrideLabel = namedtuple("OverrideLabel", ["label", "reverse_label"])


class InlineRelation(StructuredRel):
    inline = BooleanProperty(default=True)


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty(index=True)
    is_deleted = BooleanProperty(default=False)

    @classmethod
    def as_inline_field(cls):
        """Allows embedding of model as an inline field with cardinality-one relationship.

        Use with caution. Changing a related field inline will create a new instance,
        not modify the original."""
        return RelationshipTo(
            cls.__name__, f"has_{cls.__name__}", cardinality=One, model=InlineRelation
        )

    class Meta:
        pass

    def __init_subclass__(cls) -> None:
        """On subclassing ProsNode, search through all RelationshipDefinitions attached
        and update the key of the relation as the relation_type.

        Also, add reverse relation to REVERSE_RELATIONS dict for lookup elsewhere."""

        for k, v in cls.__dict__.items():
            if isinstance(v, RelationshipDefinition):
                # print(v.definition)
                try:
                    v.definition["relation_type"] = k.upper()
                    REVERSE_RELATIONS[v._raw_class][
                        v.definition["model"].__dict__["reverse_name"].default.lower()
                    ]["relation_to"] = cls.__name__
                except:
                    pass

        """ Allow meta inheritance
        
        N.B. Some fields should not be inherited —— display names, for obvious reasons ——
        and subclasses should never be abstract unless specified
        """

        base_attrs = {**getattr(cls.__base__, "Meta").__dict__}

        for remove_field in ["display_name", "display_name_plural", "abstract"]:
            base_attrs.pop(remove_field, None)

        meta_attrs = {**base_attrs, **cls.__dict__.get("Meta", __class__.Meta).__dict__}
        cls.Meta = type(
            "Meta",
            (__class__.Meta,),
            meta_attrs,
        )

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
        print(db_results)
        for r in db_results:
            subj, rel, obj = r
            # print(rel.type)
            # TODO: thought of a problem with this, but can't remember what it was
            if rel.get("inline"):
                res = dict(obj)
                res.pop("uid")
                res["type"] = res.pop("real_type")
                results[rel.type.lower()] = res
            elif (
                rel.start_node.__dict__["_properties"]["real_type"]
                == self.__class__.__name__.lower()
            ):

                results[rel.type.lower()].append(
                    {
                        **dict(obj),
                        "relData": {
                            k: v for k, v in rel.items() if k != "reverse_name"
                        },
                    }
                )
            else:
                reverse_name = rel["reverse_name"]
                results[reverse_name.lower()].append(
                    {
                        **dict(obj),
                        "relData": {
                            k: v for k, v in rel.items() if k != "reverse_name"
                        },
                    }
                )

        return results

    def has_relations(self):
        print(self.uid)
        q = Pypher()
        q.Match.node("s").rel().node("o")
        q.WHERE.s.property("uid") == self.uid
        q.RETURN(__.s, __.o)

        db_results, meta = db.cypher_query(str(q), q.bound_params)

        return db_results


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
