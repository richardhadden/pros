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
  accessToken: "",
  refreshToken: "",
});
import { SERVER } from "../index";

export const refreshToken = async () => {
  console.log(Cookies.get("refreshToken"));
  console.log(Cookies.get("accessToken"));
  const refresh = await fetch(`${SERVER}/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      //"X-CSRFToken": userStatus.csrf,
    },
    credentials: "include",
    body: JSON.stringify({ refresh: Cookies.get("refreshToken") }),
  });
  const refresh_data = await refresh.json();
  Cookies.set("accessToken", refresh_data.access);
  setUserStatus({ isAuthenticated: true });
};

export const alreadyLoggedIn = async () => {
  if (Cookies.get("accessToken")) {
    setUserStatus({ isAuthenticated: true });
  } else {
    await refreshToken();
  }
};

const [loginFailed, setLoginFailed] = createSignal(false);

const login = async (event) => {
  console.log("login tried");
  event.preventDefault();
  //console.log(userStatus.csrf);
  const resp = await fetch("http://localhost:8000/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      //"X-CSRFToken": userStatus.csrf,
    },
    credentials: "include",
    body: JSON.stringify({
      username: userStatus.username,
      password: userStatus.password,
    }),
  });
  const data = await resp.json();
  if (resp.status === 200) {
    Cookies.set("accessToken", data.access, { expires: 7 });
    Cookies.set("refreshToken", data.refresh, { expires: 7 });
    setUserStatus({
      accessToken: data.access,
      refreshToken: data.refresh,
      isAuthenticated: true,
    });
  } else if (resp.status === 401) {
    setLoginFailed(true);
  }
};

export const logout = () => {
  setUserStatus({ isAuthenticated: false });
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
};

const Login: Component = () => {
  const navigate = useNavigate();
  //onMount(getCSRF);
  const onSubmit = async (e) => {
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
              onInput={(e) => setUserStatus({ username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={userStatus.password}
              class="input mb-4"
              onInput={(e) => setUserStatus({ password: e.target.value })}
            />

            <input type="submit" class="btn-primary btn" value="Log In" />
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
