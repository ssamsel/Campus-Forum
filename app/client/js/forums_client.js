import * as crud from './crud.js';


const account_link = document.getElementById('account_link');
const submit_button = document.getElementById('submit_post');
const create_post_text = document.getElementById('post_text')
const create_post_title = document.getElementById('create_post_title')
const image_upload = document.getElementById('image_upload');
const output_div = document.getElementById('output');
const threads_div = document.getElementById('threads');

const username = window.sessionStorage.getItem("username");
const pwHash = window.sessionStorage.getItem("pwHash");

if (username !== null) {
    account_link.innerText = username;
}


// Get the threads and put them in the page
const dumpedThreads = await crud.dumpThreads();
let threads_html = dumpedThreads.length !== 0 ? "" : `<div class="container-fluid forum bottom-row">
        <div class="w-50"></div>
        <div class="col-sm row-item">
          <div class="circle-div"></div>
        </div>
        <div class="col-sm row-item">
          <div class="circle-div"></div>
        </div>
        <div class="col-sm row-item">
          <p class="small-text"></p>
          <div class="author-div">
          </div>
        </div>
      </div>`;

dumpedThreads.forEach((x, idx) => {
    const last = idx === dumpedThreads.length - 1 ? "bottom-row" : "";
    const template = `<div class="container-fluid forum ${last}">
        <div class="w-50"><a href="http://${crud.SERVER_IP_PORT_TUPLE}/client/post.html?title=${x.title}">${x.title}</a></div>
        <div class="col-sm row-item">
          <div class="circle-div">${x.images}</div>
        </div>
        <div class="col-sm row-item">
          <div class="circle-div">${x.posts}</div>
        </div>
        <div class="col-sm row-item">
          <p class="small-text">${x.time}</p>
          <div class="author-div">
            <img class="avatar" src="img/avatar.png" />
            ${x.author}
          </div>
        </div>
      </div>`;
    threads_html += template;
});
threads_div.innerHTML = threads_html;

submit_button.addEventListener("click", async (e) => {
    const post_data = { title: create_post_title.value, text: create_post_text.value };
    const response = await crud.createThread(username, pwHash, post_data);
    if (response.error === undefined) {
        output_div.innerHTML = `<h1>${response.success}</h1>`;
        location.reload();
        return;
    }
    output_div.innerHTML = `<h1>Error: ${response.error}</h1>`;
});