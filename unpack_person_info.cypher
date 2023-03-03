MATCH (ns:Person)
UNWIND ns AS n
CALL {
  WITH n
  UNWIND ["Birth", "Death"] AS ntype
  CALL {
    WITH n, ntype
    OPTIONAL MATCH (n)-[r]-(o)
    WHERE ntype IN labels(o)
    OPTIONAL MATCH (o)-[q:DATE]-(d)
    WHERE d <> n
    OPTIONAL MATCH (o)-[s:LOCATION]-(l)
    
    RETURN d{ .earliest_possible, .latest_possible, location: l.label }
  }
  WITH COLLECT(d) AS colld, ntype
  RETURN apoc.map.setValues({ }, [ntype, colld]) AS irs
  
}

WITH DISTINCT (n) AS ns, apoc.map.mergeList(COLLECT(irs)) AS i
RETURN apoc.map.
MERGE (ns, i)
