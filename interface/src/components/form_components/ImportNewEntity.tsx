import {
  Component,
  For,
  Show,
  onMount,
  Setter,
  Accessor,
  createSignal,
  createEffect,
} from "solid-js";
import { FiDatabase } from "solid-icons/fi";
import { schema } from "../../index";

import {
  getEntityDisplayName,
  getEntityNamePlural,
} from "../../utils/entity_names";

import {
  getImportList,
  ImportListData,
} from "../../../../pros_import/interface/data";

function debounce(cb: CallableFunction, delay = 500) {
  let timeout: number;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}

const ImportNewEntity: Component<{
  selectedEntitiesToImport: string[];
  setSelectedEntitiesToImport: Setter<Array<string>>;
  onClickImport: () => Promise<void>;
  entityType: Accessor<any>;
  setEntityType: Setter<string>;
  initialType: string;
  fieldName?: string;
  cardinality: "ZeroOrOne" | "One" | "OneOrMore" | "ZeroOrMore";
}> = (props) => {
  const [filterValue, setFilterValue] = createSignal("");
  const [itemsToShow, setItemsToShow] = createSignal<ImportListData>([]);

  let filterInputBox: HTMLInputElement;

  onMount(() => {
    filterInputBox.focus();
  });

  const getData = debounce(async () => {
    console.log;
    const data = await getImportList(props.entityType(), filterValue());
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
      ...props.selectedEntitiesToImport,
      item_id,
    ] as string[];
    props.setSelectedEntitiesToImport(newSelectedItems);
  };

  const removeItemFromSelected = (item_id: string) => {
    const newSelectedItems = props.selectedEntitiesToImport.filter(
      (current_item) => current_item != item_id
    );
    props.setSelectedEntitiesToImport(newSelectedItems);
  };

  createEffect(() =>
    console.log("selectedItems", props.selectedEntitiesToImport)
  );

  return (
    <Show when={schema[props.initialType.toLowerCase()]}>
      <div class="fixed flex w-full flex-row items-center justify-between bg-neutral bg-opacity-80 p-6">
        <div>
          <span class="select-none font-semibold uppercase text-neutral-content">
            Import
          </span>

          <span
            class="btn-neutral btn-sm btn prose-sm ml-3
           font-semibold uppercase"
          >
            {getEntityDisplayName(props.initialType)}
          </span>
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
            onClick={props.onClickImport}
            class="btn-warning btn-sm btn"
            disabled={props.selectedEntitiesToImport.length === 0}
          >
            Import and add selected{" "}
            {props.cardinality === "ZeroOrOne" || props.cardinality === "One"
              ? getEntityDisplayName(props.initialType)
              : getEntityNamePlural(props.initialType)}
          </button>
        </div>

        <For each={schema[props.initialType.toLowerCase()].subclasses_list}>
          {(item) => (
            <span
              onClick={() => props.setEntityType(item.toLowerCase())}
              class={`btn-sm btn prose-sm ml-3 rounded-sm font-semibold uppercase ${
                item.toLowerCase() === props.entityType()
                  ? "btn-accent"
                  : "btn-neutral"
              }`}
            >
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
              Type to search the GND for{" "}
              {getEntityNamePlural(props.initialType)}...
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
                  props.selectedEntitiesToImport.includes(item.id)
                    ? "bg-primary hover:bg-primary-focus"
                    : "bg-neutral hover:bg-neutral-focus"
                }
              `}
                    onClick={() => {
                      if (props.selectedEntitiesToImport.includes(item.id)) {
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
                          props.selectedEntitiesToImport.length === 1 &&
                          item.id !== props.selectedEntitiesToImport[0]
                        }
                        type="checkbox"
                        class="checkbox-accent checkbox mr-1.5"
                        checked={props.selectedEntitiesToImport.includes(
                          item.id
                        )}
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

export default ImportNewEntity;
