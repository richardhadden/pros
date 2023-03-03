
    
    
    MATCH (a:Source)
    CALL {
        WITH a
        MATCH path = (a)-[:MERGED*]-(b)
        CALL {
                    WITH b
                    WITH b
                    MATCH (b)<-[in_r]-(x)
                    WHERE NOT in_r:MERGED 
                    RETURN COUNT(b) > 0  as has_inbound_b
                }
                WITH b, b.is_deleted AND has_inbound_b AS ddn
        RETURN COLLECT(b{.label, .uid, .real_type, .is_deleted, deleted_and_has_dependent_nodes:ddn}) AS cb
    }
    CALL {
                WITH a
                WITH a
                MATCH (a)<-[in_r]-(x)
                WHERE NOT in_r:MERGED 
                RETURN COUNT(a) > 0  as has_inbound_a
    }
    

    WITH DISTINCT(a) AS da, a.is_deleted AND has_inbound_a AS ddn, cb <> [] as is_merged_item,  cb 
  

    RETURN da{.label, .uid, .real_type, .is_deleted, is_merged_item:is_merged_item, is_merged_item:is_merged_item, merged_items:cb } AS results
    ORDER BY da.label


    