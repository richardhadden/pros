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
    ZeroOrOne,
)
from neomodel.properties import BooleanProperty, DateTimeProperty, ArrayProperty
from neomodel.relationship_manager import (
    RelationshipDefinition,
    RelationshipManager,
    is_direct_subclass,
    RelationshipClassRedefined,
    OUTGOING,
)
from pypher import Pypher, __
import datetime

from icecream import ic

from frozendict import frozendict

REVERSE_RELATIONS = defaultdict(lambda: defaultdict(dict))

OverrideLabel = namedtuple("OverrideLabel", ["label", "reverse_label"])


class InlineRelation(StructuredRel):
    """Does not do anything useful as a class, except provide a hook to
    determine whether a relation is inline or not. Can use the 'inline'
    field value (when getting data), or class relation (during setup)
    to determine this."""

    inline = BooleanProperty(default=True)


class DeletedNode(StructuredNode):
    uid = UniqueIdProperty()
    type = ArrayProperty(StringProperty(), index=True)
    deletedWhen = DateTimeProperty()


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
            cls.__name__,
            f"has_{cls.__name__}",
            cardinality=ZeroOrOne,
            model=InlineRelation,
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

        for c in cls.__bases__:
            if "Mixin" not in c.__name__:
                base_for_meta = c
                break

        base_attrs = {**getattr(base_for_meta, "Meta").__dict__}

        for remove_field in ["display_name", "display_name_plural", "abstract"]:
            base_attrs.pop(remove_field, None)

        meta_attrs = {**base_attrs, **cls.__dict__.get("Meta", __class__.Meta).__dict__}
        cls.Meta = type(
            "Meta",
            (__class__.Meta,),
            meta_attrs,
        )

    def save(self, *args, **kwargs):
        self.real_type = type(self).__name__.lower()
        # self.modifiedWhen = datetime.datetime.now()
        super().save(*args, **kwargs)

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
        q = """
        MATCH (a {uid:$uid})
OPTIONAL MATCH (a)-[rel:MERGED*]-(b)
WITH [a,b] as ss
UNWIND ss as s
MATCH (s)
OPTIONAL MATCH (s)-[r]-(o)
WHERE type(r)<>"MERGED" AND s.uid <> o.uid
OPTIONAL MATCH (o)-[r2]-(o2)
WHERE type(r2)<>"MERGED" AND s.uid <> o2.uid

AND r.inline OR r2.inline   
OPTIONAL MATCH (o)-[dp:DATE]->(odate)
OPTIONAL MATCH (o2)-[db:DATE]->(o2date)
     
RETURN s, r, o, r2, o2, odate, o2date"""

        db_results, meta = db.cypher_query(q, {"uid": self.uid})

        R = defaultdict(set)
        labels = set()

        for result in db_results:
            ic(result)

        for i, result in enumerate(db_results):

            s, p, o, p2, o2, odate, o2date = result
            labels.add(s.get("label"))
            if p and p.get("inline"):  # Get the inline data of this node

                # this is just inline and has no relations... just unpack
                if (
                    p.type.lower() not in R
                ):  # If we have already found it, don't replace it
                    # Should not have any relData
                    d = dict(o)
                    d["sort_date"] = odate.get("earliest_possible") if odate else ""
                    d["type"] = d["real_type"]
                    R[p.type.lower()] = d

                if p2:  # If the inline has any related nodes, get those too...
                    try:
                        if p2.type.lower() not in R[p.type.lower()]:
                            R[p.type.lower()][p2.type.lower()] = set()

                        R[p.type.lower()][p2.type.lower()].add(
                            frozendict(
                                {
                                    **dict(o2),
                                    "sort_date": o2date.get(
                                        "earliest_possible_conservative"
                                    )
                                    if o2date
                                    else "",
                                    # TODO: This is only necessary if actually deleted!!
                                    "deleted_and_has_dependent_nodes": self.has_dependent_relations(
                                        dict(o2)["uid"]
                                    )
                                    if o2.get("is_deleted")
                                    else False,
                                    "relData": frozendict(
                                        {
                                            k: v
                                            for k, v in p2.items()
                                            if k != "reverse_name"
                                        }
                                    ),
                                }
                            )
                        )
                    except:
                        pass

            else:
                # This result should be treated as an associated inline
                # and redirected

                if p2 and p2.get("inline") and p2.start_node == o2:
                    dict_key = p["reverse_name"].lower()
                    if (
                        dict_key not in R
                    ):  # If we have already found it, don't replace it
                        R[dict_key] = set()  # Make these a set to deduplicate
                    R[dict_key].add(
                        frozendict(
                            {
                                **dict(o2),
                                "sort_date": o2date.get(
                                    "earliest_possible_conservative"
                                )
                                if o2date
                                else "",
                                # TODO: This is only necessary if actually deleted!!
                                "deleted_and_has_dependent_nodes": self.has_dependent_relations(
                                    dict(o2)["uid"]
                                )
                                if o2.get("is_deleted")
                                else False,
                                "relData": frozendict(
                                    {k: v for k, v in p.items() if k != "reverse_name"}
                                ),
                            }
                        )
                    )

                else:
                    # This method of determining direction of relation originally
                    # used the types, but this caused problems for relations to same type.
                    # Instead, use the uid of the nodes to determine directionality
                    if s and p and s.get("uid") == p.start_node.get("uid"):

                        dict_key = p.type.lower()
                    elif p:
                        dict_key = p["reverse_name"].lower()

                    try:
                        if (
                            dict_key and dict_key not in R
                        ):  # If we have already found it, don't replace it
                            R[dict_key] = set()
                        R[dict_key].add(
                            frozendict(
                                {
                                    **dict(o),
                                    "sort_date": odate.get(
                                        "earliest_possible_conservative"
                                    )
                                    if odate
                                    else "",
                                    "deleted_and_has_dependent_nodes": self.has_dependent_relations(
                                        dict(o)["uid"]
                                    )
                                    if o.get("is_deleted")
                                    else False,
                                    "relData": frozendict(
                                        {
                                            k: v
                                            for k, v in p.items()
                                            if k != "reverse_name"
                                        }
                                    ),
                                }
                            )
                        )
                    except:
                        pass
        R["label"] = labels
        return R

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


class ProsInlineOnlyNode(ProsNode):
    """Node type intended to be used for inline node. Will be deleted automatically
    when owner node is deleted."""

    class Meta:
        inline_only = True
        abstract = True


class ProsRelationBase(StructuredRel):
    reverse_name = StringProperty(required=True)


def ProsRelationTo(
    cls_name,
    reverse_name: str | None = None,
    cardinality=None,
    model=None,
    help_text: str = None,
):
    m: ProsRelationBase = type(
        model.__name__ if model else "ProsRelation",
        (model if model else ProsRelationBase,),
        {"reverse_name": StringProperty(default=reverse_name.upper()), **model.__dict__}
        if model
        else {"reverse_name": StringProperty(default=reverse_name.upper())},
    )
    m.help_text = help_text
    REVERSE_RELATIONS[cls_name][reverse_name.lower()]

    return RelationshipTo(
        cls_name,
        f"{cls_name}{reverse_name}",
        cardinality=cardinality or ZeroOrMore,
        model=m,
    )
