MATCH (main { uid:"de06fd5842624f81ba08c83d0fe97598" })

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
    WITH apoc.map.setValues(incoming_node, ["rel_type", toLower(incoming_relation.reverse_name), "deleted_and_has_dependent_nodes", has_inbound_incoming_node AND incoming_node.is_deleted]) AS mod_incoming_node
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
    WITH apoc.map.setValues(outgoing_node, ["rel_type", toLower(type(outgoing_relation)), "deleted_and_has_dependent_nodes", has_inbound_outgoing_node AND outgoing_node.is_deleted]) AS mod_outgoing_node
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
