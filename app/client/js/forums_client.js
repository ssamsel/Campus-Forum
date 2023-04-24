import * as crud from './crud.js';


const account_link = document.getElementById('account_link');
const submit_button = document.getElementById('submit_post');
const create_post_text = document.getElementById('post_text')
const create_post_title = document.getElementById('create_post_title')
const image_upload = document.getElementById('image_upload');
const output_div = document.getElementById('output');

const username = window.sessionStorage.getItem("username");
const pwHash = window.sessionStorage.getItem("pwHash");

function isUserLoggedIn() {
    return username !== null;
}

if (isUserLoggedIn()) {
    account_link.innerText = username;
}


submit_button.addEventListener("click", async (e) => {
    const post_data = { title: create_post_title.value, text: create_post_text.value };
    const response = await crud.createThread(username, pwHash, post_data);
    if (response.error === undefined) {
        output_div.innerHTML = `<h1>${response.success}</h1>`;
        return;
    }
    output_div.innerHTML = `<h1>Error: ${response.error}</h1>`;
});