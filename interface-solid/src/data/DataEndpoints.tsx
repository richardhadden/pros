import { groupBy } from "ramda";
import Cookies from "js-cookie";
import { createResource } from "solid-js";

import Login, {
  userStatus,
  alreadyLoggedIn,
  setUserStatus,
  refreshToken,
} from "../components/Login";

import { schema, BASE_URI, SERVER } from "../index";

export type ViewEntityTypeData = {
  real_type: string;
  uid: string;
  label: string;
}[];

export type RequestParams = {
  entity_type: string;
  uid: string;
};

const groupByRealType = groupBy(
  (item: { label: string; uid: string; real_type: string }) => item.real_type
);

async function fetchOrRefreshToken(
  url: string,
  method: string = "GET",
  data: object | undefined = undefined
): Promise<object | undefined> {
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

  if (response.status == 401) {
    const response_json = await response.json();
    if (response_json.code === "token_not_valid") {
      await refreshToken();
      return await fetchOrRefreshToken(url, method, data);
    }
  }
  // Authorised and returns data
  if (response.status === 200) {
    const response_json = await response.json();
    return response_json;
  }
  // Unauthorised
}

async function fetchEntityViewAllData(uri: string) {
  const response_json = await fetchOrRefreshToken(uri);

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
    submission_data
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
