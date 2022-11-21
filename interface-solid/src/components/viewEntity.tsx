import { Component, For, Show, createEffect, Accessor } from "solid-js";
import { useParams, useRouteData, NavLink } from "@solidjs/router";

import TopBar from "./topBar";
import { getEntityDisplayName } from "../utils/entity_names";
import { schema } from "../index";

import { BsArrowReturnRight } from "solid-icons/bs";

import EntityChip from "./ui_components/entityChip";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 max-w-4xl mb-3 rounded-md h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

export const TextFieldView: Component<{ fieldName: string; value: string }> = (
  props
) => {
  return (
    <>
      <div class="col-span-2 mb-4 mt-4 select-none font-semibold uppercase">
        {props.fieldName.replaceAll("_", " ")}
      </div>
      <div class="col-span-6 mb-4 mt-4">
        {props.value && props.value.toString()}
      </div>
    </>
  );
};

const ZeroOrMoreRelationFieldView: Component<{
  override_label: string;
  fieldName: string;
  reverseRelation: boolean;
  field: { relation_to: string };
  value: { label: string; real_type: string; uid: string; relData: object }[];
}> = (props) => {
  return (
    <>
      <div class={`col-span-2 mb-4 mt-4 select-none font-semibold uppercase`}>
        {props.override_label || props.fieldName.replaceAll("_", " ")}
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
            <Show
              when={Object.keys(item.relData).length > 0}
              fallback={
                <span>
                  <EntityChip
                    label={item.label}
                    leftSlot={getEntityDisplayName(item.real_type)}
                    href={`/entity/${item.real_type}/${item.uid}/`}
                    color={props.reverseRelation ? "primary" : "primary"}
                  />
                </span>
              }
            >
              <div class="card card-compact mr-4 mb-3 inline-block rounded-md bg-base-300 p-0 shadow-sm">
                <NavLink
                  href={`/entity/${item.real_type}/${item.uid}`}
                  class="prose-md mb-0 flex max-w-4xl bg-primary p-3 text-neutral-content hover:bg-primary-focus"
                  //onMouseDown={props.onClick}
                >
                  <span class="prose-sm mr-5 font-light uppercase">
                    {getEntityDisplayName(item.real_type)}{" "}
                  </span>
                  <span class="prose-md font-semibold">{item.label}</span>
                </NavLink>
                <div class="card-body grid grid-cols-8">
                  <For each={Object.entries(item.relData)}>
                    {([relatedFieldName, relatedFieldValue]) => (
                      <>
                        <div class="prose-sm col-span-2 font-semibold uppercase">
                          {relatedFieldName}
                        </div>
                        <div />
                        <div class="prose-sm col-span-5">
                          {relatedFieldValue}
                        </div>
                      </>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          )}
        </For>
      </div>
    </>
  );
};

const ViewEntity: Component = () => {
  const params: { entity_type: string; uid: string } = useParams();
  const data = useRouteData();

  createEffect(() => console.log(data()));

  return (
    <>
      <Show when={data() && data()["status"] !== "error"}>
        <TopBar
          params={params}
          newButton={false}
          editButton={true}
          barTitle={
            <div class="prose-sm ml-3 inline-block select-none rounded-md bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
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
                    override_label={
                      schema[params.entity_type].meta.override_labels?.[
                        schema_field_name.toLowerCase()
                      ]?.[0]
                    }
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
      <Show when={data() && data()["status"] === "error"}>
        <TopBar params={params} barCenter={data()["data"]} />
      </Show>
    </>
  );
};

export default ViewEntity;
