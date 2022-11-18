import { Component, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { BiSolidError } from "solid-icons/bi";

export const [userStatus, setUserStatus] = createStore({
  csrf: "",
  username: "",
  password: "",
  error: "",
  isAuthenticated: false,
});

const getCSRF = () => {
  fetch("http://localhost:8000/user/csrf/", {
    credentials: "include",
  })
    .then((res) => {
      let csrfToken = res.headers.get("X-CSRFToken");
      setUserStatus({ csrf: csrfToken });
      console.log(csrfToken);
    })
    .catch((err) => {
      console.log(err);
    });
};

export const getSession = () => {
  fetch("http://localhost:8000/user/session/", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.isAuthenticated) {
        setUserStatus({ isAuthenticated: true, username: data.username });
      } else {
        setUserStatus({ isAuthenticated: false });
        getCSRF();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const isResponseOk = (response) => {
  if (response.status >= 200 && response.status <= 299) {
    return response.json();
  } else {
    throw Error(response.statusText);
  }
};

const login = async (event) => {
  event.preventDefault();
  console.log(userStatus.csrf);
  fetch("http://localhost:8000/user/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": userStatus.csrf,
    },
    credentials: "include",
    body: JSON.stringify({
      username: userStatus.username,
      password: userStatus.password,
    }),
  })
    .then(isResponseOk)
    .then((data) => {
      console.log(data);
      setUserStatus({
        isAuthenticated: true,
        username: userStatus.username,
        password: "",
        error: "",
      });
    })
    .catch((err) => {
      console.log(err);
      setUserStatus({ error: "Wrong username or password." });
    });
};

export const logout = () => {
  fetch("http://localhost:8000/user/logout", {
    credentials: "include",
  })
    .then(isResponseOk)
    .then((data) => {
      console.log(data);
      setUserStatus({ isAuthenticated: false });
      getCSRF();
    })
    .catch((err) => {
      console.log(err);
    });
};

const Login: Component = () => {
  const [loginFailed, setLoginFailed] = createSignal(false);
  const navigate = useNavigate();
  onMount(getCSRF);
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

            <input type="submit" class="btn btn-primary" value="Log In" />
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
