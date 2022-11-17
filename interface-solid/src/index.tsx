/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { createEffect, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Router } from "@solidjs/router";

const SERVER: string = "http://127.0.0.1:8000";
const BASE_URI: string = "http://127.0.0.1:8000/api";

type SchemaFieldProperty = {
  type: "property";
  property_type: string;
  default_value: any;
  required: boolean;
};

type SchemaFieldRelation = {
  type: "relation";
  relation_type: string;
  relation_to: string;
  cardinality: string;
  default_value: object[];
  relation_fields: object[];
};

type SubClasses = {
  [key: string]: {} | SubClasses;
};

type SchemaEntity = {
  top_level: boolean;
  fields: { [key: string]: SchemaFieldProperty | SchemaFieldRelation };
  reverse_relations: object;
  app: string;
  meta: {
    display_name?: string;
    display_name_plural?: string;
    abstract?: boolean;
  };
  subclasses?: SubClasses;
  subclasses_list?: string[];
};

type SchemaObject = {
  [key: string]: SchemaEntity;
};

const s = createStore<SchemaObject | {}>({});

// The return type of the schema signal function
type getSchema = () => SchemaObject;

const schema: SchemaObject = s[0];
const setSchema = s[1];

type SchemaWrapperProps = {
  children: any;
};

function SchemaWrapper(props: SchemaWrapperProps) {
  createEffect(async () => {
    const res = await fetch(BASE_URI + "/schema");
    const json: SchemaObject = await res.json();
    console.log("get_schema_json", json);
    setSchema(json);
  });

  return (
    <Show when={Object.keys(schema).length > 0} fallback={<>Loading...</>}>
      {props.children}
    </Show>
  );
}

const ssomething: SchemaObject = {
  dance: {
    top_level: false,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      text: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      has_source: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Source",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      is_about_person: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      dance_partner: {
        type: "relation",
        relation_type: "HAS_PRIMARY_DANCE_PARTNER",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    reverse_relations: {},
    app: "test_app",
    meta: {
      display_name: "Dance",
    },
  },
  entity: {
    top_level: true,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
    },
    reverse_relations: {
      has_factoid_about: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Factoid",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    app: "test_app",
    meta: {
      display_name_plural: "Entities",
      display_name: "Entity",
    },
    subclasses: {
      person: {},
    },
  },
  event: {
    top_level: false,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      text: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      has_source: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Source",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      is_about_person: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    reverse_relations: {},
    app: "test_app",
    meta: {
      display_name: "Event",
    },
    subclasses: {
      dance: {},
    },
  },
  factoid: {
    top_level: true,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      text: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      has_source: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Source",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      is_about_person: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    reverse_relations: {},
    app: "test_app",
    meta: {
      abstract: true,
      display_name: "Factoid",
    },
    subclasses: {
      naming: {},
      event: {
        subclasses: {
          dance: {},
        },
      },
      interpersonalrelation: {
        subclasses: {
          parentalrelation: {},
        },
      },
    },
  },
  interpersonalrelation: {
    top_level: false,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      text: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      has_source: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Source",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      is_about_person: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      related_to: {
        type: "relation",
        relation_type: "IS_RELATED_TO",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    reverse_relations: {},
    app: "test_app",
    meta: {
      abstract: true,
      display_name: "Interpersonal Relation",
    },
    subclasses: {
      parentalrelation: {},
    },
  },
  letter: {
    top_level: false,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      sender: {
        type: "relation",
        relation_type: "HAS_SENDER",
        relation_to: "Entity",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      recipient: {
        type: "relation",
        relation_type: "HAS_RECIPIENT",
        relation_to: "Entity",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    reverse_relations: {
      is_source_of: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Factoid",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    app: "test_app",
    meta: {
      display_name: "Letter",
    },
  },
  naming: {
    top_level: false,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      text: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      title: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      first_name: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      last_name: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      has_source: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Source",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      is_about_person: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    reverse_relations: {},
    app: "test_app",
    meta: {
      display_name: "Naming",
    },
  },
  parentalrelation: {
    top_level: false,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      text: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
      has_source: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Source",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      is_about_person: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
      related_to: {
        type: "relation",
        relation_type: "HAS_PARENT",
        relation_to: "Person",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    reverse_relations: {},
    app: "test_app",
    meta: {
      display_name: "Parental Relation",
    },
  },
  person: {
    top_level: false,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
    },
    reverse_relations: {
      has_factoid_about: {
        type: "relation",
        relation_type: "IS_ABOUT_PERSON",
        relation_to: "Factoid",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    app: "test_app",
    meta: {
      display_name: "Person",
    },
  },
  source: {
    top_level: true,
    fields: {
      label: {
        type: "property",
        property_type: "StringProperty",
        default_value: null,
        required: false,
      },
    },
    reverse_relations: {
      is_source_of: {
        type: "relation",
        relation_type: "HAS_SOURCE",
        relation_to: "Factoid",
        cardinality: "ZeroOrMore",
        default_value: [],
      },
    },
    app: "test_app",
    meta: {
      display_name: "Source",
    },
    subclasses: {
      letter: {},
    },
    subclasses_list: ["Dance"],
  },
};

render(
  () => (
    <Router>
      <SchemaWrapper>
        <App />
      </SchemaWrapper>
    </Router>
  ),
  document.getElementById("root") as HTMLElement
);

export { schema, BASE_URI, SERVER };
export type { SchemaObject, SchemaEntity, SubClasses };
