import { CUSTOM_VIEW_PAGES } from "../../interface-config.js";

import { useParams, useRouteData } from "@solidjs/router";
import {
  Component,
  createEffect,
  createMemo,
  For,
  Match,
  Show,
  Switch,
  Suspense,
} from "solid-js";
import { all, F, groupBy } from "ramda";
import UnsavedLink from "../utils/UnsavedLink";

import TopBar from "../components/TopBar";
import { schema } from "../index";
import { getEntityDisplayName } from "../utils/entity_names";

import { format, formatDistance, formatRelative, subDays } from "date-fns";
import { BsLink } from "solid-icons/bs";
import { utcToZonedTime } from "date-fns-tz";

import {
  AiFillCalendar,
  AiFillCheckCircle,
  AiFillClockCircle,
  AiFillDelete,
  AiFillEdit,
  AiFillFileAdd,
  AiFillWarning,
} from "solid-icons/ai";
import {
  BsArrowReturnRight,
  BsArrowRight,
  BsClock,
  BsClockFill,
} from "solid-icons/bs";
import { CgOptions } from "solid-icons/cg";

import { SchemaFieldRelation } from "../types/schemaTypes";

import EntityChip from "../components/ui_components/entityChip";

import { sortBy } from "ramda";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 w-full mb-3 rounded-sm h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

export const TextFieldView: Component<{ fieldName: string; value: string }> = (
  props
) => {
  return (
    <>
      <div class="col-span-2 mb-4 mt-4 select-none font-semibold uppercase">
        {props.fieldName.replaceAll("_", " ")}
      </div>
      <div class="col-span-6 mb-4 mt-4">
        <Show
          when={props.fieldName === "label"}
          fallback={props.value !== null && props.value?.toString()}
        >
          {props.value}
        </Show>
        {}
      </div>
    </>
  );
};

