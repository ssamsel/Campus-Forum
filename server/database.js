import PouchDB from "pouchdb";
import * as timeUtils from "./time.js";
import { createHash } from "node:crypto";
import path from "path";

function hashPassword(password) {
  return createHash("sha256").update(password).digest("base64");
}

class AccountDB {
  constructor() {
    this.db = new PouchDB(path.join(process.env.PWD, "/db/accounts"));
  }

  // Returns true iff an account with username exists
  async exists(username) {
    const docs = await this.db.allDocs({ include_docs: true });
    return docs.rows.some((x) => x.id === username);
  }

  // Puts a new user into db
  create(username, password) {
    this.db.put({
      _id: username,
      pwHash: hashPassword(password),
      likes: [],
    });
  }

  // Checks password of username in db
  async checkPassword(username, password) {
    const account = await this.db.get(username);
    return account.pwHash === hashPassword(password);
  }

  // Toggles whether a user liked a comment or not, and returns [1 || -1], used to update like count in commentDB
  async toggleCommentLike(username, comment) {
    let ret = 0;
    const account = await this.db.get(username);
    if (account.likes.some((x) => x === comment)) {
      ret = -1;
      account.likes.splice(account.likes.indexOf(comment), 1);
    } else {
      ret = 1;
      account.likes.push(comment);
    }
    this.db.put(account, { _rev: account.rev, force: true });
    return ret;
  }
}

class ThreadDB {
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

class CommentDB {
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
}

const accounts = new AccountDB();
const threads = new ThreadDB();
const comments = new CommentDB();

export { accounts, threads, comments };
