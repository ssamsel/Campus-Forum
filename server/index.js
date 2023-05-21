import express from "express";
import fileUpload from "express-fileupload";
import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import path from "path";
import dotenv from "dotenv";
import logger from "morgan";
import * as server from "./server.js";

dotenv.config(); // Load environment variables from .env

const app = express();
app.use(
  fileUpload({
    createParentPath: true,
    safeFileNames: true,
    limits: { fileSize: 10 * 1024 * 1024 || process.env.max_upload_size },
    limitHandler: (req, res, next) => {
      res.writeHead(413);
      res.write(
        JSON.stringify({
          error: `File upload size exceeded. Max: ${
            "10Mb" || `${parseInt(process.env.max_upload_size) / 1024 / 1024}Mb`
          }`,
        })
      );
      res.end();
    },
  })
); // Middleware for image uploads
app.use(express.json()); // Middleware for JSON body parsing
app.use(express.urlencoded({ extended: false })); // Middleware for URL query processing
app.use(logger(process.env.LOG_TYPE || "combined"));
// Static routes
app.use("/", express.static("client"));
app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res, path, stat) => {
      const ext = path.toLowerCase().match(/\..*$/);
      const map = {
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpg",
        ".png": "image/png",
        ".apng": "image/apng",
        ".avif": "image/avif",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".gif": "image/gif",
      }
      let header = "";
      try {
        header = map[ext[0]];
      } catch(err) {
        header = "image/jpeg";
      }
      res.set("Content-Type", header);
    },
  })
);

// Account routes
app.put("/server/createAccount", server.createAccount);
app.post("/server/login", server.login);
app.post("/server/logout", server.logout);
app.get("/server/isLoggedIn", server.isLoggedIn);

// Thread/comment retrieval routes
app.get("/server/getThread", server.getThread);
app.get("/server/getComments", server.getComments);
app.get("/server/dumpThreads", server.dumpThreads);
app.get("/server/numThreads", server.numThreads);

// Thread/comment delete routes
app.delete("/server/deleteThread", server.deleteThread);
app.delete("/server/deleteComment", server.deleteComment);

// Creation/Update routes
app.post("/server/createThread", server.createThread);
app.post("/server/createComment", server.createComment);
app.post("/server/updateLikeCount", server.updateLikeCount);

// This is to undo the old 301 to /client/forums.html from before the refactor
app.get("/client/forums.html", (req, res) => {
  res.redirect(301, "/");
});

// Display 404 Page
app.all("*", (req, res) => {
  res.writeHead(404);
  res.write(
    fs.readFileSync(path.join(process.env.PWD, "/client/notfound.html"))
  );
  res.end();
});

// Run the website locally for testing
function local() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Started http server on http://localhost:${port}`);
  });
}

// Function that will deploy the website for public use
function deploy() {
  const httpsPort = process.env.HTTPS_PORT || 443;
  const httpPort = process.env.HTTP_PORT || 80;
  const credentials = {
    key: fs.readFileSync(path.join(process.env.PWD, "certs/private.key.pem")),
    cert: fs.readFileSync(path.join(process.env.PWD, "certs/domain.cert.pem")),
  };
  // Create the https server
  https.createServer(credentials, app).listen(httpsPort, () => {
    console.log(`Stated https server on port ${httpsPort}`);
  });

  // Redirect http requests to https
  http
    .createServer(function (req, res) {
      console.log(`Redirecting request to https`);
      res.writeHead(301, {
        Location: "https://" + req.headers["host"] + req.url,
      });
      res.end();
    })
    .listen(httpPort, function (err) {
      console.log("HTTP Server Listening on Port 80");
    });
}

// Handle command line arguments
switch (process.argv.length) {
  case 2: {
    local();
    break;
  }
  case 3: {
    if (process.argv[2] === "-d") {
      deploy();
      break;
    }
    // No break here so it jumps to default case and shows error
  }
  default: {
    const filename = process.argv[1].replace(/^\/.*\//, "");
    console.error(`Usage: node ${filename}`);
    console.error(`       node ${filename} -d`);
    break;
  }
}
