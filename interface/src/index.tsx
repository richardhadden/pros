/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { createEffect, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Router } from "@solidjs/router";
import { db } from "./data/db";

const SERVER: string = "http://127.0.0.1:8000";
const BASE_URI: string = "http://127.0.0.1:8000/api";

import { SchemaObject, SchemaEntity, SubClasses } from "./types/schemaTypes";

const [schema, setSchema] = createStore<SchemaObject>({});

interface SchemaWrapperProps {
  children: any;
}

var resolveDbReady, promiseReject;

export const dbReady = new Promise(function (resolve, reject) {
  resolveDbReady = resolve;
  promiseReject = reject;
});

function SchemaWrapper(props: SchemaWrapperProps) {
  createEffect(async () => {
    const res = await fetch(BASE_URI + "/schema");
    const json: SchemaObject = await res.json();
    console.log("get_schema_json", json);
    setSchema(json);

    const stores = Object.entries(json).reduce((acc, [entity_name, entity]) => {
      if (!entity.meta?.inline_only) {
        acc[entity_name] = "id,uid,[real_type+label]";
      }
      return acc;
    }, {});

    db.version(3).stores(stores);
    db.open();
    console.log("setting up db");
    resolveDbReady();
  });

  return (
    <Show
      when={Object.keys(schema).length > 0}
      fallback={
        <div class="flex items-center justify-center">
          <div
            class="spinner-border inline-block h-8 w-8 animate-spin rounded-full border-4"
            role="status"
          ></div>
        </div>
      }
    >
      {props.children}
    </Show>
  );
}

render(
  () => (
    <SchemaWrapper>
      <Router>
        <App />
      </Router>
    </SchemaWrapper>
  ),
  document.getElementById("root") as HTMLElement
);

export { schema, BASE_URI, SERVER };
export type { SchemaObject, SchemaEntity, SubClasses };
