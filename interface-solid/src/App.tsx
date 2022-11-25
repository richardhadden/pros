import {
  Component,
  createResource,
  Show,
  onMount,
  createSignal,
  lazy,
} from "solid-js";
import { Routes, Route } from "@solidjs/router";
import { groupBy } from "ramda";

import { schema, BASE_URI } from "./index";

import ViewEntityType from "./components/viewEntityType";
import ViewEntity from "./components/viewEntity";
import EditEntityView from "./components/editEntityView";
import NewEntityView from "./components/newEntityView";
import Login, { getSession } from "./components/login";

import Sidebar from "./components/sidebar";

import { userStatus } from "./components/login";
import { CUSTOM_ADVANCED_FIELDS } from "../../interface-solid/interface-config.js";

export const [hasUnsavedChange, setHasUnsavedChange] = createSignal(false);

type ViewEntityTypeData = {
  real_type: string;
  uid: string;
  label: string;
}[];

type RequestParams = {
  entity_type: string;
  uid: string;
};

const groupByRealType = groupBy(
  (item: { label: string; uid: string; real_type: string }) => item.real_type
);

const fetchEntityViewAllData = async (uri: String) => {
  //console.log(uri);
  const response = await fetch(`${BASE_URI}/${uri}`);
  const response_json: ViewEntityTypeData[] = await response.json();
  //console.log(response_json);
  const grouped_response_data = groupByRealType(response_json);
  //console.log(grouped_response_data);
  return grouped_response_data;
};

type DataResourceArgs = {
  params: RequestParams;
  location: { search: string };
  navigate: object;
  data: object;
};

const EntityViewAllData: (p: DataResourceArgs) => object = ({
  params,
  location,
  navigate,
  data,
}) => {
  const [entity_view_data] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/` +
      location.search,
    fetchEntityViewAllData
  );
  return entity_view_data;
};

const fetchEntityData = async (uri_end: string) => {
  //console.log("fetch_entity_data called");
  const response = await fetch(`${BASE_URI}/${uri_end}`);

  if (response.status !== 200) {
    const response_json = await response.json();
    return { status: "error", data: response_json };
  }

  const response_json = await response.json();
  console.log(response_json);
  return response_json;
};

const EntityData: (p: DataResourceArgs) => object = ({
  params,
  location,
  navigate,
  data,
}) => {
  const [entity_data] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/${params.uid}`,
    fetchEntityData
  );
  return entity_data;
};

export const fetchAutoCompleteData = async (entity_type: string) => {
  //console.log("fetch autocompletedata called", entity_type);
  const response = await fetch(
    `${BASE_URI}/${schema[entity_type].app}/autocomplete/${entity_type}/`
  );
  const response_json = await response.json();
  //console.log(response_json);
  return response_json;
};

export const putEntityData = async (
  entity: string,
  uid: string,
  submission_data: object
) => {
  //console.log("postEntityData", entity, uid, submission_data);
  const resp = await fetch(
    `${BASE_URI}/${schema[entity].app}/${entity}/${uid}`,
    {
      method: "PUT", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },

      body: JSON.stringify(submission_data),
    }
  );
  const json = await resp.json();
  return json;
};

export const postNewEntityData = async (
  entity_type: string,
  submission_data: object
) => {
  const resp = await fetch(
    `${BASE_URI}/${schema[entity_type].app}/${entity_type}/new/`,
    {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },

      body: JSON.stringify(submission_data),
    }
  );
  const json = await resp.json();
  return json;
};

export const deleteEntity = async (entity_type, uid, restore = false) => {
  const uri = `${BASE_URI}/${schema[entity_type].app}/${entity_type}/${uid}/${
    restore ? "?restore=true" : ""
  }`;
  console.log(uri);
  const resp = await fetch(uri, {
    method: "DELETE", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
  });
  return resp.status === 200;
};

const Home: Component = () => {
  const [c, setC] = createSignal(true);
  return (
    <div class="mt-12 flex flex-grow flex-row justify-center">
      <div class="w-3/6">
        <div class="prose">
          <h1 class="prose-h1">Home</h1>
          <p class="prose-lead">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae a
            veniam consequuntur nesciunt omnis cumque doloremque aperiam tempora
            magnam quas, praesentium rem ex harum numquam vitae ducimus ut vero
            nostrum!
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Error
            aspernatur libero cum deserunt ex exercitationem distinctio, dolorum
            sequi magni earum assumenda quod eaque molestias quos eos placeat
            nisi in autem.
          </p>
        </div>
        <div class="hero mt-12 bg-base-200">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-5xl font-bold">Hello there</h1>
              <p class="py-6">
                Provident cupiditate voluptatem et in. Quaerat fugiat ut
                assumenda excepturi exercitationem quasi. In deleniti eaque aut
                repudiandae et a id nisi.
              </p>
              <button class="btn btn-primary">Get Started</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: Component = () => {
  onMount(getSession);

  return (
    <>
      <Show when={userStatus.isAuthenticated} fallback={<Login />}>
        <div class="flex h-full">
          <div class="">
            <Sidebar />
          </div>
          <div class="flex-grow pl-5 pr-10">
            <Routes>
              <Route
                path="/entity/:entity_type/new/"
                component={NewEntityView}
              />
              <Route
                path="/entity/:entity_type/:uid/"
                component={ViewEntity}
                data={EntityData}
              />
              <Route
                path="/entity/:entity_type/"
                component={ViewEntityType}
                data={EntityViewAllData}
              />
              <Route
                path="/entity/:entity_type/:uid/edit/"
                component={EditEntityView}
                data={EntityData}
              />
              <Route path="/login" component={Login} />
              <Route path="/" component={Home} />
            </Routes>
          </div>
        </div>
      </Show>
    </>
  );
};

export default App;
