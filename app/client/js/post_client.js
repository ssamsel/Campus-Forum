import * as crud from './crud.js';

const commentButton = document.getElementById('post_comment');
const newPostTextBox = document.getElementById('textBox');

// Select all the like buttons and add an event listener to each one
const likeButtons = document.querySelectorAll('#like');
likeButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Your like button functionality here
    const likeCount = button.querySelector('.like-count');
    let count = parseInt(likeCount.textContent);
    count++;
    likeCount.textContent = count;
  });
});

// Select all the reply buttons and add an event listener to each one
const replyButtons = document.querySelectorAll('#reply');
replyButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Your reply button functionality here
  });
});
