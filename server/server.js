import * as timeUtils from "./time.js";
import * as db from "./database.js";
import path from "path";

const accountsLoggedIn = {};

// This is to allow for accessing the server from the same IP origin
// Will probably be modified once this is properly deployed
const headerFields = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, DELETE, HEAD, PUT, POST",
};

// Send an error message back to client
// sendError(response: HTTPresponse, code: number, message: string): void
async function sendError(response, code, message) {
  response.writeHead(code, headerFields);
  response.write(JSON.stringify({ error: message }));
  response.end();
}

export async function createAccount(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    await sendError(res, 400, `Username or password not supplied in request`);
    return;
  }

  if (await db.accounts.exists(username)) {
    await sendError(res, 400, `Username '${req.body.username}' taken`);
    return;
  }
  db.accounts.create(username, password);

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Account created" }));
  res.end();
}

export async function login(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (await db.accounts.exists(username)) {
    if (await db.accounts.checkPassword(username, password)) {
      accountsLoggedIn[username] = true;
      res.writeHead(200, headerFields);
      res.write(JSON.stringify({ success: "Successfully logged in" }));
      res.end();
      return;
    }
    await sendError(res, 404, `Invalid password`);
    return;
  }
  await sendError(res, 404, `Account ${username} does not exist`);
}

export async function logout(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (await loginValid(username, password)) {
    delete accountsLoggedIn[username];
  }
  res.writeHead(200, headerFields);
  res.end();
}

async function loginValid(username, password) {
  if (username === null || password === null) {
    return "You must be logged in for this operation.";
  }
  if (username === "null" || password === "null") {
    return "You must be logged in for this operation.";
  }

  if (
    !(await db.accounts.exists(username)) ||
    !(await db.accounts.checkPassword(username, password))
  ) {
    return "Bad Request";
  }

  if (accountsLoggedIn[username] !== true) {
    return "You must be logged in to create a thread";
  }

  return true;
}

function handleImageUpload(req) {
  if (!req.files) {
    return undefined;
  }
  const filepath = `/uploads/${Date.now()}`;
  const { image } = req.files;
  image.mv(path.join(process.env.PWD, filepath));
  return filepath;
}

export async function createThread(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const title = req.body.title;
  const text = req.body.text;

  const checkLogin = await loginValid(username, password);
  if (checkLogin !== true) {
    await sendError(res, 400, checkLogin);
    return;
  }

  if (title === "" || title === undefined) {
    await sendError(res, 400, "A thread title is required");
    return;
  }

  if (text === "" || text === undefined) {
    await sendError(res, 400, "Thread body text is required");
    return;
  }

  if (await db.threads.exists(title)) {
    await sendError(res, 400, `Title "${title}" taken`);
    return;
  }

  if (/\-/.test(title) || /_/.test(title)) {
    await sendError(res, 400, "Title may not contain dashes nor underscores");
    return;
  }
  const imagePath = handleImageUpload(req);
  db.threads.create(username, title, text, imagePath);

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Thread Created" }));
  res.end();
}

export async function createComment(req, res) {
  if (!(await db.threads.exists(req.body.post_id))) {
    await sendError(res, 404, "Post not found.");
    return;
  }
  if (req.body.text === "") {
    await sendError(res, 400, "Comment cannot be empty");
    return;
  }

  const checkLogin = await loginValid(req.body.username, req.body.password);
  if (checkLogin !== true) {
    await sendError(res, 400, checkLogin);
    return;
  }

  const num = await db.threads.incrementPostCount(req.body.post_id);
  await db.threads.updateTimeStamp(req.body.post_id);

  const comment_id = (num - 1).toString() + "-" + req.body.post_id;
  if (req.body.post_parent === "true") {
    await db.threads.addTopLevelComment(req.body.parent_id, comment_id);
  } else {
    await db.comments.addChild(req.body.parent_id, comment_id);
  }

  await db.comments.create(comment_id, req.body.username, req.body.text);

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Comment Created" }));
  res.end();
}

export async function getThread(req, res) {
  if (!(await db.threads.exists(req.query.post_id))) {
    await sendError(res, 404, "Post not found.");
    return;
  }

  const thread = await db.threads.get(req.query.post_id);
  res.writeHead(200, headerFields);
  res.write(
    JSON.stringify({
      title: thread.title,
      author: thread.author,
      post_body: thread.body,
      imagePath: thread.imagePath,
    })
  );

  res.end();
}

export async function getComments(req, res) {
  if (!(await db.threads.exists(req.query.post_id))) {
    await sendError(res, 404, "Post not found.");
    return;
  }

  const post = await db.threads.get(req.query.post_id);
  const raw_comments = [];
  for (let i = 0; i < post.comments.length; i++) {
    raw_comments.push(await db.comments.load(post.comments[i]));
  }

  function recursiveMapHOF(x) {
    x.time = timeUtils.convertToRecencyString(x.time);
    x.children = x.children.map(recursiveMapHOF);
    return x;
  }

  const comments = raw_comments.map(recursiveMapHOF);

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ comments: comments }));
  res.end();
}

export async function deleteThread(req, res) {
  const checkLogin = await loginValid(req.body.username, req.body.password);
  if (checkLogin !== true) {
    await sendError(res, 400, checkLogin);
    return;
  }

  if (!(await db.threads.exists(req.body.title))) {
    await sendError(res, 400, "Post does not exist");
    return;
  }

  if ((await db.threads.get(req.body.title)).author !== req.body.username) {
    await sendError(res, 400, "You are not the creator of this thread");
    return;
  }

  await db.comments.deleteAllFromThread(req.body.title);
  await db.threads.delete(req.body.title);

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Deleted successfully" }));
  res.end();
}

export async function dumpThreads(req, res) {
  res.writeHead(200, headerFields);
  res.write(
    JSON.stringify(await db.threads.dump(req.query.amount, req.query.page))
  );
  res.end();
}

export async function numThreads(req, res) {
  res.writeHead(200, headerFields);
  res.write(JSON.stringify(await db.threads.total()));
  res.end();
}

export async function updateLikeCount(req, res) {
  const checkLogin = await loginValid(req.body.username, req.body.password);
  if (checkLogin !== true) {
    await sendError(res, 400, checkLogin);
    return;
  }

  db.comments.changeLikeCount(
    req.body.comment,
    await db.accounts.toggleCommentLike(req.body.username, req.body.comment)
  );

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Comment Like Count Updated" }));
  res.end();
}

export async function isLoggedIn(req, res) {
  res.writeHead(200, headerFields);
  res.write(JSON.stringify(req.query.username in accountsLoggedIn));
  res.end();
}

export async function deleteComment(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const comment_id = req.body.commentID.replace(/_/g, " ");
  
  const checkLogin = await loginValid(username, password);
  if (checkLogin !== true) {
    await sendError(res, 400, checkLogin);
    return;
  }
  if ((await db.comments.getAuthor(comment_id)) !== username){
    await sendError(res, 400, "Not your comment");
    return;
  }
  await db.comments.changeText(comment_id, "[DELETED]");

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Comment Deleted" }));
  res.end();
}
