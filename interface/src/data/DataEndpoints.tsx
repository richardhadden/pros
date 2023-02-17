import { groupBy } from "ramda";
import { createResource } from "solid-js";

import { schema } from "../index";

import dataRequest, { RequestParams } from "./dataFunctions";

const groupByRealType = groupBy(
  (item: { label: string; uid: string; real_type: string }) => item.real_type
);

// * Hereafter are the actual data routes

export async function fetchEntityViewAllData(uri: string) {
  // Get the entityType from the uri to pass to fetch/db lookup;
  // unless there is some search param at the end, in which case
  // we need to hit the server
  const entityType = !uri.split("/").slice(-1)[0].startsWith("?")
    ? uri.split("/").slice(-2, -1)[0]
    : undefined;

  const response_json = await dataRequest(uri, "GET", undefined, entityType);
  const grouped_response_data = groupByRealType(response_json);
  return grouped_response_data;
}

type DataResourceArgs = {
  params: RequestParams;
  location: { search: string };
  navigate: object;
  data: object;
};

type Params = { entity_type: string; uid: string };
type Location = { search: string };

export function EntityViewAllData({
  params,
  location,
}: {
  params: Params;
  location: Location;
}) {
  const [entity_view_data, { mutate, refetch }] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/` +
      location.search,
    fetchEntityViewAllData
  );
  return [entity_view_data, refetch];
}

export async function fetchEntityData(uri_end: string) {
  //console.log("fetch_entity_data called");
  const response_json = await dataRequest(uri_end);

  //const response_json = await response.json();
  return response_json;
}

export function EntityData({ params }: { params: Params }) {
  const [entity_data, { mutate, refetch }] = createResource(
    () =>
      `${schema[params.entity_type].app}/${params.entity_type}/${params.uid}`,
    fetchEntityData
  );
  return [entity_data, refetch];
}

export async function fetchAutoCompleteData(entity_type: string) {
  //console.log("fetch autocompletedata called", entity_type);
  const response_json = await dataRequest(
    `${schema[entity_type].app}/${entity_type}/`,
    "GET",
    undefined,
    entity_type
  );
  return response_json;
}

export async function putEntityData(
  entity: string,
  uid: string,
  submission_data: object
) {
  const resp = await dataRequest(
    `${schema[entity].app}/${entity}/${uid}`,
    "PUT",
    submission_data
  );
  return resp;
}

type SaveResponseType = Promise<
  { uid: string; label: string; saved: boolean } | undefined
>;

export async function postNewEntityData(
  entity_type: string,
  submission_data: object
): SaveResponseType {
  const response_json = await dataRequest(
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
  const resp = await dataRequest(uri, "DELETE");
  return resp;
}
