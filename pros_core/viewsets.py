import datetime
import itertools
from typing import Type, Callable

from django.urls import path
from rest_framework.permissions import IsAuthenticated, AllowAny
from jsonschema import validate, ValidationError

from neomodel.exceptions import DoesNotExist
from neomodel import db
from neomodel.properties import DateTimeProperty, DateProperty
import neomodel
from neo4j.time import DateTime as neo4jDateTime

from pros_core.setup_app import PROS_MODELS

from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.request import Request
from pros_core.models import ProsInlineOnlyNode, ProsNode, DeletedNode
from pros_core.filters import icontains

from multilookupdict import MultiLookupDict

from pypher import Pypher, __

from icecream import ic

from dataclasses import dataclass


@dataclass
class ResponseValue:
    """Wrapper around data and HTTP status, to be unpacked into DRF Response object
    or for treatment separately"""

    data: dict
    status: int = 200

    def keys(self):
        return ["data", "status"]

    def __getitem__(self, key):
        return self.__dict__.get(key)

    def __iter__(self):
        yield from (self.data, self.status)


# Utility functions


def delete_all_inline_nodes(instance):
    q = Pypher()
    q.MATCH.node("s", uid=instance.uid).rel_out("p").node(
        "o", labels="ProsInlineOnlyNode"
    )
    q.DETACH.DELETE(__.o)
    results, meta = db.cypher_query(str(q), q.bound_params)


def prepare_data_value(properties, k, v):

    if properties[k].__class__ is DateProperty:
        v = datetime.date.fromisoformat(v)
    if properties[k].__class__ is DateTimeProperty:
        if v:
            return v
        else:
            None

    return v


def get_property_and_relation_data(data, model_class):
    properties = PROS_MODELS[model_class.__name__.lower()].properties
    property_data = {
        k: prepare_data_value(properties, k, v)
        for k, v in data.items()
        if k in properties
    }

    relation_data = {
        k: v
        for k, v in data.items()
        if k in PROS_MODELS[model_class.__name__.lower()].relations
    }
    # print("RDI", request.data.items())

    inline_relations = {
        k: v
        for k, v in data.items()
        if k in PROS_MODELS[model_class.__name__.lower()].inline_relations
    }

    return property_data, relation_data, inline_relations


def add_related_nodes(
    model_class: Type[ProsNode], instance: ProsNode, relation_data: dict
):
    for related_name, related in relation_data.items():
        related_values = [r for r in related]
        rel_manager = getattr(instance, related_name)
        related_model = PROS_MODELS[
            PROS_MODELS[model_class.__name__.lower()]
            .fields[related_name]["relation_to"]
            .lower()
        ].model
        for related_value in related_values:
            rel_manager.connect(
                related_model.nodes.get(uid=related_value["uid"]),
                related_value.get("relData") or {},
            )


def add_inline_related_nodes(
    model_class: Type[ProsNode], instance: ProsNode, data: dict
):

    for inline_field_name, inline_field_data in data.items():
        inline_related_type = inline_field_data.pop("type")
        inline_class = PROS_MODELS[inline_related_type]
        related_model = inline_class.model
        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(inline_field_data, related_model)

        rel_manager = getattr(instance, inline_field_name)

        new_related_node = related_model(**property_data)
        new_related_node.save()
        rel_manager.connect(new_related_node)
        add_related_nodes(related_model, new_related_node, relation_data)


def get_non_default_fields(node):
    node_dict = node.__dict__
    return {k: v for k, v in node_dict.items() if k not in ["uid", "real_type", "id"]}


