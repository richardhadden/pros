from neomodel import (
    StructuredNode,
    StringProperty,
    DateProperty,
    IntegerProperty,
    UniqueIdProperty,
    RelationshipTo,
)
from pros_core.models import ProsNode


class Factoid(ProsNode):

    has_source = RelationshipTo("Source", "HAS_SOURCE")
    is_about_person = RelationshipTo("Person", "IS_ABOUT_PERSON")
    text = StringProperty()


class Naming(Factoid):
    text = None
    title = StringProperty()
    first_name = StringProperty()
    last_name = StringProperty()


class Event(Factoid):
    pass


class Dance(Event):
    dance_partner = RelationshipTo("Person", "HAS_PRIMARY_DANCE_PARTNER")


class InterpersonalRelation(Factoid):
    related_to = RelationshipTo("Person", "IS_RELATED_TO")


class ParentalRelation(InterpersonalRelation):
    related_to = RelationshipTo("Person", "HAS_PARENT")


class Entity(ProsNode):
    pass


class Person(Entity):
    pass


class Source(ProsNode):
    pass


class Letter(Source):
    sender = RelationshipTo("Entity", "HAS_SENDER")
    recipient = RelationshipTo("Entity", "HAS_RECIPIENT")