export const RelationViewField: Component<{
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
  const getRelData = (item) => {
    return Object.entries(item.relData).filter(
      ([fname, f]) => fname !== "reverse_name"
    );
  };

  return (
    <For each={props.value}>
      {(item) => (
        <Show
          when={item.relData && Object.keys(item.relData).length > 0}
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
          <div class="card card-compact z-10 mr-4 mb-3 inline-block rounded-sm bg-base-300 p-0">
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
                      <AiFillDelete size={20} class="mt-0.5 text-gray-600" />
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

            <Show when={getRelData(item).length > 0}>
              <div class="card-body grid grid-cols-8">
                <For each={getRelData(item)}>
                  {([relatedFieldName, relatedFieldValue]) => (
                    <>
                      <div class="prose-sm col-span-2 font-semibold uppercase">
                        {relatedFieldName}
                      </div>
                      <div />
                      <div class="prose-sm col-span-5">{relatedFieldValue}</div>
                    </>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
      )}
    </For>
  );
};

export const RelationViewRow: Component<{
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
        <RelationViewField
          value={props.value}
          fieldName={props.fieldName}
          reverseRelation={props.reverseRelation}
          field={props.field}
        />
      </div>
    </>
  );
};

const groupByEntityType = groupBy((item) => item.real_type);

export const TypeGroupedRelationViewRow: Component<{
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
  const itemGroups = createMemo(() => groupByEntityType(props.value));
  //createEffect(() => console.log(itemGroups()));
  return (
    <>
      <For each={Object.entries(itemGroups())}>
        {([relatedType, items], index) => (
          <>
            <div
              class={`col-span-2 mb-4 mt-4 select-none pt-2 font-semibold uppercase`}
            >
              <Show when={index() === 0}>
                {props.override_label?.replaceAll("_", " ") ||
                  props.fieldName.replaceAll("_", " ")}
              </Show>

              <div
                class={`${index() === 0 ? "mt-1" : "mt-5"} ml-1 select-none`}
              >
                <BsArrowReturnRight class="inline-block" />{" "}
                <span class="prose-sm rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
                  {getEntityDisplayName(relatedType)}
                </span>
              </div>
            </div>
            <div class="col-span-6 mb-4 mt-4 select-none pt-2">
              <RelationViewField
                value={items}
                fieldName={props.fieldName}
                reverseRelation={props.reverseRelation}
                field={props.field}
                override_label={props.override_label}
              />
            </div>
          </>
        )}
      </For>
    </>
  );
};

const groupByType = groupBy(([field_name, field]) => field.type);

const InlineRelationView: Component = (props) => {
  const grouped_fields = () => {
    const groups = groupByType(Object.entries(schema[props.value.type].fields));

    return groups;
  };

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
          <span class="prose-sm rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
            {getEntityDisplayName(props.value.type)}
          </span>
        </div>
      </div>

      <div class="col-span-5 mt-3 mb-2 grid grid-cols-8 rounded-sm ">
        <For each={grouped_fields().property}>
          {([field_name, field], index) => (
            <Show
              when={
                !schema[props.value.type].meta?.internal_fields?.includes(
                  field_name
                )
              }
            >
              <div class="col-span-2">
                <div class="prose prose-sm select-none font-semibold uppercase">
                  {field_name.replaceAll("_", " ")}
                </div>
                <div class=" mt-3">{props.value[field_name]}</div>
              </div>
            </Show>
          )}
        </For>
        <Show when={grouped_fields().relation && grouped_fields().property}>
          <div class="divider col-span-8 mt-8 mb-8" />
        </Show>
        <div class="col-span-8 ">
          <For each={grouped_fields().relation}>
            {([field_name, field], index) => (
              <Show
                when={
                  !schema[props.value.type].meta?.internal_fields?.includes(
                    field_name
                  )
                }
              >
                <div class="prose prose-sm mb-4 flex select-none font-semibold uppercase">
                  <span class="mt-0.5">
                    {props.override_label || field_name.replaceAll("_", " ")}
                  </span>
                  <BsArrowRight class="mt-2 ml-2 mr-2" />
                  <span class="mt-0.5 rounded-sm bg-neutral pt-[5px] pb-1 pl-2 pr-2 text-xs text-neutral-content">
                    {field.relation_to}
                  </span>
                </div>

                <div class="mb-4">
                  <RelationViewField
                    value={props.value[field_name]}
                    field={field}
                    fieldName={field_name}
                  />
                </div>
                <Show when={index() < grouped_fields().relation.length - 1}>
                  <div class="divider col-span-8 mt-8 mb-8" />
                </Show>
              </Show>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

const buildDateString = (date_as_string) => {
  try {
    //console.log(date_as_string);
    const parsedDate = new Date(date_as_string);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZoneDate = utcToZonedTime(new Date(parsedDate.toUTCString()), tz);
    const time = parsedDate.toTimeString().slice(0, 5);

    return formatDistance(timeZoneDate, new Date(), {
      addSuffix: true,
    });
  } catch {
    return "No date";
  }
};

const RowView: Component<{
  fields: Array;
  data: object;
  params: { entity_type: string; uid: string };
}> = (props) => {
  return (
    <For each={props.fields}>
      {([schema_field_name, field], index) => (
        <Show
          when={
            schema_field_name !== "is_deleted" && schema_field_name !== "merged"
          }
        >
          <Switch>
            <Match when={field.type === "property"}>
              <TextFieldView
                fieldName={schema_field_name}
                value={props.data[schema_field_name]}
              />
            </Match>
            <Match when={field.type === "relation" && !field.inline_relation}>
              <RelationViewRow
                override_label={schema[
                  props.params.entity_type
                ].meta.override_labels?.[
                  schema_field_name.toLowerCase()
                ]?.[0].replaceAll("_", " ")}
                fieldName={schema_field_name}
                value={props.data[schema_field_name]}
                field={field as SchemaFieldRelation}
              />
            </Match>
            <Match when={field.type === "relation" && field.inline_relation}>
              <InlineRelationView
                fieldName={schema_field_name}
                value={props.data[schema_field_name]}
                field={field}
              />
            </Match>
          </Switch>

          <Show
            when={
              Object.entries(schema[props.params.entity_type].fields).length >
              index() + 1
            }
          >
            <div class="divider col-span-8" />
          </Show>
        </Show>
      )}
    </For>
  );
};

const ViewMergedEntity: Component<{
  fields: Array<[string, { type: "property" | "relation" }]>;
  data: object;
  params: { entity_type: string; uid: string };
}> = (props) => {
  const col_width = () => {
    return Math.floor(10 / (props.data.merged_items?.length + 1));
  };

  const reverseRelationGroupTypes = createMemo(() => {
    const all_items_data = [props.data, ...props.data.merged_items];
    //console.log(all_items_data);
    const reverse_relations = Object.keys(
      schema[props.params.entity_type].reverse_relations
    );
    const subtypes_by_rr_type = {};

    for (let rr of reverse_relations) {
      subtypes_by_rr_type[rr] = [];
      for (let item of all_items_data) {
        if (rr in item) {
          for (let rel_item of item[rr]) {
            subtypes_by_rr_type[rr].push(rel_item.real_type);
          }
        }
      }
    }
    return subtypes_by_rr_type;
  });

  const getTypedGroupFieldData = (entity, rr) => {
    if (rr in entity) {
      //console.log(">>", groupByEntityType(entity[rr]));
      return groupByEntityType(entity[rr]);
    }
    return {};
  };

  return (
    <div class="grid grid-cols-12 gap-2">
      <For each={props.fields}>
        {([schema_field_name, field], index) => {
          return (
            <Show
              when={
                schema_field_name !== "is_deleted" &&
                schema_field_name !== "merged"
              }
            >
              <Switch>
                <Match when={field.type === "property"}>
                  <div class="col-span-2 mb-4 mt-4 select-none font-semibold uppercase">
                    {schema_field_name.replaceAll("_", " ")}
                  </div>
                </Match>
                <Match when={field.type === "relation"}>
                  <div
                    class={`col-span-2 mb-4 mt-4 select-none font-semibold uppercase`}
                  >
                    {schema_field_name.replaceAll("_", " ")}
                    <div class="mt-1 ml-1 select-none">
                      <BsArrowReturnRight class="inline-block" />{" "}
                      <span class="prose-sm rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
                        {field.relation_to}
                      </span>
                    </div>
                  </div>
                </Match>
              </Switch>
              <Switch>
                <Match when={field.type === "property"}>
                  <div class={`col-span-${col_width()} mt-3`}>
                    <Show
                      when={schema_field_name === "label"}
                      fallback={" " !== null && props.value?.toString()}
                    >
                      {props.data[schema_field_name]}
                    </Show>
                  </div>
                  <For each={props.data.merged_items}>
                    {(item) => (
                      <div class={`col-span-${col_width()} mt-3`}>
                        {item[schema_field_name]}
                      </div>
                    )}
                  </For>
                  <div class="col-span-12" />
                  <For each={Object.entries(reverseRelationGroupTypes())}>
                    {([field_name, related_object_types], index) => (
                      <>
                        <Show when={related_object_types.length > 0}>
                          <For each={related_object_types}>
                            {(related_object_type, index) => (
                              <>
                                <Show
                                  when={index() === 0}
                                  fallback={
                                    <div class="col-span-2">
                                      <div
                                        class={`${
                                          index() === 0 ? "mt-1" : "mt-5"
                                        } ml-1 select-none font-semibold uppercase`}
                                      >
                                        <BsArrowReturnRight class="inline-block" />{" "}
                                        <span class="prose-sm rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
                                          {getEntityDisplayName(
                                            related_object_type
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  }
                                >
                                  <div class="col-span-2 font-semibold uppercase">
                                    {field_name.replaceAll("_", " ")}
                                    <div
                                      class={`${
                                        index() === 0 ? "mt-1" : "mt-5"
                                      } ml-1 select-none `}
                                    >
                                      <BsArrowReturnRight class="inline-block" />{" "}
                                      <span class="prose-sm rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
                                        {getEntityDisplayName(
                                          related_object_type
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </Show>

                                <div class={`col-span-${col_width()}`}>
                                  <RelationViewField
                                    value={
                                      getTypedGroupFieldData(
                                        props.data,
                                        field_name
                                      )[related_object_type]
                                    }
                                  />
                                </div>
                                <For each={props.data.merged_items}>
                                  {(item) => (
                                    <div class={`col-span-${col_width()}`}>
                                      <RelationViewField
                                        value={
                                          getTypedGroupFieldData(
                                            item,
                                            field_name
                                          )[related_object_type]
                                        }
                                      />
                                    </div>
                                  )}
                                </For>
                                <div class="col-span-12"></div>
                              </>
                            )}
                          </For>
                        </Show>
                      </>
                    )}
                  </For>
                </Match>
              </Switch>
            </Show>
          );
        }}
      </For>
    </div>
  );
};

const EntityView: Component = (props) => {
  const data = props.data;
  const params = props.params;
  const refetchData = props.refetchData;

  const sorted_fields = createMemo(() => {
    let sorted_fields = Object.entries(schema[params.entity_type]?.fields);
    const field_orderings = schema[params.entity_type]?.meta?.order_fields;
    if (field_orderings) {
      //console.log("orderfields");
      sorted_fields = sortBy(([field_name, field]) => {
        if (field_name === "label") {
          return -1;
        }
        const o = field_orderings.indexOf(field_name);
        if (o === -1) {
          return 1000;
        }
        return o;
      }, sorted_fields);
    }
    return sorted_fields;
  });

  return (
    <Switch>
      <Match when={data().is_merged_item}>
        <div class="col-span-8">
          <ViewMergedEntity
            data={data()}
            fields={sorted_fields()}
            params={params}
          />
        </div>
      </Match>
      <Match when={true}>
        <RowView data={data()} fields={sorted_fields()} params={params} />

        {Object.keys(schema[params.entity_type].reverse_relations).length >
          0 && <div class="col-span-8 mt-32" />}
        <For
          each={Object.entries(schema[params.entity_type].reverse_relations)}
        >
          {([schema_field_name, field], index) => (
            <Show when={data()[schema_field_name]?.length > 0}>
              <TypeGroupedRelationViewRow
                override_label={
                  schema[params.entity_type].meta.override_labels?.[
                    schema_field_name.toLowerCase()
                  ]?.[1]
                }
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
      </Match>
    </Switch>
  );
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

  const anyRelatedItemsDeleted = () => {
    if (data() && params) {
      const any = Object.entries(schema[params.entity_type].fields)
        .filter(
          ([field_name, field]) =>
            field.type === "relation" && !field.inline_relation
        )
        .map(([field_name, field]) =>
          data() ? data()[field_name]?.some((item) => item.is_deleted) : false
        )
        .some((has_deleted) => has_deleted);
      //console.log("any deleted", any);
      return any;
    }
    //console.log("any deleted fails");
    return false;
  };

  return (
    <>
      <Show when={data() && data()["status"] !== "error"}>
        <Suspense>
          <Switch>
            <Match when={CUSTOM_VIEW_PAGES[params.entity_type]}>CUSTOM!!</Match>
            <Match when={true}>
              <TopBar
                data={data}
                params={params}
                newButton={false}
                editButton={true}
                editButtonDeactivated={data().is_deleted}
                deleteButton={true}
                mergeButton={schema[params.entity_type]?.meta?.mergeable}
                barTitle={
                  <div class="prose-sm ml-3 inline-block select-none rounded-sm bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
                    {getEntityDisplayName(params.entity_type)}
                  </div>
                }
                barCenter={
                  <div class="flex flex-row items-center justify-center">
                    <div class="prose-md relative top-1.5 mb-3 h-12 w-fit rounded-sm border-gray-600 bg-primary p-3 pl-6 pr-6 font-semibold text-neutral-content shadow-xl">
                      {data().label}
                    </div>
                    <Show when={data().is_merged_item}>
                      <div class="ml-1 mr-1 flex flex-col justify-center text-neutral-content">
                        <BsLink />
                      </div>
                      <For each={data().merged_items}>
                        {(mergedItem, index) => (
                          <>
                            <UnsavedLink
                              href={`/entity/${params.entity_type}/${mergedItem.uid}`}
                              class={` flex h-fit w-fit cursor-pointer flex-row rounded-sm pb-2 pt-2 pl-4 pr-2 text-neutral-content  ${
                                mergedItem.is_deleted
                                  ? "bg-gray-400 hover:bg-gray-500"
                                  : "bg-primary hover:bg-primary-focus"
                              }`}
                            >
                              <div class="relative">
                                <div class="mr-2 inline-block text-xs font-semibold">
                                  {mergedItem.label}
                                </div>
                              </div>
                              <div class="right-0 ml-auto justify-self-end">
                                {mergedItem.is_deleted && (
                                  <div class="relative mr-2 flex flex-row">
                                    <AiFillDelete
                                      size={14}
                                      class="mt-[6px]  text-gray-600"
                                    />
                                    {mergedItem.deleted_and_has_dependent_nodes ? (
                                      <AiFillClockCircle
                                        size={14}
                                        class="mt-[6px] ml-1 rounded-full text-warning"
                                      />
                                    ) : (
                                      <AiFillCheckCircle
                                        size={14}
                                        class="mt-[6px] ml-1 text-success"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </UnsavedLink>
                            <Show
                              when={index() < data().merged_items.length - 1}
                            >
                              <div class="ml-1 mr-1 flex flex-col justify-center text-neutral-content">
                                <BsLink />
                              </div>
                            </Show>
                          </>
                        )}
                      </For>
                    </Show>
                  </div>
                }
                barEnd={
                  <div class="ml-6 flex select-none  flex-col items-start  rounded-sm pb-2 pt-2 pr-3 pl-3 text-xs uppercase text-white">
                    <div>
                      <span class="mr-3 font-semibold text-white">
                        <AiFillFileAdd
                          class="relative bottom-[1.5px] inline-block"
                          size={14}
                        />
                      </span>
                      <span class="mr-3">{data().createdBy || "Auto"}</span>
                      <BsClockFill class="relative bottom-[1.5px] mr-2 inline-block" />
                      {createdDateString()}
                    </div>
                    <div class="mt-[7px] border-t border-gray-500 pt-[6px]">
                      <span class="mr-3  font-semibold text-white">
                        <AiFillEdit
                          class="relative bottom-[1.5px] inline-block"
                          size={14}
                        />
                      </span>
                      <span class="mr-3">{data().modifiedBy}</span>
                      <BsClockFill class="relative bottom-[1.5px] mr-2 inline-block" />
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
                        referenced by the items below before trying to delete
                        again
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

                <Show when={data() && anyRelatedItemsDeleted()}>
                  <div class="col-span-1" />
                  <div class=" col-span-6 mb-16 flex flex-row rounded-sm bg-warning p-3 font-semibold uppercase text-warning-content shadow-lg">
                    <AiFillWarning class="mt-1 mr-3" /> References a deleted
                    entity{" "}
                    <span class="ml-6 normal-case">
                      This {getEntityDisplayName(params.entity_type)} references
                      an entity that has been marked for deletion
                    </span>
                  </div>
                  <div class="col-span-1" />
                </Show>

                <EntityView
                  data={data}
                  params={params}
                  refetchData={refetchData}
                />
              </div>
            </Match>
          </Switch>
        </Suspense>
      </Show>

      <Show when={data() && data()["status"] === "error"}>
        <TopBar params={params} barCenter={data()["data"]} />
      </Show>
    </>
  );
};

export default ViewEntity;
export { RowView, EntityView };
