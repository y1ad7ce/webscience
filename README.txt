Dota 2 is a multiplayer online battle arena (MOBA) video game developed and published by Valve Corporation.
Link to the wikipedia: https://en.wikipedia.org/wiki/Dota_2

From Lab3:

This web app fetches Dota 2 matches information using Steam's offical API. It shows 12 matches each time it updates starting from the 100th most recently completed game.

There are many game modes in the game. I couldn't find any API for game modes but it's written in documentation. Therefore, I put it in a json file and store it locally.

Hero names are received by an API call. Each hero has an unique ID which is also used in match details. And hero names are also used for making urls for hero images. From the array received by API call. Strings are processed and are used to make an container for hero names.

It starts with one API call to find the 100th most recent game's match sequence number, and uses another API call to find 13 next games after that one game using its match sequence number. The 13th game of that call will not be shown on the page. Instead, its match sequence number will be recorded for next API call. Repeat of API calls is automatic.
Note that match sequence number is different from match ID.

At the front end, the webpage is displaying properly with a width down to 630px. Images are shown proportionally. Since the game is usually consist of 10 player with 5 at each side. I made draft column two lines. The first line is Radiant team and second line is Dire team, in case of 10 player games. AngularJS expression has been used for displaying data.

Lab5:

The packages I used:
Express
Socket
Request (for api calls)
File system
Path
Cors

The web app loads with 12 match histories.

There is an option of refreshing feed with your choice of feeds length (2-12). The reason why length 1 wouldn't work is that the first match in each fetch is the last of last fetch. Storing information may have duplicates of objects. I may change that in later labs. But I left it there to show that the feed is updating in continuous sequence.

If you use nodemon, the server may keeps restarting if the output file is getting updated. Note that the output is from the "match history by sequence number" API call.

The front-end structure has remained almost unchanged, except the addition of two input fields for searching and setting feeds length and a submit button. Two fields will be disabled if the other one is entered with information.

I moved the match history and details API calls to NodeJS server. However some generic data is handled in front-end because information like hero names don't change a lot. Fetching feeds is handled in Node server. API sequence(back-end then front-end) may be the cause of not loading images at the first load. I may move all the API calls to Node server in the future.

Search function use another API to get a particular match details. Searching's return will not be stored in the file.


Lab 6 update:

I am using json2csv package for this lab. I installed it as a den pendency for this project. The selection of file formats is presented at the top of the page. It’s included in a form. AngularJS will communicate with Nodejs and inform the format selected when export button is clicked. Nodejs then use json2csv to convert the format if it’s selected to output in csv format. Otherwise a json file will be provided. Information is kept in a string to be ready for file exporting. It will only export what's displayed on the page. If format selected as csv, that string variable will be used for conversion.

This task should be handled in backend, since the feed is received in backend and AngularJS can't edit files. If handled in backend, the app has to pass the information from Nodejs to angular, convert and then send it back to Node to write file. In addition, this task is not supposed to be users’ concern.


Lab 7 update:

I had to get rid of some socket uses which were used to stream the data from api call to angular directly. I've had some difficulties with the latest version of mongoDB, so I switched to an older version.

The Build DB button actually reset(clear) the database first and then insert with the new information. js2xml package is used to convert json data to xml for the xml output.Display DB will pull the data from database and display it on the page. User can input the file name in the input field, and when node writing file, file name will be used.


Lab 8 update:
DB buttons color was grey, which was quite similar to that of the background color. I changed it to gain some contrast and made it a better design. Also I moved them to the first line as they should be in a group with search and fetch instead of with file export.

Added title to the dropdown. Changed file export form style.

Heroes information api call is moved to Nodejs(backend).

Alert message added to build database button.


Lab 9 update:
1. Visualize data button in home page
2. Home page button in data visualization page
3. 3 pieces of information visualized in data page. They're a bar graph, pie graph and a line graph
