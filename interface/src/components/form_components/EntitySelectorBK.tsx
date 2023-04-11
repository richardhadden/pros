import {
  Component,
  createEffect,
  createSignal,
  For,
  Show,
  Setter,
  on,
} from "solid-js";
import { createShortcut } from "@solid-primitives/keyboard";
import { createInfiniteScroll } from "@solid-primitives/pagination";
import { db } from "../../data/db";

import EntityChip from "../ui_components/entityChip";

import { getEntityDisplayName } from "../../utils/entity_names";
import { fetchAutoCompleteData } from "../../data/DataEndpoints";
import { sortBy } from "ramda";

function debounce(cb: CallableFunction, delay = 500) {
  let timeout: number;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}

const LoadingSpinner: Component = (props) => (
  <div role="status" class="flex justify-center">
    <svg
      aria-hidden="true"
      class={`mr-2 h-8 w-8 animate-spin fill-primary text-gray-200 dark:text-gray-600`}
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

type RelationFieldType = {
  uid: string;
  label: string;
  real_type: string;
  relData: object;
};

const EntitySelector: Component<{
  relation_to: string;
  errors?: object;
  onChange: Setter<RelationFieldType[]>;
  cardinalityReached: boolean;
  value: RelationFieldType[];
  after?: Element;
  placeholder?: string;
  exclude?: string[];
}> = (props) => {
  const [autoCompleteTextInput, setAutoCompleteTextInput] = createSignal("");
  const [resultsPanelVisible, setResultsPanelVisible] = createSignal(false);

  const [focusedListIndex, setFocusedListIndex] = createSignal(0);
  const [currentViewedCount, setcurrentViewedCount] = createSignal(0);

  let focusedItemElement;
  let menuElement;

  const handleKeyEnter = async (e: KeyboardEvent) => {
    if (
      e.key === "ArrowDown" &&
      focusedListIndex() < currentViewedCount() - 1
    ) {
      setFocusedListIndex(focusedListIndex() + 1);
      //focusedItemElement.scrollIntoView({
      //  block: "nearest",
      //  inline: "start",
      //});
    } else if (e.key === "ArrowUp" && focusedListIndex() > 0) {
      setFocusedListIndex(focusedListIndex() - 1);
      //focusedItemElement.scrollIntoView({
      //  block: "nearest",
      //  inline: "start",
      //});
    } else if (e.key === "Enter") {
      let dbItemQuery =
        db[props.relation_to.toLowerCase()].orderBy("[real_type+label]");

      if (autoCompleteTextInput()) {
        const filterFunc = (item) => {
          const words_regexes = autoCompleteTextInput()
            .split(" ")
            .map((word) => new RegExp(word, "i"));
          const result = words_regexes
            .map((wre) => wre.test(item.label))
            .every((test) => test); //.test(item.label);

          return result;
        };

        dbItemQuery = dbItemQuery.filter(filterFunc);
      }

      if (props.value.length > 0) {
        const currentSelectedUids = new Set(
          props.value.map((selectedItem) => selectedItem.uid)
        );

        dbItemQuery = dbItemQuery.filter((i) => !currentSelectedUids.has(i.id));
      }

      const itemFromDb = await dbItemQuery
        .offset(focusedListIndex())
        .limit(1)
        .first();

      handleAddSelection(itemFromDb);
      const resp = await fetcher(0);
      setPage(0);
      setPages(resp);
      setFocusedListIndex(0);
      if (!props.cardinalityReached) {
        //focusedItemElement.scrollIntoView({
        //  block: "nearest",
        //  inline: "start",
        //});
      }
    } /*else if (
      e.key === "Backspace" &&
      autoCompleteTextInput().length === 0 &&
      props.value.length > 0
    ) {
      props.onChange(props.value.slice(0, -1));
    }*/
  };

  const handleAddSelection = (item: RelationFieldType) => {
    setAutoCompleteTextInput("");
    props.onChange([...props.value, item]);
    if (props.cardinalityReached) {
      setResultsPanelVisible(false);
    }
  };

  async function fetcher(page): Promise<RelationFieldType[]> {
    if (!resultsPanelVisible()) {
      return [];
    }
    try {
      let resp =
        db[props.relation_to.toLowerCase()].orderBy("[real_type+label]");

      if (autoCompleteTextInput()) {
        const filterFunc = (item) => {
          const words_regexes = autoCompleteTextInput()
            .split(" ")
            .map((word) => new RegExp(word, "i"));
          const result = words_regexes
            .map((wre) => wre.test(item.label))
            .every((test) => test); //.test(item.label);

          return result;
        };

        resp = resp.filter(filterFunc);
      }

      if (props.value.length > 0) {
        const currentSelectedUids = new Set(
          props.value.map((selectedItem) => selectedItem.uid)
        );

        resp = resp.filter((i) => !currentSelectedUids.has(i.id));
      }

      const count = await resp.count();
      if (count < 50) {
        setEnd(true);
      }

      setcurrentViewedCount(count);
      const response = await resp
        .offset(page * 50)
        .limit(50)
        .toArray();

      return response;
    } catch {}
  }

  const [pages, setEl, { end, setEnd, setPage, setPages, page }] =
    createInfiniteScroll(fetcher);

  const handleInputFocusIn = () => {
    setResultsPanelVisible(true);
  };

  const handleInputFocusOut = () => {
    setResultsPanelVisible(false);
  };

  const doUpdateFilteredList = async (inputText) => {
    setAutoCompleteTextInput(inputText);
    const resp = await fetcher(0);
    //setPage(1);
    setPages(resp);
    //setEnd(false);
  };

  createEffect(() => console.log(autoCompleteTextInput()));

  return (
    <Show when={!props.cardinalityReached}>
      <div class="relative">
        <div class="relative col-span-6 flex w-full">
          <input
            type="text"
            class={`${
              props.errors
                ? "border-error focus:border-error "
                : "border-primary focus:border-primary"
            }  mb-4 mt-4 
              w-full rounded-t-md border-b-2 
              border-t-2 border-l-2 
              border-r-2  border-t-transparent border-l-transparent 
              border-r-transparent bg-base-100 pl-5 pr-5 pb-3 pt-3 
              focus:rounded-b-md focus:border-2 focus:border-b-2 
              focus:bg-base-200 focus:shadow-inner  focus:outline-none`}
            value={autoCompleteTextInput()}
            onInput={(e) => doUpdateFilteredList(e.currentTarget.value)}
            onFocusIn={handleInputFocusIn}
            onFocusOut={handleInputFocusOut}
            onKeyDown={handleKeyEnter}
            placeholder={props.placeholder}
          />{" "}
          {props.after}
        </div>
        <Show when={resultsPanelVisible()}>
          <div class="relative z-10 col-span-6 max-h-52 overflow-y-scroll bg-base-100 p-2 pt-2 pb-2">
            <div class="menu" ref={menuElement}>
              <For each={pages()}>
                {(item: RelationFieldType, index) => {
                  return (
                    <Show
                      when={true} // focusedListIndex() === index()}
                      fallback={
                        <EntityChip
                          label={item.label}
                          leftSlot={getEntityDisplayName(item.real_type)}
                          onClick={(e: MouseEvent) => {
                            handleAddSelection(item);
                          }}
                          onMouseEnter={() => setFocusedListIndex(index())}
                        />
                      }
                    >
                      <EntityChip
                        label={item.label}
                        leftSlot={getEntityDisplayName(item.real_type)}
                        onClick={(e: MouseEvent) => handleAddSelection(item)}
                        //ref={focusedItemElement}
                        selected={true}
                      />
                    </Show>
                  );
                }}
              </For>
              <Show when={!end()}>
                <div class="mb-16" ref={setEl}>
                  <LoadingSpinner />
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default EntitySelector;
