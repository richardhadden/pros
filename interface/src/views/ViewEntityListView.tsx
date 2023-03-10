import { CUSTOM_LIST_VIEW_PAGES } from "../../interface-config.js";

import {
  Accessor,
  Component,
  createEffect,
  createSignal,
  For,
  onMount,
  Show,
  Switch,
  Match,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { useParams, useRouteData, useSearchParams } from "@solidjs/router";

import UnsavedLink from "../utils/UnsavedLink";
import { AiFillDelete } from "solid-icons/ai";
import { AiFillClockCircle } from "solid-icons/ai";
import { AiFillCheckCircle } from "solid-icons/ai";
import TopBar from "../components/TopBar";
import {
  getEntityDisplayName,
  getEntityNamePlural,
} from "../utils/entity_names";
import { filter } from "ramda";
import { ViewEntityTypeData } from "../data/DataEndpoints";
import { BsLink } from "solid-icons/bs";
import { schema } from "../index";
/*
const x = <div class="navbar bg-neutral text-neutral-content rounded-b-lg pr-0 pt-0 pb-0 ml-12 max-w-7xl">
    <div class="navbar-start ml-3 prose-xl font-semibold">{getEntityNamePlural(params.entity_type).toUpperCase()}</div>
    {!schema[params.entity_type].meta.abstract && <div class="navbar-end"><Link href={`/entity/${params.entity_type}/new/`} class="btn btn-lg  btn-square btn-accent rounded-tl-none rounded-tr-none rounded-bl-none"><BsPlus size={28} /></Link></div>}

</div>*/
const custom_list_view_pages = CUSTOM_LIST_VIEW_PAGES as {
  [key: string]: Component<{}>;
};

const LoadingSpinner: Component = (props) => (
  <div role="status" class="flex justify-center">
    <svg
      aria-hidden="true"
      class={`mr-2 h-8 w-8 animate-spin fill-primary text-gray-200 dark:text-gray-600`}
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
    <span class="sr-only">Loading...</span>
  </div>
);

function debounce(cb: CallableFunction, delay = 500) {
  let timeout: number;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}

const nested_get = (
  nested: object | object[] | string[],
  keys: string[] | number[]
): string => {
  const k = keys.shift();
  if (keys.length > 0) {
    if (nested.constructor === Array) {
      if (k === "__all__") {
        //console.log(k);

        return nested
          .map((n) => {
            const keycopy = [...keys];
            return nested_get(n, keycopy);
          })
          .join(", ");
      }
      return nested_get(nested[0][k], keys);
    }
    return nested_get(nested[k], keys);
  } else {
    if (nested.constructor === Array) {
      return nested[0][k];
    }

    return nested[k];
  }
};

const build_label_template = (item: ViewEntityTypeData, template: string) => {
  try {
    const re = new RegExp("({.*?})", "g");
    const matches = [...template.matchAll(re)];
    matches.forEach((match) => {
      let s;
      if (match[0].includes(".")) {
        const es = match[0].replaceAll("{", "").replaceAll("}", "").split(".");
        s = nested_get(item, es);
      } else {
        s = item[match[0].replaceAll("{", "").replaceAll("}", "")];
      }
      template = template.replace(new RegExp(match[0]), s);
      template = template.replaceAll("undefined", "");
      template = template.replace(/\s\s+/g, " ");
    });
    return template;
  } catch (error) {
    return item.label;
  }
};

const ViewEntityListView: Component = () => {
  const params: { entity_type: string; uid: string } = useParams();
  const [data, refetchData] =
    useRouteData<[Accessor<ViewEntityTypeData[]>, CallableFunction]>();
  const [searchParams, setSearchParams] = useSearchParams<array>();
  const [filterValue, setFilterValue] = createSignal<string>("");
  const [showFilteringSpinner, setShowFilteringSpinner] =
    createSignal<boolean>(false);

  onMount(() => {
    setFilterValue(searchParams.filter || "");
  });

  const doFilter = debounce(setSearchParams);

  const onFilterInput = (value: string) => {
    console.log(value);
    setFilterValue(value);
    doFilter({ filter: filterValue() });
    setShowFilteringSpinner(true);
  };

  createEffect(() => {
    params.entity_type;
    setShowFilteringSpinner(true);
  });

  createEffect(() => {
    data();
    setShowFilteringSpinner(false);
  });

  createEffect(() => console.log("DATA", data()));

  return (
    <Switch>
      <Match when={custom_list_view_pages[params.entity_type]}>
        <Dynamic
          component={custom_list_view_pages[params.entity_type]}
          data={data()}
          params={params}
        />
      </Match>
      <Match when={true}>
        <TopBar
          params={params}
          barTitle={
            <div class="prose-sm ml-3 inline-block select-none rounded-sm bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
              {getEntityNamePlural(params.entity_type)}
            </div>
          }
          barCenter={
            <div class="relative flex">
              <input
                type="text"
                placeholder="Filter..."
                class="input w-full max-w-xs text-black"
                value={filterValue()}
                onInput={(e: InputEvent) =>
                  onFilterInput((e.currentTarget as HTMLInputElement).value)
                }
              />
            </div>
          }
          newButton={true}
        />

        <Show
          when={data() && showFilteringSpinner() == false}
          fallback={
            <div class="mx-auto mt-32  ml-6 ">
              <LoadingSpinner />
            </div>
          }
        >
          <div class="mx-auto mt-32  ml-6 ">
            <Show when={showFilteringSpinner()}>
              <LoadingSpinner />
            </Show>
            <For each={Object.entries(data())}>
              {([entity_name, items], index) => (
                <>
                  <div class="grid grid-cols-8 gap-y-6">
                    <div class="col-span-1 rounded-l-md pt-4 pb-6 pl-3">
                      <h2 class="prose-md select-none font-semibold uppercase text-base-content">
                        {getEntityNamePlural(entity_name)}
                      </h2>
                    </div>
                    <div class="col-span-5 pt-4 pb-6 pr-4">
                      <For each={items}>
                        {(item) => {
                          console.log(item);
                          return (
                            <div>
                              <Switch>
                                <Match when={item.is_merged_item}>
                                  <div class="flex flex-row items-center">
                                    <UnsavedLink
                                      href={`/entity/${entity_name}/${item.uid}`}
                                      class={`mb-3 flex h-fit flex-1 cursor-pointer flex-row rounded-sm p-3 text-neutral-content  ${
                                        item.is_deleted
                                          ? "bg-gray-400 hover:bg-gray-500"
                                          : "bg-primary hover:bg-primary-focus"
                                      }`}
                                    >
                                      <div class="flex w-fit flex-col justify-center">
                                        <div>
                                          <span class="prose-sm mr-7 select-none font-light uppercase">
                                            {getEntityDisplayName(
                                              item.real_type
                                            )}
                                          </span>
                                        </div>
                                      </div>{" "}
                                      <div class="relative">
                                        <div class="inline-block font-semibold">
                                          {item.label}
                                        </div>
                                      </div>
                                      <div class="right-0 ml-auto flex flex-row items-center justify-self-end">
                                        {item.is_deleted && (
                                          <div class="relative mr-2 flex flex-row">
                                            <AiFillDelete
                                              size={16}
                                              class="mt-0.5 text-gray-600"
                                            />
                                            {item.deleted_and_has_dependent_nodes ? (
                                              <AiFillClockCircle
                                                size={16}
                                                class="mt-0.5 ml-2 rounded-full text-warning"
                                              />
                                            ) : (
                                              <AiFillCheckCircle
                                                size={16}
                                                class="mt-0.5 ml-2 text-success"
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </UnsavedLink>
                                    <div class="ml-1 mr-1 flex flex-col justify-center text-primary">
                                      <BsLink class="relative bottom-[5px]" />
                                    </div>

                                    <For each={item.merged_items}>
                                      {(mergedItem, index) => (
                                        <>
                                          <UnsavedLink
                                            href={`/entity/${entity_name}/${mergedItem.uid}`}
                                            class={`mb-3  flex h-fit cursor-pointer flex-row rounded-sm pb-2 pt-2 pl-4 pr-2 text-neutral-content  ${
                                              mergedItem.is_deleted
                                                ? "bg-gray-400 hover:bg-gray-500"
                                                : "bg-primary hover:bg-primary-focus"
                                            }`}
                                          >
                                            <div class="relative">
                                              <div class="mr-2 inline-block text-xs font-semibold">
                                                {mergedItem.label}
                                              </div>
                                            </div>
                                            <div class="right-0 ml-auto justify-self-end">
                                              {mergedItem.is_deleted && (
                                                <div class="relative mr-2 flex flex-row">
                                                  <AiFillDelete
                                                    size={14}
                                                    class="mt-[6px]  text-gray-600"
                                                  />
                                                  {mergedItem.deleted_and_has_dependent_nodes ? (
                                                    <AiFillClockCircle
                                                      size={14}
                                                      class="mt-[6px] ml-1 rounded-full text-warning"
                                                    />
                                                  ) : (
                                                    <AiFillCheckCircle
                                                      size={14}
                                                      class="mt-[6px] ml-1 text-success"
                                                    />
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </UnsavedLink>
                                          <Show
                                            when={
                                              index() <
                                              item.merged_items.length - 1
                                            }
                                          >
                                            <div class="ml-1 mr-1 flex flex-col justify-center text-primary-focus">
                                              <BsLink class="relative bottom-[5px]" />
                                            </div>
                                          </Show>
                                        </>
                                      )}
                                    </For>
                                  </div>
                                </Match>
                                <Match when={true}>
                                  <div>
                                    <UnsavedLink
                                      href={`/entity/${entity_name}/${item.uid}`}
                                      class={`mb-3 flex cursor-pointer flex-row rounded-sm p-3 text-neutral-content  ${
                                        item.is_deleted
                                          ? "bg-gray-400 hover:bg-gray-500"
                                          : "bg-primary hover:bg-primary-focus"
                                      }`}
                                    >
                                      <div class="flex flex-col content-center">
                                        <div>
                                          <span class="prose-sm mr-7 select-none font-light uppercase">
                                            {getEntityDisplayName(
                                              item.real_type
                                            )}
                                          </span>
                                        </div>
                                      </div>{" "}
                                      <div class="relative">
                                        <div class="inline-block font-semibold">
                                          {build_label_template(
                                            item,
                                            schema[item.real_type].meta
                                              .view_label_template
                                          )}
                                        </div>
                                      </div>
                                      <div class="right-0 ml-auto flex flex-row items-center justify-self-end">
                                        {item.is_deleted && (
                                          <div class="relative mr-2 flex flex-row">
                                            <AiFillDelete
                                              size={16}
                                              class=" text-gray-600"
                                            />
                                            {item.deleted_and_has_dependent_nodes ? (
                                              <AiFillClockCircle
                                                size={16}
                                                class="ml-2 rounded-full text-warning"
                                              />
                                            ) : (
                                              <AiFillCheckCircle
                                                size={16}
                                                class=" ml-2 text-success"
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </UnsavedLink>
                                  </div>
                                </Match>
                              </Switch>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                    <div class="col-span-2 pt-4 pb-6 pr-4" />
                  </div>
                  <Show when={Object.keys(data()).length > index() + 1}>
                    <div class="divider" />
                  </Show>
                </>
              )}
            </For>
          </div>
        </Show>
      </Match>
    </Switch>
  );
};

export default ViewEntityListView;
