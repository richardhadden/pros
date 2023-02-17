import {
  Component,
  Show,
  For,
  createSignal,
  createEffect,
  onMount,
  createMemo,
  Suspense,
} from "solid-js";
import { useParams, useRouteData } from "@solidjs/router";

import { hasUnsavedChange, setHasUnsavedChange } from "../App";

import TopBar from "../components/TopBar";
import { getEntityDisplayName } from "../utils/entity_names";
import { schema } from "../index";
import Form from "../components/EditForm";
import { putEntityData } from "../data/DataEndpoints";
import { AiFillWarning } from "solid-icons/ai";
import { BiSolidEditAlt } from "solid-icons/bi";
import { createShortcut } from "@solid-primitives/keyboard";
import { Validator } from "@cfworker/json-schema";

import { unpackValidationErrors } from "../utils/unpackValidationErrors";

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 max-w-4xl mb-3 rounded-sm h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

type TParams = {
  entity_type: string;
  uid: string;
};

const EditEntityView: Component = (props) => {
  createShortcut(
    ["Meta", "s"],
    () => {
      onSave();
    },
    { preventDefault: true, requireReset: true }
  );
  const params = useParams<TParams>();
  const [initialData, refetchInitialData] = useRouteData();

  const [data, setData] = createSignal(initialData);
  const [errors, setErrors] = createSignal({});

  const handleSetData = (data) => {
    //console.log(data);
    setData(data);
    setHasUnsavedChange(true);
  };

  const [showSaveToast, setShowSaveToast] = createSignal(false);
  const [showErrorToast, setShowErrorToast] = createSignal(false);

  createEffect(() => setData(initialData));

  async function onSave(e: MouseEvent): Promise<void> {
    const validator = new Validator(
      schema[params.entity_type].json_schema,
      "2020-12",
      false
    );
    const validated = validator.validate(data());

    const validationErrors = unpackValidationErrors(validated);
    setErrors(validationErrors);

    if (validated.valid) {
      const response = await putEntityData(
        params.entity_type,
        data().uid,
        data()
      );
      //console.log("SUBMIT RESPINSE", response);
      if (response.saved) {
        setHasUnsavedChange(false);
        setShowSaveToast(true);
        setInterval(() => setShowSaveToast(false), 3000);
      }
    } else {
      setShowErrorToast(true);
      setInterval(() => setShowErrorToast(false), 3000);
    }
  }

  return (
    <>
      <Show when={data()}>
        <Suspense>
          <TopBar
            params={params}
            newButton={false}
            editButton={false}
            viewButton={true}
            hasUnsavedChange={hasUnsavedChange()}
            saveButton={true}
            onClickSaveButton={onSave}
            barTitle={
              <div
                class={`prose-sm ml-3 inline-block rounded-sm  pl-3 pr-3 pt-1 pb-1 ${
                  hasUnsavedChange()
                    ? "bg-warning text-warning-content"
                    : "bg-neutral-focus"
                }`}
              >
                <BiSolidEditAlt class="relative bottom-0.5 mr-2 inline-block " />
                {getEntityDisplayName(params.entity_type)}
              </div>
            }
            barCenter={<div class={ViewedItemTopBarStyle}>{data().label}</div>}
          />

          <div class="mt-32 mb-48">
            <Show when={data()["is_deleted"]}>
              <div class="grid grid-cols-8">
                <div class="col-span-1" />
                {data().deleted_and_has_dependent_nodes ? (
                  <div class=" col-span-6 mb-16 flex flex-row rounded-md bg-warning p-3 font-semibold uppercase text-warning-content shadow-lg">
                    <AiFillWarning class="mt-1 mr-3" /> Deletion Pending{" "}
                    <span class="ml-6 normal-case">
                      Remove as a {getEntityDisplayName(params.entity_type)}{" "}
                      referenced by other items
                    </span>
                  </div>
                ) : (
                  <div class=" col-span-6 mb-16 flex flex-row rounded-md bg-success p-3 font-semibold uppercase text-success-content shadow-lg">
                    <AiFillWarning class="mt-1 mr-3" /> Deletion Pending{" "}
                    <span class="ml-6 normal-case">
                      No more references to this{" "}
                      {getEntityDisplayName(params.entity_type)}, so it can be
                      safely deleted
                    </span>
                  </div>
                )}

                <div class="col-span-1" />
              </div>
            </Show>
            <Form
              errors={errors}
              data={data}
              setData={handleSetData}
              entity_type={params.entity_type}
            />
          </div>
        </Suspense>
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

export default EditEntityView;
