import { Component, JSXElement, Switch, Match } from "solid-js";
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
  is_deleted?: boolean;
  deleted_and_has_dependent_nodes?: boolean;
}> = (props) => {
  const style =
    "text-neutral-content p-3 max-w-4xl mb-3 mr-3 pr-4 rounded-md h-12 prose-md relative top-1.5 font-semibold inline-block";
  return (
    <Switch>
      <Match when={props.href && props.is_deleted}>
        <UnsavedLink
          class={
            style +
            ` flex cursor-pointer flex-row bg-primary transition-all hover:bg-primary-focus`
          }
          href={props.href}
        >
          <span class="prose-sm mr-5 font-light uppercase">
            {props.leftSlot}{" "}
          </span>
          <span>{props.label}</span>
          <span class="ml-auto">
            <div class="relative mr-2 flex flex-row">
              <AiFillDelete size={20} class="mt-0.5 text-gray-600" />
              {props.deleted_and_has_dependent_nodes ? (
                <AiFillClockCircle
                  size={20}
                  class="mt-0.5 ml-2 rounded-full text-warning"
                />
              ) : (
                <AiFillCheckCircle size={20} class="mt-0.5 ml-2 text-success" />
              )}
            </div>
          </span>
        </UnsavedLink>
      </Match>
      <Match when={props.href}>
        <UnsavedLink
          class={
            style +
            ` cursor-pointer bg-primary transition-all hover:bg-primary-focus`
          }
          href={props.href}
        >
          <span class="prose-sm mr-5 font-light uppercase">
            {props.leftSlot}{" "}
          </span>
          {props.label}
        </UnsavedLink>
      </Match>
      <Match when={true}>
        <span
          class={
            style +
            ` cursor-pointer bg-primary hover:bg-primary-focus ` +
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
  );
};

export default EntityChip;
