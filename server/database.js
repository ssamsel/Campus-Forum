import * as timeUtils from "./time.js";
import { createHash } from "node:crypto";
import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config();
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
  time bigint,
  images integer,
  image_path text,
  posts integer,
  comments text[]
);`;
const comment_table = `
CREATE TABLE IF NOT EXISTS comments (
  comment_id text,
  author text,
  comment_body text,
  time bigint,
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
    const users = await pool.query(
      `SELECT username FROM accounts WHERE username = $1;`,
      [username]
    );
    return users.rows.length != 0;
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
  constructor() {}

  async exists(title) {
    const docs = await pool.query(
      `SELECT title FROM threads WHERE title = $1`,
      [title]
    );
    return docs.rows.length != 0;
  }

  create(author, title, text, imagePath) {
    pool.query(`INSERT INTO threads VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`, [
      title,
      author,
      text,
      Date.now(),
      imagePath ? 1: 0,
      imagePath,
      1,
      [],
    ]);
  }

  async updateTimeStamp(title) {
    await pool.query(`UPDATE threads SET time = $1 WHERE title = $2;`, [
      Date.now(),
      title,
    ]);
  }

  // Increments post count and returns the new value
  async incrementPostCount(title) {
    await pool.query(
      `UPDATE threads SET posts = posts + 1 WHERE title = $1;`,
      [title]
    );
    return (
      await pool.query(`SELECT posts FROM threads WHERE title = $1;`, [title])
    ).rows[0].posts;
  }

  addTopLevelComment(title, comment_id) {
    pool.query(
      `UPDATE threads SET comments = comments || $1 WHERE title = $2;`,
      [[comment_id], title]
    );
  }

  async get(title) {
    const thread = (
      await pool.query(`SELECT * FROM threads WHERE title = $1`, [title])
    ).rows[0];
    return {
      title: thread.title,
      author: thread.author,
      body: thread.body,
      time: thread.time,
      images: thread.images,
      imagePath: thread.image_path ? thread.image_path : undefined,
      posts: thread.posts,
      comments: thread.comments,
    };
  }

  delete(title) {
    pool.query(`DELETE FROM threads WHERE title = $1`, [title]);
  }

  async dump(amount, page) {
    let threads = (
      await pool.query(`SELECT * FROM threads ORDER BY time DESC;`)
    ).rows;

    // Get the page requested, if applicable
    if (amount !== undefined && page != undefined && amount !== "All") {
      const amt = parseInt(amount);
      const pg = parseInt(page) - 1;
      threads = threads.slice(pg * amt, pg * amt + amt);
    }

    return threads.map((x) => {
      return {
        author: x.author,
        title: x.title,
        body: x.body,
        time: timeUtils.convertToRecencyString(x.time),
        images: x.images,
        posts: x.posts,
      };
    });
  }

  async total() {
    return (await pool.query(`SELECT title FROM threads;`)).rows.length;
  }
}

class CommentTable {
  constructor() {}

  addChild(parent_id, id) {
    pool.query(`UPDATE comments SET children = children || $1 WHERE comment_id = $2;`, [
      [id.replace(/_/g, " ")],
      parent_id,
    ]);
  }

  async create(id, author, text) {
    await pool.query(`INSERT INTO comments VALUES ($1, $2, $3, $4, $5, $6);`, [
      id.replace(/_/g, " "),
      author,
      text,
      Date.now(),
      0,
      [],
    ]);
  }

  async load(id) {
    const comment = (
      await pool.query(`SELECT * FROM comments WHERE comment_id = $1;`, [id.replace(/_/g, " ")])
    ).rows[0];
    for (let i = 0; i < comment.children.length; i++) {
      const child = await this.load(comment.children[i]);
      comment.children[i] = child;
    }
    return comment;
  }

  deleteAllFromThread(title) {
    pool.query(`DELETE FROM comments WHERE comment_id ~ $1;`, [
      `^[0-9]+-${title}$`,
    ]);
  }

  // Adds amount to comment_id's like count
  changeLikeCount(comment_id, amount) {
    pool.query(
      `UPDATE comments SET likes = likes + $1 WHERE comment_id = $2;`,
      [amount, comment_id.replace(/_/g, " ")]
    );
  }

  async getAuthor(comment_id) {
    return (
      await pool.query(`SELECT author FROM comments WHERE comment_id = $1;`, [
        comment_id.replace(/_/g, " "),
      ])
    ).rows[0].author;
  }

  changeText(comment_id, text) {
    pool.query(`UPDATE comments SET comment_body = $1 WHERE comment_id = $2;`, [
      text,
      comment_id.replace(/_/g, " "),
    ]);
  }

  changeAuthor(comment_id, author){
    pool.query(`UPDATE comments SET author = $1 WHERE comment_id = $2;`,[
      author,
      comment_id.replace(/_/g, " ")
    ]);
  }
}

const accounts = new AccountTable();
const threads = new ThreadTable();
const comments = new CommentTable();

export { accounts, threads, comments };