def update_related_nodes(
    model_class: Type[ProsNode], instance: ProsNode, relation_data: dict
):
    for related_name, related in relation_data.items():
        # (related_name)
        related_values = [r for r in related]
        rel_manager = getattr(instance, related_name)
        related_model = PROS_MODELS[
            PROS_MODELS[model_class.__name__.lower()]
            .fields[related_name]["relation_to"]
            .lower()
        ].model

        # TODO: When changing any kind of links to things, also bump the
        # modifiedWhen date...

        # TODO: reconsider whether we need an "internal" modifiedWhen
        # to distinguish it from useful changes made by someone to the model
        # in question... (may be of use for versioning...?)

        # If it's a cardinality-One relation, can't simply disconnect all
        # as it's not allowed... instead, get the old node from the rel_manager,
        # look up the new node by uid, and then reconnect the rel_manager
        if isinstance(rel_manager, neomodel.cardinality.One):
            ic(related_name, "is one")
            old_node = rel_manager.get()
            new_node = related_model.nodes.get(uid=related_values[0]["uid"])
            rel_manager.reconnect(old_node, new_node)

        # If it's a OneOrMore cardinality relation, also cannot disconnect
        # everything; here we need to find out whether a relation already exists,
        # in which case, use rel_manager.replace (otherwise it creates new)
        # or create new connection if so. Then, clean up all the no-longer
        # desired connections.
        elif isinstance(rel_manager, neomodel.cardinality.OneOrMore):
            ic(related_name, "is oneonemore")
            for related_value in related_values:
                ic(">>", related_value)
                if already_connected_node := rel_manager.get_or_none(
                    uid=related_value["uid"]
                ):
                    ic("already exists")
                    ic(related_value.get("relData"))
                    rel_manager.replace(
                        already_connected_node,
                        related_value.get("relData") or {"something": "arse"},
                    )
                    # ic(rel_manager.relationship(already_connected_node))

                else:
                    rel_manager.connect(
                        related_model.nodes.get(uid=related_value["uid"]),
                        related_value.get("relData") or {},
                    )

            updated_uids = {rv["uid"] for rv in related_values}

            for node in rel_manager.all():

                if node.uid not in updated_uids:

                    rel_manager.disconnect(node)
        # TODO: this might not be as quick as comparing lists
        # of relations and making fewer changes... (unlikely list will
        # change dramatically...)
        else:
            # Remove all relations
            rel_manager.disconnect_all()

            # And recreate them again so that the data is updated
            for related_value in related_values:
                rel_manager.connect(
                    related_model.nodes.get(uid=related_value["uid"]),
                    related_value.get("relData") or {},
                )


def update_inline_related_nodes(instance, data, username=None):
    for inline_related_name, inline_field_data in data.items():

        rel_manager = getattr(instance, inline_related_name)
        related_model = PROS_MODELS[inline_field_data["type"]].model

        new_type = inline_field_data.pop("type")

        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(inline_field_data, related_model)
        try:

            # Get old node
            old_related_node: ProsNode = rel_manager.all()[0]

            # Check whether it's inline-only
            old_field_inline_only = isinstance(old_related_node, ProsInlineOnlyNode)

            # If it's not inline-only, we should update the modified info
            if not old_field_inline_only:
                property_data.pop("createdWhen")
                property_data.pop("createdBy")
                property_data = {
                    **property_data,
                    "modifiedBy": username,
                    "modifiedWhen": datetime.datetime.now(datetime.timezone.utc),
                }

            # NEW STRATEGY...

            # if type is the same, don't replace Inline Node, just update props and relations
            if old_related_node.real_type == new_type:
                for prop_key, prop_value in property_data.items():
                    setattr(old_related_node, prop_key, prop_value)
                    update_related_nodes(related_model, old_related_node, relation_data)
                old_related_node.save()

            else:
                new_related_node = related_model(**property_data)
                new_related_node.save()
                rel_manager.reconnect(old_related_node, new_related_node)
                add_related_nodes(related_model, new_related_node, relation_data)

                if old_field_inline_only:
                    old_related_node.delete()

            # create new Inline Node with properties

            # add relations to new Inline Node

            # if the old Inline Node is inline-only
            # delete
            # else:
            # leave it there??

            # If there is already a node related here...

            ## We need to remove the old node, because it could have changed type...
            '''
            old_related_node: ProsNode = rel_manager.all()[0]  # Get it...
            # (there should only be one node to get, due to One cardinality)

            # Create a new node with the data
            new_related_node = related_model(**property_data)
            new_related_node.save()

            # Reconnect from the old node to the new node
            rel_manager.reconnect(old_related_node, new_related_node)

            # CHANGE: No need to delete connections: just delete the node
            # if it is no longer referenced by anything else
            """
            for k, v in relation_data.items():
                old_node_rel_manager = getattr(old_related_node, k)
                for i in v:
                    i_related_model = PROS_MODELS[i["real_type"]].model
                    i_node = i_related_model.nodes.get(uid=i["uid"])
                    old_node_rel_manager.disconnect(i_node)
            """

            # Add the relation to the new node
            add_related_nodes(related_model, new_related_node, relation_data)

            # If the old node is not related to anything else
            # delete it

            ic(old_related_node.Meta.__dict__)

            if not getattr(old_related_node.Meta, "inline_only"):
                ic("deleting old node", old_related_node)

                old_related_node.delete()
            '''
        except IndexError:
            # Otherwise, this node does not exist
            new_related_node = related_model(**property_data)
            new_related_node.save()
            rel_manager.connect(new_related_node)
            add_related_nodes(related_model, new_related_node, relation_data)


