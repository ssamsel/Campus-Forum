import * as crud from "./crud.js";

const loginButton = document.getElementById("login_submit");
const createAccountButton = document.getElementById("login_create");
const usernameBox = document.getElementById("username");
const passwordBox = document.getElementById("password");
const outputDiv = document.getElementById("output");
const buttons = document.getElementById("buttons");
const usernameFeedback = document.getElementById("username-feedback");
const passwordFeedback = document.getElementById("password-feedback");

if (window.sessionStorage.getItem("user") !== null) {
  buttons.innerHTML =
    '<button id="login_out" type="button" class="btn login-btn">Log Out</button>';
  document.getElementById("login_out").addEventListener("click", async (e) => {
    await crud.logOut(
      window.sessionStorage.getItem("user"),
      window.sessionStorage.getItem("pw")
    );
    window.sessionStorage.clear();
    outputDiv.innerHTML =
      "<h1>You have logged out</h1><a href=/client/forums.html>Return to homepage</a>";
  });
}

function invalidPw(password) {
  if (password.length < 5) {
    return {valid: false, reason: "password is too short"}; // password is too short
  }
  if (!/[a-z]/.test(password)) {
    return {valid: false, reason: "password must contain at least one lowercase letter"}; // password must contain at least one lowercase letter
  }
  if (!/[A-Z]/.test(password)) {
    return {valid: false, reason: "password must contain at least one uppercase letter"}; // password must contain at least one uppercase letter
  }
  if (!/\d/.test(password)) {
    return {valid: false, reason: "password must contain at least one number"}; // password must contain at least one number
  }
  if (!/[!@#$%^&*()\-_=+{}[\]\\|;:'",.<>/?]/.test(password)) {
    return {valid: false, reason: "password must contain at least one special character"}; // password must contain at least one special character
  }
  return {valid: true, reason: "VALID"}; // password meets all criteria for a valid password
}

function invalidUsername(username) {
  if (username.length < 5) {
    return true; // username is too short
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return true; // username must only contain letters, numbers, and underscores
  }
  return false; // username meets all criteria for a valid username
}

createAccountButton.addEventListener("click", async (e) => {
  const username = usernameBox.value;
  const password = passwordBox.value;

  const passValid = invalidPw(password);
  if (!passValid.valid) {
    passwordFeedback.innerText = passValid.reason;
    passwordBox.classList.add("is-invalid");
    return;
  }
  if (invalidUsername(username)) {
    usernameFeedback.innerText = "Invalid Username, try again";
    usernameBox.classList.add("is-invalid");
    return;
  }

  const response = await crud.createAccount(username, password);
  if (response.error === undefined) {
    outputDiv.innerHTML = "<h1>" + response.success + "</h1>";
    login();
    return;
  }
  outputDiv.innerHTML = "<h1>" + response.error + "</h1>";
});

async function login() {
  const username = usernameBox.value;
  const password = passwordBox.value;

  if (username === "" || password === "") {
    return;
  }

  const response = await crud.logIn(username, password);
  if (response.error === undefined) {
    window.sessionStorage.clear();
    window.sessionStorage.setItem("user", username);
    window.sessionStorage.setItem("pw", password);
    const urlParams = new URLSearchParams(window.location.search);
    const previous = urlParams.has("prev") ? urlParams.get("prev") : "/";
    outputDiv.innerHTML = "<h1>" + response.success + "</h1>";
    window.location.replace(previous);
    return;
  }
  outputDiv.innerHTML = "<h1>" + response.error + "</h1>";
}

loginButton.addEventListener("click", login);
