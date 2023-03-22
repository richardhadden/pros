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

import { makeResizeObserver } from "@solid-primitives/resize-observer";

// bottom-[230px] right-[0px] h-[400px] w-[400px] min-w-[250px]

const EntityWindow = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);
  const [thisUid, setThisUid] = createSignal();
  /*const { observe, unobserve } = makeResizeObserver(onResizeElement, {
    box: "content-box",
  });*/
  let draggableContainer: HTMLElement;
  let draggableHeader: HTMLElement;

  /*function onResizeElement(e) {
    console.log("resized");
  }*/

  const [data, setData] = createSignal();

  onMount(async () => {
    if (draggableContainer) {
      dragElement(draggableContainer);
      //observe(draggableContainer);
      draggableContainer.style.top = props.top ? props.top + "px" : "0px";
      draggableContainer.style.left = props.left ? props.left + "px" : "0px";
      draggableContainer.style.height = props.height ? props.height : "300px";
      draggableContainer.style.width = props.width ? props.width : "300px";
    }
    const app = schema[props.entityType]?.app;
    const response = await dataRequest(
      `${app}/${props.entityType}/${props.id}`
    );
    setData(response);
  });

  // Make the DIV element draggable:

  function dragElement(elmnt) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    if (elmnt) {
      elmnt.addEventListener("resize", onResize);
    }

    if (draggableHeader) {
      draggableHeader.onmousedown = dragMouseDown;
    }

    function onResize(e) {
      console.log(e);
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      const top = elmnt.offsetTop - pos2;
      const left = elmnt.offsetLeft - pos1;
      const windowWidth = window.innerWidth;
      if (top < 0) {
        elmnt.style.top = "0px";
      } else {
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
      }

      if (left < 0) {
        elmnt.style.left = "0px";
      } else if (left > windowWidth) {
        elmnt.style.left = windowWidth + "px";
      } else {
        elmnt.style.left = left + "px";
      }
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  const onClickMinimise = (e) => {
    const node = draggableContainer;

    setFloatingPages(
      floatingPages().map((item) =>
        item.uid === props.id
          ? {
              ...item,
              minimised: true,
              top: node?.offsetTop,
              left: node?.offsetLeft,
              height: node?.style.height,
              width: node?.style.width,
            }
          : item
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

  const onClickClose = (e) => {
    setFloatingPages(floatingPages().filter((item) => item.uid !== props.id));
  };

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
          ref={draggableContainer}
          class={`draggable scroll group fixed  h-[300px] w-[300px] justify-between overflow-hidden shadow-2xl outline-1 outline-offset-1 outline-slate-300 transition-shadow hover:resize hover:shadow-2xl`}
          classList={{
            "z-50": isFocused(),
            "z-40": !isFocused(),
          }}
          onresize={() => alert("yo")}
        >
          <div
            class="handle m-0 flex w-full  cursor-grab flex-row rounded-tl-sm rounded-tr-sm bg-neutral p-0 text-neutral-content transition-colors active:cursor-grabbing group-hover:bg-neutral-focus"
            ref={draggableHeader}
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
            <div class="content z-50 h-full w-full resize  overflow-y-scroll bg-white p-5 hover:resize ">
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
