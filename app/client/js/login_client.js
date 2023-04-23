import * as crud from './crud.js';

const loginButton = document.getElementById('login_submit');
const createAccountButton = document.getElementById('login_create');
const usernameBox = document.getElementById('username');
const passwordBox = document.getElementById('password');
const outputDiv = document.getElementById('output');
const buttons = document.getElementById('buttons');

// Taken from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function hashPw(password) {
    const msgUint8 = new TextEncoder().encode(password); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

if (window.sessionStorage.getItem("username") !== null) {
    buttons.innerHTML = '<button id="login_out" type="button" class="btn login-btn">Log Out</button>';
    document.getElementById('login_out').addEventListener("click", async (e) => {
        await crud.logOut(window.sessionStorage.getItem("username"), window.sessionStorage.getItem("pwHash"));
        window.sessionStorage.clear();
        outputDiv.innerHTML = "<h1>You have logged out</h1><a href=/client/forums.html>Return to homepage</a>";
    });
}


function invalidPw(password) {
    // TODO: Add more criteria for an invalid password
    return password.length < 5;
}

function invalidUsername(username) {
    return username.length < 5;
}

createAccountButton.addEventListener('click', async (e) => {
    const username = usernameBox.value;
    const password = passwordBox.value;

    if (invalidPw(password)) {
        outputDiv.innerHTML = "<h1>Password does not meet criteria, try again</h1>";
        return;
    }
    if (invalidUsername(username)) {
        outputDiv.innerHTML = "<h1>Invalid Username, try again</h1>";
        return;
    }

    const hash = await hashPw(password);

    const response = await crud.createAccount(username, hash);
    if (response.error === undefined) {
        outputDiv.innerHTML = "<h1>" + response.success + "</h1>";
        return;
    }
    outputDiv.innerHTML = "<h1>" + response.error + "</h1>";
});

loginButton.addEventListener('click', async (e) => {
    const username = usernameBox.value;
    const password = passwordBox.value;

    if (username === "" || password === "") {
        return;
    }
    const hash = await hashPw(password);

    const response = await crud.logIn(username, hash);
    if (response.error === undefined) {
        window.sessionStorage.clear();
        window.sessionStorage.setItem("username", username);
        window.sessionStorage.setItem("pwHash", hash);
        outputDiv.innerHTML = "<h1>" + response.success + "</h1><a href=/client/forums.html>Return to homepage</a>";
        return;
    }
    outputDiv.innerHTML = "<h1>" + response.error + "</h1>";
});