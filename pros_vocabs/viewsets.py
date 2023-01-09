from pros_core.viewsets import ProsAbstractViewSet, ProsDefaultViewSet
from rest_framework.response import Response
from pros_vocabs.models import VocabTerm


class VocabViewSet(ProsDefaultViewSet):
    __model_class__ = VocabTerm

    def list(self):
        return Response(["hello"])
