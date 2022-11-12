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
import { CgAbstract } from "solid-icons/cg";

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
      <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col items-center justify-center">
        <label
          for="my-drawer-2"
          class="btn btn-primary drawer-button lg:hidden"
        >
          Open drawer
        </label>
      </div>
      <div class="h-full min-h-screen min-w-fit bg-base-300 shadow-inner">
        <label for="my-drawer-2" class="drawer-overlay">
          Hello
        </label>
        <ul class="overflow-y-auto p-4 pr-10 text-base-content ">
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
