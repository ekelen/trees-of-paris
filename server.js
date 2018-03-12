var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
require('dotenv').config({ silent: process.env.NODE_ENV === 'production' })

var mongoose = require('mongoose')
var async = require('async')
var fs = require('fs')
var _ = require('lodash')

var request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')

var treeSchema = require('./src/app/mongoose/Tree.js')

var Trees = mongoose.model('Trees', treeSchema);
mongoose.connect(process.env.PROD_MONGODB)
mongoose.Promise = global.Promise;
let db = mongoose.connection;

db.on('error', function(){
  console.log('ERR: Error connecting to database.');
  process.exit(1)
});

var app = express();
app.use(bodyParser.json());

app.use(function(req, res, next) {
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  console.time(`${req.method} ${req.originalUrl} from ${ip}`)
  next()
})

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

// MIDDLEWARE
const checkAdmin = function (req, res, next) {
  if (!req.headers['x-auth']) return handleError(res, "You are not authorized.", null, 401)
  if (req.headers['x-auth'] !== process.env.ADMIN_KEY) return handleError(res, "You are not authorized.", null, 401)
  next()
}

// ROUTES

app.get("/api/trees", async function(req, res) {
  const { query } = req
  const options = new Options(query)
  Trees.find({}, {}, options)
    .cursor()
    .pipe(JSONStream.stringify())
    .pipe(res.type('json'))
});

app.get("/api/trees/search", async (req, res) => {
  const { query } = req
  const dbQuery = new Search(query)
  const options = new Options(query)
  console.log('dbQuery: ', dbQuery)
  Trees.count(dbQuery, (err, count) => {
    if (err)
      return handleError(res, "Server error", err.message)
    if (!count)
      return handleError(res, "No results found. Please broaden your query.")
    let cursor = Trees.find(dbQuery, {}, options)
      .cursor()

    cursor.pipe(JSONStream.stringify())
      .pipe(res.type('json'))
    cursor.on('end', () => {
      let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      console.timeEnd(`${req.method} ${req.originalUrl} from ${ip}`)
    })
  })
});

var distDir = __dirname + "/dist/";
app.use(express.static(distDir));


// CONTROLLERS
const formatGeoSearch = (lnglat, distance = 250) => {
  let geoQuery = {}
  let geoPt = {
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
  for (var k in query) {
    if (_.keys(Trees.schema.paths).includes(k) && query[k].length > 0) {
      if (Util.isArrayLike(query[k]))
        this[k] = {'$in': Util.toArray(query[k]).map(v => Util.isNumberLike(v) ? Util.toNum(v) : v)}
      else if (Util.isNumberLike(query[k]))
        this[k] = Util.toNum(query[k])
    }
    else if (k === "geometry") {
      this['geometry'] = formatGeoSearch(Util.toLngLat(query[k]), query['distance'] ? +query['distance'] : undefined)
    }
  }
}

function Options (query) {
  for (var k in query) {
    if (["limit", "skip"].includes(k) && query[k].length > 0) {
      this[k] = Util.toNum(query[k])
    }
  }
}
