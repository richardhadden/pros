import { BsPlus } from "solid-icons/bs";
import { BiSolidEditAlt } from "solid-icons/bi";
import { BiRegularSave } from "solid-icons/bi";
import { BiRegularExit } from "solid-icons/bi";
import { AiFillDelete } from "solid-icons/ai";
import { AiOutlineReload } from "solid-icons/ai";

import { Component, createSignal, Show, JSXElement } from "solid-js";
import { useNavigate } from "@solidjs/router";
import EntityChip from "./ui_components/entityChip";
import { schema } from "../index";
import { deleteEntity } from "../App";
import { getEntityDisplayName } from "../utils/entity_names";
import DeleteModal from "./deleteModal";

import UnsavedLink from "../utils/UnsavedLink";

const TopBar: Component<{
  params: { entity_type: string; uid: string };
  barCenter?: JSXElement;
  barTitle?: JSXElement;
  newButton?: boolean;
  editButton?: boolean;
  editButtonDeactivated?: boolean;
  viewButton?: boolean;
  saveButton?: boolean;
  deleteButton?: boolean;
  hasUnsavedChange?: boolean;
  onClickSaveButton?: (e: MouseEvent) => null;
}> = (props) => {
  const navigate = useNavigate();

  const [deleteModalVisible, setDeleteModalVisible] = createSignal(false);
  const [restoreModalVisible, setRestoreModalVisible] = createSignal(false);

  const onClickDelete = () => {
    setDeleteModalVisible(true);
  };

  const doRestore = async () => {
    const restored = await deleteEntity(
      props.params.entity_type,
      props.params.uid,
      true
    );
    if (restored) {
      setRestoreModalVisible(false);
      navigate(`/entity/${props.params.entity_type}/`, {
        replace: true,
      });
    } else {
      setDeleteModalVisible(false);
      alert("Could not be restored");
    }
  };

  return schema ? (
    <>
      <div class="mr-32">
        <div class="navbar fixed z-50 ml-32 h-20 w-4/6 rounded-b-lg bg-neutral pr-0 pt-0 pb-0 text-neutral-content shadow-2xl">
          <div class="navbar-start prose-xl ml-3 font-semibold uppercase">
            {props.barTitle}
          </div>
          <div class="navbar-center">{props.barCenter}</div>
          <div class="navbar-end">
            {!schema[props.params.entity_type].meta.abstract &&
              props.newButton && (
                <UnsavedLink
                  href={`/entity/${props.params.entity_type}/new/`}
                  class="btn btn-accent  btn-square btn-lg h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none"
                >
                  <BsPlus size={32} />
                </UnsavedLink>
              )}
            {props.deleteButton && (
              <button
                onClick={onClickDelete}
                class="btn btn-accent btn-square btn-lg mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none text-accent-content"
              >
                <AiFillDelete size={27} class="relative bottom-0.5 " />
              </button>
            )}

            {props.editButton && !props.editButtonDeactivated && (
              <UnsavedLink
                href={`/entity/${props.params.entity_type}/${props.params.uid}/edit/`}
                class="btn btn-accent  btn-square btn-lg h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none"
              >
                <BiSolidEditAlt size={32} />
              </UnsavedLink>
            )}

            {props.editButton && props.editButtonDeactivated && (
              <button
                onClick={() => setRestoreModalVisible(true)}
                class="btn btn-accent  btn-square btn-lg h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none"
              >
                <AiOutlineReload size={32} />
              </button>
            )}

            {props.viewButton && !props.hasUnsavedChange && (
              <UnsavedLink
                href={`/entity/${props.params.entity_type}/${props.params.uid}/`}
                class="btn btn-accent btn-square  btn-lg mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none"
              >
                <BiRegularExit class="rotate-180" size={28} />
              </UnsavedLink>
            )}
            {props.viewButton && props.hasUnsavedChange && (
              <UnsavedLink
                href={`/entity/${props.params.entity_type}/${props.params.uid}/`}
                class="btn btn-accent btn-square  btn-lg mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none"
              >
                <BiRegularExit class="rotate-180" size={28} />
              </UnsavedLink>
            )}
            {props.saveButton && (
              <span
                class="btn btn-accent  btn-square btn-lg h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none"
                onClick={props.onClickSaveButton}
              >
                <BiRegularSave size={28} />
              </span>
            )}
          </div>
        </div>
      </div>

      <Show when={deleteModalVisible()}>
        <DeleteModal
          setDeleteModalVisible={setDeleteModalVisible}
          data={props.data}
          entityType={props.params.entity_type}
          uid={props.params.uid}
        />
      </Show>

      <Show when={restoreModalVisible()}>
        <div class="modal modal-open">
          <div class="modal-box z-50 text-black">
            <h3 class="font-semibold uppercase">Restore</h3>
            <p class="py-4">
              Are you sure you want to restore deleted{" "}
              {getEntityDisplayName(props.params.entity_type)} &ldquo;
              {props.data().label}&rdquo;?
            </p>
            <div class="modal-action">
              <span class="btn btn-error" onClick={doRestore}>
                Confirm
              </span>
              <span
                onClick={() => setRestoreModalVisible(false)}
                class="btn btn-success"
              >
                Cancel
              </span>
            </div>
          </div>
        </div>
      </Show>
    </>
  ) : (
    <></>
  );
};

export default TopBar;
