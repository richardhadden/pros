import {
  Component,
  createEffect,
  createSignal,
  For,
  Show,
  onMount,
  Setter,
  Accessor,
} from "solid-js";
import { schema } from "../index";
import EntityChip from "./ui_components/entityChip";
import { BsArrowReturnRight, BsPlus } from "solid-icons/bs";
import { CgClose } from "solid-icons/cg";
import { getEntityDisplayName } from "../utils/entity_names";
import { fetchAutoCompleteData } from "../App";
import { postNewEntityData } from "../App";

const TextEditField: Component<{
  fieldName: string;
  value: string;
  onInput: (e: InputEvent) => void;
}> = (props) => {
  return (
    <>
      <div class="col-span-2 mb-4 mt-8 select-none font-semibold uppercase">
        {props.fieldName.replaceAll("_", " ")}
      </div>
      <div class="col-span-5 mb-4 mt-4 w-full">
        <input
          type="text"
          class="w-full rounded-t-md border-b-2 border-t-2 border-l-2 border-r-2 border-primary border-t-transparent border-l-transparent border-r-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
          value={props.value || ""}
          onInput={props.onInput}
        />
      </div>
      <div class="col-span-1" />
    </>
  );
};

const EmbeddedNewEntity: Component<{
  data: object;
  setData: Setter<object>;
  entityType: Accessor<string>;
  setEntityType: Setter<string>;
  initialType: string;
  fieldName?: string;
}> = (props) => {
  createEffect(() => {
    console.log("changed entity type", props.entityType());
  });

  return (
    <>
      <div class="bg-neutral bg-opacity-80 p-6">
        <span class="select-none font-semibold uppercase text-neutral-content">
          Create new
        </span>

        <span
          onClick={() => props.setEntityType(props.initialType)}
          class={`btn btn-sm prose-sm ml-3 font-semibold uppercase ${
            props.initialType === props.entityType()
              ? "btn-accent"
              : "btn-neutral"
          }`}
        >
          {getEntityDisplayName(props.initialType)}
        </span>
        <For each={schema[props.initialType].subclasses_list}>
          {(item) => (
            <span
              onClick={() => props.setEntityType(item.toLowerCase())}
              class={`btn btn-sm prose-sm ml-3 rounded-md font-semibold uppercase ${
                item.toLowerCase() === props.entityType()
                  ? "btn-accent"
                  : "btn-neutral"
              }`}
            >
              {item}
            </span>
          )}
        </For>
      </div>
      <div class="mr-6 ml-6">
        <Form
          data={props.data}
          setData={props.setData}
          entity_type={props.entityType()}
        />
      </div>
    </>
  );
};

type RelationFieldType = {
  uid: string;
  label: string;
  real_type: string;
};

