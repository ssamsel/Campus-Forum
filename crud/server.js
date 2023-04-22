import * as http from 'http';
import * as url from 'url';
import PouchDB from 'pouchdb';


const accounts_db = new PouchDB("db/accounts");

// This is to allow for accessing the server from the same IP origin
// Will probably be modified once this is properly deployed
const headerFields = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "*", "Access-Control-Allow-Methods": "GET, DELETE, HEAD, OPTIONS, PUT, POST" };

