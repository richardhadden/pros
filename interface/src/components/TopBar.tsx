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

const LoadingSpinner: Component = (props) => (
  <div role="status" class="flex justify-center">
    <svg
      aria-hidden="true"
      class={` h-6 w-6 animate-spin fill-primary text-primary-focus dark:text-gray-600`}
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
    <span class="sr-only">Loading...</span>
  </div>
);

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
  savingInProgress?: boolean;
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
                class="cursort btn-square  btn-lg btn h-20 w-20 rounded-tl-none rounded-tr-none rounded-bl-none text-neutral"
                classList={{
                  "btn-active": props.savingInProgress,
                  "cursor-default": props.savingInProgress,
                  "btn-accent": !props.savingInProgress,
                }}
                onClick={(e) => {
                  if (props.onClickSaveButton && !props.savingInProgress) {
                    props.onClickSaveButton(e);
                  }
                }}
              >
                {props.savingInProgress ? (
                  <LoadingSpinner />
                ) : (
                  <BiRegularSave size={28} />
                )}
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
