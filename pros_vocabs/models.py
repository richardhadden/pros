from neomodel.properties import StringProperty
from pros_core.models import ProsNode


class VocabTerm(ProsNode):
    value = StringProperty()

    class Meta:
        display_name = "Vocabulary"
        display_name_plural = "Vocabularies"
        use_list_cache = False
