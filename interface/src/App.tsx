import {
  Component,
  createResource,
  Show,
  onMount,
  createSignal,
  lazy,
  Suspense,
  ErrorBoundary,
  For,
} from "solid-js";
import { Routes, Route } from "@solidjs/router";

import ViewEntityListView from "./views/ViewEntityListView";
import ViewEntity from "./views/ViewEntityView";
import EditEntityView from "./views/EditEntityView";
import NewEntityView from "./views/NewEntityView";
import MergeView from "./views/MergeView";

import Sidebar from "./components/SideBar";
import Login, { userStatus, alreadyLoggedIn } from "./components/Login";
import { EntityData, EntityViewAllData } from "./data/DataEndpoints";
import Testing from "./views/Testing";
import TestingSchema from "./views/TestingSchema";
import { createStore } from "solid-js/store";
import { createEffect } from "solid-js";

export const [hasUnsavedChange, setHasUnsavedChange] = createSignal(false);
export const [floatingPages, setFloatingPages] = createStore({});

import {
  DragDropProvider,
  DragDropSensors,
  DragEventHandler,
  createDraggable,
  DragOverlay,
  transformStyle,
} from "@thisbeyond/solid-dnd";
/*
const Draggable = (props) => {
  const draggable = createDraggable(props.id);
  return (
    <div
      ref={draggable.ref}
      class="draggable-container absolute z-50 border border-black"
      classList={{ "opacity-0": draggable.isActiveDraggable }}
      style={{
        top: "200px",
        left: (props.id === 1 ? 200 : 300) + "px",
      }}
    >
      <div
        class="h-12 cursor-grab bg-primary"
        classList={{ "cursor-grabbed": draggable.isActiveDraggable }}
        {...draggable.dragActivators}
      >
        Entity
      </div>
      <div class="content">
        Draggable <div class="bg-secondary">some other</div>
      </div>
    </div>
  );
};

export const FloatingPages = () => {
  let transform = { x: 0, y: 0 };

  const onDragMove: DragEventHandler = ({ overlay }) => {
    if (overlay) {
      transform = { ...overlay.transform };
    }
  };

  const onDragEnd: DragEventHandler = ({ draggable }) => {
    const node = draggable.node;
    node.style.setProperty("top", node.offsetTop + transform.y + "px");
    node.style.setProperty("left", node.offsetLeft + transform.x + "px");
  };

  return (
    <DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
      <DragDropSensors />

      <Draggable id={1} />
      <Draggable id={2} />

      <DragOverlay>
        {(draggable) => <div class="draggable">Draggable {draggable.id}</div>}
      </DragOverlay>
    </DragDropProvider>
  );
};
*/
const Home: Component = () => {
  return (
    <div class="mt-12 flex flex-grow flex-row justify-center">
      <div class="w-3/6">
        <div class="prose">
          <h1 class="prose-h1">Home</h1>

          <p class="prose-lead">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae a
            veniam consequuntur nesciunt omnis cumque doloremque aperiam tempora
            magnam quas, praesentium rem ex harum numquam vitae ducimus ut vero
            nostrum!
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Error
            aspernatur libero cum deserunt ex exercitationem distinctio, dolorum
            sequi magni earum assumenda quod eaque molestias quos eos placeat
            nisi in autem.
          </p>
        </div>
        <div class="hero mt-12 bg-base-200">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-5xl font-bold">Hello there</h1>
              <p class="py-6">
                Provident cupiditate voluptatem et in. Quaerat fugiat ut
                assumenda excepturi exercitationem quasi. In deleniti eaque aut
                repudiandae et a id nisi.
              </p>
              <button class="btn-primary btn">Get Started</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: Component = () => {
  onMount(alreadyLoggedIn);

  return (
    <>
      <Show when={userStatus.isAuthenticated} fallback={<Login />}>
        <div class="flex h-full">
          <div class="">
            <Sidebar />
          </div>
          <div class="flex-grow pl-5 pr-10">
            <Routes>
              <Suspense>
                <Route
                  path="/entity/:entity_type/new/"
                  component={NewEntityView}
                />
                <Route
                  path="/entity/:entity_type/:uid/"
                  component={ViewEntity}
                  data={EntityData}
                />
                <Route
                  path="/entity/:entity_type/"
                  component={ViewEntityListView}
                  data={EntityViewAllData}
                />
                <Route
                  path="/entity/:entity_type/:uid/merge/"
                  component={MergeView}
                  data={EntityData}
                />
                <Route
                  path="/entity/:entity_type/:uid/edit/"
                  component={EditEntityView}
                  data={EntityData}
                />
                <Route path="/login" component={Login} />
                <Route path="/testing" component={Testing} />
                <Route path="testingSchema" component={TestingSchema} />
                <Route path="/" component={Home} />
              </Suspense>
            </Routes>
          </div>
        </div>
      </Show>
    </>
  );
};

export default App;
