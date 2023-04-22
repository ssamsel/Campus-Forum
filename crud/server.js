import * as http from 'http';
import * as url from 'url';
import PouchDB from 'pouchdb';

const DEFAULT_PORT = 3000;

const accounts_db = new PouchDB("db/accounts");

// This is to allow for accessing the server from the same IP origin
// Will probably be modified once this is properly deployed
const headerFields = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "*", "Access-Control-Allow-Methods": "GET, DELETE, HEAD, OPTIONS, PUT, POST" };





async function server(request, response) {
    const parsedURL = url.parse(request.url, true);
    const options = parsedURL.query;
    const pathname = parsedURL.pathname;
    const method = request.method;

    if (method == 'POST' && pathname.startsWith('/createAccount')) {
        createAccount(response, options);
    }
}

// Start server on port from argv[1]
// Default 3000
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