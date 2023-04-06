import {
  Component,
  createSignal,
  Show,
  For,
  Setter,
  onMount,
  createEffect,
} from "solid-js";
import { BiRegularImport } from "solid-icons/bi";
import { FiDatabase } from "solid-icons/fi";

import { schema } from "../../../interface/src";
import { AutocompleteModalsType } from "../../../interface/src/types/AutoCompleteModalTypes";

import { getImportList, createImports, ImportListData } from "../data";

import {
  getEntityDisplayName,
  getEntityNamePlural,
} from "../../../interface/src/utils/entity_names";

function debounce(cb: CallableFunction, delay = 500) {
  let timeout: number;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}

const ImportNewEntityModal: Component<{
  selectedList: { uid: string; real_type: string; label: string }[];
  changeSelectedList: Setter<
    Array<{ uid: string; real_type: string; label: string }>
  >;
  entityType: string;
  fieldName?: string;
  cardinality: "ZeroOrOne" | "One" | "OneOrMore" | "ZeroOrMore";
  setShowImportEntityModal: Setter<boolean>;
}> = (props) => {
  const [filterValue, setFilterValue] = createSignal("");
  const [itemsToShow, setItemsToShow] = createSignal<ImportListData>([]);
  const [selectedEndpoint, setSelectedEndpoint] = createSignal(
    Object.keys(schema[props.entityType].meta.importers)[0]
  );
  const [selectedEntitiesToImport, setSelectedEntitiesToImport] = createSignal<
    Array<string>
  >([]);

  let filterInputBox: HTMLInputElement;

  onMount(() => {
    filterInputBox.focus();
  });

  const getData = debounce(async () => {
    console.log;
    const data = await getImportList(
      props.entityType,
      selectedEndpoint(),
      filterValue()
    );
    setItemsToShow(data.data);
  });

  createEffect(async () => {
    if (filterValue() === "") {
      setItemsToShow([]);
      return;
    } else {
      getData();
    }
  });

  const addItemToSelected = (item_id: string) => {
    const newSelectedItems = [
      ...selectedEntitiesToImport(),
      item_id,
    ] as string[];
    setSelectedEntitiesToImport(newSelectedItems);
  };

  const removeItemFromSelected = (item_id: string) => {
    const newSelectedItems = selectedEntitiesToImport().filter(
      (current_item: string) => current_item != item_id
    );
    setSelectedEntitiesToImport(newSelectedItems);
  };

  createEffect(() => console.log("selectedEndpoint", selectedEndpoint()));

  const importAndAddEntities = async (e: MouseEvent) => {
    const response = await createImports(
      props.entityType,
      selectedEndpoint(),
      selectedEntitiesToImport()
    );
    props.changeSelectedList([...props.selectedList, ...response]);

    props.setShowImportEntityModal(false);
    setSelectedEntitiesToImport([]);
  };

  return (
    <Show when={schema[props.entityType.toLowerCase()]}>
      <div class="fixed flex w-full flex-row items-center justify-between bg-neutral bg-opacity-80 p-6">
        <div>
          <span class="select-none font-semibold uppercase text-neutral-content">
            Import
          </span>

          <span
            class="btn-neutral btn-sm btn prose-sm ml-3 mr-3
             font-semibold uppercase"
          >
            {getEntityNamePlural(props.entityType)}
          </span>

          <span class="mr-3 select-none font-semibold uppercase text-neutral-content">
            from
          </span>

          <For each={Object.entries(schema[props.entityType].meta.importers)}>
            {([endpoint_slug, endpoint_name]) => (
              <Show
                when={endpoint_slug == selectedEndpoint()}
                fallback={
                  <span
                    class="btn-neutral btn-sm btn prose-sm  mr-3
                font-semibold uppercase"
                    onClick={(e) => setSelectedEndpoint(endpoint_slug)}
                  >
                    {endpoint_name}
                  </span>
                }
              >
                <span
                  class="btn-accent btn-sm btn prose-sm  mr-3
                font-semibold uppercase"
                >
                  {endpoint_name}
                </span>
              </Show>
            )}
          </For>
        </div>

        <div class="">
          <input
            ref={filterInputBox!}
            type="text"
            placeholder="Search..."
            class="input w-full max-w-xs text-black"
            value={filterValue()}
            onInput={(e: InputEvent) =>
              setFilterValue((e.currentTarget as HTMLInputElement).value)
            }
          />
        </div>

        <div class="w-max">
          <button
            onClick={importAndAddEntities}
            class="btn-warning btn-sm btn"
            disabled={selectedEntitiesToImport().length === 0}
          >
            Import{" "}
            {props.cardinality === "ZeroOrOne" || props.cardinality === "One"
              ? getEntityDisplayName(props.entityType)
              : getEntityNamePlural(props.entityType)}
          </button>
        </div>

        <For each={schema[props.entityType.toLowerCase()].subclasses_list}>
          {(item) => (
            <span class="btn-sm btn prose-sm ml-3 rounded-sm font-semibold uppercase btn-neutral">
              {item}
            </span>
          )}
        </For>
      </div>
      <div class="mt-24 mr-6 ml-6 overflow-y-scroll pt-8 pl-4 pr-4">
        <Show
          when={itemsToShow().length > 0}
          fallback={
            <div class="prose">
              Type to search{" "}
              {schema[props.entityType].meta.importers[selectedEndpoint()]} for{" "}
              {getEntityNamePlural(props.entityType)}...
            </div>
          }
        >
          <For each={itemsToShow()}>
            {(item) => {
              return (
                <Show
                  when={true} //!item.already_in_db}
                  fallback={
                    <div class="mb-3 flex cursor-not-allowed flex-row items-center justify-between rounded-sm  bg-gray-400 p-3 text-neutral-content">
                      <div class="align-middle">
                        <span class="prose-sm mr-7 select-none font-light uppercase">
                          GND
                        </span>
                        <span>{item.label}</span>
                        <span class="ml-6 text-sm font-extralight">
                          {item.label_extra}
                        </span>
                      </div>
                      <div>
                        <input
                          disabled={true}
                          type="checkbox"
                          class="checkbox-accent checkbox mt-1.5 mr-1.5"
                          checked={true}
                        />
                      </div>
                    </div>
                  }
                >
                  <div
                    class={`mb-3 flex cursor-pointer flex-row items-center justify-between rounded-sm  p-3 text-neutral-content 
                  ${
                    selectedEntitiesToImport().includes(item.id)
                      ? "bg-primary hover:bg-primary-focus"
                      : "bg-neutral hover:bg-neutral-focus"
                  }
                `}
                    onClick={() => {
                      if (selectedEntitiesToImport().includes(item.id)) {
                        removeItemFromSelected(item.id);
                      } else {
                        addItemToSelected(item.id);
                      }
                    }}
                  >
                    <div class="align-middle">
                      <span class="prose-sm mr-7 select-none font-light uppercase">
                        GND
                      </span>
                      <span>{item.label}</span>
                      <span class="ml-6 text-sm font-extralight">
                        {item.label_extra}
                      </span>
                    </div>
                    <div class="flex flex-row items-center">
                      <Show when={item.already_in_db}>
                        <span class="text-accent">
                          <FiDatabase class="mr-4 inline-block" size={18} />
                        </span>
                      </Show>
                      <input
                        disabled={
                          (props.cardinality === "ZeroOrOne" ||
                            props.cardinality === "One") &&
                          selectedEntitiesToImport().length === 1 &&
                          item.id !== selectedEntitiesToImport()[0]
                        }
                        type="checkbox"
                        class="checkbox-accent checkbox mr-1.5"
                        checked={selectedEntitiesToImport().includes(item.id)}
                      />
                    </div>
                  </div>
                </Show>
              );
            }}
          </For>
        </Show>
      </div>
    </Show>
  );
};

const ImporterModal: Component<AutocompleteModalsType> = (props) => {
  const [showImportEntityModal, setShowImportEntityModal] = createSignal(false);
  return (
    <>
      <Show when={schema[props.entityType].meta?.importable === true}>
        <span
          onClick={() => setShowImportEntityModal(true)}
          class="btn-base btn-square btn-sm btn relative top-6 ml-2"
        >
          <BiRegularImport />
        </span>

        <Show when={showImportEntityModal()}>
          <div class="modal modal-open pr-96 pl-96">
            <div class="modal-box min-w-full pt-0 pl-0 pr-0 transition-all">
              <ImportNewEntityModal
                entityType={props.entityType}
                cardinality={props.cardinality}
                selectedList={props.selectedList}
                changeSelectedList={props.changeSelectedList}
                setShowImportEntityModal={setShowImportEntityModal}
              />
            </div>
          </div>
        </Show>
      </Show>
    </>
  );
};

export default ImporterModal;
