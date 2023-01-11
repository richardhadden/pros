from dataclasses import dataclass, asdict
from icecream import ic


@dataclass
class Thing:
    """Class for keeping track of an item in inventory."""

    data: dict
    status: int = 200


t = Thing({"one": "two"}, 300)
ic(asdict(t))
