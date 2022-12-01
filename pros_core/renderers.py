from rest_framework.renderers import JSONRenderer
from rest_framework.utils import encoders
from rest_framework.compat import INDENT_SEPARATORS, LONG_SEPARATORS, SHORT_SEPARATORS

import json

from neo4j.time import Date as Neo4jDate
import datetime


class ComplexEncoder(encoders.JSONEncoder):
    def default(self, z):
        if isinstance(z, Neo4jDate):
            return str(z.to_native())
        else:
            return super().default(z)


class CustomJsonRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render `data` into JSON, returning a bytestring.
        """
        if data is None:
            return b""

        renderer_context = renderer_context or {}
        indent = self.get_indent(accepted_media_type, renderer_context)

        if indent is None:
            separators = SHORT_SEPARATORS if self.compact else LONG_SEPARATORS
        else:
            separators = INDENT_SEPARATORS

        ret = json.dumps(
            data,
            cls=ComplexEncoder,
            indent=indent,
            ensure_ascii=self.ensure_ascii,
            allow_nan=not self.strict,
            separators=separators,
        )

        # We always fully escape \u2028 and \u2029 to ensure we output JSON
        # that is a strict javascript subset.
        # See: https://gist.github.com/damncabbage/623b879af56f850a6ddc
        ret = ret.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
        return ret.encode()
