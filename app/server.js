import * as http from "http";
import * as https from "https";
import * as url from "url";
import PouchDB from "pouchdb";
import formidable from "formidable"; // For handling image uploads
import { readFile } from "fs/promises";
import { readFileSync } from "fs";
import * as timeUtils from "./time.js";
import { createHash } from "node:crypto";

const DEFAULT_PORT_LOCAL = 3000;

// This is to ensure that no matter where the server is run from, the path is always valid
// This regex removes the ending "server.js" and replaces it with the path to the requested resource
const filePathPrefix = process.argv[1].replace(/server\.js$/, "");

const accounts_db = new PouchDB(filePathPrefix + "/db/accounts");
const threads_db = new PouchDB(filePathPrefix + "/db/threads");
const comments_db = new PouchDB(filePathPrefix + "/db/comments");

const accountsLoggedIn = { lol123: true };

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

async function createAccount(response, options) {
  const username = Object.keys(options)[0];
  if (await accountExists(username)) {
    await sendError(response, 404, `Username '${username}' taken`);
    return;
  }

  await accounts_db.put({
    _id: username,
    pwHash: hashPassword(options[username]),
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

async function login(response, options) {
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

async function logout(response, options) {
  const username = Object.keys(options)[0];
  if (
    (await accountExists(username)) &&
    (await checkPassword(username, options[username]))
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
  if (username === 'null' || password === 'null') {
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

async function createThread(request, response, options) {
  const username = options.user;
  const password = options.pw;
  const postTitle = options.postTitle;
  const postText = options.postText;
  const hasImage = options.hasImage === 'true';

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
    await sendError(response, 400, "Title may not contain dashes nor underscores");
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

async function createComment(response, options) {
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
  console.log(commentId);
  console.log(options);
  post.posts++;
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

async function getThread(response, options) {
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

async function getComments(response, options) {
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

async function deleteThread(response, options) {
  const checkLogin = await loginValid(options.user, options.pw);
  if (checkLogin !== true) {
    await sendError(response, 400, checkLogin);
    return;
  }

  if (!(await threadExists(options.title))) {
    await sendError(response, 400, "Post does not exist");
    return;
  }

  await threads_db.remove(await threads_db.get(options.title));
  // TODO Remove comments too

  response.writeHead(200, headerFields);
  response.write(JSON.stringify({ success: "Deleted successfully" }));
  response.end();
}

async function dumpThreads(response, options) {
  const allDocs = await threads_db.allDocs({ include_docs: true });
  const threads = [];
  allDocs.rows.forEach((x) => threads.push(x.doc));
  threads.sort(timeUtils.compare);
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

async function updateLikeCount(response, options) {
  const checkLogin = await loginValid(options.user, options.pw);
  if (checkLogin !== true) {
    await sendError(response, 400, checkLogin);
    return;
  }



  comments_db.get(options.comment).then(async function (doc) {
    const userDoc = await accounts_db.get(options.user);

    if (userDoc.likes.some(x => x === options.comment)) {
      --doc.likes;
      userDoc.likes.splice(userDoc.likes.indexOf(options.comment), 1);
    }
    else {
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

async function isLoggedIn(response, options) {
  response.writeHead(200, headerFields);
  response.write(JSON.stringify(options.user in accountsLoggedIn));
  response.end();
}

async function server(request, response) {
  const parsedURL = url.parse(request.url, true);
  const options = parsedURL.query;
  const pathname = parsedURL.pathname;
  const method = request.method;

  if (pathname.startsWith("/certs")) {
    response.writeHead(403, headerFields);
    response.end();
    return;
  }

  if (method === "OPTIONS") {
    response.writeHead(200, headerFields);
    response.end();
    return;
  }

  if (method === "PUT" && pathname.startsWith("/server/createAccount")) {
    createAccount(response, options);
    return;
  }

  if (method === "POST" && pathname.startsWith("/server/login")) {
    login(response, options);
    return;
  }

  if (method === "POST" && pathname.startsWith("/server/logout")) {
    logout(response, options);
    return;
  }

  if (method === "POST" && pathname.startsWith("/server/createThread")) {
    createThread(request, response, options);
    return;
  }

  if (method === "POST" && pathname.startsWith("/server/createComment")) {
    createComment(response, options);
    return;
  }

  if (method === "GET" && pathname.startsWith("/server/getThread")) {
    getThread(response, options);
    return;
  }

  if (method === "GET" && pathname.startsWith("/server/getComments")) {
    getComments(response, options);
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/server/deleteThread")) {
    deleteThread(response, options);
    return;
  }
  if (method === "GET" && pathname.startsWith("/server/dumpThreads")) {
    dumpThreads(response, options);
    return;
  }
  if (method === "POST" && pathname.startsWith("/server/updateLikeCount")) {
    updateLikeCount(response, options);
    return;
  }
  if (method === "GET" && pathname.startsWith("/server/isLoggedIn")) {
    isLoggedIn(response, options);
    return;
  }

  if (method === "GET" && !pathname.startsWith("/server")) {
    if (pathname === "/") {
      response.writeHead(301, { Location: "/client/forums.html" });
      response.end();
      return;
    }
    try {
      let type = "";
      if (pathname.endsWith(".css")) {
        type = "text/css";
      } else if (pathname.endsWith(".js")) {
        type = "text/javascript";
      } else if (pathname.endsWith(".html")) {
        type = "text/html";
      } else if (pathname.search(/(\.jpg)|(\.png)|(\.jpeg)$/) !== -1) {
        type = "image/jpeg";
      } else {
        type = "text/plain";
      }

      const data = await readFile(filePathPrefix + pathname);
      response.writeHead(200, { "Content-Type": type });
      response.write(data);
    } catch (err) {
      console.error(err);
      response.statusCode = 404;
      response.write(`Not Found: ${pathname}`);
    }
    response.end();
    return;
  }
}

function usageError() {
  console.error(`Usage: node ${process.argv[1]}`);
  console.error(`       node ${process.argv[1]} [-p port]`);
  console.error(`       node ${process.argv[1]} [-d]`);
  process.exit(1);
}

// Parse arguments and perform appropriate task
if (process.argv.length > 5) {
  usageError();
}
if (process.argv.length === 2) {
  http.createServer(server).listen(DEFAULT_PORT_LOCAL, () => {
    console.log(`Started http server at default port ${DEFAULT_PORT_LOCAL}`);
  });
} else if (process.argv.length === 4) {
  if (process.argv[2] === '-p') {
    try {
      http.createServer(server).listen(parseInt(process.argv[3]), () => {
        console.log(`Started http server at specified port ${process.argv[2]}`);
      });
    }
    catch {
      usageError();
    }
  }
  else {
    usageError();
  }
}
else if (process.argv.length === 3) {
  if (process.argv[2] === '-d') {
    https.createServer({
      key: readFileSync(filePathPrefix + "/certs/private.key.pem"),
      cert: readFileSync(filePathPrefix + "/certs/domain.cert.pem")
    }, server).listen(parseInt(process.argv[2]), () => {
      console.log(`Started server at 443`);
    });

    // create an HTTP server on port 80 and redirect to HTTPS
    http.createServer(function (req, res) {
      console.log(`Redirecting request to https`);
      res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
      res.end();
    }).listen(80, function (err) {
      console.log("HTTP Server Listening on Port 80");
    });
  }
  else {
    usageError();
  }
}
