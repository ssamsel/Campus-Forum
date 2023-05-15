import PouchDB from "pouchdb";
import * as timeUtils from "./time.js";
import { createHash } from "node:crypto";
import path from "path";
import pg from "pg";

const pg_options = {
  user: "mmteam",
  password: process.env.PGPASSWORD,
  host: "127.0.0.1",
  database: "mm",
  port: 5432,
};
const pool = new pg.Pool(pg_options);
const client = new pg.Client(pg_options);

const account_table = `
CREATE TABLE IF NOT EXISTS accounts (
  username text,
  hash text,
  likes text[]
);`;
const thread_table = `
CREATE TABLE IF NOT EXISTS threads (
  title text,
  author text,
  body text,
  time integer,
  images integer,
  imagePath text,
  posts integer,
  comments text[]
);`;
const comment_table = `
CREATE TABLE IF NOT EXISTS comments (
  comment_id text,
  author text,
  comment_body text,
  time integer,
  likes integer,
  children text[]
);`;

try {
  await client.connect();
} catch (err) {
  console.error("Failed to connect to database!");
  console.error("Did you start the daemon and create 'mm'?");
  console.error(err);
  process.exit(1);
}

try {
  await client.query(account_table);
  await client.query(thread_table);
  await client.query(comment_table);
} catch (err) {
  console.error("Error Creating Tables");
  console.error(err);
  process.exit(1);
}
client.end();

function hashPassword(password) {
  return createHash("sha256").update(password).digest("base64");
}

class AccountTable {
  constructor() {}

  // Returns true iff an account with username exists
  async exists(username) {
    const users = await pool.query(`SELECT username FROM accounts;`);
    return users.rows.some((x) => x.username === username);
  }

  // Puts a new user into db
  create(username, password) {
    pool.query(
      `INSERT INTO accounts VALUES ('${username}','${hashPassword(
        password
      )}','{}');`
    );
  }

  // Checks password of username in db
  async checkPassword(username, password) {
    const account = await pool.query(
      `SELECT username,hash FROM accounts WHERE username = '${username}';`
    );
    return account.rows[0].hash === hashPassword(password);
  }

  // Toggles whether a user liked a comment or not, and returns [1 || -1], used to update like count in commentDB
  async toggleCommentLike(username, comment) {
    let ret = 0;
    const account = (
      await pool.query(
        `SELECT username,likes FROM accounts WHERE username = '${username}';`
      )
    ).rows[0];
    if (account.likes.some((x) => x === comment)) {
      ret = -1;
      account.likes.splice(account.likes.indexOf(comment), 1);
    } else {
      ret = 1;
      account.likes.push(comment);
    }
    pool.query(`UPDATE accounts SET likes = $1 WHERE username = $2;`, [
      account.likes,
      username,
    ]);
    return ret;
  }
}

class ThreadTable {
  constructor() {
    this.db = new PouchDB(path.join(process.env.PWD, "/db/threads"));
  }

  async exists(title) {
    const docs = await this.db.allDocs({ include_docs: true });
    return docs.rows.some((x) => x.id === title);
  }

  create(author, title, text, imagePath) {
    this.db.put({
      _id: title,
      author: author,
      body: text,
      time: Date.now(),
      images: imagePath ? 1 : 0,
      imagePath: imagePath,
      posts: 1,
      comments: [],
    });
  }

  async updateTimeStamp(title) {
    const thread = await this.db.get(title);
    thread.time = Date.now();
    this.db.put(thread, { _rev: thread._rev, force: true });
  }

  // Increments post count and returns the new value
  async incrementPostCount(title) {
    const thread = await this.db.get(title);
    thread.posts++;
    this.db.put(thread, { _rev: thread._rev, force: true });
    return thread.posts;
  }

  async addTopLevelComment(title, comment_id) {
    const thread = await this.db.get(title);
    thread.comments.push(comment_id);
    this.db.put(thread, { _rev: thread._rev, force: true });
  }

  async get(title) {
    const thread = await this.db.get(title);
    return {
      title: thread._id,
      author: thread.author,
      body: thread.body,
      time: thread.time,
      images: thread.images,
      imagePath: thread.imagePath,
      posts: thread.posts,
      comments: thread.comments,
    };
  }

  async delete(title) {
    await this.db.remove(await this.db.get(title));
  }

  async dump(amount, page) {
    const allDocs = await this.db.allDocs({ include_docs: true });
    let threads = [];
    allDocs.rows.forEach((x) => threads.push(x.doc));
    threads.sort(timeUtils.compare);

    // Get the page requested, if applicable
    if (amount !== undefined && page != undefined && amount !== "All") {
      const amt = parseInt(amount);
      const pg = parseInt(page) - 1;
      threads = threads.slice(pg * amt, pg * amt + amt);
    }

    return threads.map((x) => {
      return {
        author: x.author,
        title: x._id,
        body: x.body,
        time: timeUtils.convertToRecencyString(x.time),
        images: x.images,
        posts: x.posts,
      };
    });
  }

  async total() {
    const allDocs = await this.db.allDocs({ include_docs: true });
    return allDocs.total_rows;
  }
}

class CommentTable {
  constructor() {
    this.db = new PouchDB(path.join(process.env.PWD, "/db/comments"));
  }

  async addChild(parent_id, id) {
    const parent = await this.db.get(parent_id);
    parent.children.push(id);
    this.db.put(parent), { _rev: parent._rev, force: true };
  }

  create(id, author, text) {
    this.db.put({
      _id: id,
      author: author,
      comment_body: text,
      time: Date.now(),
      likes: 0,
      children: [],
    });
  }

  async load(id) {
    const comment = await this.db.get(id);
    for (let i = 0; i < comment.children.length; i++) {
      const child = await this.load(comment.children[i]);
      comment.children[i] = child;
    }
    return comment;
  }

  async deleteAllFromThread(title) {
    const comments = await this.db.allDocs({ include_docs: true });
    const db = this.db;
    comments.rows.forEach(async (comment) => {
      const re = new RegExp(`^\\d+\-${title}$`);
      if (re.test(comment.id)) {
        await db.remove(await db.get(comment.id));
      }
    });
  }

  // Adds amount to comment_id's like count
  async changeLikeCount(comment_id, amount) {
    const comment = await this.db.get(comment_id);
    comment.likes += amount;
    await this.db.put(comment, { _rev: comment._rev, force: true });
  }

  async getAuthor(comment_id) {
    const comment = await this.db.get(comment_id);
    return comment.author;
  }

  async changeText(comment_id, text) {
    const comment = await this.db.get(comment_id);
    comment.comment_body = text;
    await this.db.put(comment, { _rev: comment._rev, force: true });
  }
}

const accounts = new AccountTable();
const threads = new ThreadTable();
const comments = new CommentTable();

export { accounts, threads, comments };