def build_select_value_string(select_values, unpack_values):
    select_value_string = "{"
    select_value_string += ", ".join(f".{v}" for v in select_values)
    if unpack_values:
        select_value_string += ","
        select_value_string += ", ".join(f"{k}: {k}" for k in unpack_values if k != "_")
    select_value_string += "}"
    return select_value_string


def build_nested_call(fields, current_node="a", key=None, n=0):

    # ic(select_values_string)
    res = ""
    if isinstance(fields, set):
        return res
    for k1, v1 in fields.items():

        select_values = {}
        if not isinstance(v1, set):
            select_values = v1.get("_")
        if isinstance(v1, set):
            select_values = v1
        if k1 == "_":
            pass
        if k1 != "_":
            res += f"""
CALL {{
WITH {current_node}
OPTIONAL MATCH ({current_node})-[r_{k1}]-(o_{k1})
WHERE type(r_{k1}) = '{k1.upper()}' OR r_{k1}.reverse_name = '{k1.upper()}'
"""

            res += build_nested_call(v1, current_node=f"o_{k1}", key=k1, n=n + 1)
            if not isinstance(v1, set):
                res += f"RETURN COLLECT(o_{k1}{build_select_value_string(select_values, v1)}) AS {k1} }}"
            else:
                res += f"RETURN o_{k1}{build_select_value_string(select_values, {})} AS {k1} }}"
    return res


"""
TODO: try conditionally adding so we don't end up with empty lists

WITH n, COLLECT(
  CASE
    WHEN ilist.container IS NULL THEN NULL
    ELSE { container : ilist.container, target : target.id } END
) AS iset
"""


def get_list(model_class):
    """Get list of items of a type, grouping together merged entities
    as different permutations, i.e. main person, with merged entities as separate field.

    n.b. entity_type should come from the BACKEND, so safe to interpolate it!
    """
    entity_type = model_class.__name__
    unpack_fields = getattr(model_class.Meta, "unpack_fields", None)
    ic(entity_type)
    ic(unpack_fields)
    if unpack_fields:
        unpack_calls = build_nested_call(unpack_fields)
    else:
        unpack_calls = ""

    q = f"""
    
    
    MATCH (a:{entity_type})
    CALL {{
        WITH a
        MATCH path = (a)-[:MERGED*]-(b)
        CALL {{
                    WITH b
                    WITH b
                    MATCH (b)<-[in_r]-(x)
                    WHERE NOT in_r:MERGED 
                    RETURN COUNT(b) > 0  as has_inbound_b
                }}
                WITH b, b.is_deleted AND has_inbound_b AS ddn
        RETURN COLLECT(b{{.label, .uid, .real_type, .is_deleted, deleted_and_has_dependent_nodes:ddn}}) AS cb
    }}
    CALL {{
                WITH a
                WITH a
                MATCH (a)<-[in_r]-(x)
                WHERE NOT in_r:MERGED 
                RETURN COUNT(a) > 0  as has_inbound_a
    }}
    {unpack_calls}

    WITH DISTINCT(a) AS da, a.is_deleted AND has_inbound_a AS ddn, cb <> [] as is_merged_item,  cb {", "+", ".join(unpack_fields) if unpack_fields else ""}
  

    RETURN apoc.map.clean(da{{.label, .uid, .real_type, .is_deleted, is_merged_item:is_merged_item, is_merged_item:is_merged_item, merged_items:cb {", "+", ".join(f'''{f}: {f}''' for f in unpack_fields) if unpack_fields else ""}}}, [], [[], {{}}, [{{}}], null]) AS results
    ORDER BY da.label


    """
    results, meta = db.cypher_query(q)

    if build_label := getattr(model_class.Meta, "build_label", None):
        return map(build_label, itertools.chain.from_iterable(results))
    else:
        return itertools.chain.from_iterable(results)


