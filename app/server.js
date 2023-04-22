import * as http from 'http';
import * as url from 'url';
import PouchDB from 'pouchdb';
import { readFile } from 'fs/promises';

const DEFAULT_PORT = 3000;

// This is to ensure that no matter where the server is run from, the path is always valid
// This regex removes the ending "server.js" and replaces it with the path to the requested resource
const filePathPrefix = process.argv[1].replace(/server\.js$/, "");

const accounts_db = new PouchDB(filePathPrefix + "/db/accounts");

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

    if (method == 'POST' && pathname.startsWith('/createAccount')) {
        createAccount(response, options);
        return;
    }

    if (method === 'GET' && pathname.startsWith('/client')) {
        try {
            let type = '';
            if (pathname.endsWith('.css')) {
                type = 'text/css';
            } else if (pathname.endsWith('.js')) {
                type = 'text/javascript';
            } else if (pathname.endsWith('.html')) {
                type = 'text/html';
            } else {
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