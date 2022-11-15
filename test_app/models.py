from neomodel import (
    StringProperty,
)

from pros_core.models import ProsNode, ProsRelationTo, ProsRelationBase
from pros_core.filters import icontains


class UncertainRelation(ProsRelationBase):
    certainty = StringProperty(default="1")


class Factoid(ProsNode):
    is_about_person = ProsRelationTo(
        "Person", reverse_name="HAS_FACTOID_ABOUT", model=UncertainRelation
    )
    has_source = ProsRelationTo("Source", reverse_name="IS_SOURCE_OF")

    text = StringProperty()

    class Meta:
        abstract = True


class Naming(Factoid):
    title = StringProperty()
    first_name = StringProperty()
    last_name = StringProperty()

    class Meta:
        # Sets fields for filtering by text
        # Can take field names as strings, or any Pypher object (or custom filters
        # that return a Pypher object)
        # where 's', 'p', 'o' = Subject (self), Property, (related) Object
        text_filter_fields = [
            "title",
            "first_name",
            "last_name",
            "text",
            icontains("o", "label"),
        ]

        # Overrides the `label` field with template derived from other fields
        # (dotted notation indicates access via relationship -- limited to one rel)
        label_template = (
            "{is_about_person.label} named {title} {first_name} {last_name}"
        )


class Membership(Factoid):
    member_of = ProsRelationTo("Organisation", reverse_name="membership_organisation")

    class Meta:
        label_template = "{is_about_person.label} is member of {member_of.label}"


class Entity(ProsNode):
    class Meta:
        display_name_plural = "Entities"


class Person(Entity):
    pass


class Organisation(Entity):
    pass


class Source(ProsNode):
    pass


class Letter(Source):
    text = StringProperty()
    sender = ProsRelationTo(
        "Entity", reverse_name="is_sender_of", model=UncertainRelation
    )
    recipient = ProsRelationTo(
        "Entity", reverse_name="is_recipient_of", model=UncertainRelation
    )

    class Meta:
        # __all__ can be used in label_template to add label of all related nodes
        label_template = "Letter from {sender.__all__.label} to {recipient.label}"
