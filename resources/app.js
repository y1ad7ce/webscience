function timeConverter(UNIX_timestamp){
  // reference: https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
};

var app = angular.module('dotaApp', ['btford.socket-io'])
  .factory('socket', function(socketFactory) {
    return socketFactory({
      ioSocket: io.connect('http://localhost:3000')
    });
  });

app.controller('matchController', ['$scope', '$http', 'socket', '$window', '$log', function($scope, $http, socket, $window, $log) {
  $scope.formats = [
    {format : "JSON"},
    {format : "CSV"},
    {format : "XML"}
  ];

  var gameMode = {};
  $http.get('/resources/game_mode.js').then(function(response) {
    gameMode = response.data[0];
  });

  var heroContainer = [];
  socket.on("gotHeros", function(container) {
    for (var i = 0; i < container.length; i++) {
      heroContainer.push(container[i]);
    }
  });

  $scope.buildDB = function() {
    $http.get('/build').then(successCallback, errorCallback);
      function successCallback(response){
      }
      function errorCallback(error){
          //error code
      }
  };

  $scope.readDB = function() {
    // updates here
    $http.get('/read').then(function(response) {
      $scope.matches = response.data;
      // loop through each match
      $.each($scope.matches, function(index, match) {
        // start time
        match.start_time = timeConverter(match.start_time);

        // game mode
        match.game_mode = gameMode[match.game_mode];

        // match result(winner)
        if (match.radiant_win) { match["result"] = "Radiant Victory";
        } else { match["result"] = "Dire Victory"; }

        // duration of games (hr : min : sec)
        var hr = Math.floor(match.duration/3600);
        var min = Math.floor(match.duration/60) - hr*60;
        var sec = Math.round(match.duration%60);
        match["durationInter"] = min + ":" + sec;
        if (hr > 0) {match["durationInter"] = hr + ":" + match["durationInter"];}

        // draft
        match["hero_arr"] = [];
        for (var i = 0; i < match.players.length; i++) {
          for (var j = 0; j < heroContainer.length; j++) {
            if (heroContainer[j]["id"] == match.players[i].hero_id) {
              match["hero_arr"].push("http://cdn.dota2.com/apps/dota2/images/heroes/" +
              heroContainer[j].name + "_sb.png?");
            }
          }
        }
      });
    });
  }


  // button on the page clicked
  $scope.fetchFeeds = function (mID, len) {
    socket.emit("fetch", mID, len);
  }

  $scope.outputFileFormat = function(fmt, fName) {
    socket.emit("export", fmt, fName);
  }

  socket.on("exported", function(message){
    $window.alert("A file is exported for matches currently displayed on screen.");
  });

  socket.on("fileExist", function(message2){
    $window.alert("A file has been overwritten by the new file you're exporting");
  });

}]);
