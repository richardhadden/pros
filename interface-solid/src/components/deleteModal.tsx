import { Component, createSignal, Accessor, Setter } from "solid-js";
import EntityChip from "./ui_components/entityChip";
import { getEntityDisplayName } from "../utils/entity_names";

import { useNavigate, useRouteData } from "@solidjs/router";
import { deleteEntity } from "../App";

const DeleteModal: Component<{
  data: any;
  entityType: string;
  uid: string;
  setDeleteModalVisible: Setter<boolean>;
}> = (props) => {
  const [data, refetchData] = useRouteData();
  const navigate = useNavigate();
  const [deleteModalEntityName, setDeleteModalEntityName] = createSignal("");
  const onConfirmDelete = async () => {
    if (
      deleteModalEntityName().toLowerCase() !== props.data().label.toLowerCase()
    ) {
      alert("does not match");
    } else {
      const del = await deleteEntity(props.entityType, props.uid);
      if (del.result === "pending") {
        refetchData();
        props.setDeleteModalVisible(false);
        //navigate(`/entity/${props.entityType}/${props.uid}`, { replace: true });
      } else if (del.result === "success") {
        props.setDeleteModalVisible(false);
        navigate(`/entity/${props.entityType}/`, { replace: true });
      }
    }
  };
  return (
    <div class="modal modal-open pr-96 pl-96">
      <div class="modal-box min-w-full p-5">
        <div class="">
          <h3 class="select-none font-semibold uppercase">CONFIRM DELETE</h3>
          <p class="prose prose-base"></p>
        </div>
        <div class="mt-5 flex flex-row justify-center">
          <EntityChip
            color="primary"
            leftSlot={getEntityDisplayName(props.entityType)}
            label={props.data().label}
          />
        </div>
        <div class="divider mt-10 mb-10" />
        <div class="mt-5 mr-20 ml-20 pb-10">
          <label>Type the entity name here to confirm deletion</label>
          <input
            onInput={(e) =>
              setDeleteModalEntityName((e.target as HTMLInputElement).value)
            }
            type="text"
            class="w-full rounded-b-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
          />
        </div>

        <div class="modal-action">
          <span class="btn btn-error" onClick={onConfirmDelete}>
            Confirm
          </span>
          <span
            onClick={() => props.setDeleteModalVisible(false)}
            class="btn btn-success"
          >
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
