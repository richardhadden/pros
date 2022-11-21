from collections import defaultdict, namedtuple
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

OverrideLabel = namedtuple("OverrideLabel", ["label", "reverse_label"])


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty(index=True)
    label = StringProperty(index=True, help_text="Short text description")

    class Meta:
        pass

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

        for r in db_results:
            subj, rel, obj = r

            if (
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