def get_filter_list(entity_type: str, text_filter: str):
    ic(text_filter)
    q = f"""
        CALL {{
        MATCH (a:{entity_type})
        WITH a, toLower(a.label) CONTAINS toLower($text_filter) AS a_matches
        CALL {{
            WITH a, a_matches
            MATCH path = (a)-[:MERGED*]-(other)
            WHERE a_matches OR toLower(other.label) CONTAINS toLower($text_filter)
            RETURN other as b
        }}
        MATCH (a)-[:MERGED*]-(b)
        CALL {{
            WITH a
            MATCH (a)-[:MERGED*]-(b)
            CALL {{
                WITH b
                WITH b
                MATCH (b)<-[in_r]-(x)
                WHERE NOT in_r:MERGED 
                RETURN COUNT(b) > 0  as has_inbound_b
            }}
            WITH b, b.is_deleted AND has_inbound_b AS ddn
            RETURN COLLECT(b{{.label, .uid, .real_type, .is_deleted, deleted_and_has_dependent_nodes:ddn}}) as cb
        }}
        CALL {{
                WITH a
                WITH a
                MATCH (a)<-[in_r]-(x)
                WHERE NOT in_r:MERGED 
                RETURN COUNT(a) > 0  as has_inbound_a
            }}
        WITH DISTINCT(a) AS da, a.is_deleted AND has_inbound_a AS ddn, cb
        RETURN da{{.uid, .label, .real_type, .is_deleted, is_merged_item:true, deleted_and_has_dependent_nodes: ddn, merged_items: cb}} AS results

        UNION

        MATCH (a:{entity_type})
        WHERE toLower(a.label) CONTAINS toLower($text_filter) AND NOT (a)-[:MERGED]-()
        CALL {{
                MATCH (a)<-[in_r]-(x)
                WHERE NOT in_r:MERGED 
                RETURN COUNT(a) > 0  as has_inbound_a
            }}
        WITH a as da, a.is_deleted AND has_inbound_a AS ddn
        return da{{.uid, .label, .real_type, .is_deleted, is_merged_item:false, deleted_and_has_dependent_nodes:ddn, merged_items:[]}} AS results
        }}
        WITH results
        RETURN results
        ORDER BY results.label
        """
    results, meta = db.cypher_query(
        q,
        {
            "text_filter": text_filter,
        },
    )

    return itertools.chain.from_iterable(results)


def get_created_modified_list(entity_type: str, timestamp: datetime.datetime):

    q = f"""
        
        CALL {{
            MATCH (a:{entity_type})
            WITH a, a.modifiedWhen > datetime($timestamp) AS a_matches
            CALL {{
                WITH a, a_matches
                MATCH path = (a)-[:MERGED*]-(other)
                WHERE a_matches OR other.modifiedWhen > datetime($timestamp)
                RETURN other as b
            }}
            MATCH (a)-[:MERGED*]-(b)
            CALL {{
                WITH a
                MATCH (a)-[:MERGED*]-(b)
                CALL {{
                    WITH b
                    WITH b
                    MATCH (b)<-[in_r]-(x)
                    WHERE NOT in_r:MERGED 
                    RETURN COUNT(b) > 0  as has_inbound_b
                }}
                WITH b, b.is_deleted AND has_inbound_b AS ddn
                RETURN COLLECT(b{{.label, .uid, .real_type, .is_deleted, deleted_and_has_dependent_nodes:ddn}}) as cb
            }}
            CALL {{
                    WITH a
                    WITH a
                    MATCH (a)<-[in_r]-(x)
                    WHERE NOT in_r:MERGED 
                    RETURN COUNT(a) > 0  as has_inbound_a
                }}
            WITH DISTINCT(a) AS da, a.is_deleted AND has_inbound_a AS ddn, cb
            RETURN da{{.uid, .label, .real_type, .is_deleted, is_merged_item:true, deleted_and_has_dependent_nodes: ddn, merged_items: cb}} AS results

            UNION

            MATCH (a:{entity_type})
            WHERE a.modifiedWhen > datetime($timestamp) AND NOT (a)-[:MERGED]-()
            CALL {{
                    MATCH (a)<-[in_r]-(x)
                    WHERE NOT in_r:MERGED 
                    RETURN COUNT(a) > 0  as has_inbound_a
                }}
            WITH a as da, a.is_deleted AND has_inbound_a AS ddn
            RETURN da{{.uid, .label, .real_type, .is_deleted, is_merged_item:false, deleted_and_has_dependent_nodes:ddn, merged_items:[]}} AS results
        }}
        WITH results
        RETURN results
        ORDER BY results.label
        """
    results, meta = db.cypher_query(q, {"timestamp": timestamp})

    return itertools.chain.from_iterable(results)


