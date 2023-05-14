import PouchDB from "pouchdb";
import formidable from "formidable"; // For handling image uploads
import * as timeUtils from "./time.js";
import { createHash } from "node:crypto";

// This is to ensure that no matter where the server is run from, the path is always valid
// This regex removes the ending "server.js" and replaces it with the path to the requested resource
const filePathPrefix = process.argv[1].replace(/server\.js$/, "");

const accounts_db = new PouchDB(filePathPrefix + "/db/accounts");
const threads_db = new PouchDB(filePathPrefix + "/db/threads");
const comments_db = new PouchDB(filePathPrefix + "/db/comments");

const accountsLoggedIn = {};

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

export async function createAccount(request, response) {
  const username = Object.keys(request)[0];
  if (await accountExists(username)) {
    await sendError(response, 404, `Username '${username}' taken`);
    return;
  }

  await accounts_db.put({
    _id: username,
    pwHash: hashPassword(request[username]),
    likes: [],
  });
  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ success: "Account created" }));
  response.end();
}

async function checkPassword(username, password) {
  const account = await accounts_db.get(username);
  return account.pwHash === hashPassword(password);
}

export async function login(response, options) {
  const username = Object.keys(options)[0];
  if (await accountExists(username)) {
    if (await checkPassword(username, options[username])) {
      accountsLoggedIn[username] = true;
      response.writeHead(200, headerFields);
      response.write(JSON.stringify({ success: "Successfully logged in" }));
      response.end();
      return;
    }
    await sendError(response, 404, `Invalid password`);
    return;
  }
  await sendError(response, 404, `Account ${username} does not exist`);
}

export async function logout(request, response) {
  const username = Object.keys(request)[0];
  if (
    (await accountExists(username)) &&
    (await checkPassword(username, request[username]))
  ) {
    delete accountsLoggedIn[username];
  }
  response.writeHead("200", headerFields);
  response.end();
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

function handleImageUpload(request) {
  const filename = Date.now().toString();
  const form = new formidable.IncomingForm({
    maxFields: 1,
    uploadDir: filePathPrefix + "/img/",
    filename: () => filename,
  });
  try {
    form.parse(request);
  } catch (err) {
    console.error(err);
  }
  return "/img/" + filename;
}

export async function createThread(request, response, options) {
  const username = options.user;
  const password = options.pw;
  const postTitle = options.postTitle;
  const postText = options.postText;
  const hasImage = options.hasImage === "true";

  const checkLogin = await loginValid(username, password);
  if (checkLogin !== true) {
    await sendError(response, 400, checkLogin);
    return;
  }

  if (hasImage === undefined) {
    await sendError(response, 400, "Missing hasImage field");
    return;
  }

  if (postTitle === "" || postTitle === undefined) {
    await sendError(response, 400, "A thread title is required");
    return;
  }

  if (postText === "" || postText === undefined) {
    await sendError(response, 400, "Thread body text is required");
    return;
  }

  if (await threadExists(postTitle)) {
    await sendError(response, 400, `Title "${postTitle}" taken`);
    return;
  }

  if (/\-/.test(postTitle) || /_/.test(postTitle)) {
    await sendError(
      response,
      400,
      "Title may not contain dashes nor underscores"
    );
    return;
  }

  threads_db.put({
    _id: postTitle,
    author: username,
    body: postText,
    time: Date.now(),
    images: hasImage ? 1 : 0,
    imagePath: hasImage ? handleImageUpload(request) : undefined,
    posts: 1,
    comments: [],
  });

  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ success: "Thread Created" }));
  response.end();
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

export async function dumpThreads(response, options) {
  const allDocs = await threads_db.allDocs({ include_docs: true });
  let threads = [];
  const amount = options.amount;
  const page = options.page;
  allDocs.rows.forEach((x) => threads.push(x.doc));
  threads.sort(timeUtils.compare);
  if (amount !== undefined && page != undefined && amount !== "All") {
    const amt = parseInt(amount);
    const pg = parseInt(page) - 1;
    threads = threads.slice(pg * amt, pg * amt + amt);
  }

  response.writeHead(200, headerFields);
  response.write(
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
  response.end();
}

export async function numThreads(response, options) {
  const allDocs = await threads_db.allDocs({ include_docs: true });
  response.writeHead(200, headerFields);
  response.write(JSON.stringify(allDocs.total_rows));
  response.end();
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

export async function isLoggedIn(response, options) {
  response.writeHead(200, headerFields);
  response.write(JSON.stringify(options.user in accountsLoggedIn));
  response.end();
}

export async function deleteComment(response, options) {
  // TODO this method is incomplete
  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ error: "Not yet implemented" }));
  response.end();
}