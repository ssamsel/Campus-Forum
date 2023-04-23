import * as http from 'http';
import * as url from 'url';
import PouchDB from 'pouchdb';
import { readFile } from 'fs/promises';

const DEFAULT_PORT = 3000;

// This is to ensure that no matter where the server is run from, the path is always valid
// This regex removes the ending "server.js" and replaces it with the path to the requested resource
const filePathPrefix = process.argv[1].replace(/server\.js$/, "");

const accounts_db = new PouchDB(filePathPrefix + "/db/accounts");
const posts_db = new PouchDB(filePathPrefix + '/db/posts');

const accountsLoggedIn = {};

// This is to allow for accessing the server from the same IP origin
// Will probably be modified once this is properly deployed
const headerFields = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "*", "Access-Control-Allow-Methods": "GET, DELETE, HEAD, OPTIONS, PUT, POST" };

// Send an error message back to client
// sendError(response: HTTPresponse, code: number, message: string): void
async function sendError(response, code, message) {
    response.writeHead(code, headerFields);
    response.write(JSON.stringify({ error: message }));
    response.end();
}


async function accountExists(username) {
    const docs = await accounts_db.allDocs({ include_docs: true });
    return docs.rows.some(x => x.id === username);
}


async function createAccount(response, options) {
    const username = Object.keys(options)[0];
    if (await accountExists(username)) {
        await sendError(response, 404, `Username '${username}' taken`);
        return;
    }

    await accounts_db.put({ _id: username, pwHash: options[username] });
    response.writeHead(200, headerFields);
    response.write(JSON.stringify({ success: "Account created" }));
    response.end();
}

async function checkPwHash(username, hash) {
    const account = await accounts_db.get(username);
    return account.pwHash === hash;
}

async function login(response, options) {
    const username = Object.keys(options)[0];
    if (await accountExists(username)) {
        if (await checkPwHash(username, options[username])) {
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
    if (await accountExists(username) && await checkPwHash(username, options[username])) {
        delete accountsLoggedIn[username];
    }
    response.writeHead("200", headerFields);
    response.end();
}

async function createThread(response, options) {
    const data = JSON.parse(options.data);
    const username = data.user;
    const pwHash = data.pwHash;
    const post = data.postData;

    if (username === null || pwHash === null) {
        await sendError(response, 400, "You must be logged in to create a thread");
    }
    if (post === undefined) {
        await sendError(response, 400, "Missing post in request");
    }

    if (!await accountExists(username) || !await checkPwHash(username, pwHash)) {
        // This error is vague on purpose as it would only be triggered when somebody is trying to exploit
        await sendError(response, 400, "Bad Request");
        return;
    }

    if (accountsLoggedIn[username] !== true) {
        await sendError(response, 400, "You must be logged in to create a thread");
        return;
    }

    if (post.title === "" || post.title === undefined) {
        await sendError(response, 400, "A thread title is required");
        return;
    }

    if (post.text === "" || post.text === undefined) {
        await sendError(response, 400, "Thread body text is required");
        return;
    }

    response.writeHead(200, headerFields);
    response.write(JSON.stringify({ success: "Thread Created" }))
    response.end();
}

async function deleteThread(response, options){
    // TODO: Check if post exists first
    const data = JSON.parse(options.data);
    const username = data.user;
    const pwHash = data.pwHash;
    const post = data.postData;

    posts_db.remove();
}

async function server(request, response) {
    const parsedURL = url.parse(request.url, true);
    const options = parsedURL.query;
    const pathname = parsedURL.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
        response.writeHead(200, headerFields);
        response.end();
        return;
    }

    if (method === 'PUT' && pathname.startsWith('/server/createAccount')) {
        createAccount(response, options);
        return;
    }

    if (method === 'POST' && pathname.startsWith('/server/login')) {
        login(response, options);
        return;
    }

    if (method === 'POST' && pathname.startsWith('/server/logout')) {
        logout(response, options);
        return;
    }

    if (method === 'POST' && pathname.startsWith('/server/createThread')) {
        createThread(response, options);
        return;
    }
    if (method === 'DELETE' && pathname.startsWith('/server/deleteThread')) {
        deleteThread(response, options);
        return;
    }

    if (method === 'GET' && !pathname.startsWith('/server')) {
        if (pathname === "/") {
            response.writeHead(301, { Location: "/client/forums.html" });
            response.end();
            return;
        }
        try {
            let type = '';
            if (pathname.endsWith('.css')) {
                type = 'text/css';
            } else if (pathname.endsWith('.js')) {
                type = 'text/javascript';
            } else if (pathname.endsWith('.html')) {
                type = 'text/html';
            }
            else if (pathname.endsWith('.png')) {
                type = 'text/plain'
            }
            else {
                type = 'text/plain';
            }

            const data = await readFile(filePathPrefix + pathname, 'utf8');
            response.writeHead(200, { 'Content-Type': type });
            response.write(data);
        }
        catch (err) {
            console.error(err);
            response.statusCode = 404;
            response.write(`Not Found: ${pathname}`);
        }
        response.end();
        return;
    }
}

// Start server on port from argv[1] or DEFAULT_PORT
if (process.argv.length > 3) {
    console.error(`Usage: node ${process.argv[1]} <port>`);
    process.exit(1);
}
if (process.argv.length === 2) {
    http.createServer(server).listen(DEFAULT_PORT, () => {
        console.log(`Started server at default port ${DEFAULT_PORT}`);
    })
}
else {
    http.createServer(server).listen(parseInt(process.argv[2]), () => {
        console.log(`Started server at specified port ${process.argv[2]}`);
    })
}