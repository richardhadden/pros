from neomodel import StructuredNode, StringProperty, DateProperty, IntegerProperty
from django_neomodel import DjangoNode


class Book(StructuredNode):
    title = StringProperty(unique_index=True)
    published = DateProperty()


class Person(StructuredNode):
    name = StringProperty(unique_index=True, default="John")
    age = IntegerProperty(default=0)


class Stuff(StructuredNode):
    stuff_type = StringProperty()
