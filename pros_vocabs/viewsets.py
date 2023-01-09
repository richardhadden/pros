from pros_core.viewsets import ProsAbstractViewSet, ProsDefaultViewSet
from rest_framework.response import Response
from pros_vocabs.models import VocabTerm


class VocabViewSet(ProsAbstractViewSet):
    __model_class__ = VocabTerm

    def list(self, request):
        return Response([vi for vi in VocabTerm.nodes.all()])
