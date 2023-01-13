import { CUSTOM_EDIT_FIELDS } from "../../../interface-config.js";

import {
  Component,
  createSignal,
  For,
  Show,
  onMount,
  onCleanup,
  Switch,
  Match,
  createEffect,
  createMemo,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { groupBy } from "ramda";

import { schema } from "../../index";
import { BsArrowRight } from "solid-icons/bs";

import { getEntityDisplayName } from "../../utils/entity_names";

import { CgOptions } from "solid-icons/cg";

import TypedInputField from "./TypedInputField";

import RelationEditField from "./RelationEditField";
import { unpackInlineErrors } from "../../utils/unpackValidationErrors.js";

function clickOutside(el: HTMLElement, accessor) {
  const onClick = (e) => !el.contains(e.target) && accessor()?.();
  document.body.addEventListener("click", onClick);

  onCleanup(() => document.body.removeEventListener("click", onClick));
}

const groupByType = groupBy(([field_name, field]) => field.type);

const InlineRelationEditField: Component<{
  inlineRelationFieldName: string;
  errors: object;
}> = (props) => {
  const inlineErrors = createMemo(() => {
    return unpackInlineErrors(props.errors);
  });

  createEffect(() => inlineErrors());

  const grouped_fields = () => {
    const groups = groupByType(Object.entries(selectedTypeModel().fields));

    return groups;
  };
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

    return list;
  };

  onMount(() => {
    setSelectedType(props.value?.type || subclasses_list()[0]);
    //props.onChange({ type: selectedType().toLowerCase() });
  });

  const selectedTypeModel = () => {
    return schema[selectedType().toLowerCase()];
  };

  const setValue = (fieldName: string, value) => {
    props.onChange({
      ...props.value,
      type: selectedType().toLowerCase(),
      [fieldName]: value,
    });
  };

  const changeSelectedType = (type) => {
    //console.log(type, selectedType());
    if (type.toLowerCase() === selectedType()) {
      props.onChange({ ...props.value, type: type.toLowerCase() });
    } else {
      props.onChange({
        type: type.toLowerCase(),
      });
    }
    setSelectedType(type);
  };

  const shouldShowField = (field_name) => {
    return !field().meta?.internal_fields?.includes(field_name);
  };

  return (
    <>
      <div class="col-span-2 mb-2 mt-8 flex select-none flex-col items-baseline font-semibold uppercase">
        <div class={props.errors && "text-error"}>
          {props.fieldName.replaceAll("_", " ")}
        </div>
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

      <div class=" col-span-5 mt-4 grid flex-none grid-cols-8 gap-x-16">
        <For each={grouped_fields().property}>
          {([field_name, field]) => (
            <Show when={shouldShowField(field_name)}>
              <div class="col-span-3">
                <div
                  class={`prose prose-sm mb-4 w-full select-none pl-2 font-semibold uppercase ${
                    inlineErrors()[field_name] ? "text-error" : ""
                  }`}
                >
                  {field_name.replaceAll("_", " ")}
                </div>
                <Switch>
                  <Match when={CUSTOM_EDIT_FIELDS[field.property_type]}>
                    <Dynamic
                      component={CUSTOM_EDIT_FIELDS[field.property_type]}
                      value={props.value[field_name] || ""}
                      setValue={(value) => setValue(field_name, value)}
                      errors={inlineErrors()[field_name]}
                    />
                  </Match>
                  <Match when={true}>
                    <TypedInputField
                      value={props.value[field_name] || ""}
                      setValue={(value) => setValue(field_name, value)}
                      propertyType={field.property_type}
                      errors={inlineErrors()[field_name]}
                    />
                  </Match>
                </Switch>
              </div>
            </Show>
          )}
        </For>
        <Show when={grouped_fields().relation && grouped_fields().property}>
          <div class="divider col-span-8 mt-4 mb-8" />
        </Show>
        <For each={grouped_fields().relation}>
          {([field_name, field], index) => (
            <Show when={shouldShowField(field_name)}>
              <div class="col-span-8">
                <div
                  class={`prose prose-sm mb-4 flex select-none font-semibold uppercase ${
                    inlineErrors()[field_name] ? "text-error" : ""
                  }`}
                >
                  <span class="mt-0.5">
                    {props.override_label || field_name.replaceAll("_", " ")}
                  </span>
                  <BsArrowRight class="mt-2 ml-2 mr-2" />
                  <span class="mt-0.5 rounded-sm bg-neutral pt-[5px] pb-1 pl-2 pr-2 text-xs text-neutral-content">
                    {field.relation_to}
                  </span>
                </div>
                <div class="">
                  <RelationEditField
                    override_labels={props.override_labels}
                    field={field}
                    relatedToType={field.relation_to?.toLowerCase()}
                    relationFields={field.relation_fields}
                    value={props.value[field_name] || []}
                    onChange={(value) => setValue(field_name, value)}
                    reverseRelation={selectedTypeModel().reverseRelation}
                    errors={inlineErrors()[field_name]}
                  />
                </div>
                <Show when={index() < grouped_fields().relation.length - 1}>
                  <div class="divider col-span-8 mb-8" />
                </Show>
              </div>
            </Show>
          )}
        </For>
      </div>
    </>
  );
};

export default InlineRelationEditField;
