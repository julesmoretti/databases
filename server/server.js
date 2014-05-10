/* globals require, __dirname */
var express = require("express");
var fs = require("fs");
var url = require("url");
var path = require("path");
var _  = require("underscore");
var mysql = require('mysql');

// Create the main express app.
var app = express();

var server = app.listen(3000, function() {
  console.log("Listening on port %d", server.address().port);
});

// SQL db connection
var dbConnection = mysql.createConnection({
  user: "root",
  password: "123",
  database: "chat"
});

//connection to SQL server
dbConnection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + dbConnection.threadId);
});

// // fetch a username
// dbConnection.query('SELECT * from users', function(err, rows, fields) {
//   if (err) throw err;
//   console.log('The username is: ', rows[1].username);
// });

// dbConnection.end();

// These headers are extremely important as they allow us to
// run this file locally and get around the same origin policy.
// Without these headers our server will not work.
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

// This function is extremely useful. It lets us
// abstract away the logic of writing response headers
// and status-codes for our get and post ajax requests
//
// handleResponse takes a response object, and returns
// a specialized function that will apply some return
// string and statusCode to the response. Effectively,
// this lets us just use _.partial(sendData, res) as our
// callback to many asynchronous functions and make
// the logic of our code much simpler.
//
// Such is the power of closures.
var sendData = function (res, data, statusCode) {
  res.writeHead(statusCode || 200, defaultCorsHeaders);
  res.end(data);
};

// These are two really cool functions. By just creating these
// general getFrom/postTo functions it makes adding messages or rooms
// extremely easy.
//
// Unfortunately, you'll probably have to refactor this to work with
// a more complex database where rooms aren't represented in the same
// way as messages. It's clean for now though.
var getFromCollection = function (getData, callback) {
  callback(JSON.stringify({results: getData()}), 200); // won't work, client wants array messages/users or rooms
  // extracting from the database - getting
};

var postToCollection = function (postData, query, callback) {
  // We take the O(n) hit here, once per message,
  // rather than reversing the list on the client
  // every time we make a GET request.
  postData(JSON.parse(query)); // won't work - want to replace with another way to put stuff in the database
  // Dole out the right response code.
  callback("Messages Received.", 201);
};

// sets up listeners a specific collection on the collection url
var setupCollection = function (app, collectionName, getData, postData) {
  var collectionURL = "/classes/" + collectionName; // Fewer allocated strings.

  app.get(collectionURL, function (req, res) {
    console.log("Serving a get request on: " + collectionURL);
    getFromCollection(getData, _.partial(sendData, res));
  });

  app.post(collectionURL, function (req, res) {
    console.log("Serving a post request on: " + collectionURL);
    // Such is the power of currying.
    // _ = missing middle argument = the data from the post request
    fromPostRequest(req, _.partial(postToCollection, postData, _, _.partial(sendData, res)));
  });
};

var fromPostRequest = function (req, callback) {
  var body = "";
  req.on("data", function (data) {
    body += data;
    // We do this seemingly tedious thing to protect
    // against DOS attacks, so one huge message can't
    // crash our server.
    if (body.length > 1e3) {
      req.connection.destroy();
    }
  });
  req.on("end", function () {
    callback(body);
  });
};

// serves all static files
app.configure(function () {
  app.use(express.static(path.join(__dirname, "../client")));
});

setupCollection(app, "messages", getMessages, postMessage);
setupCollection(app, "rooms", getRooms, postRoom);
setupCollection(app, "users", getUsers, postUser);

var getCollection = function () { // returns a function that queries the database, must use a callback (refactor use of getData and postData functions to use promises)

};
