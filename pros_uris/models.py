from django.conf import settings
from neomodel import StructuredNode, Relationship
from neomodel.properties import StringProperty, BooleanProperty
from neomodel.relationship_manager import ZeroOrMore
from slugify import slugify

from icecream import ic


def build_uri(instance):
    uri = settings.INTERAL_URI_BASE
    if not uri.endswith("/"):
        uri += "/"
    uri += instance.__module__.split(".")[0] + "/"
    uri += "entity/"
    uri += instance.real_type + "/"
    uri += instance.uid + "/"
    uri += slugify(instance.label)
    return uri


class URI(StructuredNode):
    uri = StringProperty(unique_index=True)
    internal = BooleanProperty(default=True)


class DefaultUriMixin:
    """Mixin to add default URI construction to a ProsNode class.
    The mixin should be placed *before* other parent classes."""

    uris = Relationship("URI", "uri", cardinality=ZeroOrMore)

    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        internal_uri = self.uris.get_or_none(internal=True)

        if not internal_uri:
            uri_value = build_uri(self)
            uri = URI(uri=uri_value)
            uri.save()
            self.uris.connect(uri)
            ic(self.uris.get_or_none(internal=True))
