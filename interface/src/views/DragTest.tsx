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
import { createSignal, Show, onCleanup } from "solid-js";

let [items, setItems] = createSignal([
  { id: "Birth of John Smith" },
  { id: "Some other thing" },
]);

const Draggable = (props) => {
  const [isMinimised, setIsMinimised] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);
  const draggable = createDraggable(props.id);

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
    <Show when={!isMinimised()}>
      <div
        data-drag={true}
        onMouseDown={() => setIsFocused(true)}
        use:clickOutside={() => setIsFocused(false)}
        ref={draggable.ref}
        class="draggable scroll group absolute bottom-[230px] right-[0px] h-[400px] w-[400px] min-w-[250px] justify-between overflow-hidden shadow-lg  transition-shadow hover:resize hover:shadow-2xl"
        style={transformStyle(draggable.transform)}
        classList={{
          "z-50": isFocused(),
        }}
      >
        <div
          class="handle m-0 flex w-full  cursor-grab flex-row rounded-tl-sm rounded-tr-sm bg-neutral p-0 text-neutral-content transition-colors active:cursor-grabbing group-hover:bg-neutral-focus"
          {...draggable.dragActivators}
        >
          <div class="mx-auto">
            <div class=" my-2.5 w-fit overflow-x-clip whitespace-nowrap bg-primary px-3 py-1 text-sm font-semibold text-primary-content">
              {props.id}
            </div>
          </div>
          <div
            class="btn btn-accent btn-square btn-md m-0 mr-px rounded-tr-none rounded-bl-none rounded-br-none rounded-tl-none"
            onClick={() => alert("yo")}
          >
            <VsChromeMinimize />
          </div>
          <div
            class="btn btn-accent btn-square btn-md m-0 rounded-tr-sm rounded-bl-none rounded-br-none rounded-tl-none"
            onClick={() => alert("yo")}
          >
            <AiOutlineClose size={16} />
          </div>
        </div>
        <div class="content h-full w-full resize bg-white p-5 hover:resize">
          CONTENT {isFocused() ? "FOCUSED" : ""}
        </div>
      </div>
    </Show>
  );
};

export const DragTest = () => {
  let transform = { x: 0, y: 0 };

  const onDragMove = ({ draggable }) => {
    transform = { ...draggable.transform };
  };

  const onDragEnd = ({ draggable }) => {
    const node = draggable.node;
    node.style.setProperty("top", node.offsetTop + transform.y + "px");
    node.style.setProperty("left", node.offsetLeft + transform.x + "px");
  };

  return (
    <div class="min-h-15 relative h-full w-full">
      <For each={items()}>
        {(item) => <Draggable id={item.id} selected={item.selected} />}
      </For>
    </div>
  );
};
