import { CUSTOM_EDIT_FIELDS } from "../../../interface-config.js";

import { Component, createSignal, Match, Show, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";

const typedInputFieldStyle =
  "w-full rounded-b-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none";

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
    | "DateTimeProperty"
    | string;
  helpText?: string;
}> = (props) => {
  const [floatFieldPreviousValue, setFloatFieldPreviousValue] = createSignal(
    props.value ?? ""
  );
  const [emailIsValid, setEmailIsValid] = createSignal(false);

  const setFloat = (e: InputEvent) => {
    const v = (e.currentTarget as HTMLInputElement).value;
    const regex = /^\d*(?:\.\d*)?$/;
    if (regex.test(v)) {
      props.setValue(v);
      setFloatFieldPreviousValue(v);
    } else {
      props.setValue(floatFieldPreviousValue());
    }
  };

  const setEmail = (e: InputEvent) => {
    if ((e.currentTarget as HTMLInputElement).validity.valid) {
      setEmailIsValid(true);
    } else {
      setEmailIsValid(false);
    }
    props.setValue((e.currentTarget as HTMLInputElement).value);
  };

  return (
    <Switch>
      <Match when={CUSTOM_EDIT_FIELDS[props.propertyType]}>
        <Dynamic
          component={CUSTOM_EDIT_FIELDS[props.propertyType]}
          value={props.value || ""}
          setValue={(value: unknown) => props.setValue(value)}
        />
      </Match>
      <Match when={props.propertyType === "StringProperty"}>
        <input
          type="text"
          class={typedInputFieldStyle}
          value={props.value || ""}
          onInput={(e) => props.setValue(e.currentTarget.value)}
        />
      </Match>
      <Match when={props.propertyType === "EmailProperty"}>
        <div>
          <input
            type="email"
            class={typedInputFieldStyle}
            value={props.value || ""}
            onInput={setEmail}
          />
          <div class="prose-sm mt-2 text-center font-semibold uppercase text-gray-300">
            <Show when={props.value}>
              {emailIsValid()
                ? "Valid e-mail address"
                : "invalid email address"}
            </Show>
          </div>
        </div>
      </Match>
      <Match when={props.propertyType === "IntegerProperty"}>
        <input
          step="any"
          type="number"
          class={typedInputFieldStyle}
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
          class={"w-fit " + typedInputFieldStyle}
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
            {props.value?.toString() ?? false.toString()}
          </div>
        </div>
      </Match>
      <Match when={props.propertyType === "DateProperty"}>
        <div class="w-fit">
          <input
            type="date"
            class="appearance-none  rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-b-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
            value={props.value || ""}
            onInput={(e) => props.setValue(e.currentTarget.value)}
          />
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

export default TypedInputField;
