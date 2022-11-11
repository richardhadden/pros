import { Component, For, Show, createEffect, Accessor } from "solid-js";
import { useParams, useRouteData, NavLink } from "@solidjs/router";

import TopBar from "./topBar";
import { getEntityDisplayName } from "../utils/entity_names";
import { schema } from "../index";

import { BsArrowReturnRight } from "solid-icons/bs";

import EntityChip from "./ui_components/entityChip";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 max-w-4xl mb-3 rounded-md h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

const TextFieldView: Component<{ fieldName: string; value: string }> = (
  props
) => {
  return (
    <>
      <div class="col-span-2 mb-4 mt-4 select-none font-semibold uppercase">
        {props.fieldName.replaceAll("_", " ")}
      </div>
      <div class="col-span-6 mb-4 mt-4">{props.value}</div>
    </>
  );
};

const ZeroOrMoreRelationFieldView: Component<{
  fieldName: string;
  reverseRelation: "primary" | "secondary";
  field: { relation_to: string };
  value: { label: string; real_type: string; uid: string }[];
}> = (props) => {
  return (
    <>
      <div class="col-span-2 mb-4 mt-4 select-none font-semibold uppercase">
        {props.fieldName.replaceAll("_", " ")}
        <div class="mt-1 ml-1 select-none">
          <BsArrowReturnRight class="inline-block" />{" "}
          <span class="prose-sm rounded-md bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
            {props.field.relation_to}
          </span>
        </div>
      </div>
      <div class="col-span-6 mb-4 mt-4 select-none pt-2">
        <For each={props.value}>
          {(item) => (
            <EntityChip
              label={item.label}
              leftSlot={getEntityDisplayName(item.real_type)}
              href={`/entity/${item.real_type}/${item.uid}/`}
              color={props.reverseRelation ? "primary" : "primary"}
            />
          )}
        </For>
      </div>
    </>
  );
};

const ViewEntity: Component = () => {
  const params: { entity_type: string; uid: string } = useParams();
  const data = useRouteData();

  return (
    <Show when={data()}>
      <TopBar
        params={params}
        newButton={false}
        editButton={true}
        barTitle={
          <div class="prose-sm ml-3 inline-block rounded-md bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
            {getEntityDisplayName(params.entity_type)}
          </div>
        }
        barCenter={<div class={ViewedItemTopBarStyle}>{data().label}</div>}
      />

      <div class="mt-32 ml-6 grid grid-cols-8">
        <For each={Object.entries(schema[params.entity_type].fields)}>
          {([schema_field_name, field], index) => (
            <>
              {field.type === "property" && (
                <TextFieldView
                  fieldName={schema_field_name}
                  value={data()[schema_field_name]}
                />
              )}
              {field.type === "relation" && (
                <ZeroOrMoreRelationFieldView
                  fieldName={schema_field_name}
                  value={data()[schema_field_name]}
                  field={field}
                />
              )}

              <Show
                when={
                  Object.entries(schema[params.entity_type].fields).length >
                  index() + 1
                }
              >
                <div class="divider col-span-8" />
              </Show>
            </>
          )}
        </For>
        {Object.keys(schema[params.entity_type].reverse_relations).length >
          0 && <div class="col-span-8 mt-32" />}
        <For
          each={Object.entries(schema[params.entity_type].reverse_relations)}
        >
          {([schema_field_name, field], index) => (
            <Show when={data()[schema_field_name]?.length > 0}>
              <ZeroOrMoreRelationFieldView
                fieldName={schema_field_name}
                value={data()[schema_field_name]}
                field={field}
                reverseRelation={true}
              />

              <Show
                when={
                  Object.entries(schema[params.entity_type].fields).length >
                  index() + 1
                }
              ></Show>
            </Show>
          )}
        </For>
      </div>
    </Show>
  );
};

export default ViewEntity;