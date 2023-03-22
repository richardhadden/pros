import { Component, JSXElement, Switch, Match, createEffect } from "solid-js";
import UnsavedLink from "../../utils/UnsavedLink";

import { AiFillDelete } from "solid-icons/ai";
import { AiFillClockCircle } from "solid-icons/ai";
import { AiFillCheckCircle } from "solid-icons/ai";

const EntityChip: Component<{
  href?: string | undefined;
  label: string;
  leftSlot?: JSXElement | string;
  class?: string;
  onClick?: (e: MouseEvent) => void;
  isDeleted?: boolean;
  deletedAndHasDependentNodes?: boolean;
  selected?: boolean;
  ref: any;
}> = (props) => {
  const style =
    "text-neutral-content p-3 max-w-4xl mb-3 mr-3 pr-4 rounded-sm h-12 prose-md relative top-1.5 font-semibold inline-block h-fit z-10";
  return (
    <>
      <Switch>
        <Match when={props.href && props.isDeleted}>
          <UnsavedLink
            class={
              style +
              `  w-fit cursor-pointer  bg-gray-400 pr-2 transition-all hover:bg-gray-500`
            }
            href={props.href}
          >
            <div class="flex flex-row" ref={props.ref}>
              <span class="prose-sm mr-5 font-light uppercase">
                {props.leftSlot}{" "}
              </span>
              <span>{props.label}</span>
              <span class="ml-auto">
                <div class="relative mr-1 ml-4 flex flex-row">
                  <AiFillDelete size={20} class="mt-0.5 text-gray-600" />
                  {props.deletedAndHasDependentNodes ? (
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
              </span>
            </div>
          </UnsavedLink>
        </Match>
        <Match when={props.isDeleted}>
          <span
            class={
              style +
              `  w-fit select-none  bg-gray-400 pr-2 transition-all hover:bg-gray-500`
            }
            href={props.href}
          >
            <div class="flex flex-row" ref={props.ref}>
              <span class="prose-sm mr-5 font-light uppercase">
                {props.leftSlot}{" "}
              </span>
              <span>{props.label}</span>
              <span class="ml-auto">
                <div class="relative mr-1 ml-4 flex flex-row">
                  <AiFillDelete size={20} class="mt-0.5 text-gray-600" />
                  {props.deletedAndHasDependentNodes ? (
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
              </span>
            </div>
          </span>
        </Match>
        <Match when={props.href}>
          <UnsavedLink
            class={
              style + ` cursor-pointer transition-all hover:bg-primary-focus`
            }
            href={props.href}
          >
            <span class="prose-sm mr-5 font-light uppercase" ref={props.ref}>
              {props.leftSlot}{" "}
            </span>
            {props.label}
          </UnsavedLink>
        </Match>
        <Match when={true}>
          <span
            ref={props.ref}
            class={
              style +
              ` cursor-pointer ${
                props.selected === true ? "bg-primary-focus" : "bg-primary"
              } hover:bg-primary-focus ` +
              props.class
            }
            onMouseDown={props.onClick}
          >
            <span class="prose-sm mr-5 font-light uppercase">
              {props.leftSlot}{" "}
            </span>
            {props.label}
          </span>
        </Match>
      </Switch>
    </>
  );
};

export default EntityChip;
