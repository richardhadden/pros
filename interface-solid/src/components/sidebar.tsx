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

import { Link } from "@solidjs/router";

import { schema, SchemaEntity, SubClasses } from "../index";
import { getEntityNamePlural } from "../utils/entity_names";

import { BsPlus, BsQuestion } from "solid-icons/bs";
import { AiOutlineLine } from "solid-icons/ai";
import { CgAbstract } from "solid-icons/cg";
import { logout, userStatus } from "./login";

const SideBarListItems: Component<{
  subclasses: SubClasses | undefined;
  level: number;
}> = ({ subclasses, level }) => {
  return (
    subclasses && (
      <For each={Object.entries(subclasses)}>
        {([entity_name, entity], index) => (
          <>
            <li class={`ml-4 flex`}>
              {schema[entity_name].meta.abstract ? (
                <div class="btn-group mb-2 grow border-0">
                  <Link
                    class="btn btn-sm w-full"
                    href={`/entity/${entity_name}/`}
                  >
                    {getEntityNamePlural(entity_name)}
                  </Link>

                  <Link
                    href={`/entity/${entity_name}/new/`}
                    class="btn btn-disabled btn-square btn-sm"
                  >
                    <CgAbstract />
                  </Link>
                </div>
              ) : (
                <div class="btn-group mb-2 grow border-0">
                  <Link
                    class="btn btn-sm w-full"
                    href={`/entity/${entity_name}/`}
                  >
                    {getEntityNamePlural(entity_name)}
                  </Link>

                  <Link
                    href={`/entity/${entity_name}/new/`}
                    class="btn btn-accent btn-square btn-sm"
                  >
                    <BsPlus />
                  </Link>
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
  const topLevelEntities = createMemo(() =>
    Object.entries(schema).filter(([key, entry], index) => entry.top_level)
  );

  return (
    <div class="drawer-mobile drawer h-full">
      <div class="relative h-full min-h-screen min-w-fit bg-base-300 shadow-inner">
        <div class="mb-4 bg-base-200 p-3 pt-3 pb-5 shadow-inner ">
          <Link
            href="/"
            class="prose prose-xl ml-2 mb-4 block text-center font-black hover:text-accent"
          >
            PROS
          </Link>
          <div class="flex justify-evenly">
            <span class="prose-sm mt-1 mr-1 font-semibold uppercase">
              User{" "}
            </span>
            <span class="btn btn-disabled btn-sm prose-sm mr-3 ml-1 bg-base-300 text-base-content">
              {userStatus.username}
            </span>{" "}
            <Link href="/" class="btn btn-sm" onClick={logout}>
              Log Out
            </Link>
          </div>
        </div>
        <ul class="overflow-y-scroll p-4 pr-10 text-base-content ">
          <For each={topLevelEntities()}>
            {([entity_name, entity], index) => (
              <>
                {schema[entity_name].meta.abstract ? (
                  <li class="flex">
                    <div class="btn-group mb-2 grow ">
                      <Link
                        href={`/entity/${entity_name}/`}
                        class="btn btn-sm  w-full"
                      >
                        {getEntityNamePlural(entity_name)}
                      </Link>

                      <Link
                        href={`/entity/${entity_name}/new/`}
                        class="btn btn-disabled btn-square btn-sm"
                      >
                        <CgAbstract />
                      </Link>
                    </div>
                  </li>
                ) : (
                  <li class="flex">
                    <div class="btn-group mb-2 grow ">
                      <Link
                        href={`/entity/${entity_name}/`}
                        class="btn btn-sm  w-full"
                      >
                        {getEntityNamePlural(entity_name)}
                      </Link>
                      <Link
                        href={`/entity/${entity_name}/new/`}
                        class="btn btn-accent  btn-square btn-sm"
                      >
                        <BsPlus />
                      </Link>
                    </div>
                  </li>
                )}

                <SideBarListItems subclasses={entity.subclasses} level={1} />
                <Show when={topLevelEntities().length > index() + 1}>
                  <div class="divider" />
                </Show>
              </>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