def get_item(model_class: str, uid: str):
    q = """MATCH (main { uid:$uid })

// START OF QUERY ON SINGLE MATCHED NODE
CALL {
// Direct incoming
  WITH main
  CALL {
    WITH main
    OPTIONAL MATCH (main)<-[incoming_relation]-(incoming_node)
    WHERE incoming_relation.inline is null AND NOT incoming_relation:MERGED
    CALL {
      WITH incoming_node
      MATCH (incoming_node)<-[in_r]-(x)
      WHERE NOT in_r:MERGED
      RETURN COUNT(incoming_node) > 0 AS has_inbound_incoming_node
    }
    WITH apoc.map.setValues(incoming_node, ["relData", incoming_relation, "rel_type", toLower(incoming_relation.reverse_name), "deleted_and_has_dependent_nodes", has_inbound_incoming_node AND incoming_node.is_deleted]) AS mod_incoming_node
    RETURN apoc.map.groupByMulti(COLLECT(mod_incoming_node), "rel_type") AS incoming_relations
  }
  
// Outgoing direct
  CALL {
    WITH main
    OPTIONAL MATCH (main)-[outgoing_relation]->(outgoing_node)
    WHERE outgoing_relation.inline is null AND NOT outgoing_relation:MERGED
    CALL {
      WITH outgoing_node
      MATCH (outgoing_node)<-[in_r]-(x)
      WHERE NOT in_r:MERGED
      RETURN COUNT(outgoing_node) > 0 AS has_inbound_outgoing_node
    }
    WITH apoc.map.setValues(outgoing_node, ["relData", outgoing_relation, "rel_type", toLower(type(outgoing_relation)), "deleted_and_has_dependent_nodes", has_inbound_outgoing_node AND outgoing_node.is_deleted]) AS mod_outgoing_node
    RETURN apoc.map.groupByMulti(COLLECT(mod_outgoing_node), "rel_type") AS outgoing_relations
  }
  
// Incoming inline...
  CALL {
    WITH main
    OPTIONAL MATCH (main)<-[incoming_relation]-(incoming_node)<-[passthrough_rel]-(passthrough_node)
    WHERE main.uid <> passthrough_node.uid AND NOT incoming_relation:MERGED AND passthrough_rel.inline
    CALL {
      WITH passthrough_node
      MATCH (passthrough_node)<-[in_r]-(x)
      WHERE NOT in_r:MERGED
      RETURN COUNT(passthrough_node) > 0 AS has_inbound_passthrough_node
    }
    WITH incoming_relation, incoming_node, passthrough_rel, apoc.map.setValues(passthrough_node, ["rel_type", toLower(incoming_relation.reverse_name), "deleted_and_has_dependent_nodes", has_inbound_passthrough_node AND passthrough_node.is_deleted]) AS ptn
    RETURN apoc.map.groupByMulti(COLLECT(ptn), "rel_type") AS incoming_inline
    
  }
// Inlines...
  CALL {
    WITH main
    OPTIONAL MATCH (main)-[inline_relation]->(inline_node)
    WHERE main.uid <> inline_node.uid AND inline_relation.inline
    CALL {
      WITH inline_node
      OPTIONAL MATCH (inline_node)-[related_rel]->(related_node)
      WHERE NOT related_rel:MERGED
      CALL {
        WITH related_node
        MATCH (related_node)<-[in_r]-(x)
        WHERE NOT in_r:MERGED
        RETURN COUNT(related_node) > 0 AS has_inbound_related_node
      }
      WITH apoc.map.setValues(related_node, ["rel_type", toLower(type(related_rel)), "deleted_and_has_dependent_nodes", has_inbound_related_node AND related_node.is_deleted]) AS mod_related_node, related_rel
      RETURN related_rel, apoc.map.groupByMulti(COLLECT(mod_related_node), "rel_type") AS grouped_mod_related_node // NOW, just need to add in related node to inline_node..., grouping by type!!
    }
    
    WITH apoc.map.setValues(inline_node, ["type", inline_node.real_type]) AS mod_inline_node,
    inline_relation, inline_node, related_rel, grouped_mod_related_node
    RETURN apoc.map.mergeList([mod_inline_node, grouped_mod_related_node]) AS inlines, inline_relation, inline_node, related_rel, grouped_mod_related_node
  }
  CALL {
    MATCH (main)<-[in_r]-(x)
    WHERE NOT in_r:MERGED
    RETURN COUNT(main) > 0 AS has_inbound_main
  }
  WITH apoc.map.setValues(main, [toLower(type(inline_relation)), inlines, "deleted_and_has_dependent_nodes", has_inbound_main AND main.is_deleted]) AS main_node, inlines, outgoing_relations, incoming_inline, incoming_relations
  RETURN apoc.map.mergeList(COLLECT(apoc.map.mergeList([main_node, outgoing_relations, incoming_relations, incoming_inline]))) AS main_node
}

CALL {
  WITH main
  OPTIONAL MATCH (main)-[:MERGED*]-(mn)
  
// START OF LOOKUPS FOR MERGED NODES
  
// START OF QUERY ON SINGLE MATCHED NODE
  CALL {
// Direct incoming
    WITH mn
    CALL {
      WITH mn
      OPTIONAL MATCH (mn)<-[incoming_relation]-(incoming_node)
      WHERE incoming_relation.inline is null AND NOT incoming_relation:MERGED
      CALL {
        WITH incoming_node
        MATCH (incoming_node)<-[in_r]-(x)
        WHERE NOT in_r:MERGED
        RETURN COUNT(incoming_node) > 0 AS has_inbound_incoming_node
      }
      WITH apoc.map.setValues(incoming_node, ["rel_type", toLower(incoming_relation.reverse_name), "deleted_and_has_dependent_nodes", has_inbound_incoming_node AND incoming_node.is_deleted]) AS mod_incoming_node
      RETURN apoc.map.groupByMulti(COLLECT(mod_incoming_node), "rel_type") AS incoming_relations
    }
    
// Outgoing direct
    CALL {
      WITH mn
      OPTIONAL MATCH (mn)-[outgoing_relation]->(outgoing_node)
      WHERE outgoing_relation.inline is null AND NOT outgoing_relation:MERGED
      CALL {
        WITH outgoing_node
        MATCH (outgoing_node)<-[in_r]-(x)
        WHERE NOT in_r:MERGED
        RETURN COUNT(outgoing_node) > 0 AS has_inbound_outgoing_node
      }
      WITH apoc.map.setValues(outgoing_node, ["rel_type", toLower(type(outgoing_relation)), "deleted_and_has_dependent_nodes", has_inbound_outgoing_node AND outgoing_node.is_deleted]) AS mod_outgoing_node
      RETURN apoc.map.groupByMulti(COLLECT(mod_outgoing_node), "rel_type") AS outgoing_relations
    }
    
// Incoming inline...
    CALL {
      WITH mn
      OPTIONAL MATCH (mn)<-[incoming_relation]-(incoming_node)<-[passthrough_rel]-(passthrough_node)
      WHERE mn.uid <> passthrough_node.uid AND NOT incoming_relation:MERGED AND passthrough_rel.inline
      CALL {
        WITH passthrough_node
        MATCH (passthrough_node)<-[in_r]-(x)
        WHERE NOT in_r:MERGED
        RETURN COUNT(passthrough_node) > 0 AS has_inbound_passthrough_node
      }
      WITH incoming_relation, incoming_node, passthrough_rel, apoc.map.setValues(passthrough_node, ["rel_type", toLower(incoming_relation.reverse_name), "deleted_and_has_dependent_nodes", has_inbound_passthrough_node AND passthrough_node.is_deleted]) AS ptn
      RETURN apoc.map.groupByMulti(COLLECT(ptn), "rel_type") AS incoming_inline
      
    }
// Inlines...
    CALL {
      WITH mn
      OPTIONAL MATCH (mn)-[inline_relation]->(inline_node)
      WHERE mn.uid <> inline_node.uid AND inline_relation.inline
      CALL {
        WITH inline_node
        OPTIONAL MATCH (inline_node)-[related_rel]->(related_node)
        WHERE NOT related_rel:MERGED
        CALL {
          WITH related_node
          MATCH (related_node)<-[in_r]-(x)
          WHERE NOT in_r:MERGED
          RETURN COUNT(related_node) > 0 AS has_inbound_related_node
        }
        WITH apoc.map.setValues(related_node, ["rel_type", toLower(type(related_rel)), "deleted_and_has_dependent_nodes", has_inbound_related_node AND related_node.is_deleted]) AS mod_related_node, related_rel
        RETURN related_rel, apoc.map.groupByMulti(COLLECT(mod_related_node{ .uid, .real_type, .label, .is_deleted, .rel_type, .deleted_and_has_dependent_nodes }), "rel_type") AS grouped_mod_related_node // NOW, just need to add in related node to inline_node..., grouping by type!!
      }
      
      WITH apoc.map.setValues(inline_node, ["type", inline_node.real_type]) AS mod_inline_node,
      inline_relation, inline_node, related_rel, grouped_mod_related_node
      RETURN apoc.map.mergeList([mod_inline_node, grouped_mod_related_node]) AS inlines, inline_relation, inline_node, related_rel, grouped_mod_related_node
    }
    CALL {
      MATCH (mn)<-[in_r]-(x)
      WHERE NOT in_r:MERGED
      RETURN COUNT(mn) > 0 AS has_inbound_main
    }
    WITH apoc.map.setValues(mn, [toLower(type(inline_relation)), inlines, "deleted_and_has_dependent_nodes", has_inbound_main AND mn.is_deleted]) AS main_node, inlines, outgoing_relations, incoming_inline, incoming_relations
    RETURN apoc.map.mergeList(COLLECT(apoc.map.mergeList([main_node, outgoing_relations, incoming_relations, incoming_inline]))) AS merged_main_node
  }
  RETURN DISTINCT (merged_main_node) AS merged_nodes
}
WITH main_node, merged_nodes.uid is NOT null AS is_merged_item, COLLECT(merged_nodes) AS mnlist

WITH apoc.map.setValues(main_node, ["merged_items", mnlist, "is_merged_item", is_merged_item]) AS result, is_merged_item
RETURN
CASE is_merged_item WHEN true THEN result ELSE apoc.map.removeKey(result, "merged_items") END
"""
    results, meta = db.cypher_query(q, {"uid": uid})
    try:
        return results[0][0]
    except IndexError:
        raise model_class.DoesNotExist(
            f"""<{model_class.__name__} uid={uid}> not found."""
        )


