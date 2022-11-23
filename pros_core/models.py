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


class OverriddenRelationshipDefinition(RelationshipDefinition):
    def __init__(self):
        current_frame = inspect.currentframe()

        def enumerate_traceback(initial_frame):
            depth, frame = 0, initial_frame
            while frame is not None:
                yield depth, frame
                frame = frame.f_back
                depth += 1

        frame_number = 5
        for i, frame in enumerate_traceback(current_frame):
            if self.init_vals["cls_name"] in frame.f_globals:
                frame_number = i
                break
        self.module_name = sys._getframe(frame_number).f_globals["__name__"]
        print(self.module_name)
        if "__file__" in sys._getframe(frame_number).f_globals:
            self.module_file = sys._getframe(frame_number).f_globals["__file__"]
        self._raw_class = self.init_vals["cls_name"]
        self.manager = self.init_vals["manager"]
        self.definition = {}
        self.definition["relation_type"] = self.init_vals["relation_type"]
        self.definition["direction"] = self.init_vals["direction"]
        self.definition["model"] = self.init_vals["model"]

        if self.init_vals["model"] is not None:
            # Relationships are easier to instantiate because (at the moment), they cannot have multiple labels. So, a
            # relationship's type determines the class that should be instantiated uniquely. Here however, we still use
            # a `frozenset([relation_type])` to preserve the mapping type.
            label_set = frozenset([self.init_vals["relation_type"]])
            try:
                # If the relationship mapping exists then it is attempted to be redefined so that it applies to the same
                # label. In this case, it has to be ensured that the class that is overriding the relationship is a
                # descendant of the already existing class
                model_from_registry = db._NODE_CLASS_REGISTRY[label_set]
                if not issubclass(self.init_vals["model"], model_from_registry):
                    is_parent = issubclass(model_from_registry, self.init_vals["model"])
                    if (
                        is_direct_subclass(self.init_vals["model"], StructuredRel)
                        and not is_parent
                    ):
                        raise RelationshipClassRedefined(
                            self.init_vals["relation_type"],
                            db._NODE_CLASS_REGISTRY,
                            self.init_vals["model"],
                        )
                else:
                    db._NODE_CLASS_REGISTRY[label_set] = self.init_vals["model"]
            except KeyError:
                # If the mapping does not exist then it is simply created.
                db._NODE_CLASS_REGISTRY[label_set] = self.init_vals["model"]


class ProsInlineRelation(StructuredNode):
    @classmethod
    def as_field(cls):
        return RelationshipTo(
            cls.__name__,
            f"has_{cls.__name__}",
            cardinality=One,
        )


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

        for r in db_results:
            subj, rel, obj = r

            # TODO: thought of a problem with this, but can't remember what it was
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
