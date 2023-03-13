import { createInfiniteScroll } from "@solid-primitives/pagination";
import { db } from "../data/db";

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

function debounce(cb: CallableFunction, delay = 300) {
  let timeout: number;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}

const TestList: Component = (props) => {
  // fetcher: (page: number) => Promise<T[]>

  const [firstUidOfType, setFirstUidOfType] = createSignal({});
  const [filterValue, setFilterValue] = createSignal("");
  const params = { entity_type: "entity" };

  const doUpdateFilter = debounce(async () => {
    console.log(firstUidOfType());
    const resp = await fetcher(0);
    setFirstUidOfType({});
    setPage(1);
    setPages(resp);

    setEnd(false);
    window.scrollTo(0, 0);
  });

  createEffect(() => {
    filterValue();
    doUpdateFilter();
  });

  async function fetcher(page) {
    try {
      let resp = db["entity"].orderBy("[real_type+label]");

      if (filterValue()) {
        const filterFunc = (item) => {
          const words_regexes = filterValue()
            .split(" ")
            .map((word) => new RegExp(word, "i"));
          const result = words_regexes
            .map((wre) => wre.test(item.label))
            .every((test) => test); //.test(item.label);

          return result;
        };

        resp = resp.filter(filterFunc);
      }

      const count = await resp.count();
      if (count < 50) {
        setEnd(true);
      }
      return await resp
        .offset(page * 50)
        .limit(50)
        .toArray();
    } catch {}
  }
  const [pages, setEl, { end, setEnd, setPage, setPages, page }] =
    createInfiniteScroll(fetcher);

  return (
    <>
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
                setFilterValue((e.currentTarget as HTMLInputElement).value)
              }
            />
          </div>
        }
        newButton={true}
      />
      <div class="mx-auto ml-6 mt-32 mb-16 grid grid-cols-8">
        <For each={pages()}>
          {(item, index) => {
            if (!firstUidOfType()[item.real_type]) {
              setFirstUidOfType({
                ...firstUidOfType(),
                [item.real_type]: item.uid,
              });
            }
            console.log(firstUidOfType()[item.real_type], item.uid);
            return (
              <>
                <Show
                  when={firstUidOfType()[item.real_type] === item.uid}
                  fallback={<div class="col-span-2" />}
                >
                  <>
                    <Show when={index() !== 0}>
                      <div class="divider col-span-8" />
                    </Show>
                    <div class="col-span-2">
                      <h2 class="prose-md col-span-2 select-none font-semibold uppercase text-base-content">
                        {getEntityNamePlural(item.real_type)}
                      </h2>
                    </div>
                  </>
                </Show>
                <Switch>
                  <Match when={item.is_merged_item}>
                    <div class="col-span-5 flex flex-row items-center">
                      <UnsavedLink
                        href={`/entity/${item.real_type}/${item.uid}`}
                        class={`mb-3 flex h-fit flex-1 cursor-pointer flex-row rounded-sm p-3 text-neutral-content  ${
                          item.is_deleted
                            ? "bg-gray-400 hover:bg-gray-500"
                            : "bg-primary hover:bg-primary-focus"
                        }`}
                      >
                        <div class="flex w-fit flex-col justify-center">
                          <div>
                            <span class="prose-sm mr-7 select-none font-light uppercase">
                              {getEntityDisplayName(item.real_type)}
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
                              href={`/entity/${mergedItem.real_type}/${mergedItem.uid}`}
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
                            <Show when={index() < item.merged_items.length - 1}>
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
                    <div class="col-span-5">
                      <UnsavedLink
                        href={`/entity/${item.real_type}/${item.uid}`}
                        class={`mb-3 flex cursor-pointer flex-row rounded-sm p-3 text-neutral-content  ${
                          item.is_deleted
                            ? "bg-gray-400 hover:bg-gray-500"
                            : "bg-primary hover:bg-primary-focus"
                        }`}
                      >
                        <div class="flex flex-col content-center">
                          <div>
                            <span class="prose-sm mr-7 select-none font-light uppercase">
                              {getEntityDisplayName(item.real_type)}
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
                              <AiFillDelete size={16} class=" text-gray-600" />
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
              </>
            );
          }}
        </For>
      </div>
      <Show when={!end()}>
        <div class="mb-16" ref={setEl}>
          <LoadingSpinner />
        </div>
      </Show>
    </>
  );
};

export default TestList;
