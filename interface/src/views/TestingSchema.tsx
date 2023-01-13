import { Component, createEffect, onMount } from "solid-js";
import Dexie from "dexie";
import {
  Draft04,
  Draft06,
  Draft07,
  Draft,
  JSONError,
} from "json-schema-library";

import { Validator } from "@cfworker/json-schema";
import { createDexieArrayQuery } from "solid-dexie";
import { addSchema, validate } from "@hyperjump/json-schema/draft-2020-12";

const myData = {
  uid: "955a42b4f6344cfc9ab1a30525c23233",
  real_type: "birth",
  is_deleted: false,
  createdBy: "rhadden",
  createdWhen: "2023-01-13T11:19:18.137318Z",
  modifiedBy: "rhadden",
  modifiedWhen: "2023-01-13T11:46:16.338125Z",
  label: "Birth of Aaron Crocker",
  text: "Aaron Crocker born",
  id: 5074,
  deleted_and_has_dependent_nodes: false,
  is_about_person: [
    {
      uid: "55cb93dcf6c544d192280bb56a933e7d",
      real_type: "person",
      is_deleted: false,
      label: "Aaron Crocker",
      sort_date: "",
      deleted_and_has_dependent_nodes: false,
      relData: {
        certainty: 1,
      },
    },
  ],
  citation: {
    uid: "c63fa25bc1d74ddf91d8d6c564abc02b",
    real_type: "citation",
    is_deleted: false,
    line: 1,
    page: 1,
    sort_date: "",
    type: "citation",
    source: [
      {
        uid: "f34bf8ff20374b58b31ad143d61daa69",
        real_type: "source",
        is_deleted: false,
        createdBy: "rhadden",
        modifiedBy: "rhadden",
        label: "Book of Aaron Crocker",
        modifiedWhen: "2023-01-13 11:16:42.968667+00:00",
        createdWhen: "2023-01-13 11:16:42.968664+00:00",
        sort_date: "",
        deleted_and_has_dependent_nodes: false,
        relData: {},
      },
    ],
  },
  date: {
    date: "201",
    uid: "5aa50d1ca1ed4c89b9860f2c89dc2df8",
    real_type: "precisedate",
    is_deleted: false,
    earliest_possible_conservative: "0201-12-31",
    earliest_possible: "0201-01-01",
    latest_possible_conservative: "0201-01-01",
    latest_possible: "0201-12-31",
    sort_date: "",
    type: "precisedate",
  },
};

const myJsonSchema = {
  $id: "https://example.com/product.schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  properties: {
    label: {
      type: "string",
      minLength: 1,
    },
    text: {
      type: "string",
      minLength: 1,
    },
    is_about_person: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
          },
          uid: {
            type: "string",
          },
          relData: {
            certainty: {
              type: "integer",
            },
          },
        },
      },
      minItems: 1,
    },
    citation: {
      type: "object",
      oneOf: [
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "citation",
            },
            page: {
              type: "integer",
            },
            line: {
              type: "integer",
            },
            source: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: {
                    type: "string",
                  },
                  uid: {
                    type: "string",
                  },
                },
              },
              minItems: 1,
            },
          },
        },
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "impliedbyfactoid",
            },
            implied_by_factoid: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: {
                    type: "string",
                  },
                  uid: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      ],
    },
    related_factoids: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
          },
          uid: {
            type: "string",
          },
          relData: {
            note: {
              type: "string",
            },
          },
        },
      },
    },
    location: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
          },
          uid: {
            type: "string",
          },
        },
      },
    },
    date: {
      type: "object",
      oneOf: [
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "precisedate",
            },
            date: {
              type: "string",
              pattern:
                "^\\d{4}(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
          },
        },
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "imprecisedate",
            },
            not_before: {
              type: "string",
              pattern:
                "^\\d{4}(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
            not_after: {
              type: "string",
              pattern:
                "^\\d{4}(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
          },
        },
      ],
    },
  },
  required: ["label", "text", "is_about_person"],
};

const validator = new Validator(myJsonSchema, "2020-12", false);
//const jsonSchema: Draft = new Draft07(myJsonSchema);

const TestingSchema: Component = (props) => {
  const v = validator.validate(myData);
  console.log(v);
  return <div>testingschema</div>;
};

export default TestingSchema;
