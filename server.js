// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var dns = require('dns');
var url = require('url');
const crypto = require("crypto");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/fileupload.html');
});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.get("/api/whoami", function (req, res) {
  res.json({
    "ipaddress": req.socket.remoteAddress,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"]
  });
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

let urlStore = [];
app.post('/api/shorturl', function(req, res){

  var adr = req.body.url;
  var q = url.parse(adr, true);

  if (q.host == null || q.host == "") {
    return res.json({ error: 'invalid url' });
  }
  dns.lookup(q.host, function (err, addresses, family) {
    if (err) {
      res.json({ error: 'invalid url' });
    }
    else {
      let index = urlStore.length + 1;
      urlStore.push({original_url : req.body.url, short_url : index})
      res.json({ original_url : req.body.url, short_url : index})
    }
  });
});

app.get('/api/shorturl/:short_url', function(req, res){
  if (req.params.short_url) {
    let given = (urlStore.filter(u => u.short_url == req.params.short_url)||[])[0]
    if (given) {
      res.redirect(given.original_url);
    }
  }
});

let users = [];

app.post('/api/users', function (req, res) {
  var username = req.body.username;
  let newUser = {
    _id: crypto.randomBytes(16).toString("hex"),
    username: username,
    exercises: []
  }
  users.push(newUser);
  res.json({_id: newUser._id, username: newUser.username});
});

app.get('/api/users', function (req, res) {
  res.json(users.map(u => {
    return {
    _id: u._id,
     username: u.username }
    }));
});

app.post('/api/users/:_id/exercises', function (req, res) {
  try {
    if (!req.params._id) {
      return res.json({error: "invalid request"})
    }

    let user = (users.filter(u => u._id == req.params._id)||[])[0]
    if (!user) {
      return res.json({error: "invalid user id"})
    }

    let exercise = {};
    exercise.description = req.body.description;
    exercise.duration = parseInt(req.body.duration);
    exercise.date = req.body.date;

    if (!exercise.date) {
      exercise.date = new Date().toDateString();
    }
    else {
      exercise.date = new Date(exercise.date).toDateString();
    }

    exercise.username = user.username;
    exercise._id = user._id;
    user.exercises.push(exercise)

    res.json(exercise);
  }
  catch(err) {
    return res.json({error: "invalid request"})
  }
});

app.get('/api/users/:_id/logs', function (req, res) {
  try {
    if (!req.params._id) {
      return res.json({error: "invalid request"})
    }

    let user = (users.filter(u => u._id == req.params._id)||[])[0]
    if (!user) {
      return res.json({error: "invalid user id"})
    }

    let log = {
      username: user.username,
      _id: user._id,
      count: user.exercises.length,
      log: []
    };

    let query = {};
    let exercises = [];
    if (req.query && (req.query.from || req.query.to || req.query.limit)) {

      let fromDate = req.query.from ? new Date(req.query.from): new Date(0);
      let toDate = req.query.to ? new Date(req.query.to) : new Date(8640000000000000);
      let limit = req.query.limit ? parseInt(req.query.limit) : Number.MAX_SAFE_INTEGER;

      exercises = user.exercises.filter((e, index) => {
        return new Date(e.date).getTime() >= fromDate.getTime() && new Date(e.date) <= toDate.getTime() && index < limit;
      });
     
    }
    else {
      exercises = user.exercises;
    }

    log.log = exercises.map(e => {
        return {
          description: `${e.description}`,
          duration: parseInt(e.duration),
         date: e.date
      }
    });

    res.json(log);
  }
  catch(err) {
    return res.json({error: "invalid request"})
  }
});

app.post('/api/fileanalyse', upload.single('upfile'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  res.json({"name":file.originalname,"type":file.mimetype,"size":file.size});
})

app.get("/api/:date?", function (req, res) {

  let response = {};
  let dateParam = null;
  let date = null;

  //no param
  if (!req.params.date) {
    date = new Date();
  }

  //could be unix time
  if (req.params.date && !isNaN(req.params.date)) {
    date = new Date(parseInt(req.params.date)); 
  }

  //has param non number
  if (req.params.date && isNaN(req.params.date)) {
    date = new Date(req.params.date);
  }
  
  if (date == "Invalid Date") {
    return res.json({ error : "Invalid Date" });
  }   

  res.json({unix: date.getTime(), utc: date.toUTCString()});
});




// listen for requests :)
// var listener = app.listen(5001, function () {
//   console.log('Your app is listening on port ' + 5001);
// });

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
