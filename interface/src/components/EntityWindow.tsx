import {
  DragDropProvider,
  DragDropSensors,
  useDragDropContext,
  createDraggable,
  createDroppable,
  transformStyle,
  DragOverlay,
} from "@thisbeyond/solid-dnd";
import { AiOutlineClose } from "solid-icons/ai";
import { VsChromeMinimize } from "solid-icons/vs";
import { createEffect, onMount, Suspense } from "solid-js";
import { createSignal, Show, onCleanup } from "solid-js";
import dataRequest from "../data/dataFunctions";

import { schema } from "../index";
import { EntityView } from "../views/ViewEntityView";
import { floatingPages, setFloatingPages } from "../App";

// bottom-[230px] right-[0px] h-[400px] w-[400px] min-w-[250px]

const EntityWindow = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);
  const [thisUid, setThisUid] = createSignal();
  const draggable = createDraggable(props.id, { some: "thing" });
  const hasBeenDragged = createSignal(false);

  const [data, setData] = createSignal();

  onMount(async () => {
    const app = schema[props.entityType]?.app;
    const response = await dataRequest(
      `${app}/${props.entityType}/${props.id}`
    );
    setData(response);
    console.log("STARTOFFSET", props.startOffset);
  });

  const tsregex = /(-?\d*?)px, (-?\d*?)px/g;
  const modTS = (ts) => {
    const [x, y] = ts.transform
      .match(tsregex)[0]
      .split(",")
      .map((i) => 1 * i.replace("px", ""));
    const xMod = x + props.left;
    const yMod = y + props.top;
    return { transform: `translate3d(${xMod}px, ${yMod}px, 0)` };
  };

  createEffect(() =>
    console.log(
      "iad",
      draggable.isActiveDraggable,
      modTS(transformStyle(draggable.transform))
    )
  );

  function clickOutside(el, accessor) {
    const onClick = (e) => {
      return (
        !el.contains(e.target) &&
        e.target?.offsetParent?.dataset?.drag &&
        accessor()?.()
      );
    };
    document.body.addEventListener("mousedown", onClick);
    onCleanup(() => document.body.removeEventListener("click", onClick));
  }

  const onClickClose = (e) => {
    setFloatingPages(floatingPages().filter((item) => item.uid !== props.id));
  };

  const onClickMinimise = (e) => {
    setFloatingPages(
      floatingPages().map((item) =>
        item.uid === props.id ? { ...item, minimised: true } : item
      )
    );
  };

  const onClickMaximise = (e) => {
    setFloatingPages(
      floatingPages().map((item) =>
        item.uid === props.id ? { ...item, minimised: false } : item
      )
    );
  };

  return (
    <Show
      when={!props.minimised}
      fallback={
        <Show when={data()}>
          <div
            onClick={onClickMaximise}
            class="cursor-pointer select-none rounded-sm bg-primary py-1 px-3 text-primary-content hover:bg-primary-focus"
          >
            <span class="prose-sm mr-5 font-light uppercase">
              {data().real_type}
            </span>
            {data().label}
          </div>
        </Show>
      }
    >
      <Suspense>
        <div
          id={props.id}
          data-drag={true}
          onMouseDown={() => setIsFocused(true)}
          use:clickOutside={() => setIsFocused(false)}
          ref={draggable.ref}
          class={`draggable scroll group fixed  h-[300px] w-[300px] justify-between overflow-hidden shadow-lg transition-shadow hover:resize hover:shadow-2xl`}
          style={
            draggable.isActiveDraggable
              ? modTS(transformStyle(draggable.transform))
              : `top: ${props.top}px; left: ${props.left}px;`
          }
          classList={{
            "z-50": isFocused(),
            "z-40": !isFocused(),
          }}
        >
          <div
            class="handle m-0 flex w-full  cursor-grab flex-row rounded-tl-sm rounded-tr-sm bg-neutral p-0 text-neutral-content transition-colors active:cursor-grabbing group-hover:bg-neutral-focus"
            {...draggable.dragActivators}
          >
            <Show when={data()}>
              <div class="mx-auto">
                <div class=" my-2.5 w-fit overflow-x-clip whitespace-nowrap bg-primary px-3 py-1 text-sm font-semibold text-primary-content">
                  {data().label}
                </div>
              </div>
            </Show>
            <div
              class="btn-accent btn-square btn-md btn m-0 mr-px rounded-tr-none rounded-bl-none rounded-br-none rounded-tl-none"
              onClick={onClickMinimise}
            >
              <VsChromeMinimize />
            </div>
            <div
              class="btn-accent btn-square btn-md btn m-0 rounded-tr-sm rounded-bl-none rounded-br-none rounded-tl-none"
              onClick={onClickClose}
            >
              <AiOutlineClose size={16} />
            </div>
          </div>
          <Show when={data()}>
            <div class="content h-full w-full resize overflow-y-scroll bg-white p-5 hover:resize">
              <EntityView
                data={data}
                params={{ entity_type: data().real_type, uid: data().uid }}
              />
            </div>
          </Show>
        </div>
      </Suspense>
    </Show>
  );
};

export default EntityWindow;
