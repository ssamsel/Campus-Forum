import * as crud from "./crud.js";
import * as Util from "./util.js";

const submit_button = document.getElementById("submit_post");
const create_post_text = document.getElementById("post_text");
const create_post_title = document.getElementById("create_post_title");
const image_upload = document.getElementById("image_upload");
const output_div = document.getElementById("output");
const threads_div = document.getElementById("threads");
const results_per_page = document.getElementById("count");
const navigation = document.getElementById("navigation");

const username = window.sessionStorage.getItem("user");
const password = window.sessionStorage.getItem("pw");

// Add logout button and display username on top right if user logged in;
Util.integrateAuthUI();

// create a URL parameter object to use for various paging functionality
const urlParams = new URLSearchParams(window.location.search);

// Set the results per page select form
results_per_page.value = urlParams.has("amount")
  ? urlParams.get("amount")
  : results_per_page.value;

// Get the current page number and results per page
const page = urlParams.has("page") ? parseInt(urlParams.get("page")) : 1;
const amount = results_per_page.value;
const ordering = urlParams.has("by") ? urlParams.get("by") : "time";

// Set the location link
const path = window.location.pathname;
const numThreads = await crud.numThreads();
const totalPages =
  amount === "All" ? 1 : Math.ceil(numThreads / parseInt(amount));
let locationHtml = "";

locationHtml += Util.orderingMap[ordering] + " > ";

if (totalPages === 1) {
  locationHtml += "<b>First</b>";
} else {
  if (page > 1) {
    locationHtml += `<a href="${path}?page=${
      page - 1
    }&amount=${amount}&by=${ordering}">Prev</a> `;
  }
  locationHtml += `<b>${page === 1 ? "Newest" : page}</b> `;
  if (page < totalPages) {
    locationHtml += `<a href="${path}?page=${
      page + 1
    }&amount=${amount}&by=${ordering}">Next</a>`;
  }
}
navigation.innerHTML = locationHtml;

// Refresh when rpp changes
results_per_page.addEventListener("change", () => {
  window.location.replace(
    `${path}?page=${page}&amount=${results_per_page.value}&by=${ordering}`
  );
});

// Get the threads
const dumpedThreads = await crud.dumpThreads(page, amount, ordering);
let threads_html =
  dumpedThreads.length !== 0
    ? ""
    // This is an empty thread to make the UI look better if there are no threads
    : `<div class="container-fluid forum bottom-row">
        <div class="w-50"></div>
        <div class="col-sm row-item">
          <div class="circle-div"></div>
        </div>
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

// Put each thread into the page
dumpedThreads.forEach((x, idx) => {
  const last = idx === dumpedThreads.length - 1 ? "bottom-row" : "";
  const template = `<div class="container-fluid forum ${last}">
        <div class="w-50"><a href="/post.html?title=${encodeURIComponent(
          x.title
        )}&page=${page}&amount=${amount}&by=${ordering}">${x.title}</a></div>
        <div class="col-sm row-item">
          <div class="circle-div">${x.likes}</div>
        </div>
        <div class="col-sm row-item">
          <div class="circle-div">${x.images}</div>
        </div>
        <div class="col-sm row-item">
          <div class="circle-div">${x.posts}</div>
        </div>
        <div class="col-sm-2 row-item">
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

// Handle thread submission event
submit_button.addEventListener("click", async (e) => {
  const response = await crud.createThread(
    username,
    password,
    create_post_title.value,
    create_post_text.value,
    image_upload.files[0]
  );
  if (response.error !== undefined) {
    output_div.innerHTML = `<h1>Error: ${response.error}</h1>`;
    return;
  }
  output_div.innerHTML = `<h1>${response.success}</h1>`;

  // Clear text input boxes to make it more evident it was posted
  create_post_title.value = "";
  create_post_text.value = "";

  window.location.reload();
});
