import Cookies from "js-cookie";

import {
  refreshToken
} from "../components/Login";

import { BASE_URI, dbReady } from "../index";
import { db, dbRequests, setDbRequests } from "./db";

import { schema } from "../index";

export type ViewEntityTypeData = {
  real_type: string;
  uid: string;
  label: string;
  is_deleted: boolean;
  deleted_and_has_dependent_nodes: boolean;
  merged_items: Array<ViewEntityTypeData>;
  is_merged_item: boolean;
};

export type RequestParams = {
  entity_type: string;
  uid: string;
};


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
    is_deleted: item.is_deleted,
    deleted_and_has_dependent_nodes: item.deleted_and_has_dependent_nodes,
    merged_items: item.merged_items ?? [],
    is_merged_item: item.is_merged_item ?? false,
  }));
  // @ts-ignore
  db[entityType].bulkPut(dataToStore);
  const timestamp = new Date();
  setDbRequests(entityType, timestamp.toISOString());

}

async function updateDataInIndexedDB(
  entityType: string,
  data: ViewEntityTypeData[]
) {
  db.open();
  const dataToStore = data.map((item) => ({
    id: item.uid,
    uid: item.uid,
    label: item.label,
    real_type: item.real_type,
    is_deleted: item.is_deleted,
    deleted_and_has_dependent_nodes: item.deleted_and_has_dependent_nodes,
    merged_items: item.merged_items ?? [],
    is_merged_item: item.is_merged_item ?? false,
  }));
  for (let item of dataToStore) {
    // @ts-ignore
    const itemInDB = await db[entityType].get(item.id);
    if (itemInDB) {
      console.log("Patching in IndexedDB", item);
      // @ts-ignore
      await db[entityType].update(item.id, item);
    } else {
      console.log("Adding to IndexedDB", item);
      // @ts-ignore
      await db[entityType].add(item, item.id);
    }
  }
}

async function deleteDataFromIndexedDB(entityType: string, items: ViewEntityTypeData[]) {
  db.open();

  for (let item of items) {
    // @ts-ignore
    await db[entityType].delete(item.uid);
  }
}

async function getDataAndPatchIndexedDB(uri: string, entityType: string): Promise<void> {
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
    await updateDataInIndexedDB(entityType, response_json.created_modified);
    await deleteDataFromIndexedDB(entityType, response_json.deleted);
    const timestamp = new Date();
    setDbRequests(entityType, timestamp.toISOString());
    return;
  }
}

async function dataRequest(
  url: string,
  method: string = "GET",
  data: object | undefined = undefined,
  entityTypeForDb: string | undefined = undefined
): Promise<unknown | undefined> {
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
  if (entityTypeForDb && schema[entityTypeForDb]?.meta?.use_list_cache !== false && method === "GET" && dbRequests[entityTypeForDb]) {
    // Do a request to server for updated data... get, and index...
    await getDataAndPatchIndexedDB(url, entityTypeForDb);
    await dbReady;
    // @ts-ignore
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
  if (response.status === 401) {
    const response_json = await response.json();
    if (response_json.code === "token_not_valid") {
      
      const refreshStatus = await refreshToken();
      if (refreshStatus === "FAIL") {
        return;
      }
      return await dataRequest(url, method, data);
    } else return;
  }
  // Authorised and returns data
  if (response.status === 200) {
    const response_json = await response.json();
    if (entityTypeForDb && method === "GET" && schema[entityTypeForDb]?.meta?.use_list_cache !== false) {
      storeDataToIndexedDB(entityTypeForDb, response_json);
    }
    return response_json;
  }
}

export default dataRequest;