# Viewset methods
class ProsBlankViewSet(ViewSet):
    pass


class ProsAbstractViewSet(ProsBlankViewSet):
    """ViewSet for abstract Pros models. Allows listing of entities, but nothing else."""

    __model_class__ = None

    def __init_subclass__(cls):
        if cls.__name__ != "ProsDefaultViewSet" and cls.__model_class__ is None:
            raise TypeError(
                "ProsDefaultViewSet requires __model_class__ attribute to be "
                "set to an instance of <pros_core.models.ProsNode>"
            )

    def do_list(self, request: Request) -> ResponseValue:
        # If a text filter is set...
        filter = request.query_params.get("filter")
        if filter:
            node_data = get_filter_list(
                self.__model_class__.__name__, text_filter=filter
            )

        # No filter assigned
        else:

            last_refreshed_timestamp_string = request.query_params.get(
                "lastRefreshedTimestamp"
            )
            # Get update from timestamp
            if last_refreshed_timestamp_string:
                d = datetime.datetime.fromisoformat(
                    last_refreshed_timestamp_string.replace("Z", "")
                )

                resp_data = {
                    "created_modified": get_created_modified_list(
                        self.__model_class__.__name__, d
                    ),
                    "deleted": [
                        {"uid": b.uid}
                        for b in DeletedNode.nodes.filter(
                            deletedWhen__gt=d, type=self.__model_class__.__name__
                        )
                    ],
                }

                return ResponseValue(resp_data)

            # Return list
            else:

                node_data = get_list(self.__model_class__)
        return ResponseValue(node_data)

    def list(self, request: Request) -> Response:
        return Response(**self.do_list(request))


