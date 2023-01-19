import { Component, Show, createMemo } from "solid-js";
import { useParams, useRouteData } from "@solidjs/router";
import TopBar from "../components/TopBar";

import { BsArrowRight } from "solid-icons/bs";

import { getEntityDisplayName } from "../utils/entity_names";
import { createSignal } from "solid-js";
import { RowView } from "./ViewEntityView";
import { TypeGroupedRelationViewRow } from "./ViewEntityView";

import { schema } from "../index";
import EntityChip from "../components/ui_components/entityChip";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 w-full mb-3 rounded-sm h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

const MergeView: Component = (props) => {
  const params: { entity_type: string; uid: string } = useParams();
  const [data, refetchData] = useRouteData();
  const [selectedMergeItem, setSelectedMergeItem] = createSignal(null);

  const sorted_fields = createMemo(() => {
    let sorted_fields = Object.entries(schema[params.entity_type]?.fields);
    const field_orderings = schema[params.entity_type]?.meta?.order_fields;
    if (field_orderings) {
      console.log("orderfields");
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
    <Show when={data()}>
      <TopBar
        params={params}
        saveButton={true}
        barTitle={
          <>
            Merge{" "}
            <div class="prose-sm ml-3 inline-block select-none rounded-sm bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
              {getEntityDisplayName(params.entity_type)}
            </div>
          </>
        }
        barCenter={
          <span class="flex items-center">
            <div class={ViewedItemTopBarStyle}>{data().label}</div>{" "}
            <Show when={selectedMergeItem()}>
              <BsArrowRight class="ml-4" size={26} />
              <div class={ViewedItemTopBarStyle}>
                {selectedMergeItem().label}
              </div>{" "}
            </Show>
          </span>
        }
      />

      <div class="mt-36 ml-6 grid grid-cols-2">
        <div class="col-span-1 grid grid-cols-8 border-r border-red-500">
          <div class="col-span-8">
            <EntityChip label="DUDE" />
          </div>
          <RowView params={params} data={data()} fields={sorted_fields()} />
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
        </div>
      </div>
    </Show>
  );
};

export default MergeView;
