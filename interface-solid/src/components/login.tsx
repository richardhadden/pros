import { Component, createSignal } from "solid-js";
import { postLogin } from "../App";

const Login: Component = () => {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");

  return (
    <>
      <h1>Log in</h1>
      <input
        type="text"
        placeholder="User Name"
        value={username()}
        class="input"
        onInput={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password()}
        class="input"
        onInput={(e) => setPassword(e.target.value)}
      />

      <button class="btn" onClick={() => postLogin(username(), password())}>
        Log in
      </button>
    </>
  );
};

export default Login;
