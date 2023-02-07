import {
  Component,
  Show,
  For,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
} from "solid-js";
import { useParams, useRouteData, useNavigate } from "@solidjs/router";

import { hasUnsavedChange, setHasUnsavedChange } from "../App";
import { BsPlusCircleFill } from "solid-icons/bs";
import TopBar from "../components/TopBar";
import { getEntityDisplayName } from "../utils/entity_names";
import { schema } from "../index";
import Form from "../components/EditForm";
import { postNewEntityData } from "../data/DataEndpoints";
import { createShortcut } from "@solid-primitives/keyboard";

import { Validator } from "@cfworker/json-schema";

import { unpackValidationErrors } from "../utils/unpackValidationErrors";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 max-w-4xl mb-3 rounded-sm h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

const NewEntityView: Component = (props) => {
  const params = useParams();

  const createBlankDataTemplate = (et) => {
    // For validation, cannot easily validate an empty data object,
    // so we create a blank one
    const t = Object.entries(schema[et].fields).reduce((acc, curr) => {
      const [field_name, field] = curr;
      if (field.type === "relation" && field.inline_relation) {
        acc[field_name] = { type: "" };
      } else if (field.type === "relation") {
        acc[field_name] = [];
      } else {
        acc[field_name] = "";
      }

      return acc;
    }, {});
    return t;
  };

  const navigate = useNavigate();

  const [data, setData] = createSignal(
    createBlankDataTemplate(params.entity_type)
  );
  const [errors, setErrors] = createSignal({});
  const handleSetData = (data) => {
    setHasUnsavedChange(true);
    setData(data);
  };

  createShortcut(
    ["Meta", "s"],
    () => {
      onSave();
    },
    { preventDefault: true, requireReset: true }
  );

  const [showSaveToast, setShowSaveToast] = createSignal(false);
  const [showErrorToast, setShowErrorToast] = createSignal(false);

  createEffect(() => console.log(data()));

  const onSave = async () => {
    console.log(schema[params.entity_type].json_schema);
    console.log("DATA", data());
    const validator = new Validator(
      schema[params.entity_type].json_schema,
      "2020-12",
      false
    );
    const validated = validator.validate(data());

    const validationErrors = unpackValidationErrors(validated);
    setErrors(validationErrors);

    if (validated.valid) {
      const response = await postNewEntityData(params.entity_type, data());
      if (response && response.saved) {
        setHasUnsavedChange(false);
        setShowSaveToast(true);
        setInterval(() => setShowSaveToast(false), 3000);

        navigate(`/entity/${params.entity_type}/${response.uid}/`, {
          replace: false,
        });
      }
    } else {
      setShowErrorToast(true);
      setInterval(() => setShowErrorToast(false), 3000);
    }
  };

  return (
    <>
      <Show when={data()}>
        <TopBar
          params={params}
          newButton={false}
          editButton={false}
          saveButton={true}
          onClickSaveButton={onSave}
          barTitle={
            <div class="prose-sm ml-3 inline-block select-none rounded-sm bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
              <BsPlusCircleFill class="relative bottom-0.5 mr-2 inline-block" />
              {getEntityDisplayName(params.entity_type)}
            </div>
          }
          barCenter={
            <div class={ViewedItemTopBarStyle}>
              {data().label ||
                `New ${getEntityDisplayName(params.entity_type)}`}
            </div>
          }
        />

        <div class="mt-32 mb-48">
          <Form
            data={data}
            setData={handleSetData}
            entity_type={params.entity_type}
            errors={errors}
          />
        </div>
      </Show>

      <Show when={showSaveToast()}>
        <div class="toast-end toast">
          <div class="alert alert-success text-success-content">
            <div>
              <span>Save successful</span>
            </div>
          </div>
        </div>
      </Show>
      <Show when={showErrorToast()}>
        <div class="toast-end toast">
          <div class="alert alert-error text-error-content">
            <div>
              <span>Cannot save: error with form</span>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default NewEntityView;
