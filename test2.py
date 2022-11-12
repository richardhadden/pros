class Relation:
    def __init__(self, cls_name):
        self.cls_name = cls_name

    def __set_name__(self, owner, name):
        self.rel_type = name


class OwnerBase:
    def __init_subclass__(cls) -> None:
        for k, v in cls.__dict__.items():
            if isinstance(v, Relation):
                setattr(cls, k, "BALLS")


class Owner(OwnerBase):
    item = Relation("FFF")
