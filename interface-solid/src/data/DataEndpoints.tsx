import { groupBy, sort } from "ramda";
import Cookies from "js-cookie";
import { createEffect, createResource } from "solid-js";

import Login, {
  userStatus,
  alreadyLoggedIn,
  setUserStatus,
  refreshToken,
} from "../components/Login";

import { schema, BASE_URI, SERVER, dbReady } from "../index";
import { db, setDbRequests, dbRequests } from "./db";

export type ViewEntityTypeData = {
  real_type: string;
  uid: string;
  label: string;
  is_deleted: boolean;
  deleted_and_has_dependent_nodes: boolean;
}[];

export type RequestParams = {
  entity_type: string;
  uid: string;
};

const groupByRealType = groupBy(
  (item: { label: string; uid: string; real_type: string }) => item.real_type
);

async function storeDataToIndexedDB(
  entityType: string,
  data: ViewEntityTypeData[]
) {
  db.open();
  const dataToStore = data.map((item) => ({
    id: item.uid,
    uid: item.uid,
    label: item.label,
    real_type: item.real_type,
    deleted: item.deleted,
  }));
  db[entityType].bulkPut(dataToStore);
  const timestamp = new Date();
  setDbRequests(entityType, timestamp.toISOString());
}

async function getDataAndPatchIndexedDB(uri: string, entityType: string) {
  const fetchOptions: {
    mode: RequestMode;
    method: string;
    credentials: RequestCredentials;
    headers: HeadersInit | undefined;
    body?: string | undefined;
  } = {
    mode: "cors", // no-cors, *cors, same-origin

    credentials: "same-origin", // include, *same-origin, omit
    method: "GET",
    headers: {
      Authorization: `Bearer ${Cookies.get("accessToken")}`,
      "Content-Type": "application/json",
    },
  };
  const lastRefreshedTimestamp = dbRequests[entityType];
  const response = await fetch(
    `${BASE_URI}/${uri}?lastRefreshedTimestamp=${lastRefreshedTimestamp}`,
    fetchOptions
  );

  // Unauthorised probably means expired token, so we can refresh this
  // an dtry again
  if (response.status == 401) {
    const response_json = await response.json();
    if (response_json.code === "token_not_valid") {
      await refreshToken();
      return await getDataAndPatchIndexedDB(uri, entityType);
    } else return;
  }
  // Authorised and returns data
  if (response.status === 200) {
    const response_json = await response.json();

    return response_json;
  }
}

async function fetchOrRefreshToken(
  url: string,
  method: string = "GET",
  data: object | undefined = undefined,
  entityTypeForDb: string | undefined = undefined
): Promise<object | undefined> {
  // Function to handle data-fetching, either from endpoint or IndexedDB
  // If an enpoint request fails due to expired token, it runs itself again

  // Set up the fetch options
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

  // If we provide the entity type for db lookup, it's a GET request,
  // and a request for that endpoint has already been made (using lookup to
  // localstorage), retrieve the data directly from the indexeddb
  if (entityTypeForDb && method === "GET" && dbRequests[entityTypeForDb]) {
    // Do a request to server for updated data... get, and index...
    getDataAndPatchIndexedDB(url, entityTypeForDb);
    await dbReady;
    const response = await db[entityTypeForDb]
      .orderBy("[real_type+label]")
      .toArray();
    return response;
  }

  // Otherwise, we continue with usual request...

  // If some data is provided, add to the request body
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  // Do the request
  const response = await fetch(`${BASE_URI}/${url}`, fetchOptions);

  // Unauthorised probably means expired token, so we can refresh this
  // an dtry again
  if (response.status == 401) {
    const response_json = await response.json();
    if (response_json.code === "token_not_valid") {
      await refreshToken();
      return await fetchOrRefreshToken(url, method, data);
    } else return;
  }
  // Authorised and returns data
  if (response.status === 200) {
    const response_json = await response.json();

    if (entityTypeForDb && method === "GET") {
      storeDataToIndexedDB(entityTypeForDb, response_json);
    }
    return response_json;
  }
}

async function fetchEntityViewAllData(uri: string) {
  // Get the entityType from the uri to pass to fetch/db lookup;
  // unless there is some search param at the end, in which case
  // we need to hit the server
  const entityType = !uri.split("/").slice(-1)[0].startsWith("?")
    ? uri.split("/").slice(-2, -1)[0]
    : undefined;

  const response_json = await fetchOrRefreshToken(
    uri,
    "GET",
    undefined,
    entityType
  );

  const grouped_response_data = groupByRealType(response_json);
  //console.log(grouped_response_data);
  return grouped_response_data;
}

type DataResourceArgs = {
  params: RequestParams;
  location: { search: string };
  navigate: object;
  data: object;
};

export function EntityViewAllData({ params, location }) {
  const [entity_view_data, { mutate, refetch }] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/` +
      location.search,
    fetchEntityViewAllData
  );
  return [entity_view_data, refetch];
}

async function fetchEntityData(uri_end: string) {
  //console.log("fetch_entity_data called");
  const response_json = await fetchOrRefreshToken(uri_end);

  //const response_json = await response.json();
  return response_json;
}

export function EntityData({ params }) {
  const [entity_data, { mutate, refetch }] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/${params.uid}`,
    fetchEntityData
  );
  return [entity_data, refetch];
}

export async function fetchAutoCompleteData(entity_type: string) {
  //console.log("fetch autocompletedata called", entity_type);
  const response_json = await fetchOrRefreshToken(
    `${schema[entity_type].app}/autocomplete/${entity_type}/`
  );

  //console.log(response_json);
  return response_json;
}

export async function putEntityData(
  entity: string,
  uid: string,
  submission_data: object
) {
  //console.log("postEntityData", entity, uid, submission_data);
  const resp = await fetchOrRefreshToken(
    `${schema[entity].app}/${entity}/${uid}`,
    "PUT",
    submission_data
  );
  return resp;
}

export async function postNewEntityData(
  entity_type: string,
  submission_data: object
) {
  const response_json = await fetchOrRefreshToken(
    `${schema[entity_type].app}/${entity_type}/new/`,
    "POST",
    submission_data,
    entity_type
  );

  return response_json;
}

export async function deleteEntity(
  entity_type: string,
  uid: string,
  restore: boolean = false
) {
  const uri = `${schema[entity_type].app}/${entity_type}/${uid}/${
    restore ? "?restore=true" : ""
  }`;
  console.log(uri);
  const resp = await fetchOrRefreshToken(uri, "DELETE");
  return resp;
}
