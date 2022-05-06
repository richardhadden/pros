from neomodel import (
    StructuredNode,
    StringProperty,
    DateProperty,
    IntegerProperty,
    UniqueIdProperty,
    RelationshipTo,
)
from django_neomodel import DjangoNode


class Book(StructuredNode):
    uid = UniqueIdProperty()
    title = StringProperty(unique_index=True)
    published = DateProperty()
    author = RelationshipTo("Person", "HAS_AUTHOR")


class Person(StructuredNode):
    uid = UniqueIdProperty()
    name = StringProperty(unique_index=True, default="John")
    age = IntegerProperty(default=0)


class Stuff(StructuredNode):
    uid = UniqueIdProperty()
    stuff_type = StringProperty(required=True)


class Thing(StructuredNode):
    uid = UniqueIdProperty()
    name = StringProperty(required=True)
    other_fact = StringProperty(required=True)
