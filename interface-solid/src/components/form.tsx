import {
  Component,
  createEffect,
  createSignal,
  For,
  Show,
  onMount,
  Setter,
  Accessor,
  createMemo,
} from "solid-js";
import { schema } from "../index";
import EntityChip from "./ui_components/entityChip";
import { BsArrowReturnRight, BsPlus } from "solid-icons/bs";
import { CgClose } from "solid-icons/cg";
import { getEntityDisplayName } from "../utils/entity_names";
import { fetchAutoCompleteData } from "../App";
import { postNewEntityData } from "../App";
import { filter } from "ramda";
import { TextFieldView } from "./viewEntity";

const nested_get = (nested, keys) => {
  const k = keys.shift();
  if (keys.length > 0) {
    if (nested.constructor === Array) {
      if (k === "__all__") {
        console.log(k);

        return nested
          .map((n) => {
            const keycopy = [...keys];
            return nested_get(n, keycopy);
          })
          .join(", ");
      }
      return nested_get(nested[0][k], keys);
    }
    return nested_get(nested[k], keys);
  } else {
    if (nested.constructor === Array) {
      return nested[0][k];
    }

    return nested[k];
  }
};

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
          class="w-full rounded-b-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
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
  entityType: Accessor<any>;
  setEntityType: Setter<string>;
  initialType: string;
  fieldName?: string;
}> = (props) => {
  createEffect(() => {
    //console.log("changed entity type", props.entityType());
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
  relData: object;
};

const ZeroOrMoreSimpleRelationEditField: Component<{
  override_labels: object;
  field: { relation_to: string };
  fieldName: string;
  relatedToType: string;
  relationFields: object;
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
    //console.log(autoCompleteData.length);
    if (autoCompleteData().length === 0) {
      const data = await fetchAutoCompleteData(
        props.field.relation_to.toLowerCase()
      );
      setAutoCompleteData(data);
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
    }
  };

  //createEffect(() => console.log("Edit field VALUE>>", props.value));

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
      props.value.map((i) => (item["uid"] !== i["uid"] ? i : updatedItem))
    );
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
    //console.log("SUBMIT RESPINSE", response);
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

  return (
    <>
      <div class="col-span-2 mb-4 mt-4 select-none font-semibold uppercase">
        {props.override_labels
          ? props.override_labels[0]
          : props.fieldName.replaceAll("_", " ")}
        <div class="mt-1 ml-1 select-none">
          <BsArrowReturnRight class="inline-block" />{" "}
          <span class="prose-sm rounded-md bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
            {props.field.relation_to}
          </span>
        </div>
      </div>
      <div class="col-span-5 mb-4 mt-4 pt-2">
        {Object.keys(props.relationFields).length > 0 ? (
          <For each={props.value || []}>
            {(item: RelationFieldType) => (
              <div class="card card-compact mr-4 mb-3 inline-block w-96 rounded-md bg-base-300 p-0 shadow-sm">
                <div
                  class="prose-md mb-0 bg-primary p-3 text-neutral-content"
                  //onMouseDown={props.onClick}
                >
                  <span class="prose-sm mr-5 font-light uppercase">
                    <a
                      onClick={() => handleRemoveSelection(item.uid)}
                      class="btn btn-circle btn-primary btn-xs mr-3 border-primary-content"
                    >
                      <CgClose />
                    </a>{" "}
                    {getEntityDisplayName(item.real_type)}{" "}
                  </span>
                  <span class="prose-md font-semibold">{item.label}</span>
                </div>
                <div class="card-body grid grid-cols-7">
                  <For each={Object.entries(props.relationFields)}>
                    {([relationFieldName, relationField]) => (
                      <TextEditField
                        fieldName={relationFieldName}
                        value={
                          item.relData
                            ? item.relData[relationFieldName]
                            : relationField.default_value || ""
                        }
                        onInput={(e) =>
                          handleModifyRelationField(
                            item,
                            relationFieldName,
                            e.target?.value
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
        )}

        <div class="relative">
          <div class="relative col-span-6 flex w-full">
            <input
              type="text"
              class={`mb-4 mt-4 
                w-full rounded-t-md border-b-2 
                border-t-2 border-l-2 
                border-r-2 border-primary border-t-transparent border-l-transparent 
                border-r-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 
                focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary 
                focus:bg-base-200 focus:shadow-inner  focus:outline-none`}
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
    props.setData({
      ...props.data(),
      [field_name]: value,
    });
    props.setData({
      ...props.data(),
      label: build_label(),
    });
  };

  const build_label_template = (template) => {
    const data = props.data();
    try {
      const re = new RegExp("({.*?})", "g");
      const matches = [...template.matchAll(re)];
      matches.forEach((match) => {
        let s;
        if (match[0].includes(".")) {
          const es = match[0]
            .replaceAll("{", "")
            .replaceAll("}", "")
            .split(".");
          s = nested_get(data, es);
        } else {
          s = data[match[0].replaceAll("{", "").replaceAll("}", "")];
        }
        template = template.replace(new RegExp(match[0]), s);
        template = template.replace(/\s\s+/g, " ");
      });
      return template;
    } catch (error) {}
  };

  const build_label = createMemo(() => {
    if (schema[props.entity_type].meta.label_template) {
      return build_label_template(
        schema[props.entity_type].meta.label_template
      );
    } else {
      return props.data()["label"];
    }
  });

  return (
    <div class="ml-6 grid grid-cols-8">
      <Show when={schema[props.entity_type]}>
        <For each={Object.entries(schema[props.entity_type]?.fields)}>
          {([schema_field_name, field], index) => (
            <>
              {field.type === "property" && schema_field_name !== "label" && (
                <TextEditField
                  fieldName={schema_field_name}
                  // @ts-ignore
                  value={
                    props.data()[schema_field_name] ||
                    schema[props.entity_type].fields[schema_field_name]
                      .default_value ||
                    ""
                  }
                  onInput={(e) =>
                    handleSetFieldData(schema_field_name, e.target?.value)
                  }
                />
              )}
              {field.type === "property" &&
                schema_field_name === "label" &&
                !schema[props.entity_type].meta.label_template && (
                  <TextEditField
                    fieldName={schema_field_name}
                    // @ts-ignore
                    value={props.data()[schema_field_name] || ""}
                    onInput={(e) =>
                      handleSetFieldData(schema_field_name, e.target?.value)
                    }
                  />
                )}
              {schema_field_name === "label" &&
                schema[props.entity_type].meta.label_template && (
                  <TextFieldView
                    fieldName={schema_field_name}
                    // @ts-ignore
                    value={props.data()["label"] || ""}
                  />
                )}
              {field.type === "relation" && (
                <ZeroOrMoreSimpleRelationEditField
                  override_labels={
                    schema[props.entity_type].meta.override_labels[
                      schema_field_name
                    ]
                  }
                  fieldName={schema_field_name}
                  value={props.data()[schema_field_name] || []}
                  field={field}
                  relatedToType={field.relation_to.toLowerCase()}
                  relationFields={field.relation_fields}
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
