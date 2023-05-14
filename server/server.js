import PouchDB from "pouchdb";
import * as timeUtils from "./time.js";
import { createHash } from "node:crypto";
import path from "path";
// This is to ensure that no matter where the server is run from, the path is always valid
// This regex removes the ending "server.js" and replaces it with the path to the requested resource
const filePathPrefix = process.env.PWD;

const accounts_db = new PouchDB(path.join(filePathPrefix, "/db/accounts"));
const threads_db = new PouchDB(path.join(filePathPrefix, "/db/threads"));
const comments_db = new PouchDB(path.join(filePathPrefix, "/db/comments"));

const accountsLoggedIn = { "TEST1": true };

// This is to allow for accessing the server from the same IP origin
// Will probably be modified once this is properly deployed
const headerFields = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, DELETE, HEAD, OPTIONS, PUT, POST",
};

function hashPassword(password) {
  return createHash("sha256").update(password).digest("base64");
}

// Send an error message back to client
// sendError(response: HTTPresponse, code: number, message: string): void
async function sendError(response, code, message) {
  response.writeHead(code, headerFields);
  response.write(JSON.stringify({ error: message }));
  response.end();
}

async function accountExists(username) {
  const docs = await accounts_db.allDocs({ include_docs: true });
  return docs.rows.some((x) => x.id === username);
}

export async function createAccount(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    await sendError(res, 400, `Username or password not supplied in request`);
    return;
  }

  if (await accountExists(username)) {
    await sendError(res, 400, `Username '${req.body.username}' taken`);
    return;
  }
  await accounts_db.put({
    _id: username,
    pwHash: hashPassword(password),
    likes: [],
  });
  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Account created" }));
  res.end();
}

async function checkPassword(username, password) {
  const account = await accounts_db.get(username);
  return account.pwHash === hashPassword(password);
}

export async function login(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (await accountExists(username)) {
    if (await checkPassword(username, password)) {
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
  if (
    (await accountExists(username)) &&
    (await checkPassword(username, password))
  ) {
    delete accountsLoggedIn[username];
  }
  res.writeHead(200, headerFields);
  res.end();
}

async function threadExists(title) {
  const docs = await threads_db.allDocs({ include_docs: true });
  return docs.rows.some((x) => x.id === title);
}

async function loginValid(username, password) {
  if (username === null || password === null) {
    return "You must be logged in for this operation.";
  }
  if (username === "null" || password === "null") {
    return "You must be logged in for this operation.";
  }

  if (
    !(await accountExists(username)) ||
    !(await checkPassword(username, password))
  ) {
    return "Bad Request";
  }

  if (accountsLoggedIn[username] !== true) {
    return "You must be logged in to create a thread";
  }

  return true;
}

function handleImageUpload(req) {
  if (!req.files){
    return undefined;
  }
  const filepath = path.join(process.env.PWD, `img/${Date.now()}`);
  const { image } = req.files;
  image.mv(filepath);
  return filepath;
}

export async function createThread(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const postTitle = req.body.title;
  const postText = req.body.text;

  const checkLogin = await loginValid(username, password);
  if (checkLogin !== true) {
    await sendError(res, 400, checkLogin);
    return;
  }

  if (postTitle === "" || postTitle === undefined) {
    await sendError(res, 400, "A thread title is required");
    return;
  }

  if (postText === "" || postText === undefined) {
    await sendError(res, 400, "Thread body text is required");
    return;
  }

  if (await threadExists(postTitle)) {
    await sendError(res, 400, `Title "${postTitle}" taken`);
    return;
  }

  if (/\-/.test(postTitle) || /_/.test(postTitle)) {
    await sendError(res, 400, "Title may not contain dashes nor underscores");
    return;
  }
  const imagePath = handleImageUpload(req);
  threads_db.put({
    _id: postTitle,
    author: username,
    body: postText,
    time: Date.now(),
    images: imagePath ? 1 : 0,
    imagePath: imagePath,
    posts: 1,
    comments: [],
  });

  res.writeHead(200, headerFields);
  res.write(JSON.stringify({ success: "Thread Created" }));
  res.end();
}

export async function createComment(response, options) {
  if (!(await threadExists(options.post_id))) {
    await sendError(response, 404, "Post not found.");
    return;
  }
  if (options.text === "") {
    await sendError(response, 400, "Comment cannot be empty");
    return;
  }

  const checkLogin = await loginValid(options.username, options.pw);
  if (checkLogin !== true) {
    await sendError(response, 400, checkLogin);
    return;
  }

  const post = await threads_db.get(options.post_id);
  const commentId = post.posts.toString() + "-" + options.post_id;
  post.posts++;
  post.time = Date.now();
  await threads_db.put(post, { _rev: post._rev, force: true });

  if (options.post_parent === "true") {
    threads_db.get(options.parent_id).then(async function (doc) {
      doc.comments.push(commentId);
      await threads_db.put(doc, { _rev: doc._rev, force: true });
    });
  } else {
    comments_db.get(options.parent_id).then(async function (doc) {
      doc.children.push(commentId);
      await comments_db.put(doc), { _rev: doc._rev, force: true };
    });
  }
  await comments_db.put({
    _id: commentId,
    author: options.username,
    comment_body: options.text,
    time: Date.now(),
    likes: 0,
    children: [],
  });

  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ success: "Comment Created" }));
  response.end();
}

