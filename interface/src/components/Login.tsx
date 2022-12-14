import { Component, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { BiSolidError } from "solid-icons/bi";
import Cookies from "js-cookie";
export const [userStatus, setUserStatus] = createStore({
  username: "",
  password: "",
  error: "",
  isAuthenticated: false,
});
import { SERVER } from "../index";

export async function refreshToken() {
  const refresh = await fetch(`${SERVER}/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ refresh: Cookies.get("refreshToken") }),
  });
  const refresh_data = await refresh.json();
  if (refresh.status === 403 || refresh.status == 400) {
    logout();
    return "FAIL";
  }
  Cookies.set("accessToken", refresh_data.access);
  setUserStatus({ isAuthenticated: true });
}

export async function alreadyLoggedIn() {
  if (Cookies.get("accessToken")) {
    setUserStatus({ isAuthenticated: true, username: Cookies.get("username") });
  } else {
    await refreshToken();
  }
}

const [loginFailed, setLoginFailed] = createSignal(false);

const IN_FIVE_MINUTES = new Date(new Date().getTime() + 5 * 60 * 1000);

async function login(event: SubmitEvent) {
  console.log("login tried");
  event.preventDefault();
  //console.log(userStatus.csrf);
  const resp = await fetch("http://localhost:8000/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username: userStatus.username,
      password: userStatus.password,
    }),
  });
  const data = await resp.json();
  if (resp.status === 200) {
    Cookies.set("accessToken", data.access, { expires: IN_FIVE_MINUTES });
    Cookies.set("refreshToken", data.refresh, { expires: 1 });
    Cookies.set("username", userStatus.username);
    setUserStatus({
      isAuthenticated: true,
    });
  } else if (resp.status === 401) {
    setLoginFailed(true);
  }
}

export const logout = () => {
  setUserStatus({ isAuthenticated: false, password: "" });
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
};

const Login: Component = () => {
  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    await login(e);
    if (!userStatus.isAuthenticated) {
      // Stop irritating blink where the login fail message is show
      // before redirection by adding a small delay
      setTimeout(() => setLoginFailed(true), 200);
    }
  };
  return (
    <>
      <Show when={loginFailed()}>
        <div class="fixed flex w-full justify-center">
          <div class="alert alert-error mt-10 w-fit shadow-lg">
            <div>
              <BiSolidError />
              <span>Log in error. Please try again.</span>
            </div>
          </div>
        </div>
      </Show>
      <div class="fixed flex h-screen w-screen flex-initial items-center justify-center">
        <div class="rounded-md bg-base-300 p-8 shadow-2xl">
          <form onSubmit={onSubmit} class="items-between flex flex-col">
            <input
              type="text"
              placeholder="User Name"
              value={userStatus.username}
              class="input mb-4"
              onInput={(e) =>
                setUserStatus({ username: e.currentTarget.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={userStatus.password}
              class="input mb-4"
              onInput={(e) =>
                setUserStatus({ password: e.currentTarget.value })
              }
            />

            <input type="submit" class="btn-primary btn" value="Log In" />
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
