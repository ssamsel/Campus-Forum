import * as crud from "./crud.js";
import * as Util from "./util.js";

const threads_div = document.getElementById("threads");
const username_h4 = document.getElementById("username");

const username = window.sessionStorage.getItem("user");
const password = window.sessionStorage.getItem("pw");

// Add logout button and display username on top right if user logged in;
Util.integrateAuthUI();

const urlParams = new URLSearchParams(window.location.search);
username_h4.innerText = urlParams.get('author');

// Get the threads and put them in the page
const dumpedThreads = await crud.dumpThreadsByAuthor(urlParams.get('author'));
let threads_html =
    dumpedThreads.length !== 0
        ? ""
        : `<div class="container-fluid forum bottom-row">
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
        <div class="w-50"><a href="${crud.ORIGIN}/client/post.html?title=${encodeURIComponent(x.title)}">${x.title}</a></div>
        <div class="col-sm row-item">
          <div class="circle-div">${x.images}</div>
        </div>
        <div class="col-sm row-item">
          <div class="circle-div">${x.posts}</div>
        </div>
        <div class="col-sm row-item">
          <p class="small-text">${x.time}</p>
          <div class="author-div" onclick='window.location.href = "${crud.ORIGIN}/client/profile.html?author=${x.author}"'>
            <img class="avatar" src="img/avatar.png" />
            ${x.author}
          </div>
        </div>
      </div>`;
    threads_html += template;
});
threads_div.innerHTML = threads_html;