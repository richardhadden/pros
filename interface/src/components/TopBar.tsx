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
import { IoGitMerge } from "solid-icons/io";

type TopBarProps = {
  params: { entity_type: string; uid: string };
  barCenter?: JSXElement;
  barTitle?: JSXElement;
  barEnd?: JSXElement;
  newButton?: boolean;
  editButton?: boolean;
  editButtonDeactivated?: boolean;
  viewButton?: boolean;
  saveButton?: boolean;
  deleteButton?: boolean;
  mergeButton?: boolean;
  hasUnsavedChange?: boolean;
  onClickSaveButton?: (e: MouseEvent) => Promise<void>;
  refetchData?: any;
  data?: Accessor<object>;
};

const TopBar: Component<TopBarProps> = (props: TopBarProps) => {
  const [deleteModalVisible, setDeleteModalVisible] = createSignal(false);
  const [restoreModalVisible, setRestoreModalVisible] = createSignal(false);

  const onClickDelete = () => {
    setDeleteModalVisible(true);
  };

  return schema ? (
    <>
      <div class="mr-16">
        <div class="navbar fixed z-30 z-20 ml-32 flex h-20 w-4/6 flex-row justify-evenly rounded-b-sm bg-neutral pr-0 pt-0 pb-0 text-neutral-content shadow-2xl">
          <div class="prose-md ml-3 w-fit  font-semibold uppercase">
            {props.barTitle}
          </div>
          <div class="justify-left m-auto flex justify-self-start">
            <div class="">{props.barCenter}</div>
          </div>
          <div class="w-max min-w-max">
            <div class="mr-4 ">{props.barEnd}</div>
            {!schema[props.params.entity_type].meta.abstract &&
              props.newButton && (
                <UnsavedLink
                  href={`/entity/${props.params.entity_type}/new/`}
                  class="btn-accent btn-square  btn-lg btn h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none text-neutral"
                >
                  <BsPlus size={32} />
                </UnsavedLink>
              )}
            {props.mergeButton && (
              <UnsavedLink
                class="btn-accent btn-square btn-lg btn mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none text-neutral"
                href={`/entity/${props.params.entity_type}/${props.params.uid}/merge/`}
              >
                <IoGitMerge size={28} />
              </UnsavedLink>
            )}
            {props.deleteButton && (
              <button
                onClick={onClickDelete}
                class="btn-accent btn-square btn-lg btn mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none text-neutral"
              >
                <AiFillDelete size={27} class="relative bottom-0.5 " />
              </button>
            )}

            {props.editButton && !props.editButtonDeactivated && (
              <UnsavedLink
                href={`/entity/${props.params.entity_type}/${props.params.uid}/edit/`}
                class="btn-accent btn-square  btn-lg btn h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none text-neutral"
              >
                <BiSolidEditAlt size={32} />
              </UnsavedLink>
            )}

            {props.editButton && props.editButtonDeactivated && (
              <button
                onClick={() => setRestoreModalVisible(true)}
                class="btn-accent btn-square  btn-lg btn h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none text-neutral"
              >
                <AiOutlineReload size={32} />
              </button>
            )}

            {props.viewButton && !props.hasUnsavedChange && (
              <UnsavedLink
                href={`/entity/${props.params.entity_type}/${props.params.uid}/`}
                class="btn-accent btn-square btn-lg  btn mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none text-neutral"
              >
                <BiRegularExit class="rotate-180" size={28} />
              </UnsavedLink>
            )}
            {props.viewButton && props.hasUnsavedChange && (
              <UnsavedLink
                href={`/entity/${props.params.entity_type}/${props.params.uid}/`}
                class="btn-accent btn-square btn-lg  btn mr-px h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none rounded-br-none text-neutral"
              >
                <BiRegularExit class="rotate-180" size={28} />
              </UnsavedLink>
            )}
            {props.saveButton && (
              <span
                class="btn-accent btn-square  btn-lg btn h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none text-neutral"
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
