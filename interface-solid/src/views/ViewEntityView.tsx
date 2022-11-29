import {
  Component,
  For,
  Show,
  createEffect,
  Switch,
  Match,
  createMemo,
} from "solid-js";
import { useParams, useRouteData } from "@solidjs/router";

import UnsavedLink from "../utils/UnsavedLink";

import TopBar from "../components/TopBar";
import { getEntityDisplayName } from "../utils/entity_names";
import { schema } from "../index";

import { BsArrowReturnRight } from "solid-icons/bs";
import { CgOptions } from "solid-icons/cg";
import {
  AiFillWarning,
  AiFillDelete,
  AiFillClockCircle,
  AiFillCheckCircle,
  AiFillEdit,
  AiFillFileAdd,
  AiFillCalendar,
} from "solid-icons/ai";

import { SchemaEntity, SchemaFieldRelation } from "../types/schemaTypes";

import EntityChip from "../components/ui_components/entityChip";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 max-w-4xl mb-3 rounded-sm h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

export const TextFieldView: Component<{ fieldName: string; value: string }> = (
  props
) => {
  return (
    <>
      <div class="col-span-2 mb-4 mt-4 select-none font-semibold uppercase">
        {props.fieldName.replaceAll("_", " ")}
      </div>
      <div class="col-span-6 mb-4 mt-4">
        {props.value !== null && props.value?.toString()}
      </div>
    </>
  );
};

