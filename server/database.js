import * as timeUtils from "./time.js";
import { createHash } from "node:crypto";
import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config(); // Load environment variables from .env

// PostgreSQL connection configuration
const pg_options = {
  user: process.env.PGUSER || "mmteam",
  password: process.env.PGPASSWORD,
  host: "127.0.0.1",
  database: process.env.PGDATABASE || "mm",
  port: process.env.PGPORT || 5432,
};

const pool = new pg.Pool(pg_options); // Used to actually query the db
const client = new pg.Client(pg_options); // Used to set up tables if needed

// SQL Queries to create the tables
// Also provide a visual representation to reference table structure
const account_table = `
CREATE TABLE IF NOT EXISTS accounts (
  username text,
  hash text,
  comment_likes text[],
  thread_likes text[]
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
  comments text[],
  likes integer
);`;
const comment_table = `
CREATE TABLE IF NOT EXISTS comments (
  comment_id text,
  author text,
  comment_body text,
  time bigint,
  likes integer,
  children text[],
  image_path text
);`;

// Attempt to connect to database and give helpful error messages if fails
try {
  await client.connect();
} catch (err) {
  console.error("Failed to connect to database!");
  console.error("Did you start the daemon and create 'mm'?");
  console.error(err);
  process.exit(1);
}

// Try to create the tables, error if not
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

// Used to create base64 encoded sha256 of a password
// Returns a base64 string
function hashPassword(password) {
  return createHash("sha256").update(password).digest("base64");
}

// Class to abstract account db functions
class AccountTable {
  constructor() {}

  // Returns true iff an account with username exists
  async exists(username) {
    try {
      const users = await pool.query(
        `SELECT username FROM accounts WHERE username = $1;`,
        [username]
      );
      return users.rows.length != 0;
    } catch (err) {
      console.error(`Error when checking if account: <${username}> exists`);
      console.error(err);
    }
  }

  // Puts a new user into db
  create(username, password) {
    pool
      .query(`INSERT INTO accounts VALUES ($1, $2, '{}', '{}');`, [
        username,
        hashPassword(password),
      ])
      .catch((err) => {
        console.error(`Error when creating account <${username}>`);
        console.error(err);
      });
  }

  // Checks password of username in db
  // Returns true if is correct
  async checkPassword(username, password) {
    try {
      const account = await pool.query(
        `SELECT username,hash FROM accounts WHERE username = '${username}';`
      );
      return account.rows[0].hash === hashPassword(password);
    } catch (err) {
      console.error(`Error when checking <${username}> password!`);
      console.error(err);
      return false;
    }
  }

  // Toggles whether a user liked a post (comment/thread) or not
  // returns either 1 or -1, which is used to update like count in thread or comment db
  async toggleLike(username, id, type) {
    let ret = 0;
    try {
      const account = (
        await pool.query(
          `SELECT username,${type} FROM accounts WHERE username = $1;`,
          [username]
        )
      ).rows[0];

      const likes = account[type];
      if (likes.some((x) => x === id)) {
        // If user has liked this
        ret = -1;
        likes.splice(likes.indexOf(id), 1); // Remove it from their likes array
      } else {
        // Otherwise the user has not liked this
        ret = 1;
        likes.push(id); // Add comment to their likes
      }

      // Update the database
      // Do this with await to prevent spamming
      await pool.query(
        `UPDATE accounts SET ${type} = $1 WHERE username = $2;`,
        [likes, username]
      );
    } catch (err) {
      console.error(`Error when toggling like`);
      console.error(`User: <${username}>, ID: <${id}>, Type: <${type}>`);
      console.error(err);
      return 0;
    }

    return ret;
  }
}

// Class to abstract thread db functions
class ThreadTable {
  constructor() {}

  // Returns true iff thread with title exists
  async exists(title) {
    try {
      const docs = await pool.query(
        `SELECT title FROM threads WHERE title = $1`,
        [title]
      );
      return docs.rows.length != 0;
    } catch (err) {
      console.error(`Error when checking if thread <${title}> exists`);
      console.error(err);
      return false;
    }
  }

