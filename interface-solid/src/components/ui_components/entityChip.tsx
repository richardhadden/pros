import { Component, JSXElement, Show } from "solid-js";
import { NavLink } from "@solidjs/router";

const EntityChip: Component<{
  href?: string | undefined;
  color?: string;
  label: string;
  leftSlot?: JSXElement | string;
  class: string;
  onClick?: (e: MouseEvent) => void;
}> = (props) => {
  const style =
    "text-neutral-content p-3 max-w-4xl mb-3 mr-3 pr-4 rounded-md h-12 prose-md relative top-1.5 font-semibold inline-block";
  return props.href ? (
    <NavLink
      class={style + ` bg-${props.color} hover:bg-${props.color}-focus`}
      href={props.href}
    >
      <span class="prose-sm mr-5 font-light uppercase">{props.leftSlot} </span>
      {props.label}
    </NavLink>
  ) : (
    <span
      class={
        style +
        ` bg-${props.color} cursor-pointer hover:bg-${props.color}-focus ` +
        props.class
      }
      onMouseDown={props.onClick}
    >
      <span class="prose-sm mr-5 font-light uppercase">{props.leftSlot} </span>
      {props.label}
    </span>
  );
};

export default EntityChip;
