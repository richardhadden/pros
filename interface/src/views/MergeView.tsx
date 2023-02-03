import { Component, Show, createMemo } from "solid-js";
import { useParams, useRouteData } from "@solidjs/router";
import TopBar from "../components/TopBar";

import { BsArrowLeft, BsArrowRight } from "solid-icons/bs";

import { getEntityDisplayName } from "../utils/entity_names";
import { createSignal } from "solid-js";
import { RowView } from "./ViewEntityView";
import { TypeGroupedRelationViewRow } from "./ViewEntityView";

import { CgClose } from "solid-icons/cg";

import { schema } from "../index";
import EntityChip from "../components/ui_components/entityChip";
import EntitySelector from "../components/form_components/EntitySelector";
import { createEffect } from "solid-js";
import { fetchEntityData } from "../data/DataEndpoints";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 w-fit mb-3 rounded-sm h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

const MergeView: Component = (props) => {
  const params: { entity_type: string; uid: string } = useParams();
  const [data, refetchData] = useRouteData();
  const [selectedMergeItems, setSelectedMergeItems] = createSignal([]);
  const [selectedMergeItemData, setSelectedMergeItemData] = createSignal({});

  const selectedMergeItem = () => {
    if (selectedMergeItems()) {
      return selectedMergeItems()[0];
    }
  };

  createEffect(async () => {
    const smi = selectedMergeItem();
    if (smi) {
      const resp = await fetchEntityData(
        `${schema[smi.real_type].app}/${smi.real_type}/${smi.uid}`
      );
      setSelectedMergeItemData(resp);
    } else {
      setSelectedMergeItemData({});
    }
  });

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
              <BsArrowLeft class="ml-4" size={26} />
              <div class={ViewedItemTopBarStyle}>
                {selectedMergeItem().label}
              </div>{" "}
            </Show>
          </span>
        }
      />

      <div class="mt-36 ml-6 grid grid-cols-2">
        {/* LEFT COLUMN */}
        <div class="col-span-1 grid grid-cols-8 gap-2">
          <div class="col-span-8 mb-12 flex justify-center">
            <EntityChip
              label={data().label}
              leftSlot={getEntityDisplayName(params.entity_type)}
            />
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

        {/* RIGHT COLUMN */}
        <div class="col-span-1 ml-4 grid grid-cols-8 gap-2">
          <Show
            when={selectedMergeItem() && selectedMergeItemData()}
            fallback={
              <div class="col-span-8 mb-12 flex justify-center">
                <EntitySelector
                  relation_to={params.entity_type}
                  onChange={setSelectedMergeItems}
                  value={selectedMergeItems()}
                  cardinalityReached={selectedMergeItems().length >= 1}
                  placeholder="Select person to merge"
                  exclude={[
                    params.uid,
                    ...data().merged_items.map((i) => i.uid),
                  ]}
                />
              </div>
            }
          >
            <div class="col-span-8 mb-12 flex justify-center">
              <EntityChip
                isDeleted={selectedMergeItem().is_deleted}
                deletedAndHasDependentNodes={
                  selectedMergeItem().deleted_and_has_dependent_nodes
                }
                label={selectedMergeItem().label}
                leftSlot={
                  <>
                    <a
                      onClick={() => {}}
                      class="btn-primary btn-xs btn-circle btn mr-3 border-primary-content"
                    >
                      <CgClose />
                    </a>{" "}
                    {getEntityDisplayName(selectedMergeItem().real_type)}
                  </>
                }
              />
            </div>
            <RowView
              params={{
                uid: selectedMergeItem().uid,
                entity_type: selectedMergeItem().real_type,
              }}
              data={selectedMergeItemData()}
              fields={sorted_fields()}
            />
            <For
              each={Object.entries(
                schema[selectedMergeItem().real_type].reverse_relations
              )}
            >
              {([schema_field_name, field], index) => (
                <Show
                  when={selectedMergeItemData()[schema_field_name]?.length > 0}
                >
                  <TypeGroupedRelationViewRow
                    override_label={
                      schema[selectedMergeItemData().real_type].meta
                        .override_labels?.[schema_field_name.toLowerCase()]?.[1]
                    }
                    fieldName={schema_field_name}
                    value={selectedMergeItemData()[schema_field_name]}
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
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default MergeView;
