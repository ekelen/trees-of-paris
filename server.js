var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var axios = require("axios")
var moment = require("moment")
var queryString = require("query-string")
var ObjectID = mongodb.ObjectID;

var mongoose = require('mongoose')
var async = require('async')
var fs = require('fs')
var _ = require('lodash')

var request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')

var treeData = "../assets/data/les-arbres.json"
var treeSchema = require('./src/app/mongoose/Tree.js')
process.env.MONGODB_URI = "mongodb://admin:snNA46R67KOw@ds261527.mlab.com:61527/les-arbres"

var Trees = mongoose.model('Trees', treeSchema);
mongoose.connect('mongodb://localhost:27017/les-arbres')
//mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;
let db = mongoose.connection;

db.on('error', function(){
  console.log('Error.');
  //console.log('DB connection error. If your port is being blocked over public wifi, this might work...');
  //await mongoose.connect('mongodb://localhost:27017/les-arbres')
  //let resultRetry = mongoose.connection
});

var app = express();
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/static', express.static(__dirname + '/src/assets'));

// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("Tree Server now running on port", port);
})


// Generic error handler used by all endpoints.
function handleError(res, reason = "Server error.", message = reason, code) {
  console.log("handleError: " + reason);
  return res.status(code || 500).json({error: {reason: reason, message: message, code: code}})
}

// ROUTES
app.get('/init', function(req, res) {
  addRecords()
})

app.get("/api/trees", async function(req, res) {
  const { query } = req
  const options = new Options(query)
  Trees.find({}, {}, options)
    .cursor()
    .pipe(JSONStream.stringify())
    .pipe(res.type('json'))
});

app.get("/api/trees/search", async (req, res) => {
  // const queryStr = queryString.stringify(req.query)
  const { query } = req
  const dbQuery = new Search(query)
  const options = new Options(query)
  console.log('dbQuery: ', dbQuery)
  Trees.count(dbQuery, (err, count) => {
    if (err)
      return handleError(res, "Server error", err.message)
    // if (count > 100000)
    //   return handleError(res, "Too many results. Please narrow your query.")
    if (!count)
      return handleError(res, "No results found. Please broaden your query.")
    Trees.find(dbQuery, {}, options)
      .cursor()
      .pipe(JSONStream.stringify())
      .pipe(res.type('json'))
  })
});


var distDir = __dirname + "/dist/";
app.use(express.static(distDir));


// CONTROLLERS
const formatGeoSearch = (lnglat, distance = 200) => {
  let geoQuery = {}
  geoPt = {
    type: "Point",
    coordinates: lnglat
  }

  geoQuery["$nearSphere"] = {
    "$geometry": geoPt,
    "$maxDistance": distance
  }
  return geoQuery
}

const Util = {
  toNum: (str) => {
    if (!str) return 0
    if (_.isNaN(+str))
      throw new Error(`${str} is not a numberlike input.`)
    return +str
  },
  isNumberLike: (str) => {
    if (!str) return 1
    return _.isNaN(+str) ? 0 : 1
  },
  toArray: (item) => {
    return Array.isArray(item) ? item : item.split(',')
  },
  isArrayLike: (item) => {
    return (Array.isArray(item) || (typeof item === "string" && item.split(',').length > 1))
  },
  toLngLat: (coordinates) => {
    let coordArray = Array.isArray(coordinates) ? coordinates : coordinates.split(',')
    if (!_.inRange(coordArray[0], 2.2240792, 2.4697602) || !_.inRange(coordArray[1], 48.8155256, 48.902156))
      coordArray.reverse()
    return coordArray
  },
  isEmpty: (obj) => {
    return !obj || Object.keys(obj).length < 1
  }
}

function Search (query) {
  for (k in query) {
    if (_.keys(Trees.schema.paths).includes(k) && query[k].length > 0) {
      if (Util.isArrayLike(query[k]))
        this[k] = {'$in': Util.toArray(query[k]).map(v => Util.isNumberLike(v) ? Util.toNum(v) : v)}
      else if (Util.isNumberLike(query[k]))
        this[k] = Util.toNum(query[k])
    }
    else if (k === "geometry") {
      this['geometry'] = formatGeoSearch(Util.toLngLat(query[k]))
    }
  }
}

function Options (query) {
  for (k in query) {
    if (["limit", "skip"].includes(k) && query[k].length > 0) {
      this[k] = Util.toNum(query[k])
    }
  }
}

const addRecords = async() => {
  request({url: 'http://localhost:8080/static/data/les-arbres.json'})
  .pipe(JSONStream.parse('*'))
  .pipe(es.mapSync(async (t) => {
    await Trees.create({
      id: t.recordid,
      species: t.fields.espece,
      genus: t.fields.genre,
      commonName: t.fields.libellefrancais,
      street: t.fields.adresse.toLowerCase(),
      arrondissement: parseInt(t.fields.arrondissement.split('').filter(c => c >= '0' && c <= '9').join('')),
      geometry: t.geometry,
      notable: !!t.fields.remarquable,
      usage: t.fields.domanialite.toLowerCase(),
      circumference: parseInt(t.fields.circonferenceencm),
      height: parseInt(t.fields.hauteurenm)
    })
    .then(() => console.log("ok"))
    .catch(err => console.log(err.message))
  }))
}
