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

var app = angular.module('dotaApp', []);
app.controller('matchController', function($scope, $http, $log) {
  // game modes are represented in numbers in the data responded by api calls
  // since there was no api calls for game modes inforamtion, i store the data locally
  var gameMode = {};
  $http.get('/resources/game_mode.js').then(function(response) {
    gameMode = response.data[0];
  });

  // prepare urls for calls
  // match history finds the 100th most recent game and start fetching from there
  var url_CORS = "https://cors.io/?";
  var key = "6AB6DB1C22010EF01872B4F170965144";

  var url_match_history = "https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=";
  url_match_history = url_CORS + url_match_history + key;

  var url_heros = "http://api.steampowered.com/IEconDOTA2_570/GetHeroes/v1/?key=";
  url_heros = url_CORS + url_heros + key;

  var heroContainer = [];
  // Call for heros' info and store it into a container.
  $http.get(url_heros).then(function(response) {
    $.each(response.data.result, function(j, hero) {
      heroContainer.push(hero);
    });
    for (var i = 0; i < heroContainer[0].length; i++) {
      heroContainer[0][i].name = heroContainer[0][i].name.slice(14)
    }
  });
  // Call for match history: starting from 100th most recent match.
  $http.get(url_match_history).then(function(response) {
    var starting_match_seq_num = response.data.result.matches[99].match_seq_num;
    var time = 0;
    // This function fetches data in a given interval of time
    // and updates the information on the page.
    (function theLoop (j) {
      // reference: https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/
      setTimeout(function () {
        var url_match_seq_fetch = url_CORS +
        "http://api.steampowered.com/IDOTA2Match_570" +
        "/GetMatchHistoryBySequenceNum/v1/?start_at_match_seq_num=" +
        starting_match_seq_num + "&matches_requested=13&key=" + key;

        $http.get(url_match_seq_fetch).then(function(response) {
          starting_match_seq_num = response.data.result.matches[12].match_seq_num;
          $scope.matches = response.data.result.matches;

          $.each($scope.matches, function(i, match) {
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
              for (var j = 0; j < heroContainer[0].length; j++) {
                if (heroContainer[0][j]["id"] == match.players[i].hero_id) {
                  match["hero_arr"].push("http://cdn.dota2.com/apps/dota2/images/heroes/" +
                  heroContainer[0][j].name + "_full.png?");
                }
              }
            }
          });
        });
        if (--j) { // If j > 0, keep going
          time = 1000*60*10; // 10min
          theLoop(j); // Call the loop again, and pass it the current value of i
        }
      }, time); // first load is immediate, then interval will be set
    })(99999999999999);
  });
});
