import { JSX } from "solid-js";
import {
  children,
  createSignal,
  createMemo,
  createRoot,
  mergeProps,
  on,
  Show,
  splitProps,
  Switch,
  Match,
} from "solid-js";
import {
  useHref,
  useLocation,
  useNavigate,
  useResolvedPath,
} from "@solidjs/router";
import { createKeyHold } from "@solid-primitives/keyboard";

import {
  hasUnsavedChange,
  setHasUnsavedChange,
  floatingPages,
  setFloatingPages,
} from "../App";

const trimPathRegex = /^\/+|\/+$/g;
function normalizePath(path: string, omitSlash: boolean = false) {
  const s = path.replace(trimPathRegex, "");
  return s ? (omitSlash || /^[?#]/.test(s) ? s : "/" + s) : "";
}

interface AnchorProps
  extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "state"> {
  href: string;
  replace?: boolean;
  noScroll?: boolean;
  state?: unknown;
  inactiveClass?: string;
  activeClass?: string;
  end?: boolean;
}

const metaHeld = createKeyHold("Meta", { preventDefault: true });

const UnsavedLink = (props: AnchorProps) => {
  const navigate = useNavigate();
  const [redirectModalVisible, setRedirectModalVisible] = createSignal(false);

  const doNavigateAway = () => {
    setHasUnsavedChange(false);
    setRedirectModalVisible(false);
    navigate(props.href, {
      replace: true,
    });
  };

  const onClickLink = () => {
    console.log("clicked");
    if (hasUnsavedChange()) {
      setRedirectModalVisible(true);
    } else {
      doNavigateAway();
    }
  };

  const isLinkToEntity = () => {
    try {
      const [_, entity, entityType, uid] = props.href.split("/");
      //console.log(entity, entityType, uid);
      if (uid) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const onMetaClick = () => {
    if (metaHeld()) {
      setFloatingPages({ [props.href]: { loaded: false } });
      console.log(floatingPages);
    } else {
      doNavigateAway();
    }
  };

  props = mergeProps(
    { inactiveClass: "inactive", activeClass: "active" },
    props
  );
  const [, rest] = splitProps(props, [
    "href",
    "state",
    "class",
    "activeClass",
    "inactiveClass",
    "end",
  ]);
  const to = useResolvedPath(() => props.href);
  const href = useHref(to);
  const location = useLocation();
  const isActive = createMemo(() => {
    const to_ = to();
    if (to_ === undefined) return false;
    const path = normalizePath(to_.split(/[?#]/, 1)[0]).toLowerCase();
    const loc = normalizePath(location.pathname).toLowerCase();
    return props.end ? path === loc : loc.startsWith(path);
  });

  return (
    <>
      <Show when={redirectModalVisible()}>
        <div class="modal modal-open">
          <div class="modal-box z-50 text-black">
            <h3 class="font-semibold uppercase">Confirm Unsaved Changes</h3>
            <p class="py-4">Leave page without saving changes?</p>
            <div class="modal-action">
              <span onClick={doNavigateAway} class="btn-error btn">
                Confirm
              </span>
              <span
                onClick={() => setRedirectModalVisible(false)}
                class="btn-success btn"
              >
                Cancel
              </span>
            </div>
          </div>
        </div>
      </Show>
      <Switch>
        <Match when={isLinkToEntity() && metaHeld() && !hasUnsavedChange()}>
          <a
            onClick={onMetaClick}
            {...rest}
            //href={href() || props.href}
            state={JSON.stringify(props.state)}
            classList={{
              ...(props.class && { [props.class]: true }),
              [props.inactiveClass!]: !isActive(),
              [props.activeClass!]: isActive(),
              ...rest.classList,
            }}
            aria-current={isActive() ? "page" : undefined}
          />
        </Match>
        <Match when={hasUnsavedChange()}>
          <a
            onClick={onClickLink}
            {...rest}
            //href={href() || props.href}
            state={JSON.stringify(props.state)}
            classList={{
              ...(props.class && { [props.class]: true }),
              [props.inactiveClass!]: !isActive(),
              [props.activeClass!]: isActive(),
              ...rest.classList,
            }}
            aria-current={isActive() ? "page" : undefined}
          />
        </Match>
        <Match when={true}>
          <a
            //onClick={onClickLink}
            {...rest}
            href={href() || props.href}
            state={JSON.stringify(props.state)}
            classList={{
              ...(props.class && { [props.class]: true }),
              [props.inactiveClass!]: !isActive(),
              [props.activeClass!]: isActive(),
              ...rest.classList,
            }}
            aria-current={isActive() ? "page" : undefined}
          />
        </Match>
      </Switch>
    </>
  );
};

export default UnsavedLink;
