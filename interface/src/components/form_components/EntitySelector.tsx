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

  const [filteredAutoCompleteData, setFilteredAutoCompleteData] = createSignal(
    []
  );
  const [focusedListItem, setFocusedListItem] = createSignal(null);
  const [focusedListIndex, setFocusedListIndex] = createSignal(0);
  const [currentViewedCount, setcurrentViewedCount] = createSignal(0);

  let focusedItemElement;
  let menuElement;

  const handleKeyEnter = async (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
    }

    if (
      e.key === "ArrowDown" &&
      focusedListIndex() < currentViewedCount() - 1
    ) {
      setFocusedListIndex(focusedListIndex() + 1);
      focusedItemElement.scrollIntoView({
        block: "nearest",
        inline: "start",
      });
    } else if (e.key === "ArrowUp" && focusedListIndex() > 0) {
      setFocusedListIndex(focusedListIndex() - 1);
      focusedItemElement.scrollIntoView({
        block: "nearest",
        inline: "start",
      });
    } else if (e.key === "Enter") {
      let dbItemQuery = db[props.relation_to.toLowerCase()]
        .orderBy("[real_type+label]")
        .filter((item) => !item.is_deleted);

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
        focusedItemElement.scrollIntoView({
          block: "nearest",
          inline: "start",
        });
      }
    } else if (
      e.key === "Backspace" &&
      autoCompleteTextInput().length === 0 &&
      props.value.length > 0
    ) {
      props.onChange(props.value.slice(0, -1));
    }
  };

  const handleInputFocusIn = async () => {
    // Update data from server
    await fetchAutoCompleteData(props.relation_to.toLowerCase());
    // Set results panel visible
    setResultsPanelVisible(true);
    const resp = await fetcher(0);

    setPage(1);
    setPages(resp);
  };

  const handleInputFocusOut = () => {
    setResultsPanelVisible(false);
    setFocusedListIndex(0);
  };

  const handleAddSelection = (item: RelationFieldType) => {
    setAutoCompleteTextInput("");
    props.onChange([...props.value, item]);
    if (props.cardinalityReached) {
      setResultsPanelVisible(false);
    }
  };

  async function fetcher(page: number): Promise<RelationFieldType[]> {
    if (!resultsPanelVisible()) {
      return [];
    }
    try {
      let resp = db[props.relation_to.toLowerCase()]
        .orderBy("[real_type+label]")
        .filter((item) => !item.is_deleted);

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
      } else {
        setEnd(false);
      }

      setcurrentViewedCount(count);

      const response = await resp
        .offset(page * 50)
        .limit(50)
        .toArray();

      return response;
    } catch {
      return [];
    }
  }

  const [pages, setEl, { end, setEnd, setPage, setPages, page }] =
    createInfiniteScroll(fetcher);

  const doUpdateFilteredList = debounce(async () => {
    const resp = await fetcher(0);

    setPage(1);
    setPages(resp);
    setEnd(false);
  }, 100);

  createEffect(
    on(autoCompleteTextInput, () => {
      if (resultsPanelVisible()) {
        doUpdateFilteredList();
      }
    })
  );

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
            onInput={(e) => setAutoCompleteTextInput(e.currentTarget.value)}
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
                      when={focusedListIndex() === index()}
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
                        ref={focusedItemElement}
                        selected={true}
                      />
                    </Show>
                  );
                }}
              </For>
              <Show when={!end()}>
                <div class="" ref={setEl}></div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default EntitySelector;
