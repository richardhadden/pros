from neomodel.properties import StringProperty
from pros_core.models import ProsNode


class VocabTerm(ProsNode):
    value = StringProperty()
