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
import Cookies from "js-cookie";
import { schema, BASE_URI, SERVER } from "./index";

import ViewEntityListView from "./views/ViewEntityListView";
import ViewEntity from "./views/ViewEntityView";
import EditEntityView from "./views/EditEntityView";
import NewEntityView from "./views/NewEntityView";

import Sidebar from "./components/SideBar";

import Login, {
  userStatus,
  alreadyLoggedIn,
  setUserStatus,
  refreshToken,
} from "./components/Login";
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

const fetchOrRefreshToken: (
  url: string,
  method?: string,
  data?: object | undefined
) => Promise<any> = async (url, method = "GET", data = undefined) => {
  const fetchOptions: {
    mode: RequestMode;
    method: string;
    credentials: RequestCredentials;
    headers: HeadersInit | undefined;
    body?: string | undefined;
  } = {
    mode: "cors", // no-cors, *cors, same-origin

    credentials: "same-origin", // include, *same-origin, omit
    method: method,
    headers: {
      Authorization: `Bearer ${Cookies.get("accessToken")}`,
      "Content-Type": "application/json",
    },
  };

  if (data) {
    console.log("putting data", data);
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URI}/${url}`, fetchOptions);
  // Authorised and returns data
  if (response.status === 200) {
    const response_json = await response.json();
    return response_json;
  }
  // Unauthorised
  if (response.status == 401) {
    const response_json = await response.json();
    if (response_json.code === "token_not_valid") {
      await refreshToken();
      return await fetchOrRefreshToken(url, method, data);
    }
  }
};

const fetchEntityViewAllData: (
  uri: string
) => Promise<Record<string, ViewEntityTypeData>> = async (uri) => {
  const response_json = await fetchOrRefreshToken(uri);

  console.log(response_json);
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

const EntityViewAllData: (
  p: DataResourceArgs
) => [object, (info?: unknown) => any] = ({ params, location }) => {
  const [entity_view_data, { mutate, refetch }] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/` +
      location.search,
    fetchEntityViewAllData
  );
  return [entity_view_data, refetch];
};

const fetchEntityData = async (uri_end: string) => {
  //console.log("fetch_entity_data called");
  const response_json = await fetchOrRefreshToken(uri_end);

  //const response_json = await response.json();
  return response_json;
};

const EntityData: (
  p: DataResourceArgs
) => [object, (info?: unknown) => any] = ({
  params,
  location,
  navigate,
  data,
}) => {
  const [entity_data, { mutate, refetch }] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/${params.uid}`,
    fetchEntityData
  );
  return [entity_data, refetch];
};

export const fetchAutoCompleteData = async (entity_type: string) => {
  //console.log("fetch autocompletedata called", entity_type);
  const response_json = await fetchOrRefreshToken(
    `${schema[entity_type].app}/autocomplete/${entity_type}/`
  );

  //console.log(response_json);
  return response_json;
};

export const putEntityData = async (
  entity: string,
  uid: string,
  submission_data: object
) => {
  //console.log("postEntityData", entity, uid, submission_data);
  const resp = await fetchOrRefreshToken(
    `${schema[entity].app}/${entity}/${uid}`,
    "PUT",
    submission_data
  );

  return resp;
};

export const postNewEntityData = async (
  entity_type: string,
  submission_data: object
) => {
  const response_json = await fetchOrRefreshToken(
    `${schema[entity_type].app}/${entity_type}/new/`,
    "POST",
    submission_data
  );

  return response_json;
};

export const deleteEntity = async (
  entity_type: string,
  uid: string,
  restore: boolean = false
) => {
  const uri = `${schema[entity_type].app}/${entity_type}/${uid}/${
    restore ? "?restore=true" : ""
  }`;
  console.log(uri);
  const resp = await fetchOrRefreshToken(uri, "DELETE");
  return resp;
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
              <button class="btn-primary btn">Get Started</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: Component = () => {
  onMount(alreadyLoggedIn);

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
                component={ViewEntityListView}
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
