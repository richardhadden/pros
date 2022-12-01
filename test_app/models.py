from neomodel import (
    StringProperty,
)
from neomodel.properties import (
    BooleanProperty,
    DateProperty,
    DateTimeProperty,
    EmailProperty,
    FloatProperty,
    IntegerProperty,
)

from pros_core.models import (
    ProsNode,
    ProsRelationTo,
    ProsRelationBase,
    OverrideLabel,
    ProsDateProperty,
)
from pros_core.filters import icontains

from pros_dating.models import SingleDate, ComplexDate, DateRange


class UncertainRelation(ProsRelationBase):
    certainty = StringProperty(default="1")


class Source(ProsNode):
    label = StringProperty(index=True, help_text="Short text description")


class Letter(Source):
    text = StringProperty()
    date = SingleDate.as_inline_field()
    sender = ProsRelationTo(
        "Entity", reverse_name="is_sender_of", model=UncertainRelation
    )
    recipient = ProsRelationTo(
        "Entity", reverse_name="is_recipient_of", model=UncertainRelation
    )

    class Meta:
        # __all__ can be used in label_template to add label of all related nodes
        label_template = "Letter from {sender.__all__.label} to {recipient.label}"


class Factoid(ProsNode):
    label = StringProperty(index=True, help_text="Short text description")

    is_about_person = ProsRelationTo(
        "Person", reverse_name="HAS_FACTOID_ABOUT", model=UncertainRelation
    )
    has_source = ProsRelationTo("Source", reverse_name="IS_SOURCE_OF")

    text = StringProperty()

    class Meta:
        abstract = True
        text_filter_fields = [
            icontains("o", "label"),
        ]


class Event(Factoid):
    pass


class Party(Event):
    attendee = ProsRelationTo("Person", reverse_name="attended_party")

    class Meta:
        display_name_plural = "Parties"
        override_labels = {
            "is_about_person": OverrideLabel("host", "is_host_of"),
        }


class Birth(Event):
    date = SingleDate.as_inline_field()


class Death(Event):
    date = SingleDate.as_inline_field()


class Naming(Event):
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


class Relation(Factoid):
    subject_related_to = ProsRelationTo(
        "Person", reverse_name="is_related_to_subject", model=UncertainRelation
    )

    class Meta:
        abstract = True


class ParentChildRelation(Relation):
    class Meta:
        display_name = "Parent-Child Relation"
        label_template = (
            "{is_about_person.label} is parent of {subject_related_to.label}"
        )
        override_labels = {
            "is_about_person": OverrideLabel("parent", "is_identified_as_parent"),
            "subject_related_to": OverrideLabel("child", "identified_as_child"),
        }


class Acquaintanceship(Relation):
    date = ComplexDate.as_inline_field()

    class Meta:
        label_template = "{is_about_person.label} knows {subject_related_to.label}"


class Membership(Factoid):
    member_of = ProsRelationTo("Organisation", reverse_name="membership_organisation")
    date = DateRange.as_inline_field()

    class Meta:
        label_template = "{is_about_person.label} is member of {member_of.label}"


class Entity(ProsNode):
    label = StringProperty(index=True, help_text="Short text description")

    class Meta:
        display_name_plural = "Entities"


class Person(Entity):
    pass


class Organisation(Entity):
    pass


class Test(ProsNode):
    label = StringProperty(index=True, help_text="Short text description")

    integer = IntegerProperty(help_text="An integer for you to enjoy")
    float = FloatProperty()
    boolean = BooleanProperty(default=True)
    date = DateProperty()
    dateTime = DateTimeProperty()
    email = EmailProperty()
    prosdate = ProsDateProperty()