class ProsDefaultViewSet(ProsAbstractViewSet):
    """Default ViewSet for Pros models."""

    def do_retrieve(self, request: Request, pk: str | None) -> ResponseValue:
        try:
            return ResponseValue(get_item(self.__model_class__, pk))
        except DoesNotExist as e:
            return ResponseValue(e.message, 404)

    def retrieve(self, request: Request, pk: str | None = None) -> Response:
        return Response(**self.do_retrieve(request, pk))

    @db.write_transaction
    def do_create(self, request: Request) -> ResponseValue:
        try:
            v = validate(
                instance=request.data,
                schema=PROS_MODELS[self.__model_class__.__name__.lower()].json_schema,
            )
        except ValidationError as e:
            return ResponseValue(data=e, status=400)

        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(request.data, self.__model_class__)

        property_data = {
            **property_data,
            "createdBy": request.user.username,
            "createdWhen": datetime.datetime.now(datetime.timezone.utc),
            "modifiedBy": request.user.username,
            "modifiedWhen": datetime.datetime.now(datetime.timezone.utc),
        }

        instance = self.__model_class__(**property_data)
        instance.save()

        add_related_nodes(self.__model_class__, instance, relation_data)
        add_inline_related_nodes(self.__model_class__, instance, inline_relation_data)

        return ResponseValue(
            {"uid": instance.uid, "label": instance.label, "saved": True}
        )

    def create(self, request: Request) -> Response:
        return Response(**self.do_create(request))

    @db.write_transaction
    def do_update(self, request: Request, pk: str | None) -> ResponseValue:
        try:
            v = validate(
                instance=request.data,
                schema=PROS_MODELS[self.__model_class__.__name__.lower()].json_schema,
            )
        except ValidationError as e:
            return ResponseValue(data=e, status=400)

        (
            property_data,
            relation_data,
            inline_relation_data,
        ) = get_property_and_relation_data(request.data, self.__model_class__)
        property_data.pop("createdWhen")
        property_data.pop("createdBy")
        property_data = {
            **property_data,
            "modifiedBy": request.user.username,
            "modifiedWhen": datetime.datetime.now(datetime.timezone.utc),
        }
        ic(relation_data)
        instance: ProsNode = self.__model_class__.nodes.get(uid=pk)

        for property_key, property_value in property_data.items():
            setattr(instance, property_key, property_value)
        instance.save()

        update_related_nodes(self.__model_class__, instance, relation_data)
        update_inline_related_nodes(
            instance, inline_relation_data, request.user.username
        )

        return ResponseValue({"uid": pk, "saved": True})

    def update(self, request, pk=None):
        return Response(**self.do_update(request, pk))

    @db.write_transaction
    def do_delete(self, request: Request, pk: str | None) -> ResponseValue:
        if request.query_params.get("restore"):
            instance: ProsNode = self.__model_class__.nodes.get(uid=pk)
            if instance.is_deleted:
                instance.is_deleted = False
                instance.modifiedWhen = datetime.datetime.now(datetime.timezone.utc)
                instance.save()

            return ResponseValue(
                {
                    "result": "success",
                    "detail": f"Deleted {self.__model_class__.__name__} '{instance.label}' restored.",
                }
            )

        try:
            instance: ProsNode = self.__model_class__.nodes.get(uid=pk)
            if instance.has_dependent_relations():

                instance.is_deleted = True
                instance.modifiedWhen = datetime.datetime.now(datetime.timezone.utc)
                instance.save()
                return ResponseValue(
                    {
                        "detail": (
                            f"Marked {self.__model_class__.__name__} '{instance.label}' as deletion desired,"
                            " pending removal of references from dependent entities"
                        ),
                        "result": "pending",
                    }
                )
            else:
                delete_all_inline_nodes(instance)
                d = DeletedNode(
                    uid=instance.uid,
                    type=self.__model_class__.__name__,
                    deletedWhen=datetime.datetime.now(datetime.timezone.utc),
                )
                d.save()
                instance.delete()

                return ResponseValue(
                    {
                        "detail": f"Deleted {self.__model_class__.__name__} {pk} as it has no dependencies",
                        "result": "success",
                    }
                )
        except DoesNotExist:
            return ResponseValue({"detail": "Not found", "result": "fail"}, status=404)

    def delete(self, request: Request, pk: str | None = None):
        return Response(**self.do_delete(request, pk))


def generic_viewset_factory(
    app_model,
) -> type[ProsAbstractViewSet] | type[ProsDefaultViewSet]:
    def get_permissions(self):
        # ic(self)
        if self.request.method == "GET":
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    """Produces named ViewSet for a Pros model."""
    if app_model.meta.get("abstract"):

        return type(
            f"{app_model.model.__name__}ViewSet",
            (ProsAbstractViewSet,),
            {
                "__model_class__": app_model.model,
                "get_permissions": get_permissions,
            },
        )
    else:
        return type(
            f"{app_model.model.__name__}ViewSet",
            (ProsDefaultViewSet,),
            {
                "__model_class__": app_model.model,
                "get_permissions": get_permissions,
            },
        )
