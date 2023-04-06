import { Setter } from "solid-js";

export type AutocompleteModalsType = {
    relatedToType: string;
    entityType: string;
    selectedList: { uid: string; real_type: string; label: string }[];
    changeSelectedList: Setter<Array<{ uid: string; real_type: string; label: string }>>;
    cardinality: "ZeroOrOne" | "One" | "OneOrMore" | "ZeroOrMore";
  };