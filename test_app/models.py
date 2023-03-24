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
from pros_uris.models import DefaultUriMixin

from icecream import ic


class UncertainRelation(ProsRelationBase):
    certainty = IntegerProperty(default=1)


class TypedFactoidToFactoidRelation(ProsRelationBase):
    note = StringProperty()


class Reference(ProsInlineOnlyNode):
    class Meta:
        abstract = True


class Citation(Reference):

    page = IntegerProperty(required=True)
    line = IntegerProperty(required=True)
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
        # __all__ can be used in construct_label_template to add label of all related nodes
        construct_label_template = (
            "Letter from {sender.__all__.label} to {recipient.label}"
        )
        order_fields = ["sender", "recipient", "date", "text"]


class Factoid(ProsNode):
    use_list_cache = False
    label = StringProperty(
        index=True, help_text="Short text description", required=True
    )

    citation = Reference.as_inline_field()

    text = StringProperty()

    related_factoids = ProsRelationTo(
        "Factoid",
        reverse_name="related_to_factoid",
        model=TypedFactoidToFactoidRelation,
    )

    class Meta:
        abstract = True


class Order(Factoid):
    person_giving_order = ProsRelationTo(
        "Person",
        reverse_name="gave_order",
        model=UncertainRelation,
        cardinality=OneOrMore,
    )
    person_ordered = ProsRelationTo("Person", "received_order")
    thing_ordered = ProsRelationTo("Factoid", "ordered_by")

    class Meta:
        order_fields = [
            "text",
            "person_giving_order",
            "person_ordered",
            "thing_ordered",
        ]
        override_labels = {
            "is_about_person": OverrideLabel("person_giving_order", "order_given_by"),
        }


class Event(Factoid):
    location = ProsRelationTo("Location", reverse_name="location_of_event")


class Party(Event):
    host = ProsRelationTo(
        "Person",
        reverse_name="hosted_party",
        model=UncertainRelation,
        cardinality=OneOrMore,
    )
    attendee = ProsRelationTo("Person", reverse_name="attended_party")
    date = SingleDate.as_inline_field()

    class Meta:
        display_name_plural = "Parties"
        override_labels = {
            "is_about_person": OverrideLabel("host", "is_host_of"),
        }
        order_fields = ["text", "host", "attendee", "date", "location"]


class Birth(Event):
    person_born = ProsRelationTo(
        "Person",
        reverse_name="birth_event",
        model=UncertainRelation,
        cardinality=One,
    )
    date = SingleDate.as_inline_field()

    class Meta:
        construct_label_template = "Birth of {person_born.label}"
        order_fields = ["text", "person_born", "date", "location"]


class Death(Event):
    person_died = ProsRelationTo(
        "Person",
        reverse_name="death_event",
        model=UncertainRelation,
        cardinality=One,
    )
    date = SingleDate.as_inline_field()
    cause_of_death = StringProperty(default="Tuberculosis")

    class Meta:
        construct_label_template = "Death of {person_died.label}"
        order_fields = ["text", "person_died", "cause_of_death", "date", "location"]


class Naming(Event):
    """Describes the attribution of a name to a Person."""

    person_named = ProsRelationTo(
        "Person",
        reverse_name="has_naming",
        model=UncertainRelation,
        cardinality=One,
    )
    title = StringProperty(help_text="e.g. 'Sir', 'Lord'")
    first_name = StringProperty()
    last_name = StringProperty()

    class Meta:
        order_fields = [
            "person_named",
            "title",
            "first_name",
            "last_name",
            "text",
        ]

        # Overrides the `label` field with template derived from other fields
        # (dotted notation indicates access via relationship -- limited to one rel)
        construct_label_template = (
            "{person_named.label} named {title} {first_name} {last_name}"
        )


class Relation(Factoid):
    subject = ProsRelationTo(
        "Person",
        reverse_name="has_relation",
        model=UncertainRelation,
        cardinality=OneOrMore,
    )
    subject_related_to = ProsRelationTo(
        "Person", reverse_name="is_related_to_subject", model=UncertainRelation
    )

    class Meta:
        abstract = True


class Marriage(Relation):
    class Meta:
        construct_label_template = (
            "{subject.label} married to {subject_related_to.label}"
        )
        override_labels = {
            "subject": OverrideLabel("person", "married"),
            "subject_related_to": OverrideLabel("married to", "married"),
        }
        order_fields = ["text", "subject", "subject_related_to"]


class ParentChildRelation(Relation):
    class Meta:
        display_name = "Parent-Child Relation"
        construct_label_template = (
            "{subject.label} is parent of {subject_related_to.label}"
        )
        override_labels = {
            "subject": OverrideLabel("parent", "is_identified_as_parent"),
            "subject_related_to": OverrideLabel("child", "identified_as_child"),
        }
        order_fields = ["text", "subject", "subject_related_to"]


class Acquaintanceship(Relation):
    date = ComplexDate.as_inline_field()

    class Meta:
        construct_label_template = "{subject.label} knows {subject_related_to.label}"
        order_fields = ["text", "subject", "subject_related_to", "date"]


class Membership(Factoid):
    person = ProsRelationTo(
        "Person",
        reverse_name="has_membership",
        model=UncertainRelation,
        cardinality=OneOrMore,
    )
    member_of = ProsRelationTo("Organisation", reverse_name="membership_organisation")
    date = DateRange.as_inline_field()

    class Meta:
        construct_label_template = "{person.label} is member of {member_of.label}"
        view_label_template = "{label}"
        order_fields = ["text", "person", "member_of", "date"]


class Entity(ProsNode):
    label = StringProperty(required=True, help_text="Short text description")

    class Meta:
        display_name_plural = "Entities"


class Person(DefaultUriMixin, Entity):
    initial_attestation = Citation.as_inline_field()

    # merged = ProsRelationTo("Person", reverse_name="merged")

    class Meta:
        # mergeable = True
        internal_fields = ["merged"]
        unpack_fields = {
            "birth_event": {
                "_": {"label"},
                "date": {"earliest_possible", "earliest_possible_conservative"},
                "location": {"label"},
            },
            "death_event": {
                "_": {"label"},
                "date": {"latest_possible", "latest_possible_conservative"},
                "location": {"label"},
            },
        }
        list_display_extras = {"b.": ["{birth_event[0].date.earliest_possible}"]}

    class Importer:
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
