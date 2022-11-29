import {
  Component,
  createEffect,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
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

/*
const x = <div class="navbar bg-neutral text-neutral-content rounded-b-lg pr-0 pt-0 pb-0 ml-12 max-w-7xl">
    <div class="navbar-start ml-3 prose-xl font-semibold">{getEntityNamePlural(params.entity_type).toUpperCase()}</div>
    {!schema[params.entity_type].meta.abstract && <div class="navbar-end"><Link href={`/entity/${params.entity_type}/new/`} class="btn btn-lg  btn-square btn-accent rounded-tl-none rounded-tr-none rounded-bl-none"><BsPlus size={28} /></Link></div>}

</div>*/

const debounce = <F extends (...args: any) => any>(
  func: F,
  waitFor: number = 400
) => {
  let timeout: number = 0;

  const debounced = (...args: any) => {
    clearTimeout(timeout);
    setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

const ViewEntityListView: Component = () => {
  const params: { entity_type: string; uid: string } = useParams();
  const [data, refetchData] = useRouteData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterValue, setFilterValue] = createSignal<string>("");

  onMount(() => {
    console.log("searchparams", searchParams.filter);
    setFilterValue(searchParams.filter || "");
  });

  const onFilterInput = (value) => {
    console.log(value);
    setFilterValue(value);
    //setSearchParams({ filter: value });
  };

  createEffect(() => debounce(setSearchParams, 1)({ filter: filterValue() }));

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
          <input
            type="text"
            placeholder="Filter..."
            class="input w-full max-w-xs text-black"
            value={filterValue()}
            onInput={(e: InputEvent) =>
              onFilterInput((e.currentTarget as HTMLInputElement).value)
            }
          />
        }
        newButton={true}
      />

      <Show when={data()}>
        <div class="mx-auto mt-32  ml-6 ">
          <For each={Object.entries(data())}>
            {([entity_name, items], index) => (
              <>
                <div class="grid grid-cols-8 gap-y-6">
                  <div class="col-span-2 rounded-l-md pt-4 pb-6 pl-3">
                    <h2 class="prose-md select-none font-semibold uppercase text-base-content">
                      {getEntityNamePlural(entity_name)}
                    </h2>
                  </div>
                  <div class="col-span-4 pt-4 pb-6 pr-4">
                    <For each={items}>
                      {(item) => (
                        <div>
                          <UnsavedLink
                            href={`/entity/${entity_name}/${item.uid}`}
                            class={`mb-3 flex max-w-4xl cursor-pointer flex-row rounded-sm p-3 text-neutral-content  ${
                              item.is_deleted
                                ? "bg-gray-300 hover:bg-gray-500"
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
                              <div class="inline-block">{item.label}</div>
                            </div>
                            <div class="right-0 ml-auto justify-self-end">
                              {item.is_deleted && (
                                <div class="relative mr-2 flex flex-row">
                                  <AiFillDelete
                                    size={20}
                                    class="mt-0.5 text-gray-600"
                                  />
                                  {item.deleted_and_has_dependent_nodes ? (
                                    <AiFillClockCircle
                                      size={20}
                                      class="mt-0.5 ml-2 rounded-full text-warning"
                                    />
                                  ) : (
                                    <AiFillCheckCircle
                                      size={20}
                                      class="mt-0.5 ml-2 text-success"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </UnsavedLink>
                        </div>
                      )}
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
    </>
  );
};

export default ViewEntityListView;