  // Creates a new thread
  create(author, title, text, imagePath) {
    const params = [
      title,
      author,
      text,
      Date.now(),
      imagePath ? 1 : 0,
      imagePath,
      1,
      [],
      0,
    ];
    pool
      .query(
        `INSERT INTO threads VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        params
      )
      .catch((err) => {
        console.error(`Error when creating thread`);
        console.error(`Data: ${JSON.stringify(params)}`);
        console.error(err);
      });
  }

  // Updates the time of thread ("Latest Post" time in front-end)
  async updateTimeStamp(title) {
    try {
      await pool.query(`UPDATE threads SET time = $1 WHERE title = $2;`, [
        Date.now(),
        title,
      ]);
    } catch (err) {
      console.error(`Error when updating timestamp for thread <${title}>`);
      console.error(err);
    }
  }

  // Increments post count and returns the new value
  async incrementPostCount(title) {
    try {
      await pool.query(
        `UPDATE threads SET posts = posts + 1 WHERE title = $1;`,
        [title]
      );
    } catch (err) {
      console.error(`Error when incrementing post count for <${title}>`);
      console.error(err);
    }
    try {
      return (
        await pool.query(`SELECT posts FROM threads WHERE title = $1;`, [title])
      ).rows[0].posts;
    } catch (err) {
      console.error(`Error when getting post count value from <${title}>`);
      console.error(err);
      return 0;
    }
  }

  async incrementImageCount(title) {
    try {
      await pool.query(
        `UPDATE threads SET images = images + 1 WHERE title = $1`,
        [title]
      );
    } catch (err) {
      console.error(`Error when incrementing image count for <${title}>`);
      console.error(err);
    }
    try {
      return (
        await pool.query(`SELECT images FROM threads WHERE title = $1;`, [
          title,
        ])
      ).rows[0].posts;
    } catch (err) {
      console.error(`Error when getting image count value from <${title}>`);
      console.error(err);
      return 0;
    }
  }
  // Adds a comment to list of comment tree roots to a thread
  addTopLevelComment(title, comment_id) {
    pool
      .query(`UPDATE threads SET comments = comments || $1 WHERE title = $2;`, [
        [comment_id],
        title,
      ])
      .catch((err) => {
        console.error(`Error when add top level comment`);
        console.error(`Title: <${title}>, Comment: <${comment_id}`);
      });
  }

  // Returns all stored info regarding a thread
  async get(title) {
    try {
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
        likes: thread.likes,
      };
    } catch (err) {
      console.error(`Error when retrieving thread <${title}>`);
      console.error(err);
      return { error: true };
    }
  }

  // Deletes thread
  delete(title) {
    pool.query(`DELETE FROM threads WHERE title = $1`, [title]).catch((err) => {
      console.err(`Error when deleting thread <${title}>`);
    });
  }

  // Returns array which each entry being the information shown in front-end
  // Limits which threads are returned to a virtual page defined by page and amount
  // if amount is "All", or page or amount are undefined, dumps all threads
  async dump(amount, page, ordering) {
    const col = ["likes", "posts", "images"].includes(ordering)
      ? ordering
      : "time";
    try {
      let threads = (
        await pool.query(`SELECT * FROM threads ORDER BY ${col} DESC;`)
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
          time: timeUtils.convertToRecencyString(x.time), // Convert UNIX millis to "XX minutes ago" or similar
          images: x.images,
          posts: x.posts,
          likes: x.likes,
        };
      });
    } catch (err) {
      console.error(`Error when dumping threads`);
      console.error(`Amount: <${amount}>, Page: <${page}>, Col: <${col}>`);
      console.error(err);
      return [];
    }
  }

  // Returns total number of threads
  async total() {
    try {
      return (await pool.query(`SELECT title FROM threads;`)).rows.length;
    } catch (err) {
      console.error(`Error when getting total pages`);
      console.error(err);
      return 0;
    }
  }

  // Adds amount to titles's like count
  changeLikeCount(title, amount) {
    pool
      .query(`UPDATE threads SET likes = likes + $1 WHERE title = $2;`, [
        amount,
        title,
      ])
      .catch((err) => {
        console.error(`Error changing thread like count`);
        console.error(`Thread: <${title}>, amount: <${amount}>`);
        console.error(err);
      });
  }
}

// Class to abstract comment db functions
// Regex are used to ensure consistency of id from back-end calls
class CommentTable {
  constructor() {}

  // Adds a comment id to a comment's children array
  addChild(parent_id, id) {
    pool
      .query(
        `UPDATE comments SET children = children || $1 WHERE comment_id = $2;`,
        [[id.replace(/_/g, " ")], parent_id]
      )
      .catch((err) => {
        console.error(
          `Error when adding child to <${parent_id}>, child: <${id}>`
        );
        console.error(err);
      });
  }

  // Creates a new row for a new comment
  async create(id, author, text, imagePath) {
    try {
      await pool.query(
        `INSERT INTO comments VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [id.replace(/_/g, " "), author, text, Date.now(), 0, [], imagePath]
      );
    } catch (err) {
      console.error(`Error creating comment`);
      console.error(`ID: <${id}>, Author: <${author}>`);
      console.error(`Text: <${text}>`);
      console.error(err);
    }
  }

  // Returns a comment with all its children recursively nested in its children array
  async load(id) {
    try {
      const comment = (
        await pool.query(`SELECT * FROM comments WHERE comment_id = $1;`, [
          id.replace(/_/g, " "),
        ])
      ).rows[0];
      for (let i = 0; i < comment.children.length; i++) {
        const child = await this.load(comment.children[i]);
        comment.children[i] = child;
      }
      return comment;
    } catch (err) {
      console.error(`Error loading comment id: <${id}>`);
      console.error(err);
      return { children: [] };
    }
  }

  // Deletes comments corresponding to a thread
  deleteAllFromThread(title) {
    pool
      .query(`DELETE FROM comments WHERE comment_id ~ $1;`, [
        `^[0-9]+-${title}$`,
      ])
      .catch((err) => {
        console.error(`Error deleting comments from thread <${title}>`);
        console.error(err);
      });
  }

  // Adds amount to comment_id's like count
  changeLikeCount(comment_id, amount) {
    pool
      .query(`UPDATE comments SET likes = likes + $1 WHERE comment_id = $2;`, [
        amount,
        comment_id.replace(/_/g, " "),
      ])
      .catch((err) => {
        console.error(`Error changing like count`);
        console.error(`Comment: <${comment_id}>, amount: <${amount}>`);
        console.error(err);
      });
  }

  // Returns the username of the comment creator
  async getAuthor(comment_id) {
    try {
      return (
        await pool.query(`SELECT author FROM comments WHERE comment_id = $1;`, [
          comment_id.replace(/_/g, " "),
        ])
      ).rows[0].author;
    } catch (err) {
      console.error(`Error getting author of comment: <${comment_id}>`);
      console.error(err);
      return "[ERROR]";
    }
  }

  // Changes the text of a comment to text
  // Used to showy deletion in UI
  changeText(comment_id, text) {
    pool
      .query(`UPDATE comments SET comment_body = $1 WHERE comment_id = $2;`, [
        text,
        comment_id.replace(/_/g, " "),
      ])
      .catch((err) => {
        console.error(`Error changing text of comment: <${comment_id}`);
        console.error(`Text: <${text}>`);
        console.error(err);
      });
  }

  // Changes the author of a comment to author
  // Used to showy deletion in UI
  changeAuthor(comment_id, author) {
    pool
      .query(`UPDATE comments SET author = $1 WHERE comment_id = $2;`, [
        author,
        comment_id.replace(/_/g, " "),
      ])
      .catch((err) => {
        console.error(`Error changing author of comment: <${comment_id}`);
        console.error(`Author: <${author}>`);
        console.error(err);
      });
  }

  // Changes path of image if there was a path to begin with
  changeImagePath(comment_id, new_path) {
    pool
      .query(
        `UPDATE comments SET image_path = $1 WHERE comment_id = $2 AND image_path IS NOT NULL;`,
        [new_path, comment_id]
      )
      .catch((err) => {
        console.error(`Error changing image_path of comment: <${comment_id}`);
        console.error(`Path: <${new_path}>`);
        console.error(err);
      });
  }
}

const accounts = new AccountTable();
const threads = new ThreadTable();
const comments = new CommentTable();

export { accounts, threads, comments };
