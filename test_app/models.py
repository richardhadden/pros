from neomodel import (
    StructuredNode,
    StringProperty,
    DateProperty,
    IntegerProperty,
    UniqueIdProperty,
    RelationshipTo,
)
from django_neomodel import DjangoNode
from pros_core.models import ProsNode


class Factoid(ProsNode):

    has_source = RelationshipTo("Source", "HAS_SOURCE")
    is_about_person = RelationshipTo("Person", "IS_ABOUT_PERSON")
    text = StringProperty()


class Event(Factoid):
    pass


class Dance(Event):
    dance_partner = RelationshipTo("Person", "HAS_PRIMARY_DANCE_PARTNER")


class Person(ProsNode):

    uid = UniqueIdProperty()
    label = StringProperty()


class Source(ProsNode):
    uid = UniqueIdProperty()
    label = StringProperty()
    stuff_type = StringProperty()
