import { Component, Setter, Accessor } from "solid-js";
import { useRouteData } from "@solidjs/router";

import { getEntityDisplayName } from "../utils/entity_names";
import { deleteEntity } from "../data/DataEndpoints";

const RestoreModal: Component<{
  uid: string;
  entityType: string;
  data: Accessor<object>;
  setRestoreModalVisible: Setter<Boolean>;
}> = (props) => {
  const [_, refetchData] = useRouteData();
  const doRestore = async () => {
    const restored = await deleteEntity(props.entityType, props.uid, true);
    if (restored) {
      props.setRestoreModalVisible(false);
      refetchData();
    } else {
      props.setRestoreModalVisible(false);
      alert("Could not be restored");
    }
  };
  return (
    <div class="modal modal-open">
      <div class="modal-box z-50 text-black">
        <h3 class="font-semibold uppercase">Restore</h3>
        <p class="py-4">
          Are you sure you want to restore deleted{" "}
          {getEntityDisplayName(props.entityType)} &ldquo;
          {props.data().label}&rdquo;?
        </p>
        <div class="modal-action">
          <span class="btn-error btn" onClick={doRestore}>
            Confirm
          </span>
          <span
            onClick={() => props.setRestoreModalVisible(false)}
            class="btn-success btn"
          >
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestoreModal;