const ZeroOrMoreRelationFieldView: Component<{
  override_label: string;
  fieldName: string;
  reverseRelation: boolean;
  field: { relation_to: string };
  value: {
    label: string;
    real_type: string;
    uid: string;
    relData: object;
    is_deleted: boolean;
    deleted_and_has_dependent_nodes?: boolean;
  }[];
}> = (props) => {
  return (
    <>
      <div class={`col-span-2 mb-4 mt-4 select-none font-semibold uppercase`}>
        {props.override_label || props.fieldName.replaceAll("_", " ")}
        <div class="mt-1 ml-1 select-none">
          <BsArrowReturnRight class="inline-block" />{" "}
          <span class="prose-sm rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
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
                    isDeleted={item.is_deleted}
                    deletedAndHasDependentNodes={
                      item.is_deleted && item.deleted_and_has_dependent_nodes
                    }
                  />
                </span>
              }
            >
              <div class="card card-compact mr-4 mb-3 inline-block rounded-sm bg-base-300 p-0">
                <Switch>
                  <Match when={item.is_deleted}>
                    <UnsavedLink
                      href={`/entity/${item.real_type}/${item.uid}`}
                      class="prose-md mb-0 flex max-w-4xl cursor-pointer rounded-t-sm bg-gray-400 p-3 text-neutral-content hover:bg-gray-500"
                      //onMouseDown={props.onClick}
                    >
                      <span class="prose-sm mr-5 font-light uppercase">
                        {getEntityDisplayName(item.real_type)}{" "}
                      </span>
                      <span class="prose-md font-semibold">{item.label}</span>
                      <span class="ml-auto">
                        <div class="relative mr-2 flex flex-row">
                          <AiFillDelete
                            size={20}
                            class="mt-0.5 text-gray-600"
                          />
                          {item.deleted_and_has_dependent_nodes ? (
                            <AiFillClockCircle
                              size={20}
                              class="mt-0.5 ml-2 rounded-full text-warning"
                            />
                          ) : (
                            <AiFillCheckCircle
                              size={20}
                              class="mt-0.5 ml-2 text-success"
                            />
                          )}
                        </div>
                      </span>
                    </UnsavedLink>
                  </Match>
                  <Match when={true}>
                    <UnsavedLink
                      href={`/entity/${item.real_type}/${item.uid}`}
                      class="prose-md mb-0 flex max-w-4xl cursor-pointer rounded-t-sm bg-primary p-3 text-neutral-content hover:bg-primary-focus"
                      //onMouseDown={props.onClick}
                    >
                      <span class="prose-sm mr-5 font-light uppercase">
                        {getEntityDisplayName(item.real_type)}{" "}
                      </span>
                      <span class="prose-md font-semibold">{item.label}</span>
                    </UnsavedLink>
                  </Match>
                </Switch>

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

const InlineRelationView: Component = (props) => {
  return (
    <Show
      when={props.value}
      fallback={
        <>
          <div
            class={`col-span-2 mb-4 mt-4 select-none font-semibold uppercase`}
          >
            {props.fieldName.replaceAll("_", " ")}
          </div>
        </>
      }
    >
      <div class={`col-span-2 mb-4 mt-4 select-none font-semibold uppercase`}>
        {props.fieldName.replaceAll("_", " ")}
        <div class="mt-2 ml-1 select-none">
          <CgOptions class="mt-0 mr-2 inline-block" />{" "}
          <span class="prose-sm rounded-md rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
            {getEntityDisplayName(props.value.type)}
          </span>
        </div>
      </div>
      <div class="flex-none">
        <div class="mt-3 flex w-full flex-row items-stretch">
          <For each={Object.entries(schema[props.value.type].fields)}>
            {([field_name, field]) => (
              <div class="mr-12 w-40 flex-none justify-self-stretch">
                <div class="pros-sm prose w-full select-none font-semibold uppercase">
                  {field_name.replaceAll("_", " ")}
                </div>
                <div class="mt-3">{props.value[field_name]}</div>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

const buildDateString = (date_as_string) => {
  const parsedDate = new Date(date_as_string);
  const time = parsedDate.toTimeString().slice(0, 5);
  const diff = new Date() - parsedDate;
  const dd = Math.floor(diff / 1000 / 60 / 60 / 24);

  if (dd == 0) {
    return `Today  ${time}`;
  } else if (dd < 7) {
    const DAYS = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return `${DAYS[parsedDate.getDay() - 1]}`;
  } else return date_as_string.split(".")[0].replace("T", " ");
};

const ViewEntity: Component = () => {
  const params: { entity_type: string; uid: string } = useParams();
  const [data, refetchData] = useRouteData();

  const modifiedDateString = createMemo(() => {
    if (data()) {
      return buildDateString(data().modifiedWhen);
    }
  });

  const createdDateString = createMemo(() => {
    if (data()) {
      return buildDateString(data().createdWhen);
    }
  });

  return (
    <>
      <Show when={data() && data()["status"] !== "error"}>
        <TopBar
          data={data}
          params={params}
          newButton={false}
          editButton={true}
          editButtonDeactivated={data().is_deleted}
          deleteButton={true}
          barTitle={
            <div class="prose-sm ml-3 inline-block select-none rounded-sm bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
              {getEntityDisplayName(params.entity_type)}
            </div>
          }
          barCenter={
            <>
              <div class={ViewedItemTopBarStyle}>{data().label}</div>
            </>
          }
          barEnd={
            <div class="ml-6 flex select-none  flex-col items-start  rounded-sm pb-2 pt-2 pr-3 pl-3 text-xs uppercase text-white">
              <div>
                <span class="mr-3 font-semibold text-white">
                  <AiFillFileAdd class="inline-block" />
                </span>
                <span class="mr-3">{data().createdBy || "Auto"}</span>
                <AiFillCalendar class="relative bottom-0.5 mr-2 inline-block" />
                {createdDateString()}
              </div>
              <div class="mt-[7px] border-t border-gray-500 pt-[6px]">
                <span class="mr-3  font-semibold text-white">
                  <AiFillEdit class="relative inline-block" />
                </span>
                <span class="mr-3">{data().modifiedBy}</span>
                <AiFillCalendar class="relative bottom-0.5 mr-2 inline-block" />
                {modifiedDateString()}
              </div>
            </div>
          }
          refetchData={refetchData}
        />

        <div class="mt-36 ml-6 grid grid-cols-8">
          <Show when={data()["is_deleted"]}>
            <div class="col-span-1" />
            {data().deleted_and_has_dependent_nodes ? (
              <div class=" col-span-6 mb-16 flex flex-row rounded-sm bg-warning p-3 font-semibold uppercase text-warning-content shadow-lg">
                <AiFillWarning class="mt-1 mr-3" /> Deletion Pending{" "}
                <span class="ml-6 normal-case">
                  Remove as a {getEntityDisplayName(params.entity_type)}{" "}
                  referenced by the items below before trying to delete again
                </span>
              </div>
            ) : (
              <div class=" col-span-6 mb-16 flex flex-row rounded-sm bg-success p-3 font-semibold uppercase text-success-content shadow-lg">
                <AiFillWarning class="mt-1 mr-3" /> Deletion Pending{" "}
                <span class="ml-6 normal-case">
                  No more references to this{" "}
                  {getEntityDisplayName(params.entity_type)}, so it can be
                  safely deleted
                </span>
              </div>
            )}

            <div class="col-span-1" />
          </Show>
          <For each={Object.entries(schema[params.entity_type].fields)}>
            {([schema_field_name, field], index) => (
              <Show when={schema_field_name !== "is_deleted"}>
                <Switch>
                  <Match when={field.type === "property"}>
                    <TextFieldView
                      fieldName={schema_field_name}
                      value={data()[schema_field_name]}
                    />
                  </Match>
                  <Match
                    when={field.type === "relation" && !field.inline_relation}
                  >
                    <ZeroOrMoreRelationFieldView
                      override_label={
                        schema[params.entity_type].meta.override_labels?.[
                          schema_field_name.toLowerCase()
                        ]?.[0]
                      }
                      fieldName={schema_field_name}
                      value={data()[schema_field_name]}
                      field={field as SchemaFieldRelation}
                    />
                  </Match>
                  <Match
                    when={field.type === "relation" && field.inline_relation}
                  >
                    <InlineRelationView
                      fieldName={schema_field_name}
                      value={data()[schema_field_name]}
                      field={field}
                    />
                  </Match>
                </Switch>

                <Show
                  when={
                    Object.entries(schema[params.entity_type].fields).length >
                    index() + 1
                  }
                >
                  <div class="divider col-span-8" />
                </Show>
              </Show>
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
