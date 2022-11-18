import {
  Component,
  createEffect,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
import {
  Link,
  useParams,
  useRouteData,
  useSearchParams,
} from "@solidjs/router";

import TopBar from "./topBar";
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

const ViewEntityType: Component = () => {
  const params: { entity_type: string; uid: string } = useParams();
  const data = useRouteData();
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

  createEffect(() => debounce(setSearchParams, 300)({ filter: filterValue() }));

  return (
    <>
      <TopBar
        params={params}
        barTitle={
          <div class="prose-sm ml-3 inline-block select-none rounded-md bg-neutral-focus pl-3 pr-3 pt-1 pb-1">
            {getEntityNamePlural(params.entity_type)}
          </div>
        }
        barCenter={
          <input
            type="text"
            placeholder="Filter..."
            class="input w-full max-w-xs text-black"
            value={filterValue()}
            onInput={(e: InputEvent) => onFilterInput(e.target?.value)}
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
                          <Link
                            href={`/entity/${entity_name}/${item.uid}`}
                            class="mb-3 flex max-w-4xl rounded-md bg-primary p-3 text-neutral-content hover:bg-primary-focus"
                          >
                            <div class="flex-col content-center">
                              <div>
                                <span class="prose-sm mr-7 select-none font-light uppercase">
                                  {getEntityDisplayName(item.real_type)}
                                </span>
                              </div>
                            </div>{" "}
                            <div>{item.label}</div>
                          </Link>
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

export default ViewEntityType;
