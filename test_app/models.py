from neomodel import One, ZeroOrOne, OneOrMore
from neomodel.properties import (
    StringProperty,
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
    ProsInlineOnlyNode,
)
from pros_core.filters import icontains

from pros_dating.models import (
    IncompleteDateProperty,
    SingleDate,
    ComplexDate,
    DateRange,
)


class UncertainRelation(ProsRelationBase):
    certainty = IntegerProperty(default=1)


class TypedFactoidToFactoidRelation(ProsRelationBase):
    note = StringProperty()


class Reference(ProsInlineOnlyNode):
    class Meta:
        abstract = True


class Citation(Reference):

    page = IntegerProperty()
    line = IntegerProperty()
    source = ProsRelationTo("Source", "is_source_of", cardinality=One)


class ImpliedByFactoid(Reference):
    implied_by_factoid = ProsRelationTo("Factoid", reverse_name="implies")


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
        order_fields = ["sender", "recipient", "date", "text"]


class Factoid(ProsNode):
    label = StringProperty(
        index=True, help_text="Short text description", required=True
    )

    is_about_person = ProsRelationTo(
        "Person",
        reverse_name="HAS_FACTOID_ABOUT",
        model=UncertainRelation,
        cardinality=OneOrMore,
    )
    citation = Reference.as_inline_field()

    text = StringProperty(required=True)

    related_factoids = ProsRelationTo(
        "Factoid",
        reverse_name="related_to_factoid",
        model=TypedFactoidToFactoidRelation,
    )

    class Meta:
        abstract = True
        text_filter_fields = [
            icontains("o", "label"),
        ]


class Order(Factoid):
    person_ordered = ProsRelationTo("Person", "received_order")
    thing_ordered = ProsRelationTo("Factoid", "ordered_by")


class Event(Factoid):
    location = ProsRelationTo("Location", reverse_name="location_of_event")


class Party(Event):
    attendee = ProsRelationTo("Person", reverse_name="attended_party")
    date = SingleDate.as_inline_field()

    class Meta:
        display_name_plural = "Parties"
        override_labels = {
            "is_about_person": OverrideLabel("host", "is_host_of"),
        }
        order_fields = ["text", "is_about_person", "attendee", "date", "location"]


class Birth(Event):
    date = SingleDate.as_inline_field()

    class Meta:
        label_template = "Birth of {is_about_person.label}"
        order_fields = ["text", "is_about_person", "date", "location"]


class Death(Event):
    date = SingleDate.as_inline_field()
    cause_of_death = StringProperty(default="Tuberculosis")

    class Meta:
        label_template = "Death of {is_about_person.label}"
        text_filter_fields = ["cause_of_death", icontains("o", "label")]
        order_fields = ["text", "is_about_person", "cause_of_death", "date", "location"]


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

        order_fields = [
            "is_about_person",
            "title",
            "first_name",
            "last_name",
            "text",
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


class Marriage(Relation):
    class Meta:
        label_template = "{is_about_person.label} married to {subject_related_to.label}"
        override_labels = {
            "is_about_person": OverrideLabel("person", "married"),
            "subject_related_to": OverrideLabel("married to", "married"),
        }


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
        order_fields = ["text", "is_about_person", "subject_related_to"]


class Acquaintanceship(Relation):
    date = ComplexDate.as_inline_field()

    class Meta:
        label_template = "{is_about_person.label} knows {subject_related_to.label}"
        order_fields = ["text", "is_about_person", "subject_related_to", "date"]


class Membership(Factoid):
    member_of = ProsRelationTo("Organisation", reverse_name="membership_organisation")
    date = DateRange.as_inline_field()

    class Meta:
        label_template = "{is_about_person.label} is member of {member_of.label}"
        order_fields = ["text", "is_about_person", "member_of", "date"]


class Entity(ProsNode):
    label = StringProperty(required=True, help_text="Short text description")

    class Meta:
        display_name_plural = "Entities"


class Person(Entity):
    pass


class Organisation(Entity):
    has_location = ProsRelationTo(
        "Location", reverse_name="location_of", cardinality=ZeroOrOne
    )


class Location(ProsNode):
    label = StringProperty()
    location_type = StringProperty()
    located_within = ProsRelationTo(
        "Location", reverse_name="location_of", cardinality=ZeroOrOne
    )


class Test(ProsNode):
    label = StringProperty(index=True, help_text="Short text description")

    integer = IntegerProperty(help_text="An integer for you to enjoy")
    float = FloatProperty()
    boolean = BooleanProperty(default=True)
    date = DateProperty()
    dateTime = DateTimeProperty()
    email = EmailProperty()
    complex_date = IncompleteDateProperty()
