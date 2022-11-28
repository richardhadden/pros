/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { createEffect, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Router } from "@solidjs/router";

const SERVER: string = "http://127.0.0.1:8000";
const BASE_URI: string = "http://127.0.0.1:8000/api";

import { SchemaObject, SchemaEntity, SubClasses } from "./types/schemaTypes";

const [schema, setSchema] = createStore<SchemaObject>({});

interface SchemaWrapperProps {
  children: any;
}

function SchemaWrapper(props: SchemaWrapperProps) {
  createEffect(async () => {
    const res = await fetch(BASE_URI + "/schema");
    const json: SchemaObject = await res.json();
    console.log("get_schema_json", json);
    setSchema(json);
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
