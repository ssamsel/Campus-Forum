import * as crud from './crud.js';

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('title');

const title = document.getElementById("title-div");
const author = document.getElementById("author-div");
const post = document.getElementById("post-body");
const image = document.getElementById("image");

const comments = document.getElementById('comments-div');
const commentButton = document.getElementById('post_comment');
const newPostTextBox = document.getElementById('textBox');

const username = window.sessionStorage.getItem("username");
const pwHash = window.sessionStorage.getItem("pwHash");


commentButton.addEventListener('click', async function (event) {
  let text = newPostTextBox.value;
  const responseData = await crud.createComment("true", postId, postId, username, pwHash, text);
  console.log(responseData);
  if (responseData.error !== undefined){
    alert(responseData.error);
  }
  await loadComments();
});

async function loadPost() {
  const postData = await crud.getThread(postId);
  
  if ('error' in postData) {
    title.innerText = 'Error';
    post.innerText = postData.error;
    return -1;
  }

  title.innerText = postData.title;
  author.innerText = postData.author;
  post.innerText = postData.post_body;
  if (postData.imagePath !== undefined){
    image.innerHTML = `<img src="${postData.imagePath}" />`
  }
  return 0;
}

function generateCommentHTML(comment) {
  let commentHTML = `<div id = comment-${comment._id}>
    <p class="medium-text">${comment.author}</p>
    <p class="small-text">${comment.time}</p>
    <div class="vl"></div>
    <p class="comment-text">${comment.comment_body}</p>
    <br>
    <button class="like" id="like-button">
      <img class="comment" src="img/heart.png" /> 
      <span class="like-count">${comment.likes}</span>
      Like
    </button>
    <div style="display: inline-block; width: 50px"></div>
    <button class="reply" id="reply-${comment._id}">
      <img class="comment" src="img/comment.png" /> Reply
    </button>
    <br><br>`
  
  if (comment.children.length > 0) {
    commentHTML += `<div class="ml-5">`
    for (let i = 0; i < comment.children.length; i++) {
      commentHTML += generateCommentHTML(comment.children[i]);
    }
    commentHTML += `</div>`;
  }
  commentHTML += `</div>`;
  return commentHTML;
}

async function loadComments() {
  const commentData = await crud.getComments(postId);
  console.log(commentData);
  comments.innerHTML = commentData.comments.reduce((acc, e) => acc + generateCommentHTML(e), '');
  setCommentEventHandlers();
}

if (await loadPost() === 0) {
  await loadComments();
}

function setCommentEventHandlers () {
  const likeButtons = document.querySelectorAll('#like-button');
  likeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const likeCount = button.querySelector('.like-count');
      let count = parseInt(likeCount.textContent);
      count++;
      likeCount.textContent = count;
      const response = await crud.updateLikeCount(button.parentElement.id.split('-')[1]);
      console.log(response);
  });

  const replyButtons = document.querySelectorAll('.reply');
  replyButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const commentDiv = button.parentElement;
      const parentId = button.id.split('-')[1];
      button.disabled = true;
      let div = document.createElement("div");
      div.id = `reply-div-${parentId}`;
      div.classList.add("w-50");
      div.innerHTML = `
        <textarea id="text-${parentId}" style="width: 100%" class="form-rounded" rows="7"
          placeholder="What are your thoughts?"></textarea>
        <br>
        <button class="cancel_reply" id=cancel-${parentId} style="float: left" type="button" class="btn new-thread-button">Cancel</button>
        <button class="comment_reply" id=post-${parentId} style="float: right" type="button" class="btn new-thread-button">Comment</button>
        <br><br>
      `
      commentDiv.append(div);

      document.getElementById(`cancel-${parentId}`).addEventListener('click', function (event) {
        document.getElementById(`reply-${parentId}`).disabled = false;
        event.target.parentElement.remove();
      });

      document.getElementById(`post-${parentId}`).addEventListener('click', async function (event) {
        const text = document.getElementById(`text-${parentId}`).value;
        const responseData = await crud.createComment("false", postId, parentId, username, pwHash, text);
        document.getElementById(`reply-${parentId}`).disabled = false;
        event.target.parentElement.remove();

        if (responseData.error !== undefined){
          alert(responseData.error);
        }

        await loadComments();
      });
    });
  });
}

