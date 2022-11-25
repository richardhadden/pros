import {
  Component,
  createEffect,
  For,
  onMount,
  createSignal,
  createMemo,
  Show,
  Accessor,
} from "solid-js";

import { useLocation } from "@solidjs/router";

import UnsavedUnsavedLink from "../utils/UnsavedUnsavedLink";

import { schema, SchemaEntity, SubClasses } from "../index";
import { getEntityNamePlural } from "../utils/entity_names";

import { BsPlus, BsQuestion } from "solid-icons/bs";
import { AiOutlineLine } from "solid-icons/ai";
import { CgAbstract } from "solid-icons/cg";
import { logout, userStatus } from "./login";
import UnsavedLink from "../utils/UnsavedLink";

const SideBarListItems: Component<{
  subclasses: SubClasses | undefined;
  level: number;
}> = ({ subclasses, level }) => {
  const location = useLocation();
  return (
    subclasses && (
      <For each={Object.entries(subclasses)}>
        {([entity_name, entity], index) => (
          <>
            <li class={`ml-4 flex`}>
              {schema[entity_name].meta.abstract ? (
                <div class="btn-group mb-2 grow border-0">
                  <UnsavedLink
                    class={`btn btn-sm w-full ${
                      location.pathname.includes("/entity/" + entity_name)
                        ? " btn-primary"
                        : ""
                    }`}
                    href={`/entity/${entity_name}/`}
                  >
                    {getEntityNamePlural(entity_name)}
                  </UnsavedLink>

                  <UnsavedLink
                    href={`/entity/${entity_name}/new/`}
                    class="btn btn-disabled btn-square btn-sm"
                  >
                    <CgAbstract />
                  </UnsavedLink>
                </div>
              ) : (
                <div class="btn-group mb-2 grow border-0">
                  <UnsavedLink
                    class={`btn btn-sm w-full ${
                      location.pathname.includes("/entity/" + entity_name)
                        ? " btn-primary"
                        : ""
                    }`}
                    href={`/entity/${entity_name}/`}
                  >
                    {getEntityNamePlural(entity_name)}
                  </UnsavedLink>

                  <UnsavedLink
                    href={`/entity/${entity_name}/new/`}
                    class="btn btn-accent btn-square btn-sm"
                  >
                    <BsPlus size={18} />
                  </UnsavedLink>
                </div>
              )}
            </li>
            <Show when={entity.subclasses}>
              <div class="ml-4">
                <SideBarListItems
                  subclasses={entity.subclasses}
                  level={level + 2}
                />
              </div>
            </Show>
          </>
        )}
      </For>
    )
  );
};

const Sidebar: Component = () => {
  const location = useLocation();

  createEffect(() => console.log("LOC", location.pathname));

  const topLevelEntities = createMemo(() =>
    Object.entries(schema).filter(([key, entry], index) => entry.top_level)
  );

  return (
    <div class="drawer drawer-mobile h-full">
      <div class="relative h-full min-h-screen min-w-fit bg-base-300 shadow-inner">
        <div class="mb-4 bg-base-200 p-3 pt-3 pb-5 shadow-inner shadow-2xl">
          <UnsavedLink
            href="/"
            class="prose prose-xl ml-2 mb-4 block text-center font-black hover:text-accent"
          >
            PROS
          </UnsavedLink>
          <div class="flex justify-evenly">
            <span class="prose-sm mt-1 mr-1 font-semibold uppercase">
              User{" "}
            </span>
            <span class="btn btn-disabled btn-sm prose-sm mr-3 ml-1 bg-base-300 text-base-content">
              {userStatus.username}
            </span>{" "}
            <UnsavedLink href="/" class="btn btn-sm" onClick={logout}>
              Log Out
            </UnsavedLink>
          </div>
        </div>
        <ul class="overflow-y-scroll p-4 pr-10 text-base-content ">
          <For each={topLevelEntities()}>
            {([entity_name, entity], index) => (
              <Show when={!schema[entity_name].meta.inline_only}>
                {schema[entity_name].meta.abstract ? (
                  <li class="flex">
                    <div class="btn-group mb-2 grow ">
                      <UnsavedLink
                        href={`/entity/${entity_name}/`}
                        class={`btn btn-sm w-full ${
                          location.pathname.includes("/entity/" + entity_name)
                            ? " btn-primary"
                            : ""
                        }`}
                      >
                        {getEntityNamePlural(entity_name)}
                      </UnsavedLink>

                      <UnsavedLink
                        href={`/entity/${entity_name}/new/`}
                        class="btn btn-disabled btn-square btn-sm"
                      >
                        <CgAbstract />
                      </UnsavedLink>
                    </div>
                  </li>
                ) : (
                  <li class="flex">
                    <div class="btn-group mb-2 grow ">
                      <UnsavedLink
                        href={`/entity/${entity_name}/`}
                        class={`btn btn-sm w-full ${
                          location.pathname.includes("/entity/" + entity_name)
                            ? " btn-primary"
                            : ""
                        }`}
                      >
                        {getEntityNamePlural(entity_name)}
                      </UnsavedLink>
                      <UnsavedLink
                        href={`/entity/${entity_name}/new/`}
                        class="btn btn-accent  btn-square btn-sm"
                      >
                        <BsPlus size={18} />
                      </UnsavedLink>
                    </div>
                  </li>
                )}

                <SideBarListItems subclasses={entity.subclasses} level={1} />
                <Show when={topLevelEntities().length > index() + 1}>
                  <div class="divider" />
                </Show>
              </Show>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
