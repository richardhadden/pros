from neomodel import One, OneOrMore, ZeroOrMore, ZeroOrOne
from neomodel.properties import StringProperty, IntegerProperty
from pros_core.models import (
    ProsRelationBase,
    ProsNode,
    ProsRelationTo,
    ProsInlineOnlyNode,
)
from pros_dating.models import (
    PreciseDate,
    ImpreciseDate,
    PreciseDateRange,
    ImpreciseDateRange,
    SingleDate,
    DateRange,
)


class UncertainRelation(ProsRelationBase):
    certainty = IntegerProperty(default=1)


class Entity(ProsNode):
    class Meta:
        abstract = True
        display_name_plural = "Entities"


class Person(Entity):
    label = StringProperty()


class Place(Entity):
    label = StringProperty()


class Organisation(Entity):
    label = StringProperty()


class Item(Entity):
    class Meta:
        abstract = True

    label = StringProperty()


class Work(Entity):
    class Meta:
        abstract = True

    label = StringProperty()


class ArtWork(Work):
    label = StringProperty()


class MusicWork(Work):
    label = StringProperty()


class Role(Entity):
    label = StringProperty()
    in_organisation = ProsRelationTo("Organisation", "has_role", ZeroOrOne)


class Reference(ProsInlineOnlyNode):
    class Meta:
        abstract = True


class Citation(Reference):

    page = IntegerProperty(required=True)
    line = IntegerProperty(required=True)
    source = ProsRelationTo("Source", "is_source_of", cardinality=One)


class Statement(ProsNode):
    class Meta:
        abstract = True

    label = StringProperty()
    reference = Citation.as_inline_field()


class Birth(Statement):
    person_born = ProsRelationTo(
        "Person",
        reverse_name="birth_event",
        model=UncertainRelation,
        cardinality=One,
    )
    date = SingleDate.as_inline_field()
    location = ProsRelationTo("Place", "is_location_of", cardinality=One)

    class Meta:
        construct_label_template = "Birth of {person_born.label}"
        order_fields = ["person_born", "date", "location"]


class Death(Statement):
    person_died = ProsRelationTo(
        "Person",
        reverse_name="death_event",
        model=UncertainRelation,
        cardinality=One,
    )
    date = SingleDate.as_inline_field()
    location = ProsRelationTo("Place", "is_location_of", cardinality=One)

    class Meta:
        construct_label_template = "Death of {person_died.label}"
        order_fields = ["person_died", "date", "location"]


class Naming(Statement):
    person_named = ProsRelationTo("Person", "has_name", One)
    forename = StringProperty()
    surname = StringProperty()
    role_name = StringProperty()
    additional_names = StringProperty()

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
        construct_label_template = "{person_named.label} named {forename} {surname} {role_name} {additional_names}"


class Order(Statement):
    person_ordering = ProsRelationTo("Person", "was ordered by", ZeroOrMore)
    person_ordered = ProsRelationTo("Person", "was ordered to do", ZeroOrMore)
    thing_ordered = ProsRelationTo("Statement", "was ordered by", One)
    date = SingleDate.as_inline_field()

    class Meta:
        order_fields = ["person_ordering", "person_ordered", "thing_ordered", "date"]


class OrganisationStatement(Statement):
    class Meta:
        abstract = True


class ElectionToRole(OrganisationStatement):
    person_elected_to_role = ProsRelationTo("Person", "was_elected_to_role", One)
    role_elected_to = ProsRelationTo("Role", "role_elected_to", One)
    date = SingleDate.as_inline_field()

    class Meta:
        order_fields = ["person_elected_to_role", "role_elected_to", "date"]
        display_name = "Election To Role"
        display_name_plural = "Elections to Role"
        construct_label_template = (
            "{person_elected_to_role.label} elected to {role_elected_to.label}"
        )


class AssignmentToRole(OrganisationStatement):
    person_assigned_to_role = ProsRelationTo("Person", "was_assigned_to_role", One)
    person_assigning = ProsRelationTo("Person", "assigned_role", ZeroOrMore)
    role_assigned_to = ProsRelationTo("Role", "assigned_in", One)
    date = SingleDate.as_inline_field()

    class Meta:
        display_name = "Assignment to Role"
        display_name_plural = "Assignments to Role"
        order_fields = [
            "person_assigned_to_role",
            "role_assigned_to",
            "person_assigning",
            "date",
        ]
        construct_label_template = "{person_assigned_to_role.label} assigned to role {role_assigned_to.label} by {person_assigning.label}"


class RemovalFromRole(OrganisationStatement):
    person_removed_from_role = ProsRelationTo("Person", "was_assigned_to_role", One)
    person_removing = ProsRelationTo("Person", "assigned_role", ZeroOrMore)
    role_removed_from = ProsRelationTo("Role", "assigned_in", One)
    date = SingleDate.as_inline_field()

    class Meta:
        display_name = "Removal from Role"
        display_name_plural = "Removals from Role"
        order_fields = [
            "person_removed_from_role",
            "role_removed_from",
            "person_removing",
            "date",
        ]
        construct_label_template = "{person_removed_from_role.label} assigned to role {role_assigned_to.label} by {person_removing.label}"


class RoleOccupation(OrganisationStatement):
    person_occupying_role = ProsRelationTo("Person", "occupied_role", One)
    role_occupied = ProsRelationTo("Role", "role_occupied", One)
    date = DateRange.as_inline_field()

    class Meta:
        order_fields = ["person_occupying_role", "role_occupied", "date"]
        construct_label_template = (
            "{person_occupying_role.label} holds role {role_occupied.label}"
        )


class OrganisationLocated(OrganisationStatement):
    organisation = ProsRelationTo("Organisation", "has_organisation_location", One)
    location = ProsRelationTo("Place", "has_organisation_location", One)
    date = DateRange.as_inline_field()

    class Meta:
        order_fields = ["organisation", "location", "date"]
        display_name = "Organisation in location"
        display_name_plural = "Organisation has location"

        construct_label_template = "{organisation.label} located in {location.label}"


class FamilialRelation(Statement):
    class Meta:
        abstract = True


class ParentalRelation(FamilialRelation):
    parent = ProsRelationTo("Person", "is parent in relation", One)
    child = ProsRelationTo("Person", "is child in relation", One)

    class Meta:
        order_fields = ["parent", "child"]
        construct_label_template = "{parent.label} is parent of {child.label}"


class Source(ProsNode):
    label = StringProperty(index=True, help_text="Short text description")
