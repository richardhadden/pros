from neomodel import (
    StringProperty,
)

from pros_core.models import ProsNode, ProsRelationTo, ProsRelationBase
from pros_core.filters import icontains


class UncertainRelation(ProsRelationBase):
    certainty = StringProperty(default="1")


class Factoid(ProsNode):
    has_source = ProsRelationTo("Source", reverse_name="IS_SOURCE_OF")
    is_about_person = ProsRelationTo(
        "Person", reverse_name="HAS_FACTOID_ABOUT", model=UncertainRelation
    )
    text = StringProperty()

    class Meta:
        abstract = True


class Naming(Factoid):
    title = StringProperty()
    first_name = StringProperty()
    last_name = StringProperty()

    class Meta:
        text_filter_fields = [
            "title",
            "first_name",
            "last_name",
            "text",
            icontains("o", "label"),
        ]


class Entity(ProsNode):
    class Meta:
        display_name_plural = "Entities"


class Person(Entity):
    pass


class Source(ProsNode):
    pass
