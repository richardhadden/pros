from dataclasses import dataclass


@dataclass
class ResponseWrapper:
    """Class for keeping track of an item in inventory."""

    data: dict
    status: int = 200

    def keys(self):
        return ["dict", "status"]

    def __getitem__(self, key):
        return self.__dict__.get(key)

    def __iter__(self):
        yield from (self.data, self.status)


t = ResponseWrapper({"something": 1})

data, status = t

print(data, status)
