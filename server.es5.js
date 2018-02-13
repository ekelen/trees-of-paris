"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var axios = require("axios");
var moment = require("moment");
var queryString = require("query-string");
var ObjectID = mongodb.ObjectID;
require('dotenv').config();

var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');

var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream');

var treeData = "../assets/data/les-arbres.json";
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

// ROUTES
// app.get('/init', function(req, res) {
//   addRecords()
// })

app.get("/api/trees", function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
    var query, options;
    return regeneratorRuntime.wrap(function _callee$(_context) {
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
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {
    var query, dbQuery, options;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // const queryStr = queryString.stringify(req.query)
            query = req.query;
            dbQuery = new Search(query);
            options = new Options(query);

            console.log('dbQuery: ', dbQuery);
            Trees.count(dbQuery, function (err, count) {
              if (err) return handleError(res, "Server error", err.message);
              // if (count > 100000)
              //   return handleError(res, "Too many results. Please narrow your query.")
              if (!count) return handleError(res, "No results found. Please broaden your query.");
              Trees.find(dbQuery, {}, options).cursor().pipe(JSONStream.stringify()).pipe(res.type('json'));
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
  var distance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;

  var geoQuery = {};
  geoPt = {
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
    return !obj || Object.keys(obj).length < 1;
  }
};

function Search(query) {
  for (k in query) {
    if (_.keys(Trees.schema.paths).includes(k) && query[k].length > 0) {
      if (Util.isArrayLike(query[k])) this[k] = { '$in': Util.toArray(query[k]).map(function (v) {
          return Util.isNumberLike(v) ? Util.toNum(v) : v;
        }) };else if (Util.isNumberLike(query[k])) this[k] = Util.toNum(query[k]);
    } else if (k === "geometry") {
      this['geometry'] = formatGeoSearch(Util.toLngLat(query[k]));
    }
  }
}

function Options(query) {
  for (k in query) {
    if (["limit", "skip"].includes(k) && query[k].length > 0) {
      this[k] = Util.toNum(query[k]);
    }
  }
}

var addRecords = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            request({ url: 'http://localhost:8080/static/data/les-arbres.json' }).pipe(JSONStream.parse('*')).pipe(es.mapSync(function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(t) {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return Trees.create({
                          id: t.recordid,
                          species: t.fields.espece,
                          genus: t.fields.genre,
                          commonName: t.fields.libellefrancais,
                          street: t.fields.adresse.toLowerCase(),
                          arrondissement: parseInt(t.fields.arrondissement.split('').filter(function (c) {
                            return c >= '0' && c <= '9';
                          }).join('')),
                          geometry: t.geometry,
                          notable: !!t.fields.remarquable,
                          usage: t.fields.domanialite.toLowerCase(),
                          circumference: parseInt(t.fields.circonferenceencm),
                          height: parseInt(t.fields.hauteurenm)
                        }).then(function () {
                          return console.log("ok");
                        }).catch(function (err) {
                          return console.log(err.message);
                        });

                      case 2:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, undefined);
              }));

              return function (_x8) {
                return _ref4.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function addRecords() {
    return _ref3.apply(this, arguments);
  };
}();