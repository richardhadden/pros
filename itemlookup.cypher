MATCH (main { uid:"b8d9ddca945b41a88172d8926e9952eb" })
// Outgoing direct
CALL {
  WITH main
  OPTIONAL MATCH (main)-[outgoing_relation]->(outgoing_node)
  WHERE outgoing_relation.inline is null
  WITH apoc.map.setKey(outgoing_node, "rel_type", toLower(type(outgoing_relation))) AS mod_outgoing_node
  RETURN apoc.map.groupByMulti(COLLECT(mod_outgoing_node), "rel_type") AS outgoing_relations
}

// Incoming inline...
CALL {
  WITH main
  OPTIONAL MATCH (main)<-[incoming_relation]-(incoming_node)<-[passthrough_rel]-(passthrough_node)
  WHERE main.uid <> passthrough_node.uid
  WITH incoming_relation, incoming_node, passthrough_rel, apoc.map.setKey(passthrough_node, "rel_type", toLower(incoming_relation.reverse_name)) AS ptn
  RETURN apoc.map.groupByMulti(COLLECT(ptn{ .uid, .real_type, .label, .is_deleted, .rel_type }), "rel_type") AS incoming_inline
  
}
// Inlines...
CALL {
  WITH main
  OPTIONAL MATCH (main)-[inline_relation]->(inline_node)
  WHERE main.uid <> inline_node.uid AND inline_relation.inline
  CALL {
    WITH inline_node
    OPTIONAL MATCH (inline_node)-[related_rel]->(related_node)
    WITH apoc.map.setKey(related_node, "rel_type", toLower(type(related_rel))) AS mod_related_node, related_rel
    RETURN related_rel, apoc.map.groupByMulti(COLLECT(mod_related_node{ .uid, .real_type, .label, .is_deleted, .rel_type }), "rel_type") AS grouped_mod_related_node // NOW, just need to add in related node to inline_node..., grouping by type!!
  }
  
  WITH apoc.map.setValues(inline_node, ["type", inline_node.real_type]) AS mod_inline_node,
  inline_relation, inline_node, related_rel, grouped_mod_related_node
  RETURN apoc.map.mergeList([mod_inline_node, grouped_mod_related_node]) AS inlines, inline_relation, inline_node, related_rel, grouped_mod_related_node
}
WITH apoc.map.setKey(main, toLower(type(inline_relation)), inlines) AS main_node, inline_relation, inlines, outgoing_relations, incoming_inline, related_rel, grouped_mod_related_node, inline_node
RETURN apoc.map.mergeList(COLLECT(apoc.map.mergeList([main_node, outgoing_relations, incoming_inline])))
