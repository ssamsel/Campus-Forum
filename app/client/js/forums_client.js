import * as crud from "./crud.js";
import * as Util from "./util.js";

const submit_button = document.getElementById("submit_post");
const create_post_text = document.getElementById("post_text");
const create_post_title = document.getElementById("create_post_title");
const image_upload = document.getElementById("image_upload");
const output_div = document.getElementById("output");
const threads_div = document.getElementById("threads");
const results_per_page = document.getElementById("count")
const location = document.getElementById("location");

const username = window.sessionStorage.getItem("user");
const password = window.sessionStorage.getItem("pw");

// Add logout button and display username on top right if user logged in;
Util.integrateAuthUI();

// Get the current page number and results per page
const urlParams = new URLSearchParams(window.location.search);
const page = urlParams.has("page") ? parseInt(urlParams.get("page")) : 1;
const amount = results_per_page.value;

// Set the location link
const path = window.location.pathname;
const numThreads = await crud.numThreads();
const totalPages = amount === "All" ? 1 : Math.ceil(numThreads / amount);
let locationHtml = "Home > ";
if (totalPages === 1){
  locationHtml += "<b>Newest</b>";
}
else {
  if (page > 1){
    locationHtml += `<a href="${path}?page=${page - 1}&amount=${amount}}">Prev</a> `;
  }
  locationHtml += `<b>{page}</b> `;
  if (page < totalPages){
    locationHtml += `<a href="${path}?page=${page + 1}&amount=${amount}">Next</a>`;
  }
}
location.innerHTML = locationHtml;

// Set the results per page select form
results_per_page.value = urlParams.has("amount") ? urlParams.get("amount") : results_per_page.value;

// Refresh when rpp changes
results_per_page.addEventListener("change", () => {
  window.location.replace(`${path}?page=${page}&amount=${results_per_page.value}`);
});

// Get the threads and put them in the page
const dumpedThreads = await crud.dumpThreads(page, amount);
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
        <div class="w-50"><a href="${
          crud.ORIGIN
        }/client/post.html?title=${encodeURIComponent(x.title)}">${
    x.title
  }</a></div>
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
  const post_data = {
    title: create_post_title.value,
    text: create_post_text.value,
  };
  const image = new FormData();
  image.append("image", image_upload.files[0]);
  const response = await crud.createThread(
    username,
    password,
    post_data,
    image,
    image_upload.files[0] !== undefined
  );
  if (response.error !== undefined) {
    output_div.innerHTML = `<h1>Error: ${response.error}</h1>`;
    return;
  }
  output_div.innerHTML = `<h1>${response.success}</h1>`;
  location.reload();
});
