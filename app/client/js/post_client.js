import * as crud from './crud.js';

const title = document.getElementById("title-div");
const author = document.getElementById("author-div");
const post = document.getElementById("post-body");

const comments = document.getElementById('comments-div');
const commentButton = document.getElementById('post_comment');
const newPostTextBox = document.getElementById('textBox');

const likeButtons = document.querySelectorAll('#like');
likeButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const likeCount = button.querySelector('.like-count');
    let count = parseInt(likeCount.textContent);
    count++;
    likeCount.textContent = count;
    const response = await crud.updateLikeCount(count);
  });
});

const replyButtons = document.querySelectorAll('#reply');
replyButtons.forEach(button => {
  button.addEventListener('click', () => {
  });
});

async function loadPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('post_id');
  const postData = await crud.getThread(postId);

  // let mockTitle = 'How do I print at the library?';
  // let mockAuthor = 'Anish Gupta';
  // let mockPost = `Hi everyone,

  // I'm a new student at UMass Amherst and I'm having trouble figuring out how to print at the W.E.B Dubois Library. I have some papers due soon and I really need to print them out, but I'm not sure where to start.
  
  // Can anyone walk me through the process of printing at the library? Do I need to bring my own printer or paper? I've heard that I need a UCard to print, but I'm not sure what that is or how to use it. Any advice or guidance would be greatly appreciated.
  
  // Thank you in advance!`;

  title.innerText = postData.title;
  author.innerText = postData.author;
  post.innerText = postData.post_body;
}

function generateCommentHTML(comment) {
  let commentHTML = `<div>
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
    <button class="reply" id="reply-button">
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
  let mockComments = [
    {
      author: "Anish Gupta",
      time: "40 minutes ago",
      comment_body: "Go on umass uprint! You can scan your id at the printer and print there",
      likes: 5,
      children: [
        {
          author: "Nithin Joshy",
          time: "20 minutes ago",
          comment_body: "Thanks!! :)",
          likes: 2,
          children: []
        }
      ]
    },
    {
      author: "Nithin Joshy",
      time: "50 minutes ago",
      comment_body: "pleasse help I also rly need help.",
      likes: 0,
      children: []
    }
  ];

  comments.innerHTML = mockComments.reduce((acc, e) => acc + generateCommentHTML(e), ''); 
}

await loadPost();
await loadComments();