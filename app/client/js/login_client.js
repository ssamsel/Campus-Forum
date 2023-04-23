import * as crud from './crud.js';

const loginButton = document.getElementById('login_submit');
const createAccountButton = document.getElementById('login_create');
const usernameBox = document.getElementById('username');
const passwordBox = document.getElementById('password');
const outputDiv = document.getElementById('output')

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

    const response = await crud.createAccount(username, password);
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

    const response = await crud.logIn(username, password);
    if (response.error === undefined) {
        outputDiv.innerHTML = "<h1>" + response.success + "</h1><a href=/client/forums.html>Return to homepage</a>";
        return;
    }
    outputDiv.innerHTML = "<h1>" + response.error + "</h1>";
});