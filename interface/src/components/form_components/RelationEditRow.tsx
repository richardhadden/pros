import { Component, Setter, Accessor } from "solid-js";

import { BsArrowReturnRight } from "solid-icons/bs";

import RelationEditField from "./RelationEditField.jsx";

type RelationFieldType = {
  uid: string;
  label: string;
  real_type: string;
  relData: object;
};

const RelationEditRow: Component<{
  override_labels: Array<string>;
  field: {
    relation_to: string;
    cardinality: "ZeroOrOne" | "One" | "OneOrMore" | "ZeroOrMore";
  };
  fieldName: string;
  relatedToType: string;
  relationFields: object;
  value: any;
  onChange: Setter<RelationFieldType[]>;
  data: Accessor<RelationFieldType[]>;
  reverseRelation: string;
  errors: object;
}> = (props) => {
  return (
    <>
      {/* LEFT COLUMN */}
      <div
        class={`col-span-2 mb-4 mt-4 select-none font-semibold uppercase ${
          props.errors && "text-error"
        }`}
      >
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
        <RelationEditField
          override_labels={props.override_labels}
          field={props.field}
          relatedToType={props.relatedToType}
          relationFields={props.relationFields}
          value={props.value}
          onChange={props.onChange}
          data={props.data}
          reverseRelation={props.reverseRelation}
        />
      </div>
    </>
  );
};

export default RelationEditRow;
