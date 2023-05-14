// Logs in the user on server-side
export async function logIn(username, password) {
  const response = await fetch(`/server/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
  const data = await response.json();
  return data;
}

// Creates a new account
export async function createAccount(username, password) {
  const response = await fetch(`/server/createAccount`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
  const data = await response.json();
  return data;
}

// Logs out the user
export async function logOut(username, password) {
  const response = await fetch(`/server/logout?`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
}

// Creates a new thread
export async function createThread(username, password, title, text, imagePath) {
  const body = new FormData();
  body.append("image", imagePath);
  body.append("username", username);
  body.append("password", password);
  body.append("title", title);
  body.append("text", text);

  const response = await fetch(`/server/createThread`, {
    method: "POST",
    body: body,
  });
  const data = await response.json();
  return data;
}

// Returns a specific thread object
export async function getThread(post) {
  const response = await fetch(
    `/server/getThread?post_id=${encodeURIComponent(post)}`,
    {
      method: "GET",
    }
  );
  const data = await response.json();
  return data;
}

// Posts a comment
export async function createComment(
  post_parent,
  post_id,
  parent_id,
  username,
  password,
  text
) {
  post_parent = encodeURIComponent(post_parent);
  post_id = encodeURIComponent(post_id);
  parent_id = encodeURIComponent(parent_id);
  username = encodeURIComponent(username);
  password = encodeURIComponent(password);
  text = encodeURIComponent(text);
  const response = await fetch(
    `${ORIGIN}/server/createComment?post_id=${post_id}&post_parent=${post_parent}&parent_id=${parent_id}&username=${username}&pw=${password}&text=${text}`,
    { method: "POST" }
  );
  const data = await response.json();
  return data;
}

// Returns list of comment objects for post
export async function getComments(post) {
  const response = await fetch(
    `/server/getComments?post_id=${encodeURIComponent(post)}`,
    {
      method: "GET",
    }
  );
  const data = await response.json();
  return data;
}

// Deleted a thread with title title
// User must be authenticated
export async function deleteThread(username, password, title) {
  const response = await fetch(`/server/deleteThread`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
      title: title,
    }),
  });
  const data = await response.json();
  return data;
}

// Returns an array of all the thread objects
export async function dumpThreads(page, amount) {
  const response = await fetch(
    `/server/dumpThreads?page=${page}&amount=${amount}`,
    { method: "GET" }
  );
  const data = await response.json();
  return data;
}

// Updates the like count for comment
export async function updateLikeCount(comment, username, password) {
  const response = await fetch(`/server/updateLikeCount`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
      comment: comment,
    }),
  });
  const data = await response.json();
  return data;
}

// Returns a boolean on weather username is logged in
export async function isLoggedIn(username) {
  const response = await fetch(
    `/server/isLoggedIn?username=${encodeURIComponent(username)}`,
    {
      method: "GET",
    }
  );
  const data = await response.json();
  return data;
}

export async function deleteComment(commentID, username, password) {
  username = encodeURIComponent(username);
  password = encodeURIComponent(password);
  commentID = encodeURIComponent(commentID);

  const response = await fetch(
    `${ORIGIN}/server/deleteComment?user=${username}&pw=${password}&comment=${commentID}`,
    { method: "DELETE" }
  );
  const data = await response.json();
  return data;
}

export async function numThreads() {
  const response = await fetch(`/server/numThreads`, {
    method: "GET",
  });
  const data = await response.json();
  return data;
}
