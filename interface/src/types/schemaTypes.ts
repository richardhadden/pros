export type SchemaFieldProperty = {
    type: "property";
    property_type: | "StringProperty"
    | "EmailProperty"
    | "IntegerProperty"
    | "FloatProperty"
    | "BooleanProperty"
    | "DateProperty"
    | "DateTimeProperty";
    default_value: any;
    required: boolean;
    help_text?: string | null;
  };
  
export type SchemaFieldRelation = {
    type: "relation";
    relation_type: string;
    relation_to: string;
    cardinality: string;
    default_value: object[];
    relation_fields: {[key: string]: SchemaFieldProperty};
    inline_relation: boolean;
    help_text?: string | null;
  };
  
export type SchemaEntityMeta = 
  {
    display_name?: string;
    display_name_plural?: string;
    abstract?: boolean;
    view_label_template?: string;
    construct_label_template?: string;
    inline_only?: boolean;
    override_labels?: {[key: string]: string[]}
    use_list_cache?: boolean;
    importable?: boolean;
    importers?: {[key: string]: string};

  };


export  type SubClasses = {
    [key: string]: {} | SubClasses;
  };
  
export  type SchemaEntity = {
    top_level: boolean;
    fields: { [key: string]: SchemaFieldProperty | SchemaFieldRelation };
    reverse_relations: object;
    app: string;
    meta: SchemaEntityMeta;
    subclasses?: SubClasses;
    subclasses_list?: string[];
    parent_classes_list: string[];
    json_schema: object;
    
  };
  
export  type SchemaObject = {
    [key: string]: SchemaEntity;
  };


