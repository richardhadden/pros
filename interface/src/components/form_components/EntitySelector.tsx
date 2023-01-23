import {
  Component,
  createEffect,
  createSignal,
  For,
  Show,
  Setter,
} from "solid-js";

import EntityChip from "../ui_components/entityChip";

import { getEntityDisplayName } from "../../utils/entity_names";
import { fetchAutoCompleteData } from "../../data/DataEndpoints";
import { sortBy } from "ramda";

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
  const [autoCompleteData, setAutoCompleteData] = createSignal([]);

  const [filteredAutoCompleteData, setFilteredAutoCompleteData] = createSignal(
    []
  );
  const handleKeyEnter = (e: KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      filteredAutoCompleteData().length > 0 &&
      autoCompleteTextInput() !== ""
    ) {
      handleAddSelection(filteredAutoCompleteData()[0]);
    }
  };

  const notExcluded = (uid: string) => {
    if (props.exclude) {
      return !props.exclude.includes(uid);
    }
    return true;
  };

  const handleInputFocusIn = async () => {
    setResultsPanelVisible(true);
    //console.log(autoCompleteData.length);
    if (autoCompleteData().length === 0) {
      const data = await fetchAutoCompleteData(props.relation_to.toLowerCase());
      setAutoCompleteData(data);
      setFilteredAutoCompleteData(
        autoCompleteData().filter((item: RelationFieldType) => {
          const r = new RegExp(autoCompleteTextInput(), "i");
          return (
            r.test(item.label) &&
            !props.value
              .map((item: RelationFieldType) => item.uid)
              .includes(item.uid) &&
            notExcluded(item.uid)
          );
        })
      );
    }
  };

  //createEffect(() => console.log("Edit field VALUE>>", props.value));

  createEffect(() => {
    setFilteredAutoCompleteData(
      autoCompleteData().filter((item: RelationFieldType) => {
        const r = new RegExp(autoCompleteTextInput(), "i");
        return (
          r.test(item.label) &&
          !props.value
            .map((item: RelationFieldType) => item.uid)
            .includes(item.uid)
        );
      })
    );
  });

  const handleAddSelection = (item: RelationFieldType) => {
    setAutoCompleteTextInput("");
    props.onChange([...props.value, item]);
  };
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
            onFocusOut={() => setResultsPanelVisible(false)}
            onKeyPress={handleKeyEnter}
            placeholder={props.placeholder}
          />{" "}
          {props.after}
        </div>
        <Show when={resultsPanelVisible()}>
          <div class="dropdown rounded-box relative z-50 max-h-52 w-full overflow-y-scroll bg-base-100 p-2 shadow-xl">
            <ul class=" menu ">
              <For each={filteredAutoCompleteData()}>
                {(item: RelationFieldType, index) => (
                  <EntityChip
                    label={item.label}
                    leftSlot={getEntityDisplayName(item.real_type)}
                    color="primary"
                    onClick={(e: MouseEvent) => handleAddSelection(item)}
                  />
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default EntitySelector;
