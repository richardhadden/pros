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
  onCleanup,
  Switch,
  Match,
} from "solid-js";
import { schema } from "../index";
import EntityChip from "./ui_components/entityChip";
import { BsArrowReturnRight, BsPlus } from "solid-icons/bs";
import { CgClose } from "solid-icons/cg";

import { getEntityDisplayName } from "../utils/entity_names";
import {
  fetchAutoCompleteData,
  postNewEntityData,
} from "../data/DataEndpoints";

import {
  SchemaEntity,
  SchemaFieldProperty,
  SchemaFieldRelation,
} from "../types/schemaTypes";
import { TextFieldView } from "../views/ViewEntityView";
import { CgOptions } from "solid-icons/cg";
import {
  AiFillWarning,
  AiFillDelete,
  AiFillClockCircle,
  AiFillCheckCircle,
} from "solid-icons/ai";

function clickOutside(el, accessor) {
  const onClick = (e) => !el.contains(e.target) && accessor()?.();
  document.body.addEventListener("click", onClick);

  onCleanup(() => document.body.removeEventListener("click", onClick));
}

const nested_get = (
  nested: object | object[] | string[],
  keys: string[] | number[]
) => {
  const k = keys.shift();
  if (keys.length > 0) {
    if (nested.constructor === Array) {
      if (k === "__all__") {
        //console.log(k);

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

const TypedInputField: Component<{
  fieldName: string;
  value: any;
  setValue: (v: any) => void;
  propertyType:
    | "StringProperty"
    | "EmailProperty"
    | "IntegerProperty"
    | "FloatProperty"
    | "BooleanProperty"
    | "DateProperty"
    | "DateTimeProperty";
  helpText?: string;
}> = (props) => {
  const cv = () => props.value;
  const [floatFieldPreviousValue, setFloatFieldPreviousValue] = createSignal(
    props.value ?? ""
  );
  const [dateFieldPreviousValue, setDateFieldPreviousValue] = createSignal(
    props.value ?? ""
  );

  const setFloat = (e: InputEvent) => {
    const v = (e.currentTarget as HTMLInputElement).value;
    const regex = /^\d*(?:\.\d*)?$/;
    if (regex.test(v)) {
      props.setValue(v);
      setFloatFieldPreviousValue(v);
    } else {
      props.setValue(floatFieldPreviousValue());
    }

    //props.setValue(newV);
  };

  const displayDate = (dateString) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const YEAR_MONTH_DAY_REGEX =
      /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    const YEAR_MONTH_REGEX = /^\d{4}-(0[1-9]|1[012])$/;
    const YEAR_REGEX = /^\d{4}$/;
    if (YEAR_REGEX.test(dateString)) {
      return "Year " + dateString;
    } else if (YEAR_MONTH_REGEX.test(dateString)) {
      const month = monthNames[parseInt(dateString.slice(5), 10) - 1];
      const year = dateString.slice(0, 4);
      return `${month} ${year}`;
    } else if (YEAR_MONTH_DAY_REGEX.test(dateString)) {
      const month = monthNames[parseInt(dateString.slice(5, 7), 10) - 1];
      const year = dateString.slice(0, 4);
      const day =
        dateString.slice(8, 9) === "0"
          ? dateString.slice(9, 10)
          : dateString.slice(8, 10);
      return `${day} ${month} ${year}`;
    } else if (dateString === "") {
      return "";
    } else {
      return "invalid date";
    }
  };

  const setDate = (e: InputEvent) => {
    e.preventDefault();
    let v = (e.currentTarget as HTMLInputElement).value;
    if (e.inputType === "deleteContentBackward") {
      console.log(v);
      if (v.slice(-1) === "-") {
        console.log("ends with -");
        v = v.slice(0, -1);
        props.setValue(v);
      } else if (v.length === 1) {
        props.setValue("");
      } else {
        props.setValue(v);
      }
      return;
    }
    const INCREMENTAL_DATE_REGEX =
      /^(\d{1,3}$|\d{4}(?:-|(?:-(?:[01]$|(?:0[1-9]|1[120]))(?:-|(?:-(?:[1230]$|(?:0[1-9]|[12][0-9]|[12][0-9]|[03][01]))))?)?))$/;

    if ((v.length === 5 || v.length === 8) && v.slice(-1) !== "-") {
      v = v.slice(0, -1) + "-" + v.slice(-1);
      console.log("added dash to ", v);
    }

    if (INCREMENTAL_DATE_REGEX.test(v)) {
      props.setValue(v);
      setDateFieldPreviousValue(v);
    } else {
      props.setValue(dateFieldPreviousValue());
    }
  };

  return (
    <Switch>
      <Match when={props.propertyType === "StringProperty"}>
        <input
          type="text"
          class="w-full rounded-b-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
          value={props.value || ""}
          onInput={(e) => props.setValue(e.currentTarget.value)}
        />
      </Match>
      <Match when={props.propertyType === "EmailProperty"}>
        <input
          type="email"
          class="w-full rounded-b-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
          value={props.value || ""}
          onInput={(e) => props.setValue(e.currentTarget.value)}
        />
      </Match>
      <Match when={props.propertyType === "IntegerProperty"}>
        <input
          step="any"
          type="number"
          class="appearance-none  rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-b-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
          value={props.value}
          onInput={(e) => props.setValue(e.currentTarget.value)}
          id={props.fieldName}
        />
      </Match>
      <Match when={props.propertyType === "FloatProperty"}>
        <input
          step="any"
          type="text"
          pattern="^\d*\.?\d*$"
          class="appearance-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-b-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
          value={props.value || ""}
          onInput={setFloat}
        />
      </Match>
      <Match when={props.propertyType === "BooleanProperty"}>
        <div class="w-fit">
          <input
            type="checkbox"
            class="toggle-primary toggle mt-3"
            checked={props.value}
            onChange={(e) => props.setValue(e.currentTarget.checked)}
          />
          <div class="prose-sm mt-2 text-center font-semibold uppercase text-gray-300">
            {props.value?.toString()}
          </div>
        </div>
      </Match>
      <Match when={props.propertyType === "DateProperty"}>
        <div class="w-fit">
          <input
            step="any"
            class="w-36 appearance-none  rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-b-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
            value={props.value || ""}
            onInput={setDate}
          />
          <div class="prose-sm mt-2 text-center font-semibold uppercase text-gray-300">
            {displayDate(props.value)}
          </div>
        </div>
      </Match>
      <Match when={props.propertyType === "DateTimeProperty"}>
        <input
          step="any"
          type="datetime"
          class="appearance-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-b-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
          value={props.value || ""}
          onInput={(e) => props.setValue(e.currentTarget.value)}
        />
      </Match>
    </Switch>
  );
};

const TypedInputRow: Component<{
  fieldName: string;
  value: any;
  setValue: (v: any) => void;
  propertyType: "StringProperty" | "EmailProperty" | "IntegerProperty";
  helpText: string;
}> = (props) => {
  //createEffect(() => console.log(props.fieldName, props.value));

  return (
    <>
      <div class="col-span-2 mb-4 mt-8 flex select-none flex-col items-baseline font-semibold uppercase">
        <div>{props.fieldName.replaceAll("_", " ")}</div>
        <label
          class="prose prose-sm mt-4 block select-none uppercase text-gray-300"
          for={props.fieldName}
        >
          {props.helpText}
        </label>
      </div>
      <div class="col-span-5 mb-4 mt-4 w-full">
        <TypedInputField
          value={props.value}
          setValue={props.setValue}
          fieldName={props.fieldName}
          propertyType={props.propertyType}
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
  return (
    <>
      <div class="bg-neutral bg-opacity-80 p-6">
        <span class="select-none font-semibold uppercase text-neutral-content">
          Create new
        </span>

        <span
          onClick={() => props.setEntityType(props.initialType)}
          class={`btn-sm btn prose-sm ml-3 font-semibold uppercase ${
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
              class={`btn-sm btn prose-sm ml-3 rounded-md font-semibold uppercase ${
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
  //createEffect(() => console.log("FIELD", props.field));
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
          <span class="prose-sm rounded-sm bg-neutral pt-1 pb-1 pl-2 pr-2 text-neutral-content">
            {props.field.relation_to}
          </span>
        </div>
      </div>
      <div class="col-span-5 mb-4 mt-4 pt-2">
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
                          item.relData &&
                          item.relData[relationFieldName] !== null
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
              class="btn-base btn-sm btn-square btn relative top-6 ml-12"
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

const InlineRelationEditField: Component = (props) => {
  const [selectedType, setSelectedType] = createSignal(
    props.inlineRelationFieldName
  );
  const [showDropdown, setShowDropdown] = createSignal(false);
  const field = () => {
    const field = schema[props.inlineRelationFieldName.toLowerCase()];
    return field;
  };

  const subclasses_list = () => {
    let list = [];
    if (!field().meta?.abstract) {
      list.push(props.inlineRelationFieldName);
    }
    list = [
      ...list,
      ...field()["subclasses_list"]?.filter(
        (f) =>
          !schema[f.toLowerCase()].meta?.abstract &&
          f.toLowerCase() !== selectedType()
      ),
    ];
    console.log("LL", list);

    return list;
  };

  onMount(() => {
    setSelectedType(props.value?.type || subclasses_list()[0]);
  });

  const selectedTypeModel = () => {
    return schema[selectedType().toLowerCase()];
  };

  const setValue = (fieldName, value) => {
    props.onChange({
      ...props.value,
      type: selectedType().toLowerCase(),
      [fieldName]: value,
    });
  };

  const changeSelectedType = (type) => {
    console.log(type, selectedType());
    if (type.toLowerCase() === selectedType()) {
      props.onChange({ ...props.value, type: type.toLowerCase() });
    } else {
      props.onChange({
        type: type.toLowerCase(),
      });
    }
    setSelectedType(type);
  };

  return (
    <>
      <div class="col-span-2 mb-2 mt-8 flex select-none flex-col items-baseline font-semibold uppercase">
        <div>{props.fieldName.replaceAll("_", " ")}</div>
        <label
          class="prose prose-sm mt-4 block select-none uppercase text-gray-300"
          for={props.fieldName}
        >
          {props.helpText}
        </label>
        <div
          class=" flex flex-col"
          use:clickOutside={() => setShowDropdown(false)}
        >
          <div class="justify-left ml-1 flex select-none flex-row">
            <CgOptions class="mt-2 mr-2 inline-block" />
            <button
              class="btn-accent btn-sm btn w-fit rounded-sm"
              onClick={() => setShowDropdown(!showDropdown())}
            >
              {getEntityDisplayName(selectedType())}
            </button>
          </div>
          <Show when={showDropdown()}>
            <ul class="dropdown-content z-50 mt-1 grid w-fit grid-cols-1">
              <For each={subclasses_list()}>
                {(subclass) =>
                  subclass !== selectedType() && (
                    <li
                      class="btn-active btn-sm btn  mb-1"
                      onClick={() => {
                        changeSelectedType(subclass);
                        setShowDropdown(false);
                      }}
                    >
                      {getEntityDisplayName(subclass)}
                    </li>
                  )
                }
              </For>
            </ul>
          </Show>
        </div>
      </div>
      {/* HERE START THE FIELDS */}
      <div class="flex-none">
        <div class="mt-4 flex w-full flex-row items-stretch justify-start">
          <For each={Object.entries(selectedTypeModel()["fields"])}>
            {([field_name, field]) => (
              <div class="mr-12  flex-none">
                <div class="pros-sm prose w-full select-none pl-2 font-semibold uppercase">
                  <span class="select-none">
                    {field_name.replaceAll("_", " ")}
                  </span>
                </div>
                <div class="mt-2 mb-4 w-44">
                  <TypedInputField
                    value={props.value[field_name] || ""}
                    setValue={(value) => setValue(field_name, value)}
                    propertyType={field.property_type}
                  />
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
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
    if (schema[props.entity_type].meta.label_template) {
      props.setData({
        ...props.data(),
        label: build_label(),
      });
    }
  };

  const build_label_template = (template: string) => {
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
        template = template.replaceAll("undefined", "");
        template = template.replace(/\s\s+/g, " ");
      });
      return template;
    } catch (error) {}
  };

  const build_label = createMemo(() => {
    if (schema[props.entity_type].meta.label_template) {
      return build_label_template(
        (schema[props.entity_type] as SchemaEntity).meta.label_template
      );
    } else {
      return props.data()["label"];
    }
  });

  return (
    <div class="ml-6 grid grid-cols-8">
      <Show when={schema[props.entity_type]}>
        <For each={Object.entries(schema[props.entity_type]?.fields)}>
          {(
            [schema_field_name, field]: [string, unknown],
            index: Accessor<number>
          ) => (
            <>
              <Switch>
                {/* Renders default property field */}
                <Match
                  when={
                    (field as SchemaFieldProperty).type === "property" &&
                    schema_field_name !== "label"
                  }
                >
                  <TypedInputRow
                    fieldName={schema_field_name}
                    propertyType={(field as SchemaFieldProperty).property_type}
                    helpText={field.help_text}
                    value={
                      props.data()[schema_field_name] !== null
                        ? props.data()[schema_field_name]
                        : schema[props.entity_type].fields[schema_field_name]
                            .default_value || ""
                    }
                    setValue={(value) =>
                      handleSetFieldData(schema_field_name, value)
                    }
                  />
                </Match>

                {/* Renders label as editable field if no label template */}
                <Match
                  when={
                    (field as SchemaFieldProperty).type === "property" &&
                    schema_field_name === "label" &&
                    !schema[props.entity_type].meta.label_template
                  }
                >
                  <TypedInputRow
                    fieldName={schema_field_name}
                    helpText={(field as SchemaFieldProperty).help_text}
                    propertyType={(field as SchemaFieldProperty).property_type}
                    // @ts-ignore
                    value={props.data()[schema_field_name] || ""}
                    setValue={(value) =>
                      handleSetFieldData(schema_field_name, value)
                    }
                  />
                </Match>

                {/* Renders template-generated label if there is label_template set */}
                <Match
                  when={
                    schema_field_name === "label" &&
                    schema[props.entity_type].meta.label_template
                  }
                >
                  <TextFieldView
                    fieldName={schema_field_name}
                    // @ts-ignore
                    value={props.data()["label"] || ""}
                  />
                </Match>

                {/* Renders normal relation field */}
                <Match
                  when={
                    (field as SchemaFieldRelation).type === "relation" &&
                    !(field as SchemaFieldRelation).inline_relation
                  }
                >
                  <ZeroOrMoreSimpleRelationEditField
                    override_labels={
                      schema[props.entity_type].meta?.override_labels?.[
                        schema_field_name
                      ]
                    }
                    fieldName={schema_field_name}
                    value={props.data()[schema_field_name] || []}
                    field={field as SchemaFieldRelation}
                    relatedToType={(
                      field as SchemaFieldRelation
                    ).relation_to.toLowerCase()}
                    relationFields={
                      (field as SchemaFieldRelation).relation_fields
                    }
                    onChange={(value) =>
                      handleSetFieldData(schema_field_name, value)
                    }
                  />
                </Match>
                {/* Renders inline relation field */}
                <Match
                  when={
                    (field as SchemaFieldRelation).type === "relation" &&
                    (field as SchemaFieldRelation).inline_relation
                  }
                >
                  <InlineRelationEditField
                    value={props.data()[schema_field_name] || {}}
                    onChange={(value) =>
                      handleSetFieldData(schema_field_name, value)
                    }
                    fieldName={schema_field_name}
                    inlineRelationFieldName={
                      (field as SchemaFieldRelation).relation_to
                    }
                  />
                </Match>
              </Switch>

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
