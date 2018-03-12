"use strict";

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });

var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');

var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream');

var treeSchema = require('./src/app/mongoose/Tree.js');

var Trees = mongoose.model('Trees', treeSchema);
mongoose.connect(process.env.PROD_MONGODB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;

db.on('error', function () {
  console.log('ERR: Error connecting to database.');
  process.exit(1);
});

var app = express();
app.use(bodyParser.json());

app.use(function (req, res, next) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.time(req.method + " " + req.originalUrl + " from " + ip);
  next();
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/static', express.static(__dirname + '/src/assets'));

// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("Tree Server now running on port", port);
});

// Generic error handler used by all endpoints.
function handleError(res) {
  var reason = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Server error.";
  var message = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : reason;
  var code = arguments[3];

  console.log("handleError: " + reason);
  return res.status(code || 500).json({ error: { reason: reason, message: message, code: code } });
}

// MIDDLEWARE
var checkAdmin = function checkAdmin(req, res, next) {
  if (!req.headers['x-auth']) return handleError(res, "You are not authorized.", null, 401);
  if (req.headers['x-auth'] !== process.env.ADMIN_KEY) return handleError(res, "You are not authorized.", null, 401);
  next();
};

// ROUTES

app.get("/api/trees", function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res) {
    var query, options;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            query = req.query;
            options = new Options(query);

            Trees.find({}, {}, options).cursor().pipe(JSONStream.stringify()).pipe(res.type('json'));

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function (_x3, _x4) {
    return _ref.apply(this, arguments);
  };
}());

app.get("/api/trees/search", function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(req, res) {
    var query, dbQuery, options;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            query = req.query;
            dbQuery = new Search(query);
            options = new Options(query);

            console.log('dbQuery: ', dbQuery);
            Trees.count(dbQuery, function (err, count) {
              if (err) return handleError(res, "Server error", err.message);
              if (!count) return handleError(res, "No results found. Please broaden your query.");
              var cursor = Trees.find(dbQuery, {}, options).cursor();

              cursor.pipe(JSONStream.stringify()).pipe(res.type('json'));
              cursor.on('end', function () {
                var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                console.timeEnd(req.method + " " + req.originalUrl + " from " + ip);
              });
            });

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}());

var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

// CONTROLLERS
var formatGeoSearch = function formatGeoSearch(lnglat) {
  var distance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 250;

  var geoQuery = {};
  var geoPt = {
    type: "Point",
    coordinates: lnglat
  };

  geoQuery["$nearSphere"] = {
    "$geometry": geoPt,
    "$maxDistance": distance
  };
  return geoQuery;
};

var Util = {
  toNum: function toNum(str) {
    if (!str) return 0;
    if (_.isNaN(+str)) throw new Error(str + " is not a numberlike input.");
    return +str;
  },
  isNumberLike: function isNumberLike(str) {
    if (!str) return 1;
    return _.isNaN(+str) ? 0 : 1;
  },
  toArray: function toArray(item) {
    return Array.isArray(item) ? item : item.split(',');
  },
  isArrayLike: function isArrayLike(item) {
    return Array.isArray(item) || typeof item === "string" && item.split(',').length > 1;
  },
  toLngLat: function toLngLat(coordinates) {
    var coordArray = Array.isArray(coordinates) ? coordinates : coordinates.split(',');
    if (!_.inRange(coordArray[0], 2.2240792, 2.4697602) || !_.inRange(coordArray[1], 48.8155256, 48.902156)) coordArray.reverse();
    return coordArray;
  },
  isEmpty: function isEmpty(obj) {
    return !obj || (0, _keys2.default)(obj).length < 1;
  }
};

function Search(query) {
  for (var k in query) {
    if (_.keys(Trees.schema.paths).includes(k) && query[k].length > 0) {
      if (Util.isArrayLike(query[k])) this[k] = { '$in': Util.toArray(query[k]).map(function (v) {
          return Util.isNumberLike(v) ? Util.toNum(v) : v;
        }) };else if (Util.isNumberLike(query[k])) this[k] = Util.toNum(query[k]);
    } else if (k === "geometry") {
      this['geometry'] = formatGeoSearch(Util.toLngLat(query[k]), query['distance'] ? +query['distance'] : undefined);
    }
  }
}

function Options(query) {
  for (var k in query) {
    if (["limit", "skip"].includes(k) && query[k].length > 0) {
      this[k] = Util.toNum(query[k]);
    }
  }
}
