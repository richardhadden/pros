import { Component, createEffect } from "solid-js";

import {
  Draft04,
  Draft06,
  Draft07,
  Draft,
  JSONError,
} from "json-schema-library";

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
    type: "precisedate",
    date: "2022-01-0",
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
    label: { type: "string", minLength: 1 },
    text: { type: "string" },
  },
  title: "Validate Factoid",
  type: "object",
  required: ["date"],
};

const jsonSchema: Draft = new Draft07(myJsonSchema);

const TestingSchema: Component = (props) => {
  createEffect(() => {
    for (let err of jsonSchema.validate(myData)) {
      console.log(err);
    }
  });

  return <div>testingschema</div>;
};

export default TestingSchema;
