import {
  Component,
  createResource,
  Show,
  onMount,
  createSignal,
  lazy,
  Suspense,
  ErrorBoundary,
} from "solid-js";
import { Routes, Route } from "@solidjs/router";

import ViewEntityListView from "./views/ViewEntityListView";
import ViewEntity from "./views/ViewEntityView";
import EditEntityView from "./views/EditEntityView";
import NewEntityView from "./views/NewEntityView";

import Sidebar from "./components/SideBar";
import Login, { userStatus, alreadyLoggedIn } from "./components/Login";
import { EntityData, EntityViewAllData } from "./data/DataEndpoints";
import Testing from "./views/Testing";
import TestingSchema from "./views/TestingSchema";

export const [hasUnsavedChange, setHasUnsavedChange] = createSignal(false);

const Home: Component = () => {
  const [c, setC] = createSignal(true);
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
              <button class="btn btn-primary">Get Started</button>
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
