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
  is_about_person: [
    {
      uid: "61157ee5a6a2470d8bc8dde11e002836",
      label: "John Smith",
      real_type: "person",
      is_deleted: false,
    },
  ],
  label: "",
  citation: {
    real_type: "citation",
    page: "",
    line: "2",
    source: [
      {
        uid: "e4efdaa5c56b437b93e9ccf56c997408",
        label: "Book of John Smith",
        real_type: "source",
        is_deleted: false,
      },
    ],
  },
  date: {
    type: "imprecisedate",
    not_before: "2022-01-01",
    not_after: "2022-01-01",
  },
};

const myJsonSchema = {
  $id: "https://example.com/product.schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  properties: {
    citation: {
      properties: {
        line: { pattern: "^\\d*$", type: "string", minLength: 1 },
        page: { pattern: "^\\d*$", type: "string" },
        source: {
          items: {
            properties: { label: { type: "string" }, uri: { type: "string" } },
            type: "object",
          },
          minLength: 0,
          type: "array",
        },
      },
    },
    is_about_person: {
      items: {
        properties: { label: { type: "string" }, uri: { type: "string" } },
        type: "object",
      },
      minLength: 0,
      relData: { certainty: { type: "string" } },
      type: "array",
    },
    label: {
      type: "string",
      minLength: 1,
      errorMessage: "something wrong",
    },
    text: { type: "string" },
    date: {
      type: "object",
      oneOf: [
        {
          type: "object",
          properties: {
            type: { type: "string", const: "precisedate" },
            date: {
              type: "string",
              pattern:
                "^\\d*(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
          },
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "imprecisedate" },
            not_before: {
              type: "string",
              pattern:
                "^\\d*(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
            not_after: {
              type: "string",
              pattern:
                "^\\d*(?:-(?:0[1-9]|1[012])(?:-(?:0[1-9]|[12][0-9]|3[01]))?)?$",
            },
          },
          required: ["not_before", "not_after"],
        },
      ],
    },
  },
  title: "Validate Factoid",
  type: "object",
  required: ["date"],
};

const validator = new Validator(myJsonSchema, "2020-12", false);
//const jsonSchema: Draft = new Draft07(myJsonSchema);

const TestingSchema: Component = (props) => {
  const v = validator.validate(myData);
  console.log(v);
  return <div>testingschema</div>;
};

export default TestingSchema;
