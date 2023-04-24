import * as crud from './crud.js';

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
