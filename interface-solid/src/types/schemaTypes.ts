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
    label_template?: string;
    inline_only?: boolean;
    override_labels?: {[key: string]: string[]}
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
  };
  
export  type SchemaObject = {
    [key: string]: SchemaEntity;
  };



/* TEST */

const actualSchema: SchemaObject = {
  "acquaintanceship": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "subject_related_to": {
              "type": "relation",
              "relation_type": "SUBJECT_RELATED_TO",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "date": {
              "type": "relation",
              "relation_type": "DATE",
              "relation_to": "ComplexDate",
              "relation_fields": {
                  "inline": {
                      "type": "property",
                      "property_type": "BooleanProperty",
                      "default_value": true,
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": true,
              "cardinality": "One",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "label_template": "{is_about_person.label} knows {subject_related_to.label}",
          "display_name": "Acquaintanceship"
      },
      "subclasses_list": []
  },
  "birth": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "date": {
              "type": "relation",
              "relation_type": "DATE",
              "relation_to": "SingleDate",
              "relation_fields": {
                  "inline": {
                      "type": "property",
                      "property_type": "BooleanProperty",
                      "default_value": true,
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": true,
              "cardinality": "One",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "display_name": "Birth"
      },
      "subclasses_list": []
  },
  "complexdate": {
      "top_level": true,
      "fields": {},
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "abstract": true,
          "inline_only": true,
          "display_name": "Complex Date"
      },
      "subclasses": {
          "singledate": {
              "subclasses": {
                  "precisedate": {},
                  "imprecisedate": {}
              }
          },
          "daterange": {
              "subclasses": {
                  "precisedaterange": {},
                  "imprecisedaterange": {}
              }
          }
      },
      "subclasses_list": [
          "SingleDate",
          "PreciseDate",
          "ImpreciseDate",
          "DateRange",
          "PreciseDateRange",
          "ImpreciseDateRange"
      ]
  },
  "daterange": {
      "top_level": false,
      "fields": {},
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "inline_only": true,
          "abstract": true,
          "display_name": "Date Range"
      },
      "subclasses": {
          "precisedaterange": {},
          "imprecisedaterange": {}
      },
      "subclasses_list": [
          "PreciseDateRange",
          "ImpreciseDateRange"
      ]
  },
  "death": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "date": {
              "type": "relation",
              "relation_type": "DATE",
              "relation_to": "SingleDate",
              "relation_fields": {
                  "inline": {
                      "type": "property",
                      "property_type": "BooleanProperty",
                      "default_value": true,
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": true,
              "cardinality": "One",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "display_name": "Death"
      },
      "subclasses_list": []
  },
  "entity": {
      "top_level": true,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          }
      },
      "reverse_relations": {
          "is_sender_of": {
              "relation_to": "Letter"
          },
          "is_recipient_of": {
              "relation_to": "Letter"
          }
      },
      "app": "test_app",
      "meta": {
          "display_name_plural": "Entities",
          "display_name": "Entity"
      },
      "subclasses": {
          "person": {},
          "organisation": {}
      },
      "subclasses_list": [
          "Person",
          "Organisation"
      ]
  },
  "event": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "display_name": "Event"
      },
      "subclasses": {
          "birth": {},
          "death": {},
          "naming": {}
      },
      "subclasses_list": [
          "Birth",
          "Death",
          "Naming"
      ]
  },
  "factoid": {
      "top_level": true,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "abstract": true,
          "display_name": "Factoid"
      },
      "subclasses": {
          "event": {
              "subclasses": {
                  "birth": {},
                  "death": {},
                  "naming": {}
              }
          },
          "relation": {
              "subclasses": {
                  "parentchildrelation": {},
                  "acquaintanceship": {}
              }
          },
          "membership": {}
      },
      "subclasses_list": [
          "Event",
          "Birth",
          "Death",
          "Naming",
          "Relation",
          "ParentChildRelation",
          "Acquaintanceship",
          "Membership"
      ]
  },
  "imprecisedate": {
      "top_level": false,
      "fields": {
          "not_before": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "not_after": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "inline_only": true,
          "display_name": "Imprecise Date"
      },
      "subclasses_list": []
  },
  "imprecisedaterange": {
      "top_level": false,
      "fields": {
          "start_not_before": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "start_not_after": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "end_not_before": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "end_not_after": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "inline_only": true,
          "display_name": "Imprecise Date Range"
      },
      "subclasses_list": []
  },
  "letter": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "date": {
              "type": "relation",
              "relation_type": "DATE",
              "relation_to": "SingleDate",
              "relation_fields": {
                  "inline": {
                      "type": "property",
                      "property_type": "BooleanProperty",
                      "default_value": true,
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": true,
              "cardinality": "One",
              "default_value": []
          },
          "sender": {
              "type": "relation",
              "relation_type": "SENDER",
              "relation_to": "Entity",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "recipient": {
              "type": "relation",
              "relation_type": "RECIPIENT",
              "relation_to": "Entity",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          }
      },
      "reverse_relations": {
          "is_source_of": {
              "relation_to": "Factoid"
          }
      },
      "app": "test_app",
      "meta": {
          "label_template": "Letter from {sender.__all__.label} to {recipient.label}",
          "display_name": "Letter"
      },
      "subclasses_list": []
  },
  "membership": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "member_of": {
              "type": "relation",
              "relation_type": "MEMBER_OF",
              "relation_to": "Organisation",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "date": {
              "type": "relation",
              "relation_type": "DATE",
              "relation_to": "DateRange",
              "relation_fields": {
                  "inline": {
                      "type": "property",
                      "property_type": "BooleanProperty",
                      "default_value": true,
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": true,
              "cardinality": "One",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "label_template": "{is_about_person.label} is member of {member_of.label}",
          "display_name": "Membership"
      },
      "subclasses_list": []
  },
  "naming": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "title": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "first_name": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "last_name": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "label_template": "{is_about_person.label} named {title} {first_name} {last_name}",
          "display_name": "Naming"
      },
      "subclasses_list": []
  },
  "organisation": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          }
      },
      "reverse_relations": {
          "membership_organisation": {
              "relation_to": "Membership"
          },
          "is_sender_of": {
              "relation_to": "Letter"
          },
          "is_recipient_of": {
              "relation_to": "Letter"
          }
      },
      "app": "test_app",
      "meta": {
          "display_name": "Organisation"
      },
      "subclasses_list": []
  },
  "parentchildrelation": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "subject_related_to": {
              "type": "relation",
              "relation_type": "SUBJECT_RELATED_TO",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "display_name": "Parent-Child Relation",
          "label_template": "{is_about_person.label} is parent of {subject_related_to.label}",
          "override_labels": {
              "is_about_person": [
                  "parent",
                  "is_identified_as_parent"
              ],
              "subject_related_to": [
                  "child",
                  "identified_as_child"
              ]
          }
      },
      "subclasses_list": []
  },
  "person": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          }
      },
      "reverse_relations": {
          "has_factoid_about": {
              "relation_to": "Factoid"
          },
          "is_related_to_subject": {
              "relation_to": "Relation"
          },
          "is_sender_of": {
              "relation_to": "Letter"
          },
          "is_recipient_of": {
              "relation_to": "Letter"
          }
      },
      "app": "test_app",
      "meta": {
          "display_name": "Person"
      },
      "subclasses_list": []
  },
  "precisedate": {
      "top_level": false,
      "fields": {
          "date": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "inline_only": true,
          "display_name": "Precise Date"
      },
      "subclasses_list": []
  },
  "precisedaterange": {
      "top_level": false,
      "fields": {
          "start": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "end": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "inline_only": true,
          "display_name": "Precise Date Range"
      },
      "subclasses_list": []
  },
  "relation": {
      "top_level": false,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "text": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "is_about_person": {
              "type": "relation",
              "relation_type": "IS_ABOUT_PERSON",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "has_source": {
              "type": "relation",
              "relation_type": "HAS_SOURCE",
              "relation_to": "Source",
              "relation_fields": {},
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          },
          "subject_related_to": {
              "type": "relation",
              "relation_type": "SUBJECT_RELATED_TO",
              "relation_to": "Person",
              "relation_fields": {
                  "certainty": {
                      "type": "property",
                      "property_type": "StringProperty",
                      "default_value": "1",
                      "required": false,
                      "help_text": null
                  }
              },
              "inline_relation": false,
              "cardinality": "ZeroOrMore",
              "default_value": []
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "abstract": true,
          "display_name": "Relation"
      },
      "subclasses": {
          "parentchildrelation": {},
          "acquaintanceship": {}
      },
      "subclasses_list": [
          "ParentChildRelation",
          "Acquaintanceship"
      ]
  },
  "singledate": {
      "top_level": false,
      "fields": {},
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "inline_only": true,
          "abstract": true,
          "display_name": "Single Date"
      },
      "subclasses": {
          "precisedate": {},
          "imprecisedate": {}
      },
      "subclasses_list": [
          "PreciseDate",
          "ImpreciseDate"
      ]
  },
  "source": {
      "top_level": true,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          }
      },
      "reverse_relations": {
          "is_source_of": {
              "relation_to": "Factoid"
          }
      },
      "app": "test_app",
      "meta": {
          "display_name": "Source"
      },
      "subclasses": {
          "letter": {}
      },
      "subclasses_list": [
          "Letter"
      ]
  },
  "test": {
      "top_level": true,
      "fields": {
          "label": {
              "type": "property",
              "property_type": "StringProperty",
              "default_value": null,
              "required": false,
              "help_text": "Short text description"
          },
          "integer": {
              "type": "property",
              "property_type": "IntegerProperty",
              "default_value": null,
              "required": false,
              "help_text": "An integer for you to enjoy"
          },
          "float": {
              "type": "property",
              "property_type": "FloatProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "boolean": {
              "type": "property",
              "property_type": "BooleanProperty",
              "default_value": true,
              "required": false,
              "help_text": null
          },
          "date": {
              "type": "property",
              "property_type": "DateProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "dateTime": {
              "type": "property",
              "property_type": "DateTimeProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          },
          "email": {
              "type": "property",
              "property_type": "EmailProperty",
              "default_value": null,
              "required": false,
              "help_text": null
          }
      },
      "reverse_relations": {},
      "app": "test_app",
      "meta": {
          "display_name": "Test"
      },
      "subclasses_list": []
  }
}