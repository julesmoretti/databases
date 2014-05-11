var user = (function (){

  var User = function (name) {
    this.name = name;
    this.friends = {};
  };

  User.prototype.addFriend = function(friend) {
    this.friends[friend.name] = friend;
  };

  User.prototype.removeFriend = function(friend) {
    delete this.friends[friend.name];
  };

  User.prototype.send = function () {
    $.ajax({
      url: '/classes/users',
      type: 'POST',
      data: this.serialize(),
      contentType: 'application/json',
      success: function () {
        console.log('Chatterbox: User Sent!');
      },
      error: function () {
        console.log('Chatterbox: Failed to send user.');
      }
    });
  };

  User.prototype.serialize = function() {
    return JSON.stringify({
      username: this.name
    });
  };

  return {
    User: User,
  };
}());