const ZeroOrMoreSimpleRelationEditField: Component<{
  field: { relation_to: string };
  fieldName: string;
  relatedToType: string;
  value: any;
  onChange: Setter<RelationFieldType[]>;
  data: Accessor<RelationFieldType[]>;
  reverseRelation: string;
}> = (props) => {
  const [searchFormValue, setSearchFormValue] = createSignal("");
  const [resultsPanelVisible, setResultsPanelVisible] = createSignal(false);
  const [showAddNewEntityModal, setShowAddNewEntityModal] = createSignal(false);

  const [autoCompleteData, setAutoCompleteData] = createSignal([]);

  const [filteredAutoCompleteData, setFilteredAutoCompleteData] = createSignal(
    []
  );
  const [autoCompleteTextInput, setAutoCompleteTextInput] = createSignal("");

  const handleKeyEnter = (e) => {
    if (
      e.key === "Enter" &&
      filteredAutoCompleteData().length > 0 &&
      autoCompleteTextInput() !== ""
    ) {
      handleAddSelection(filteredAutoCompleteData()[0]);
    }
  };

  const handleInputFocusIn = async () => {
    setResultsPanelVisible(true);
    console.log(autoCompleteData.length);
    if (autoCompleteData().length === 0) {
      const data = await fetchAutoCompleteData(
        props.field.relation_to.toLowerCase()
      );
      setAutoCompleteData(data);
      setFilteredAutoCompleteData(data);
    }
  };

  createEffect(() => console.log("Edit field PROPS>>", props));

  createEffect(() => {
    setFilteredAutoCompleteData(
      autoCompleteData().filter((item: RelationFieldType) => {
        const r = new RegExp(autoCompleteTextInput(), "i");
        return (
          r.test(item.label) &&
          !props.value
            .map((item: RelationFieldType) => item.uid)
            .includes(item.uid)
        );
      })
    );
  });

  const handleAddSelection = (item: RelationFieldType) => {
    setAutoCompleteTextInput("");

    props.onChange([...props.value, item]);
  };

  const handleRemoveSelection = (uid: string) => {
    props.onChange(
      props.value.filter((item: RelationFieldType) => item.uid !== uid)
    );
  };

  const [embeddedData, setEmbeddedData] = createSignal({});
  const [embeddedType, setEmbeddedType] = createSignal(props.relatedToType);

  const saveAddedEntity = async () => {
    const response = await postNewEntityData(embeddedType(), embeddedData());
    console.log("SUBMIT RESPINSE", response);
    if (response.saved) {
      handleAddSelection({
        uid: response.uid,
        label: response.label,
        real_type: embeddedType(),
      });
      setShowAddNewEntityModal(false);
      setEmbeddedData({});
      setEmbeddedType(props.relatedToType);
    }
  };

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
      <div class="col-span-5 mb-4 mt-4 pt-2">
        <For each={props.value || []}>
          {(item: RelationFieldType) => (
            <EntityChip
              label={item.label}
              leftSlot={
                <>
                  <a
                    onClick={() => handleRemoveSelection(item.uid)}
                    class="btn btn-circle btn-primary btn-xs mr-3 border-primary-content"
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

        <div class="relative">
          <div class="relative col-span-6 flex w-full">
            <input
              type="text"
              class="mb-4 mt-4 
                w-full rounded-t-md border-b-2 
                border-t-2 border-l-2 
                border-r-2 border-primary border-t-transparent border-l-transparent 
                border-r-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 
                focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary 
                focus:bg-base-200 focus:shadow-inner  focus:outline-none "
              value={autoCompleteTextInput()}
              onInput={(e) => setAutoCompleteTextInput(e.target.value)}
              onFocusIn={handleInputFocusIn}
              onFocusOut={() => setResultsPanelVisible(false)}
              onKeyPress={handleKeyEnter}
            />{" "}
            <span
              onClick={() => setShowAddNewEntityModal(true)}
              class="btn-base btn btn-square btn-sm relative top-6 ml-12"
            >
              <BsPlus />
            </span>
          </div>
          <Show when={resultsPanelVisible()}>
            <div class="dropdown rounded-box relative z-50 max-h-52 w-full overflow-y-scroll bg-base-100 p-2 shadow-xl">
              <ul class=" menu ">
                <For each={filteredAutoCompleteData()}>
                  {(item: RelationFieldType, index) => (
                    <EntityChip
                      label={item.label}
                      leftSlot={getEntityDisplayName(item.real_type)}
                      color="primary"
                      onClick={(e: MouseEvent) => handleAddSelection(item)}
                    />
                  )}
                </For>
              </ul>
            </div>
          </Show>
        </div>
      </div>
      <Show when={showAddNewEntityModal()}>
        <div class="modal modal-open pr-96 pl-96">
          <div class="modal-box min-w-full pt-0 pl-0 pr-0">
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
                class="btn btn-warning btn-sm"
              >
                Add
              </span>
              <span
                onClick={() => setShowAddNewEntityModal(false)}
                class="btn btn-success btn-sm"
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

const Form: Component<{
  entity_type: string;
  data: Accessor<{ [key: string]: RelationFieldType[] | string }>;
  setData: Setter<object>;
}> = (props) => {
  const handleSetFieldData = (field_name: string, value: any) => {
    props.setData({ ...props.data(), [field_name]: value });
  };

  return (
    <div class="ml-6 grid grid-cols-8">
      <Show when={schema[props.entity_type]}>
        <For each={Object.entries(schema[props.entity_type]?.fields)}>
          {([schema_field_name, field], index) => (
            <>
              {field.type === "property" && (
                <TextEditField
                  fieldName={schema_field_name}
                  // @ts-ignore
                  value={props.data()[schema_field_name] || ""}
                  onInput={(e) =>
                    handleSetFieldData(schema_field_name, e.target?.value)
                  }
                />
              )}
              {field.type === "relation" && (
                <ZeroOrMoreSimpleRelationEditField
                  fieldName={schema_field_name}
                  value={props.data()[schema_field_name] || []}
                  field={field}
                  relatedToType={field.relation_to.toLowerCase()}
                  onChange={(value) =>
                    handleSetFieldData(schema_field_name, value)
                  }
                />
              )}

              <Show
                when={
                  Object.entries(schema[props.entity_type].fields).length >
                  index() + 1
                }
              >
                <div class="divider col-span-8" />
              </Show>
            </>
          )}
        </For>
      </Show>
    </div>
  );
};

export default Form;
