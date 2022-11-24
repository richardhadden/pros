import { BsPlus } from "solid-icons/bs";
import { BiSolidEditAlt } from "solid-icons/bi";
import { BiRegularSave } from "solid-icons/bi";
import { BiRegularExit } from "solid-icons/bi";
import { AiFillDelete } from "solid-icons/ai";

import { Component, createSignal, Show, JSXElement } from "solid-js";
import { Link, useNavigate } from "@solidjs/router";
import EntityChip from "./ui_components/entityChip";
import { schema } from "../index";
import { getEntityDisplayName } from "../utils/entity_names";

const TopBar: Component<{
  params: { entity_type: string; uid: string };
  barCenter?: JSXElement;
  barTitle?: JSXElement;
  newButton?: boolean;
  editButton?: boolean;
  viewButton?: boolean;
  saveButton?: boolean;
  hasUnsavedChange?: boolean;
  onClickSaveButton?: (e: MouseEvent) => null;
}> = (props) => {
  const navigate = useNavigate();
  const [redirectModalVisible, setRedirectModalVisible] = createSignal(false);
  const [deleteModalVisible, setDeleteModalVisible] = createSignal(false);

  const [deleteModalEntityName, setDeleteModalEntityName] = createSignal("");

  const onClickUnsaved = () => {
    setRedirectModalVisible(true);
  };

  const onClickDelete = () => {
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = () => {
    if (
      deleteModalEntityName().toLowerCase() !== props.data().label.toLowerCase()
    ) {
      alert("does not match");
    } else {
      alert("does match deleting");
    }
  };

  const doNavigateAway = () => {
    navigate(`/entity/${props.params.entity_type}/${props.params.uid}/`, {
      replace: true,
    });
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
                <Link
                  href={`/entity/${props.params.entity_type}/new/`}
                  class="btn btn-accent  btn-square btn-lg h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none"
                >
                  <BsPlus size={32} />
                </Link>
              )}
            {props.deleteButton && (
              <button
                onClick={onClickDelete}
                class="btn btn-warning btn-square btn-lg mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none"
              >
                <AiFillDelete size={27} class="relative bottom-0.5" />
              </button>
            )}

            {props.editButton && (
              <Link
                href={`/entity/${props.params.entity_type}/${props.params.uid}/edit/`}
                class="btn btn-accent  btn-square btn-lg h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none"
              >
                <BiSolidEditAlt size={32} />
              </Link>
            )}

            {props.viewButton && !props.hasUnsavedChange && (
              <Link
                href={`/entity/${props.params.entity_type}/${props.params.uid}/`}
                class="btn btn-accent btn-square  btn-lg mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none"
              >
                <BiRegularExit class="rotate-180" size={28} />
              </Link>
            )}
            {props.viewButton && props.hasUnsavedChange && (
              <span
                onClick={onClickUnsaved}
                class=" btn btn-accent btn-square  btn-lg mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none"
              >
                <BiRegularExit class="rotate-180" size={28} />
              </span>
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
      <Show when={redirectModalVisible()}>
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-semibold uppercase">Confirm Unsaved Changes</h3>
            <p class="py-4">Leave page without saving changes?</p>
            <div class="modal-action">
              <span onClick={doNavigateAway} class="btn btn-error">
                Confirm
              </span>
              <span
                onClick={() => setRedirectModalVisible(false)}
                class="btn btn-success"
              >
                Cancel
              </span>
            </div>
          </div>
        </div>
      </Show>
      <Show when={deleteModalVisible()}>
        <div class="modal modal-open pr-96 pl-96">
          <div class="modal-box min-w-full p-5">
            <div class="">
              <h3 class="select-none font-semibold uppercase">
                CONFIRM DELETE
              </h3>
              <p class="prose prose-base"></p>
            </div>
            <div class="mt-5 flex flex-row justify-center">
              <EntityChip
                color="primary"
                leftSlot={getEntityDisplayName(props.params.entity_type)}
                label={props.data().label}
              />
            </div>
            <div class="divider mt-10 mb-10" />
            <div class="mt-5 mr-20 ml-20 pb-10">
              <label>Type the entity name here to confirm deletion</label>
              <input
                onInput={(e) => setDeleteModalEntityName(e.target?.value)}
                type="text"
                class="w-full rounded-b-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-primary border-t-transparent border-l-transparent border-r-transparent bg-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:border-primary focus:bg-base-200 focus:shadow-inner focus:outline-none"
              />
            </div>

            <div class="modal-action">
              <span class="btn btn-error" onClick={onConfirmDelete}>
                Confirm
              </span>
              <span
                onClick={() => setDeleteModalVisible(false)}
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
