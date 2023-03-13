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
export const [floatingPages, setFloatingPages] = createSignal<
  { uid: string; minimised: boolean; real_type: string }[]
>([]);

import {
  DragDropProvider,
  DragDropSensors,
  DragEventHandler,
  createDraggable,
  DragOverlay,
  transformStyle,
} from "@thisbeyond/solid-dnd";
import { DragTest } from "./views/DragTest";
import EntityWindow from "./components/EntityWindow";
import TestList from "./views/TestList";

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
        <For each={floatingPages().filter((item) => !item.minimised)}>
          {(item, index) => (
            <EntityWindow
              id={item.uid}
              minimised={item.minimised}
              entityType={item.real_type}
              top={item.top}
              left={item.left}
              height={item.height}
              width={item.width}
            />
          )}
        </For>
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
                <Route path="/testList" component={TestList} />

                <Route path="/" component={Home} />
              </Suspense>
            </Routes>
            <Show
              when={floatingPages().filter((item) => item.minimised).length > 0}
            >
              <div class="flex flex-row justify-center">
                <div class="fixed bottom-0 z-40 flex w-fit flex-row gap-2 rounded-tl-sm rounded-tr-sm bg-neutral px-3 pb-2 pt-3">
                  <For each={floatingPages().filter((item) => item.minimised)}>
                    {(item) => (
                      <EntityWindow
                        id={item.uid}
                        entityType={item.real_type}
                        minimised={item.minimised}
                        top={null}
                        left={null}
                      />
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </>
  );
};

export default App;
