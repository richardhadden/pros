import { BsPlus } from "solid-icons/bs";
import { BiSolidEditAlt } from "solid-icons/bi";
import { BiRegularSave } from "solid-icons/bi";
import { BiRegularExit } from "solid-icons/bi";
import { AiFillDelete } from "solid-icons/ai";
import { AiOutlineReload } from "solid-icons/ai";

import { Component, createSignal, Show, JSXElement, Accessor } from "solid-js";

import { schema } from "../index";

import DeleteModal from "./DeleteModal";
import RestoreModal from "./RestoreModal";

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
  refetchData?: any;
  data?: Accessor<object>;
}> = (props) => {
  const [deleteModalVisible, setDeleteModalVisible] = createSignal(false);
  const [restoreModalVisible, setRestoreModalVisible] = createSignal(false);

  const onClickDelete = () => {
    setDeleteModalVisible(true);
  };

  return schema ? (
    <>
      <div class="mr-32">
        <div class="navbar fixed z-50 ml-32 h-20 w-4/6 rounded-b-sm bg-neutral pr-0 pt-0 pb-0 text-neutral-content shadow-2xl">
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
        <RestoreModal
          uid={props.params.uid}
          entityType={props.params.entity_type}
          data={props.data}
          setRestoreModalVisible={setRestoreModalVisible}
        />
      </Show>
    </>
  ) : (
    <></>
  );
};

export default TopBar;
