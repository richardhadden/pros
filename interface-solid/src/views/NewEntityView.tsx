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

const ViewedItemTopBarStyle =
  "pl-6 pr-6 shadow-xl bg-primary text-neutral-content p-3 max-w-4xl mb-3 rounded-sm h-12 prose-md border-gray-600 relative top-1.5 font-semibold";

const NewEntityView: Component = (props) => {
  const params = useParams();
  //const [initialData, refetchInitialData] = useRouteData();

  const navigate = useNavigate();

  const [data, setData] = createSignal({});

  const handleSetData = (data) => {
    setHasUnsavedChange(true);
    setData(data);
  };

  const [showSaveToast, setShowSaveToast] = createSignal(false);

  createEffect(() => console.log(data()));

  const onSave = async () => {
    const response = await postNewEntityData(params.entity_type, data());
    console.log("SUBMIT RESPINSE", response);
    if (response.saved) {
      setHasUnsavedChange(false);
      setShowSaveToast(true);
      setInterval(() => setShowSaveToast(false), 3000);
      console.log("response", response);
      navigate(`/entity/${params.entity_type}/${response.uid}/edit/`, {
        replace: false,
      });
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
    </>
  );
};

export default NewEntityView;
