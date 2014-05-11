/* globals require, __dirname */
var express = require("express");
var fs = require("fs");
var url = require("url");
var path = require("path");
var _ = require("underscore");
var mysql = require('mysql');
var Promise = require("bluebird");

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
  getData(function(data) {
    callback(JSON.stringify({results: data}), 200);
  });
};

var postToCollection = function (postData, query, callback) {
  // We take the O(n) hit here, once per message,
  // rather than reversing the list on the client
  // every time we make a GET request.
  postData(JSON.parse(query), function() {
    callback("Messages Received.", 201);
  }); // won't work - want to replace with another way to put stuff in the database
  // Dole out the right response code.
  // callback("Messages Received.", 201);
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

var getMessages = function(cb) {
  dbConnection.query('SELECT messages.text, users.username FROM messages, users WHERE messages.userID = users.userID', function(err, rows) {
    if (err) throw err;
    // need to get username and roomnames
    console.log(JSON.stringify(rows));
    cb(rows);

  });
};




// var postMessage = function(message, cb) { // pass in message object
//   // check for userID, create user if null
//   dbConnection.query('SELECT userID FROM users WHERE username = ?', [message.username], function(err, rows) {
//     // if User table empty
//     if(rows.length === 0) {
//       // insert user into empty table
//       dbConnection.query('INSERT INTO users (username) values (?)', [message.username], function(err, rows) {
//         // should check for table... i
//         if (err) throw err;
//         // select userID from user table
//         dbConnection.query('SELECT userID FROM users WHERE username = (?)', [message.username], function(err, rows) {
//           if (err) throw err;
//           message.userID = rows[0];
//           // select roomID from rooms table
//           dbConnection.query('SELECT roomID FROM rooms WHERE roomname = ?', [message.roomname], function(err, rows) {
//             // if room error then we need to create a room.... and then fetch everything again...
//             dbConnection.query('INSERT INTO rooms (roomname) values (?)', [message.roomname], function(err, rows) {
//               if (err) throw err;
//               dbConnection.query('SELECT roomID FROM rooms WHERE roomname = ?', [message.roomname], function(err, rows)  {
//               });
//             });
//             if (err) throw err;
//             // Insert messages tied to user and table
//             message.roomID = rows[0];
//             dbConnection.query('INSERT INTO messages (text, userID, roomID) values (?, ?, ?)', [message.text, message.userID, message.roomID], function(err, rows) {
//               if (err) throw err;
//               cb();
//               console.log("Message post success");
//             });
//           });
//         });
//       });
//     }
//     dbConnection.query('SELECT roomID FROM rooms WHERE roomname = ?', [message.roomname], function(err, rows) {
//       console.log(message.roomname);
//       message.roomID = rows[0];
//       if (err) throw err;

//       dbConnection.query('INSERT INTO messages (text, userID, roomID) values (?, ?, ?)', [message.text, message.userID, message.roomID], function(err, rows) {
//         if (err) throw err;
//         cb();
//         console.log("Message post success");
//       });
//     });
//   });
// };


var postMessage = function(data, callback) {
  //get user
  makeGetter('SELECT username FROM users', makeGetter('SELECT roomname FROM rooms', callback))();
  //get room

  dbConnection.query('INSERT INTO messages (text) values (?)', [data.message], callback);
};

// {"username":"Emily","text":"helllo","roomname":"main"}

var makeGetter = function(query, callback){
  return function(){
    dbConnection.query(query, function(err, rows) {
      if (err) throw err;
      callback(rows);
    });
  };
};

// var getUsers = function (callback) {
//   dbConnection.query('SELECT username FROM users', function(err, rows) {
//     if (err) throw err;
//     callback(rows);
//   });
// };

// var getRooms = function (callback) {
//   dbConnection.query('SELECT roomname FROM rooms', function(err, rows) {
//     if (err) throw err;
//     callback(rows);
//   });
// };

var postRoom = function() {
  dbConnection.query('INSERT INTO rooms (roomname) values (?)', [message.roomname], function(err, rows){
    if (err) throw err;
    console.log("Room added successfully");
  });
};


var postUser = function (data, callback) {
  dbConnection.query('INSERT INTO users (username) values (?)', [data.username], callback);
};

setupCollection(app, "messages", getMessages, postMessage);
setupCollection(app, "rooms", getRooms, postRoom);
setupCollection(app, "users", getUsers, postUser);

// // fetch a username
// dbConnection.query('SELECT * from users', function(err, rows, fields) {
//   if (err) throw err;
//   console.log('The username is: ', rows[1].username);
// });

// dbConnection.end();
