import { sortBy } from "ramda";
import {
  Accessor,
  Component,
  createMemo,
  For,
  Match,
  onCleanup,
  Setter,
  Show,
  Switch,
} from "solid-js";

import { schema } from "../index";

import {
  SchemaEntity,
  SchemaFieldProperty,
  SchemaFieldRelation,
} from "../types/schemaTypes";
import { TextFieldView } from "../views/ViewEntityView";

import TypedInputRow from "./form_components/TypedInputRow";

import InlineRelationEditField from "./form_components/InlineRelationEditField";
import RelationEditRow from "./form_components/RelationEditRow";

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

const Form: Component<{
  entity_type: string;
  data: Accessor<{ [key: string]: RelationFieldType[] | string }>;
  errors: Accessor<object>;
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
    if (schema[props.entity_type]?.meta?.label_template) {
      const label = build_label_template(
        (schema[props.entity_type as string] as SchemaEntity).meta
          .label_template
      );
      if (label) {
        return label;
      } else {
        return "";
      }
    } else {
      return props.data()["label"];
    }
  });

  const sorted_fields = createMemo(() => {
    let sorted_fields = Object.entries(schema[props.entity_type]?.fields);
    const field_orderings = schema[props.entity_type]?.meta?.order_fields;
    if (field_orderings) {
      //console.log("orderfields");
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
    <div class="ml-6 grid grid-cols-8">
      <Show when={schema[props.entity_type]}>
        <For each={sorted_fields()}>
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
                    errors={props.errors()[schema_field_name]}
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
                    errors={props.errors()[schema_field_name]}
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
                  <RelationEditRow
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
                    errors={props.errors()[schema_field_name]}
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
                    errors={props.errors()[schema_field_name]}
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