export async function getThread(response, options) {
  if (!(await threadExists(options.post_id))) {
    await sendError(response, 404, "Post not found.");
    return;
  }

  const post = await threads_db.get(options.post_id);
  response.writeHead(200, headerFields);
  response.write(
    JSON.stringify({
      title: post._id,
      author: post.author,
      post_body: post.body,
      imagePath: post.imagePath,
    })
  );
  response.end();
}

async function loadComment(comment_id) {
  const comment = await comments_db.get(comment_id);
  for (let i = 0; i < comment.children.length; i++) {
    const child = await loadComment(comment.children[i]);
    comment.children[i] = child;
  }

  return comment;
}

export async function getComments(response, options) {
  if (!(await threadExists(options.post_id))) {
    await sendError(response, 404, "Post not found.");
    return;
  }

  const post = await threads_db.get(options.post_id);
  const raw_comments = [];
  for (let i = 0; i < post.comments.length; i++) {
    raw_comments.push(await loadComment(post.comments[i]));
  }

  function recursiveMapHOF(x) {
    x.time = timeUtils.convertToRecencyString(x.time);
    x.children = x.children.map(recursiveMapHOF);
    return x;
  }

  const comments = raw_comments.map(recursiveMapHOF);

  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ comments: comments }));
  response.end();
}

export async function deleteThread(response, options) {
  const checkLogin = await loginValid(options.user, options.pw);
  if (checkLogin !== true) {
    await sendError(response, 400, checkLogin);
    return;
  }

  if (!(await threadExists(options.title))) {
    await sendError(response, 400, "Post does not exist");
    return;
  }

  const doc = await threads_db.get(options.title);
  const comments = await comments_db.allDocs({ include_docs: true });
  comments.rows.forEach(async (comment) => {
    const re = new RegExp(`^\\d+\-${doc._id}$`);
    if (re.test(comment.id)) {
      await comments_db.remove(await comments_db.get(comment.id));
    }
  });
  await threads_db.remove(doc);

  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ success: "Deleted successfully" }));
  response.end();
}

export async function dumpThreads(req, res) {
  const allDocs = await threads_db.allDocs({ include_docs: true });
  let threads = [];
  const amount = req.query.amount;
  const page = req.query.page;
  allDocs.rows.forEach((x) => threads.push(x.doc));
  threads.sort(timeUtils.compare);
  if (amount !== undefined && page != undefined && amount !== "All") {
    const amt = parseInt(amount);
    const pg = parseInt(page) - 1;
    threads = threads.slice(pg * amt, pg * amt + amt);
  }

  res.writeHead(200, headerFields);
  res.write(
    JSON.stringify(
      threads.map((x) => {
        return {
          author: x.author,
          title: x._id,
          body: x.body,
          time: timeUtils.convertToRecencyString(x.time),
          images: x.images,
          posts: x.posts,
        };
      })
    )
  );
  res.end();
}

export async function numThreads(req, res) {
  const allDocs = await threads_db.allDocs({ include_docs: true });
  res.writeHead(200, headerFields);
  res.write(JSON.stringify(allDocs.total_rows));
  res.end();
}

export async function updateLikeCount(response, options) {
  const checkLogin = await loginValid(options.user, options.pw);
  if (checkLogin !== true) {
    await sendError(response, 400, checkLogin);
    return;
  }

  comments_db.get(options.comment).then(async function (doc) {
    const userDoc = await accounts_db.get(options.user);

    if (userDoc.likes.some((x) => x === options.comment)) {
      --doc.likes;
      userDoc.likes.splice(userDoc.likes.indexOf(options.comment), 1);
    } else {
      ++doc.likes;
      userDoc.likes.push(options.comment);
    }
    await accounts_db.put(userDoc, { _rev: userDoc.rev, force: true });
    await comments_db.put(doc, { _rev: doc.rev, force: true });
  });

  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ success: "Comment Like Count Updated" }));
  response.end();
}

export async function isLoggedIn(req, res) {
  res.writeHead(200, headerFields);
  res.write(JSON.stringify(req.query.username in accountsLoggedIn));
  res.end();
}

export async function deleteComment(response, options) {
  // TODO this method is incomplete
  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ error: "Not yet implemented" }));
  response.end();
}
