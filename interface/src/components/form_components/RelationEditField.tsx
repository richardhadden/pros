import {
  Component,
  createEffect,
  createSignal,
  For,
  Show,
  Setter,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import EntityChip from "../ui_components/entityChip";
import { BsPlus } from "solid-icons/bs";
import { CgClose } from "solid-icons/cg";

import { getEntityDisplayName } from "../../utils/entity_names";
import {
  fetchAutoCompleteData,
  postNewEntityData,
} from "../../data/DataEndpoints";

import {
  AiFillDelete,
  AiFillClockCircle,
  AiFillCheckCircle,
} from "solid-icons/ai";
import { BiRegularImport } from "solid-icons/bi";

import EmbeddedNewEntity from "./EmbeddedNewEntity";
import TypedInputRow from "./TypedInputRow";

import EntitySelector from "./EntitySelector";

import { schema } from "../../index";
import ImportNewEntity from "./ImportNewEntity";

import { createImports } from "../../../../pros_import/interface/data";

import { CUSTOM_AUTOCOMPLETE_MODALS } from "../../../interface-config";

type RelationFieldType = {
  uid: string;
  label: string;
  real_type: string;
  relData: object;
};

const RelationEditField: Component<{
  override_labels: object;
  field: {
    relation_to: string;
    cardinality: "ZeroOrOne" | "One" | "OneOrMore" | "ZeroOrMore";
  };
  relatedToType: string;
  relationFields: object;
  value: any;
  onChange: Setter<RelationFieldType[]>;
  data: RelationFieldType;
  reverseRelation: string;
  errors: object;
}> = (props) => {
  const [cardinalityReached, setCardinalityReached] = createSignal(false);

  const [showAddNewEntityModal, setShowAddNewEntityModal] = createSignal(false);
  const [showImportEntityModal, setShowImportEntityModal] = createSignal(false);
  createEffect(() => {
    if (
      (props.field.cardinality === "One" ||
        props.field.cardinality === "ZeroOrOne") &&
      props.value.length >= 1
    ) {
      setCardinalityReached(true);
    } else {
      setCardinalityReached(false);
    }
  });

  const handleModifyRelationField = (
    item: RelationFieldType,
    relationfieldName: string,
    value: any
  ) => {
    const updatedItem = item;
    if (!updatedItem.relData) {
      updatedItem.relData = {};
    }
    updatedItem.relData[relationfieldName] = value;
    //console.log("updated item", updatedItem);
    props.onChange(
      props.value.map((i: RelationFieldType) =>
        item["uid"] !== i["uid"] ? i : updatedItem
      )
    );
  };

  const handleRemoveSelection = (uid: string) => {
    props.onChange(
      props.value.filter((item: RelationFieldType) => item.uid !== uid)
    );
  };

  const [embeddedData, setEmbeddedData] = createSignal({});
  const [embeddedType, setEmbeddedType] = createSignal(props.relatedToType);

  const [selectedEntitiesToImport, setSelectedEntitiesToImport] = createSignal<
    Array<string>
  >([]);

  const handleAddSelection = (item: RelationFieldType) => {
    //setAutoCompleteTextInput("");
    props.onChange([...props.value, item]);
  };
  const saveAddedEntity = async () => {
    const response = await postNewEntityData(embeddedType(), embeddedData());
    if (response.saved) {
      handleAddSelection({
        uid: response.uid,
        label: response.label,
        real_type: embeddedType(),
        relData: {},
      });
      setShowAddNewEntityModal(false);
      setEmbeddedData({});
      setEmbeddedType(props.relatedToType);
    }
  };

  const importAndAddEntities = async (selected_endpoint: string) => {
    const response = await createImports(
      props.relatedToType,
      selected_endpoint,
      selectedEntitiesToImport()
    );
    props.onChange([...props.value, ...response]);

    setShowImportEntityModal(false);
    setSelectedEntitiesToImport([]);
  };

  return (
    <>
      {Object.keys(props.relationFields).length > 0 ? (
        <For each={props.value || []}>
          {(item: RelationFieldType) => (
            <div class="card card-compact mr-4 mb-3 inline-block w-96 rounded-sm bg-base-300 p-0 shadow-sm">
              <div
                class="prose-md mb-0 flex flex-row  rounded-t-sm p-3 text-neutral-content"
                classList={{
                  ["bg-primary"]: !item.is_deleted,
                  ["bg-gray-400"]: item.is_deleted,
                  ["hover:bg-primary-focus"]: !item.is_deleted,
                  ["hover:bg-gray-500"]: item.is_deleted,
                }}
              >
                <span class="prose-sm mr-5 select-none font-light uppercase">
                  <a
                    onClick={() => handleRemoveSelection(item.uid)}
                    class="btn-primary btn-xs btn-circle btn mr-3 border-primary-content"
                  >
                    <CgClose />
                  </a>{" "}
                  {getEntityDisplayName(item.real_type)}{" "}
                </span>
                <span class="prose-md select-none font-semibold">
                  {item.label}
                </span>
                <Show when={item.is_deleted}>
                  <span class="ml-auto select-none">
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
                </Show>
              </div>
              <div class="card-body grid grid-cols-7">
                <For each={Object.entries(props.relationFields)}>
                  {([relationFieldName, relationField]) => (
                    <TypedInputRow
                      helpText={relationField.help_text}
                      propertyType={relationField.property_type}
                      fieldName={relationFieldName}
                      value={
                        item.relData && item.relData[relationFieldName] !== null
                          ? item.relData[relationFieldName]
                          : relationField.default_value || ""
                      }
                      setValue={(value) =>
                        handleModifyRelationField(
                          item,
                          relationFieldName,
                          value
                        )
                      }
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      ) : (
        <For each={props.value || []}>
          {(item: RelationFieldType) => (
            <EntityChip
              isDeleted={item.is_deleted}
              deletedAndHasDependentNodes={item.deleted_and_has_dependent_nodes}
              label={item.label}
              leftSlot={
                <>
                  <a
                    onClick={() => handleRemoveSelection(item.uid)}
                    class="btn-primary btn-xs btn-circle btn mr-3 border-primary-content"
                  >
                    <CgClose />
                  </a>{" "}
                  {getEntityDisplayName(item.real_type)}
                </>
              }
              color={props.reverseRelation ? "primary" : "primary"}
            />
          )}
        </For>
      )}
      <EntitySelector
        errors={props.errors}
        cardinalityReached={cardinalityReached()}
        relation_to={props.field.relation_to}
        onChange={props.onChange}
        value={props.value}
        after={
          <>
            <span
              onClick={() => setShowAddNewEntityModal(true)}
              class="btn-base btn-square btn-sm btn relative top-6 ml-12"
            >
              <BsPlus />
            </span>
            {/*<Show when={schema[props.relatedToType].meta?.importable === true}>
              <span
                onClick={() => setShowImportEntityModal(true)}
                class="btn-base btn-square btn-sm btn relative top-6 ml-2"
              >
                <BiRegularImport />
              </span>
        </Show>*/}
            <For each={CUSTOM_AUTOCOMPLETE_MODALS}>
              {(component) => (
                <Dynamic
                  component={component}
                  entityType={props.relatedToType}
                  selectedList={props.value}
                  changeSelectedList={props.onChange}
                />
              )}
            </For>
          </>
        }
      />
      <Show when={showImportEntityModal()}>
        <div class="modal modal-open pr-96 pl-96">
          <div class="modal-box min-w-full pt-0 pl-0 pr-0 transition-all">
            <ImportNewEntity
              initialType={props.relatedToType}
              entityType={embeddedType}
              setEntityType={setEmbeddedType}
              selectedEntitiesToImport={selectedEntitiesToImport()}
              setSelectedEntitiesToImport={setSelectedEntitiesToImport}
              onClickImport={importAndAddEntities}
              cardinality={props.field.cardinality}
            />
            <div class="modal-action mr-5">
              <span
                onClick={() => saveAddedEntity()}
                class="btn-warning btn-sm btn"
              >
                Add
              </span>
              <span
                onClick={() => setShowImportEntityModal(false)}
                class="btn-success btn-sm btn"
              >
                Cancel
              </span>
            </div>
          </div>
        </div>
      </Show>
      <Show when={showAddNewEntityModal()}>
        <div class="modal modal-open pr-96 pl-96">
          <div class="modal-box min-w-full pt-0 pl-0 pr-0 transition-all">
            <EmbeddedNewEntity
              initialType={props.relatedToType}
              entityType={embeddedType}
              setEntityType={setEmbeddedType}
              data={embeddedData}
              setData={setEmbeddedData}
            />
            <div class="modal-action mr-5">
              <span
                onClick={() => saveAddedEntity()}
                class="btn-warning btn-sm btn"
              >
                Add
              </span>
              <span
                onClick={() => setShowAddNewEntityModal(false)}
                class="btn-success btn-sm btn"
              >
                Cancel
              </span>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default RelationEditField;
