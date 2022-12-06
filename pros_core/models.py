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
from neomodel.properties import BooleanProperty, DateTimeProperty
from neomodel.relationship_manager import (
    RelationshipDefinition,
    RelationshipManager,
    is_direct_subclass,
    RelationshipClassRedefined,
    OUTGOING,
)
from pypher import Pypher, __
import datetime

REVERSE_RELATIONS = defaultdict(lambda: defaultdict(dict))

OverrideLabel = namedtuple("OverrideLabel", ["label", "reverse_label"])


class InlineRelation(StructuredRel):
    """Does not do anything useful as a class, except provide a hook to
    determine whether a relation is inline or not. Can use the 'inline'
    field value (when getting data), or class relation (during setup)
    to determine this."""

    inline = BooleanProperty(default=True)


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty(index=True)
    is_deleted = BooleanProperty(default=False)
    createdBy = StringProperty(index=True)
    createdWhen = DateTimeProperty()
    modifiedBy = StringProperty(index=True)
    modifiedWhen = DateTimeProperty()

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
                    # print(v.__dict__)
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
        # self.modifiedWhen = datetime.datetime.now()
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
        q.MATCH.node("s", uid=self.uid).rel("p").node("o")
        q.OPTIONAL.MATCH("x = ").node("o").rel_out("p2").node("o2")
        q.WHERE.p.property("inline").operator("=", True)
        q.RETURN(__.s, __.p, __.o, __.p2, __.COLLECT(__.x))

        db_results, meta = db.cypher_query(str(q), q.bound_params)

        results = defaultdict(list)

        for r in db_results:
            subj, rel, obj, p2, inline = r

            if inline:
                if not results[rel.type.lower()]:
                    results[rel.type.lower()] = defaultdict(list)
                for i in inline:

                    results[rel.type.lower()] = {
                        **results[rel.type.lower()],
                        **i.start_node,
                    }
                    results[rel.type.lower()]["type"] = results[rel.type.lower()].pop(
                        "real_type"
                    )

                    if not results[rel.type.lower()].get(p2.type.lower()):
                        results[rel.type.lower()][p2.type.lower()] = []
                    results[rel.type.lower()][p2.type.lower()].append(i.end_node)
                """
                for i in x:
                    print(p2.type, i)
                    print("------")
                """
                """
                if rel2:
                    for r2 in rel2:
                        res[r2.type.lower()] = []
                # if rel2:
                #    res[rel2.type.lower()] = dict(obj2)
                res.pop("uid")
                res["type"] = res.pop("real_type")
                results[rel.type.lower()] = res
                """
            elif rel.get("inline"):
                res = dict(obj)
                res.pop("uid")
                res["type"] = res.pop("real_type")
                results[rel.type.lower()] = res

            elif (
                # TODO: thought of a problem with this, but can't remember what it was
                rel.start_node.__dict__["_properties"]["real_type"]
                == self.__class__.__name__.lower()
            ):
                results[rel.type.lower()].append(
                    {
                        **dict(obj),
                        "deleted_and_has_dependent_nodes": self.has_dependent_relations(
                            dict(obj)["uid"]
                        ),
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
                        "deleted_and_has_dependent_nodes": self.has_dependent_relations(
                            dict(obj)["uid"]
                        ),
                        "relData": {
                            k: v for k, v in rel.items() if k != "reverse_name"
                        },
                    }
                )

        return results

    def has_relations(self):
        """-> Bool: node is related to another node"""
        q = Pypher()
        q.Match.node("s").rel().node("o")
        q.WHERE.s.property("uid") == self.uid
        q.RETURN.count("s") > 0

        db_results, meta = db.cypher_query(str(q), q.bound_params)

        return db_results[0][0]

    def has_dependent_relations(self, uid=None):
        uid = uid or self.uid
        """-> Bool: other nodes are dependent on this node. Deleting it would break links."""
        q = Pypher()
        q.Match.node("s").rel_in().node("o")
        q.WHERE.s.property("uid") == uid
        q.RETURN.count("s") > 0

        db_results, meta = db.cypher_query(str(q), q.bound_params)
        return db_results[0][0]


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
