import { Component, For } from "solid-js";

import TopBar from "../../../interface/src/components/TopBar";

const SAMPLE = [
  {
    uid: "12345",
    label: "Geography",
    _children: [
      {
        uid: "7899",
        label: "North America",
        _children: [
          {
            uid: "7899",
            label: "United States of America",
            _children: [
              {
                uid: "7899",
                label: "Cincinatti",
                _children: [],
              },
              {
                uid: "7899",
                label: "Kansas City",
                _children: [],
              },
            ],
          },
          {
            uid: "7899",
            label: "Canada",
            _children: [
              {
                uid: "7899",
                label: "Montreal",
                _children: [
                  {
                    uid: "7899",
                    label: "Tabernacle",
                    _children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    uid: "7899",
    label: "Jobs",
    _children: [
      {
        uid: "7899",
        label: "Teacher",
        _children: [],
      },
      {
        uid: "7899",
        label: "Librarian",
        _children: [],
      },
      {
        uid: "7899",
        label: "Tech Bro",
        _children: [],
      },
    ],
  },
];

const NestedRender: Component = (props) => {
  return (
    <For each={props.items}>
      {(item, index) => (
        <>
          <div class={`col-start-${props.n} bg-red-100 p-3`}>{item.label}</div>
          <NestedRender items={item._children} n={props.n + 1} />
          <div class={`col-span-${6 - props.n}`}></div>
        </>
      )}
    </For>
  );
};

const VocabTerm: Component = (props) => {
  return (
    <>
      <TopBar
        params={props.params}
        barCenter={
          <span class="prose-sm font-semibold uppercase">
            Edit Vocabularies
          </span>
        }
        saveButton={true}
        onClickSaveButton={(e: MouseEvent) => alert("save!")}
      />
      <div class="mt-32 grid grid-cols-6" style="display: grid;">
        <For each={SAMPLE}>
          {(item, index) => (
            <>
              <div
                class={`prose-sm col-start-1 bg-red-100 p-3 font-semibold uppercase`}
              >
                {item.label}
              </div>
              <NestedRender items={item._children} n={2} />
              <div class={`col-span-6 h-10`}></div>
            </>
          )}
        </For>
      </div>
    </>
  );
};

export default VocabTerm;
