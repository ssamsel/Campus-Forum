import * as crud from './crud.js';

const title = document.getElementById("title-div");
const author = document.getElementById("author-div");
const post = document.getElementById("post-body");

const commentButton = document.getElementById('post_comment');
const newPostTextBox = document.getElementById('textBox');

const likeButtons = document.querySelectorAll('#like');
likeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const likeCount = button.querySelector('.like-count');
    let count = parseInt(likeCount.textContent);
    count++;
    likeCount.textContent = count;
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

await loadPost();