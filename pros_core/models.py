from neomodel import StructuredNode, UniqueIdProperty, StringProperty


class ProsNode(StructuredNode):
    uid = UniqueIdProperty()
    real_type = StringProperty()
    label = StringProperty()

    def save(self):
        self.real_type = type(self).__name__.lower()
        super().save()
