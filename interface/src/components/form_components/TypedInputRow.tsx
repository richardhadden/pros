import { Accessor, Component, Show } from "solid-js";

import TypedInputField from "./TypedInputField";

const TypedInputRow: Component<{
  fieldName: string;
  value: any;
  setValue: (v: any) => void;
  propertyType: "StringProperty" | "EmailProperty" | "IntegerProperty";
  helpText: string;
  errors: object;
}> = (props) => {
  //createEffect(() => console.log(props.fieldName, props.value));

  return (
    <>
      <div class="col-span-2 mb-4 mt-8 flex select-none flex-col items-baseline font-semibold uppercase">
        <div class={props.errors && "text-error"}>
          {props.fieldName.replaceAll("_", " ")}
        </div>
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

export default TypedInputRow;
