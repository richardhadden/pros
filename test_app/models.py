from neomodel import (
    StructuredNode,
    StringProperty,
    DateProperty,
    IntegerProperty,
    UniqueIdProperty,
    RelationshipTo,
    RelationshipFrom,
)
from pros_core.models import ProsNode


class Factoid(ProsNode):

    has_source = RelationshipTo("Source", "HAS_SOURCE")
    is_about_person = RelationshipTo("Person", "IS_ABOUT_PERSON")
    text = StringProperty()

    class Meta:
        abstract = True


class Naming(Factoid):
    title = StringProperty()
    first_name = StringProperty()
    last_name = StringProperty()

    class Meta:
        text_filter_fields = ["title", "first_name", "last_name", "text"]


class Event(Factoid):
    pass


class Dance(Event):
    dance_partner = RelationshipTo("Person", "HAS_PRIMARY_DANCE_PARTNER")

    class Meta:
        text_filter_fields = ["text"]


class InterpersonalRelation(Factoid):
    # FIX THIS SHIT... clear db probably
    related_to = RelationshipTo("Person", "RELATES_TO_PERSON")

    class Meta:
        abstract = True


class ParentalRelation(InterpersonalRelation):
    related_to = RelationshipTo("Person", "HAS_PARENT")


class Entity(ProsNode):
    has_factoid_about = RelationshipFrom("Factoid", "IS_ABOUT_PERSON")

    class Meta:
        display_name_plural = "Entities"


class Person(Entity):
    pass


class Source(ProsNode):
    is_source_of = RelationshipFrom("Factoid", "HAS_SOURCE")


class Letter(Source):
    sender = RelationshipTo("Entity", "HAS_SENDER")
    recipient = RelationshipTo("Entity", "HAS_RECIPIENT")
