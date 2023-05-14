import express from "express";
import fileUpload from "express-fileupload";
import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import path from "path";
import * as server from "./server.js";

const app = express();
app.use(fileUpload({ createParentPath: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static routes
app.use("/", express.static("client"));
app.use("/uploads", express.static("uploads"));

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
  res.write(fs.readFileSync(path.join(process.env.PWD, "/client/notfound.html")));
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
