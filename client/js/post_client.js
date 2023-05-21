import * as crud from "./crud.js";
import * as Util from "./util.js";
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("title");

const deleteDiv = document.getElementById("delete-div");
const title = document.getElementById("title-div");
const author = document.getElementById("author-div");
const post = document.getElementById("post-body");
const image = document.getElementById("image");
const navigation = document.getElementById("navigation");
const comments = document.getElementById("comments-div");
const commentButton = document.getElementById("post_comment");
const newPostTextBox = document.getElementById("textBox");
const postLikeCount = document.getElementById("post_like_count");
const postLikeButton = document.getElementById("post_like_button");
const image_upload = document.getElementById("image_upload");

const username = window.sessionStorage.getItem("user");
const password = window.sessionStorage.getItem("pw");

// Add logout button and display username on top right if user logged in;
Util.integrateAuthUI();

// Adds functionality for creating a comment
commentButton.addEventListener("click", async function (event) {
  let text = newPostTextBox.value;
  const responseData = await crud.createComment(
    "true",
    postId,
    postId,
    username,
    password,
    text,
    image_upload.files[0]
  );
  if (responseData.error === undefined) {
    newPostTextBox.value = "";
    await loadComments();
    return;
  }
  alert(responseData.error);
});

// Loads the thread/forum for the page
async function loadPost() {
  const postData = await crud.getThread(postId);

  if ("error" in postData) {
    title.innerText = "Error";
    post.innerText = postData.error;
    return -1;
  }

  title.innerText = postData.title;
  author.innerText = postData.author;
  post.innerText = postData.post_body;
  postLikeCount.innerText = postData.likes.toString() + (postData.likes === 1 ? " Like" : " Likes");

  // Creates the navigation link at the top of page
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.has("page") ? urlParams.get("page") : "1";
  let link = urlParams.has("amount")
    ? `/?page=${page}&amount=${urlParams.get("amount")}`
    : `/?page=${page}&amount=4`;
  const ordering = urlParams.has("by") ? urlParams.get("by") : "time";
  link += `&by=${ordering}`;
  navigation.innerHTML = `<a href="${link}">${Util.orderingMap[ordering]} > ${
    page === "1" ? "First" : page
  } > </a> ${postData.title}`;

  // Add delete button if user is authenticated and is the post creator
  if ((await Util.isAuthenticated()) && postData.author === username) {
    deleteDiv.innerHTML =
      '<button id="delete-thread" class="btn delete-btn" type="button">Delete Thread</button>';

    // Make delete function delete the thread
    document
      .getElementById("delete-thread")
      .addEventListener("click", () => deleteThread(postData.title));
  }

  // Add image to page if this post has an image
  if (postData.imagePath !== undefined) {
    image.innerHTML = `<img class="img_upload" src="${postData.imagePath}" />`;
  }

  

  return 0;
}

// Creates the html for comment and puts it in the page
function generateCommentHTML(comment) {
  let commentHTML = `<div id = comment-${comment.comment_id.replaceAll(/ /g, "_")}>
    <p class="medium-text">${comment.author}</p>
    <p class="small-text">${comment.time}</p>
    <div class="vl"></div>
    <p class="comment-text">${comment.comment_body}</p>
    <div ${comment.image_path ? "" : "hidden='hidden'"}>
    <p class="comment-text"><img class="img_comment" src="${comment.image_path}" /></p><br>
    </div>
    <br>
    <button class="like btn" id="like-button">
      <img class="comment" src="img/heart.png" /> 
      <span class="like-count">${comment.likes}</span>
      Like
    </button>
    <div style="display: inline-block; width: 50px"></div>
    <button class="reply btn" id="reply-${comment.comment_id.split("-")[0]}">
      <img class="comment" src="img/comment.png" /> Reply
    </button>
    <button class="delete-comment btn" id="delete-${comment.comment_id.replaceAll(
      / /g,
      "_"
    )}" hidden="hidden">${comment.author}</button>
    <br><br>`;

  if (comment.children.length > 0) {
    commentHTML += `<div class="ml-5">`;
    for (let i = 0; i < comment.children.length; i++) {
      commentHTML += generateCommentHTML(comment.children[i]);
    }
    commentHTML += `</div>`;
  }
  commentHTML += `</div>`;
  console.log(comment);
  return commentHTML;
}

// Puts the comments into the page and sets their event handlers
async function loadComments() {
  const commentData = await crud.getComments(postId);
  comments.innerHTML = commentData.comments.reduce(
    (acc, e) => acc + generateCommentHTML(e),
    ""
  );
  setCommentEventHandlers();
}

// If posts loads successfully, then load the comments, and add the like button listener
if ((await loadPost()) === 0) {
  await loadComments();
  postLikeButton.addEventListener("click", async () => {
    const response = await crud.updateThreadLikeCount(title.innerText, username, password);
    if (response.error !== undefined){
      alert(response.error);
      return;
    }
    await loadPost();
  });
}

function setCommentEventHandlers() {
  const likeButtons = document.querySelectorAll("#like-button");
  likeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const commentIDTokens = button.parentElement.id.split("-");
      const response = await crud.updateLikeCount(
        `${commentIDTokens[1]}-${commentIDTokens[2]}`.replaceAll(/_/g, " "),
        username,
        password
      );
      if (response.error !== undefined) {
        alert(response.error);
        return;
      }
      await loadComments();
    });
  });

  const replyButtons = document.querySelectorAll(".reply");
  replyButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const commentDiv = button.parentElement;
      const parentId = button.id.split("-")[1];
      button.disabled = true;
      let div = document.createElement("div");
      div.id = `reply-div-${parentId}`;
      div.classList.add("w-50");
      div.innerHTML = `
        <textarea id="text-${parentId}" style="width: 100%" class="form-rounded" rows="7"
          placeholder="What are your thoughts?"></textarea>
        <br>
        <button class="cancel_reply btn" id=cancel-${parentId} style="float: left" type="button" class="btn new-thread-button">Cancel</button>
        <button class="comment_reply btn" id=post-${parentId} style="float: right" type="button" class="btn new-thread-button">Comment</button>
        <br><br>
      `;
      commentDiv.append(div);

      document
        .getElementById(`cancel-${parentId}`)
        .addEventListener("click", function (event) {
          document.getElementById(`reply-${parentId}`).disabled = false;
          event.target.parentElement.remove();
        });

      document
        .getElementById(`post-${parentId}`)
        .addEventListener("click", async function (event) {
          const text = document.getElementById(`text-${parentId}`).value;
          const responseData = await crud.createComment(
            "false",
            postId,
            `${parentId}-${postId}`,
            username,
            password,
            text
          );
          document.getElementById(`reply-${parentId}`).disabled = false;
          event.target.parentElement.remove();

          if (responseData.error !== undefined) {
            alert(responseData.error);
          }

          await loadComments();
        });
    });
  });

  document.querySelectorAll(".delete-comment").forEach((button) => {
    if (button.innerText !== username) {
      return;
    }
    button.innerText = "Delete";
    button.hidden = false;
    button.addEventListener("click", async () => {
      const splits = button.id.split("-");
      const response = await crud.deleteComment(
        `${splits[1]}-${splits[2]}`,
        username,
        password
      );
      if (response.error !== undefined) {
        window.alert(response.error);
        return;
      }
      window.alert(response.success);
      await loadComments();
    });
  });
}

async function deleteThread(title) {
  const response = await crud.deleteThread(username, password, title);
  if (response.error !== undefined) {
    alert(response.error);
  } else {
    alert("Post deleted");
  }
  window.location.replace("/");
}
