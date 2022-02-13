// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var dns = require('dns');
var url = require('url');

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
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
var listener = app.listen(5001, function () {
  console.log('Your app is listening on port ' + 5001);
});

// var listener = app.listen(process.env.PORT, function () {
//   console.log('Your app is listening on port ' + listener.address().port);
// });
