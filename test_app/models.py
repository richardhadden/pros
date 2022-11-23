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
    ProsInlineRelation,
)
from pros_core.filters import icontains


class UncertainRelation(ProsRelationBase):
    certainty = StringProperty(default="1")


class ComplexDate(ProsInlineRelation):
    class Meta:
        abstract = True


class PreciseDate(ComplexDate):
    date = DateProperty()


class PreciseDateRange(ComplexDate):
    start = DateProperty()
    end = DateProperty()


class ImpreciseDate(ComplexDate):
    not_before = DateProperty()
    not_after = DateProperty()


class ImpreciseDateRange(ComplexDate):
    start_not_before = DateProperty()
    start_not_after = DateProperty()
    end_not_before = DateProperty()
    end_not_after = DateProperty()


class Factoid(ProsNode):
    is_about_person = ProsRelationTo(
        "Person", reverse_name="HAS_FACTOID_ABOUT", model=UncertainRelation
    )
    has_source = ProsRelationTo("Source", reverse_name="IS_SOURCE_OF")

    text = StringProperty()

    date = ComplexDate.as_field()

    class Meta:
        abstract = True
        text_filter_fields = [
            icontains("o", "label"),
        ]


class Event(Factoid):
    pass


class Birth(Event):
    pass


class Death(Event):
    pass


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
    class Meta:
        label_template = "{is_about_person.label} knows {subject_related_to.label}"


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


class Test(ProsNode):
    integer = IntegerProperty(help_text="An integer for you to enjoy")
    float = FloatProperty()
    boolean = BooleanProperty(default=True)
    date = DateProperty()
    dateTime = DateTimeProperty()
    email = EmailProperty()
