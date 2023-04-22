import * as crud from './crud.js';

const loginButton = document.getElementById('login_submit');
const createAccountButton = document.getElementById('login_create');
const usernameBox = document.getElementById('username');
const passwordBox = document.getElementById('password');


createAccountButton.addEventListener('click', async (e) => {
    const username = usernameBox.value;
    const password = passwordBox.value;
    const response = await crud.createAccount(username, password);
    console.log(response);
});