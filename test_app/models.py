from neomodel import (
    StructuredNode,
    StringProperty,
    DateProperty,
    IntegerProperty,
    UniqueIdProperty,
    RelationshipTo,
)
from django_neomodel import DjangoNode


class Factoid(StructuredNode):
    uid = UniqueIdProperty()
    label = StringProperty()
    has_source = RelationshipTo("Source", "HAS_SOURCE")
    is_about_person = RelationshipTo("Person", "IS_ABOUT_PERSON")
    text = StringProperty()


class Person(StructuredNode):

    uid = UniqueIdProperty()
    label = StringProperty()


class Source(StructuredNode):
    uid = UniqueIdProperty()
    label = StringProperty()
    stuff_type = StringProperty()
