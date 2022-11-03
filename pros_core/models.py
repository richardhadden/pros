from neomodel import StringProperty, StructuredNode, UniqueIdProperty


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty()
    label = StringProperty()

    def save(self):
        self.real_type = type(self).__name__.lower()
        super().save()

    def __hash__(self):
        return hash(self.uid)
