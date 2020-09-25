const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
var io = require('socket.io').listen(server);
const port = process.env.PORT||3000;

const request = require('request');
const fs = require('fs');
const path = require('path');

const Json2csvParser = require('json2csv').Parser;
// const jstoxml = require('jstoxml');
const { toXML } = require('jstoxml');

const MongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://y1:123qwe@cluster0-shard-00-00-ekfux.gcp.mongodb.net:27017,cluster0-shard-00-01-ekfux.gcp.mongodb.net:27017,cluster0-shard-00-02-ekfux.gcp.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true';
const assert = require('assert');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors')
var corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, '/')));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.post('/data_visualization', function(req, res, html) {
  res.sendFile(__dirname + '/data-page.html');
});
app.post('/', function(req, res, html) {
  res.sendFile(__dirname + '/index.html');
});

var outputInfo;

// connected
io.on('connection', function(socket) {
  var apiKey = "6AB6DB1C22010EF01872B4F170965144";
  var url = `https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=${apiKey}`;
  var url_heros = `http://api.steampowered.com/IEconDOTA2_570/GetHeroes/v1/?key=${apiKey}`;
  var heroContainer = [];

  // api gets heros information, it's used later for the url getting heros' images
  request(url_heros, function(err, response, body) {
    if(err){
      console.log('error:', err);
    } else {
      var heros = JSON.parse(body);
      heros.result.heroes.forEach(hero => {
        heroContainer.push(hero);
      });
      for (var i = 0; i < heroContainer.length; i++) {
        heroContainer[i].name = heroContainer[i].name.slice(14);
      }
      socket.emit("gotHeros", heroContainer);
    }
  });

  // first API call is just for getting the sequence number
  request(url, function(err, response, body) {
    if(err){
      console.log('error:', err);
    } else {
      var matchHistroy = JSON.parse(body);
      var seq_num = matchHistroy.result.matches[99].match_seq_num;

      // feeds when page first loads
      var url2 = `http://api.steampowered.com/IDOTA2Match_570/`+
      `GetMatchHistoryBySequenceNum/v1/?start_at_match_seq_num=${seq_num}`+
      `&matches_requested=13&key=${apiKey}`;

      request(url2, function(err, response, body) {
        if(err){
          console.log('error:', err);
        } else {
          var matchFeed = JSON.parse(body);

          fs.writeFile("huangh10-dotaMatches.json", JSON.stringify(matchFeed), (err) => {
            if (err) throw err;
            console.log("Output file created.");
            socket.emit("forData", matchFeed);
          });

          outputInfo = matchFeed.result.matches;

          // update sequence number
          seq_num = matchFeed.result.matches[12].match_seq_num;
        }
      });

      // if asked by angularjs to fetch new feeds
      socket.on("fetch", function(mID, len){
        if (mID != null) {
         // search
          var url3 = `http://api.steampowered.com/IDOTA2Match_570/`+
          `GetMatchDetails/v1/?match_id=${mID}&key=${apiKey}`;

          request(url3, function(err, response, body) {
            if(err){
              console.log('error:', err);
            } else {
              var matchSearch = JSON.parse(body);
              // outputInfo = JSON.stringify(matchSearch);
              var theMatch = [];
              theMatch.push(matchSearch.result);
              outputInfo = theMatch;
              // going to handle data presentation in angularjs
              // socket.emit("matchFeedsUpdate", theMatch);
            }
          });
        } else {
          // fetch new feeds
          var url2 = `http://api.steampowered.com/IDOTA2Match_570/`+
          `GetMatchHistoryBySequenceNum/v1/?start_at_match_seq_num=${seq_num}`+
          `&matches_requested=${len}&key=${apiKey}`;

          request(url2, function(err, response, body) {
            if(err){
              console.log('error:', err);
            } else {
              var matchFeed = JSON.parse(body);
              // update sequence number
              seq_num = matchFeed.result.matches[matchFeed.result.matches.length-1].match_seq_num;

              // store matches
              fs.writeFile("huangh10-dotaMatches.json", JSON.stringify(matchFeed), (err) => {
                if (err) throw err;
                console.log("Output file updated.");
                socket.emit("forData", matchFeed);
              });
              outputInfo = matchFeed.result.matches;

              // going to handle data presentation in angularjs
              // socket.emit("matchFeedsUpdate", matchFeed.result.matches);
            }
          });
        }
      });
    }
  });

  socket.on("disconnect", () => console.log("Client disconnected"));

  socket.on("export", function(fmt, fName) {
    var message = "";
    var file = "";
    MongoClient.connect(mongourl, function (err, db) {
      db.collection('matchesInfo', function (err, collection) {
        if (err) {
          console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
          collection.find().toArray(function (err, docs) {
            if (err) {
              console.log (err);
            } else {
              if (fmt == "CSV") {
                const fields = ['match_id', 'radiant_win', 'radiant_score', 'dire_score'];

                const json2csvParser = new Json2csvParser({ fields });
                const csv = json2csvParser.parse(docs);

                fs.exists(fName + '.csv', function (exists) {

                  fs.writeFile(fName + ".csv", csv, function(err) {
                    if (err) throw err;
                    console.log("File exported.");
                  });

                  if (exists) {
                    socket.emit("fileExist", message);
                  } else {
                    socket.emit("exported", message);
                  }
                });
              }
              else if (fmt == "XML") {
                fs.exists(fName + '.xml', function (exists) {

                  file = toXML(docs);
                  fs.writeFile(fName + ".xml", file, function(err) {
                    if (err) throw err;
                    console.log("File exported.");
                  });

                  if (exists) {
                    socket.emit("fileExist", message);
                  } else {
                    socket.emit("exported", message);
                  }
                });
              }
              else {
                fs.exists(fName + ".json", function (exists) {
                  fs.writeFile(fName + ".json", JSON.stringify(docs), (err) => {
                    if (err) throw err;
                    console.log("File exported.");
                  });

                  if (exists) {
                    socket.emit("fileExist", message);
                  } else {
                    socket.emit("exported", message);
                  }
                });
              }

              db.close();
            }
          });
        }
      });
    });

  });

});

server.listen(port, () => {
  console.log(`Server up on *:${port}`);
});

// build database
app.get('/build', function(req, res) {

  MongoClient.connect(mongourl, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', mongourl);
      // clear current database information
      db.collection('matchesInfo', {}, function (err, result) {
        result.remove({}, function (error, res) {
          if (error) {
            console.log(error);
          }
          db.close();
        });
      });
    }
  });

  MongoClient.connect(mongourl, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      var inputInfo = JSON.parse(JSON.stringify(outputInfo))
      var collection = db.collection('matchesInfo');

      collection.insert(inputInfo, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log ("Inserted matches into database.");
          db.close();
        }
      });

    }
  });
});

// read database and display
app.get('/read', function(req, res) {
   MongoClient.connect(mongourl, function (err, db) {
    db.collection('matchesInfo', function (err, collection) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
        collection.find().toArray(function (err, docs) {
          if (err) {
            console.log (err);
          } else {
            db.close();
            res.status(200).json(docs);
          }
        });
      }
    });
  });
});
