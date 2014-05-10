-- CREATE DATABASE chat;

USE chat;

drop table if exists messages; -- remove in actual implementation
drop table if exists users; -- remove in actual implementation
drop table if exists rooms; -- remove in actual implementation

CREATE TABLE users (
 username VARCHAR(20),
 userID int(5) NOT NULL auto_increment,
 PRIMARY KEY (userID)
);

CREATE TABLE rooms (
 roomname VARCHAR(20),
 roomID int(5) NOT NULL auto_increment,
 PRIMARY KEY (roomID)
);

CREATE TABLE messages (
  text varchar(140),
  created TIMESTAMP NOT NULL,
  messagesID int(10) NOT NULL auto_increment,
  userID int,
  roomID int,
  PRIMARY KEY (messagesID),
  FOREIGN KEY (userID) REFERENCES users(userID),
  FOREIGN KEY (roomID) REFERENCES rooms(roomID)
) ENGINE=InnoDB;

-- INSERT INTO users (username)
-- values ('Jules'),('Emily');

INSERT into users (username) values ('jules');
INSERT into rooms (rooname) values ('lobby');

INSERT INTO messages (text, )
values ('hello this is a test if the mssag',(Select UserId from users where username='jules'), (Select RoomId from rooms where rooomname='lobby'));


/* You can also create more tables, if you need them... */

/*  Execute this file from the command line by typing:
 *    mysql < schema.sql
 *  to create the database and the tables.*/
