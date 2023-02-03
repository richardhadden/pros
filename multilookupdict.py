from __future__ import annotations

from collections import defaultdict, UserDict
from collections.abc import Sequence, KeysView, ValuesView

from typing import (
    AbstractSet,
    Any,
    DefaultDict,
    Dict,
    Generator,
    List,
    Hashable,
    ItemsView,
    Union,
    Tuple,
)


def _is_sequence(val: Any) -> bool:
    return (isinstance(val, Sequence) and not isinstance(val, str)) or isinstance(
        val, (KeysView, ValuesView)
    )


"""
TODO:  implementation of standard dict methods:
    ✅ pop
    ✅ del
    ✅ clear
    ✅ copy
    ✅ fromkeys 
    ✅ get 
    ✅ items
    ✅ keys 
    ✅ popitem 
    - setdefault
    ✅ update
    ✅ values
"""


class MultiLookupDictKeysView(set):
    def __repr__(self):
        return super().__repr__()


class MultiLookupDict(UserDict):
    """
    A Dict-like container that allows multiple keys to address
    the same value.
    >>> d = MultiLookupDict()
    >>> d["a_key"] = "some_value"
    >>> d.map_key("a_key", "another_key") # Make "another_key" an alias of "a_key"
    Implemented as two dicts:
        - `MultiLookupDict._data` holds the 'canonical key' and value
        - `MultiLookupDict._key_to_canonical_map` maps 'alias keys' onto canonical keys.
          (Canonical keys are mapped to themselves in this dict)
    Externally, all keys (canonical and alias) are treated identically,
    and all refer to the same value, unless a key is reassigned to another value using `map_key`.
    Multi-key lookups and assignments
    ---------------------------------
    Iterables of keys can also be accessed, set, and mapped.
    >>> d = MultiLookupDict()
    >>> d[("key_a", "key_b", "key_c")] = "some_value"
    >>> d["key_a"] == "some_value"
    Where items are accessed with multiple keys, all distinct matching values are returned
    as a list (where multiple keys are requested, the result is always a list, for consistency)
    >>> d["key_d"] = "some_other_value" # Add a distinct value
    >>> d[("key_a", "key_b", "key_d")] == ["some_value", "some_other_value"]
    >>> d.map_key("key_a", ("key_e", "key_f")) # Also do multiple mappings
    ...
    Methods
    -------
    __setitem__
        Sets a key to the value. If a (non-string) iterable is provided
        as key, each key will be assigned the value.
    __getitem__
        [As with standard Python dict]
    map_key
        Assign the value of one key to another key. Both keys
        now point to the same value.
    keys
        Returns all keys in MultiLookupDict. Returned keys refer to same or different objects.
    all_keys
        [Same as `keys`]
    values
        [Same as `dict.values`]
    items
        Same as `dict.items`, except key part of tuple is a `set` of keys for the corresponding value
    pop
        Same as `dict.pop`. All keys pointing to value are removed.
    aliases
        Returns all aliases of a given key
    """

    def __init__(self, values: Dict = {}, /, default=None) -> None:
        self._default = default
        self._data: Dict = {}
        self._key_to_canonical_map: Dict = {}
        for keys, value in values.items():
            self.__setitem__(keys, value)

    def _set_single_name_and_value(self, key: Hashable, value: Any) -> None:
        """Sets a single key and value."""
        if key not in self._key_to_canonical_map:
            self._key_to_canonical_map[key] = key
        self._data[self._key_to_canonical_map[key]] = value

    def __setitem__(self, key, value) -> None:
        if _is_sequence(key):
            self._set_single_name_and_value(key[0], value)
            for k in key[1:]:
                self.map_key(key[0], k)
        else:
            self._set_single_name_and_value(key, value)

    def __getitem__(self, name: Any) -> Any:
        if _is_sequence(name):
            canonical_keys_to_get = {
                self._key_to_canonical_map[k]
                for k in name
                if k in self._key_to_canonical_map
            }
            items = [self._data[ck] for ck in canonical_keys_to_get]
            return items
        else:
            try:
                return self._data[self._key_to_canonical_map[name]]
            except KeyError:
                if self._default:
                    self._data[self._key_to_canonical_map[name]] = defaultdict(
                        self._default
                    )
                else:
                    raise KeyError(f"Key '{name}' not found")

    def __contains__(self, name: Hashable):
        return name in self._key_to_canonical_map

    def _get_all_keys_from_canonical(self, canonical_key: Hashable):
        return [
            key
            for key, value in self._key_to_canonical_map.items()
            if value == canonical_key
        ]

    def _canonical_to_all_keys_map(self) -> DefaultDict:
        """Gets all keys associated with a canonical key"""
        key_map = defaultdict(list)
        for ref, can in self._key_to_canonical_map.items():
            key_map[can].append(ref)
        return key_map

    def map_key(self, existing_key: Hashable, new_key: Any) -> None:
        """Assigns the value of an existing key to another key."""

        if existing_key not in self._key_to_canonical_map:
            raise KeyError(f"Existing key '{existing_key}' not found")

        if _is_sequence(new_key):
            for k in new_key:
                self._key_to_canonical_map[k] = self._key_to_canonical_map[existing_key]
        else:
            self._key_to_canonical_map[new_key] = self._key_to_canonical_map[
                existing_key
            ]

    def _canonical_keys(self):
        return self._data.keys()

    def keys(self):
        return self.all_keys()

    def all_keys(self):
        return MultiLookupDictKeysView(self._key_to_canonical_map.keys())

    def __iter__(self) -> Generator:
        yield from self.keys()

    def items_with_canonical_keys(self) -> ItemsView:
        return self._data.items()

    def items(self):  # type: ignore
        key_map = self._canonical_to_all_keys_map()
        return [
            (MultiLookupDictKeysView(key_map[canonical_key]), value)
            for canonical_key, value in self._data.items()
        ]

    def values(self) -> ValuesView:
        return self._data.values()

    def _remove_from_canonical_map_by_canonical_key(
        self, canonical_key: Hashable
    ) -> None:
        self._key_to_canonical_map = {
            k: v for k, v in self._key_to_canonical_map.items() if v != canonical_key
        }

    def pop(self, key, default=None) -> Any:
        try:
            canonical_key = self._key_to_canonical_map[key]
        except KeyError:
            if default:
                return default
            else:
                raise KeyError
        self._remove_from_canonical_map_by_canonical_key(canonical_key)
        return self._data.pop(canonical_key)

    def __delitem__(self, key: Hashable) -> None:
        # Use same implementation as pop, just don't return the value
        self.pop(key)

    def clear(self) -> None:
        self._data = {}
        self._key_to_canonical_map = {}

    def popitem(self) -> Tuple[Tuple, Any]:
        popped_key, popped_data = self._data.popitem()

        all_keys = self._get_all_keys_from_canonical(popped_key)
        self._remove_from_canonical_map_by_canonical_key(popped_key)

        return tuple(all_keys), popped_data

    def get(self, key, value=None) -> Union[Any, None]:
        try:
            return self.__getitem__(key)
        except KeyError:
            return value

    def copy(self) -> MultiLookupDict:
        new_instance = self.__class__()
        new_instance._data = self._data.copy()
        new_instance._key_to_canonical_map = self._key_to_canonical_map.copy()
        return new_instance

    def fromkeys(self, *args):
        """It seems beyond confusing to figure out the semantics of this method
        in a multi-lookup dict."""

        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement fromkeys method."
        )

    def update(self, values):
        # TEST THIS PROPERLY WITH DIFFERENT TYPES
        for key, value in values.items():
            self.__setitem__(key, value)

    def aliases(self, key: Hashable, omit_requested_key: bool = False):
        if _is_sequence(key):
            raise Exception("Only the aliases of a single key can be found at a time")

        all_aliases = self._get_all_keys_from_canonical(self._key_to_canonical_map[key])

        if omit_requested_key:
            all_aliases.remove(key)

        return all_aliases

    @staticmethod
    def _item_repr(item: Tuple) -> str:
        keys, value = item
        keys_as_strings = []
        for k in keys:
            keys_as_strings.append(repr(k))
        repr_string = "["
        repr_string += ", ".join(keys_as_strings)
        repr_string += "]: "
        repr_string += value.__repr__()
        return repr_string

    def __repr__(self) -> str:
        # Just print Items
        repr_string = f"{self.__class__.__name__}({{ "
        repr_string += ", ".join(self._item_repr(item) for item in self.items())

        repr_string += " })"
        return repr_string
