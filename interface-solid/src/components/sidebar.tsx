import { Component, createEffect, For, onMount, createSignal, createMemo, Show, Accessor } from "solid-js"

import { Link } from "@solidjs/router";

import { schema, SchemaEntity, SubClasses } from '../index';
import { getEntityNamePlural } from "../utils/entity_names";

import { BsPlus, BsQuestion } from 'solid-icons/bs';
import { CgAbstract } from 'solid-icons/cg';

const SideBarListItems: Component<{ subclasses: SubClasses | {}, level: number }> = ({ subclasses, level }) => {

    return (<For each={Object.entries(subclasses)} >
        {([entity_name, entity], index) => (
            <>
                <li class={`flex ml-4`}>

                    {schema[entity_name].meta.abstract ?
                        <div class="btn-group mb-2 grow border-0">
                            <Link class="btn btn-sm w-full" href={`/entity/${entity_name}/`}>{getEntityNamePlural(entity_name)}</Link>

                            <Link href={`/entity/${entity_name}/new/`} class="btn btn-sm btn-disabled btn-square" ><CgAbstract /></Link>
                        </div>
                        :
                        <div class="btn-group mb-2 grow border-0">
                            <Link class="btn btn-sm w-full" href={`/entity/${entity_name}/`}>{getEntityNamePlural(entity_name)}</Link>

                            <Link href={`/entity/${entity_name}/new/`} class="btn btn-sm btn-square btn-accent"><BsPlus /></Link>
                        </div>
                    }
                </li>
                <Show when={entity.subclasses}>
                    <div class="ml-4">
                        <SideBarListItems subclasses={entity.subclasses} level={level + 2} />
                    </div>
                </Show>




            </>

        )
        }</For >
    )
}




const Sidebar: Component = () => {

    const topLevelEntities = createMemo(() => Object.entries(schema).filter(([key, entry], index) => entry.top_level));


    return (
        <div class="drawer drawer-mobile h-full">

            <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
            <div class="drawer-content flex flex-col items-center justify-center">

                <label for="my-drawer-2" class="btn btn-primary drawer-button lg:hidden">Open drawer</label>

            </div>
            <div class="bg-base-300 min-w-fit h-full min-h-screen shadow-inner">

                <label for="my-drawer-2" class="drawer-overlay">Hello</label>
                <ul class="p-4 pr-10 overflow-y-auto text-base-content ">
                    <For each={topLevelEntities()}>
                        {([entity_name, entity], index) => (
                            <>

                                {schema[entity_name].meta.abstract ?
                                    <li class="flex"><div class="btn-group mb-2 grow ">
                                        <Link href={`/entity/${entity_name}/`} class="btn btn-sm  w-full">{getEntityNamePlural(entity_name)}</Link>

                                        <Link href={`/entity/${entity_name}/new/`} class="btn btn-sm btn-disabled btn-square" ><CgAbstract /></Link>

                                    </div></li> :
                                    <li class="flex"><div class="btn-group mb-2 grow ">
                                        <Link href={`/entity/${entity_name}/`} class="btn btn-sm  w-full">{getEntityNamePlural(entity_name)}</Link>
                                        <Link href={`/entity/${entity_name}/new/`} class="btn btn-sm  btn-square btn-accent"><BsPlus /></Link>
                                    </div></li>
                                }


                                <SideBarListItems subclasses={entity.subclasses} level={1} />
                                <Show when={topLevelEntities().length > index() + 1}>
                                    <div class="divider" />
                                </Show>

                            </>

                        )}</For>

                </ul>

            </div >
        </div >


    )
}

export default Sidebar;