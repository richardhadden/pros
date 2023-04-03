from abc import ABC, abstractmethod
from typing import TypedDict

from neomodel import db
from rest_framework.request import Request
from rest_framework.response import Response

from pros_core.models import ProsNode
from pros_uris.models import URI

from icecream import ic


class ProsImportConfigurationError(NotImplementedError):
    pass


class ListDataItem(TypedDict):
    uri: str
    id: str
    label: str
    label_extra: str


class ListData(TypedDict):
    data: list[ListDataItem]
    totalItems: int


class ImportedDataDict(TypedDict):
    uid: str
    label: str
    real_type: str


class ProsImporter(ABC):
    importer_name = None
    search_url = None
    import_url = None

    @staticmethod
    @abstractmethod
    def build_label_extra(item: dict) -> str:
        """Method to combine returned API fields into additional label information"""
        ...

    @staticmethod
    def uri_already_exists(uri: str) -> bool:
        """Checks whether an entity already in database by checking for URI"""
        return bool(URI.nodes.get_or_none(uri=uri))

    @abstractmethod
    def build_list_data(self, api_data: list) -> ListData:
        """Build a list of items from the API, and total count of found items"""
        ...

    @abstractmethod
    def import_entity(self, request: Request, api_data: dict) -> ImportedDataDict:
        """Import an entity, using the rest_framework Request and id string of the entity"""
        ...

    @staticmethod
    def get_entity_or_none_by_uri(uri: str) -> ProsNode:
        """Utility method to return an entity from a related URI"""

        q = """MATCH (e)--(uri:URI {uri: $uri})
            RETURN e
        """
        results, meta = db.cypher_query(q, params={"uri": uri}, resolve_objects=True)
        if results:
            return results[0][0]
        return None

    @db.write_transaction
    def do_entity_import(self, request: Request, api_data: dict) -> ImportedDataDict:
        """Wrapper round Importer.import_entity to ensure it is wrapped in a db.write_transaction"""

        return self.import_entity(self, request=request, api_data=api_data)

    def __init_subclass__(cls) -> None:
        """Use subclassing to check everything is implemented properly."""
        if not cls.importer_name:
            raise ProsImportConfigurationError(f"{cls}.importer_name not set")

        if not cls.search_url:
            raise ProsImportConfigurationError(f"{cls}.search_url not set")

        if not cls.import_url:
            raise ProsImportConfigurationError(f"{cls}.import_url not set")

        if "{search_term}" not in cls.search_url:
            raise ProsImportConfigurationError(
                f"{cls}.search_url does not contain a placeholder for the search term: e.g. http://an-api.com/search/?q={{search_term}}"
            )

        if "{entity_id}" not in cls.import_url:
            raise ProsImportConfigurationError(
                f"{cls}.import_url does not contain a placeholder for the entity ID: e.g. http://an-api.com/{{entity_id}}.json"
            )
