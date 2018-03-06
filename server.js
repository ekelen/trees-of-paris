var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var axios = require("axios")
var moment = require("moment")
var queryString = require("query-string")
var ObjectID = mongodb.ObjectID;
require('dotenv').config({ silent: process.env.NODE_ENV === 'production' })

var mongoose = require('mongoose')
var async = require('async')
var fs = require('fs')
var _ = require('lodash')

var request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')

var treeData = "../assets/data/les-arbres.json"
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

server.timeout = 24000

// Generic error handler used by all endpoints.
function handleError(res, reason = "Server error.", message = reason, code) {
  console.log("handleError: " + reason);
  return res.status(code || 500).json({error: {reason: reason, message: message, code: code}})
}

// MIDDLEWARE
checkHeader = function (req, res, next) {
  if (!req.headers['x-auth']) return handleError(res, "You are not authorized.", null, 401)
  if (req.headers['x-auth'] !== process.env.ADMIN_KEY) return handleError(res, "You are not authorized.", null, 401)
  next()
}



app.get('/api/fix_special', checkHeader, function (req, res) {
 updateSpecial()
})
app.get('/api/test_private', checkHeader, (req, res) => {
  return res.json({message: 'You used the right header.'})
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
      this['geometry'] = formatGeoSearch(Util.toLngLat(query[k]))
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

// ROUTES
app.get('/api/init', checkHeader, function(req, res) {
  setTimeout(() => { return res.send('Time out.')}, 24000)
  const stream = request({url: 'http://localhost:8080/static/data/30k_trees_cim.json'})
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
        notable: !!(+t.fields.remarquable),
        usage: t.fields.domanialite.toLowerCase(),
        circumference: parseInt(t.fields.circonferenceencm),
        height: parseInt(t.fields.hauteurenm)
      })
        .then(() => console.log("ok"))
        .catch(err => console.log(err.message + '\n'))
    }))
  stream.on('end', () => {
    console.log('FINISHED')
    return res.json('finished.')
  })

})

const addRecords = async() => {
  // request({url: 'http://localhost:8080/static/data/les-arbres.json'})

}

const updateSpecial = async() => {
  request({url: 'http://localhost:8080/static/data/les-arbres.json'})
    .pipe(JSONStream.parse('*'))
    .pipe(es.mapSync(async (t) => {
      await Trees.update(
        {id: t.recordid},
        {$set:{notable: !!(+t.fields.remarquable)}}
      )
        .then(() => console.log("ok"))
        .catch(err => console.log(err.message))
    }))
}
