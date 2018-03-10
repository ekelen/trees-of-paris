import * as _ from "lodash"
import * as assert from "assert"
import * as L from "leaflet"
import * as G from "geojson"
import * as math from "mathjs"

// -------------- Geo tools
export const toPoly = (name: string | number, geometry: any): G.Feature<G.Polygon> => ({
  "type": "Feature",
  "properties": {
    "toolTipContent": name
  },
  geometry
})

export const toLatLng = (lat: number, lng: number): [number, number] => {
  const latCpy = math.round(+lat, 6)
  const lngCpy = math.round(+lng, 6)
  return [latCpy, lngCpy]
}

// -------------- General Tools

export const toStr = (obj: any):string => (JSON.stringify(obj))

export const pull = (data: any[], key: string, condition?: any): string[] | number[] => {
  // returns array of primitives (values)
  if (!condition) condition = (val) => 1 === 1
  return data.filter(d => !_.isUndefined(d[key]) && condition(d)).map(d => d[key])
}

export const toggleItem = (array, item): any[] => {
  return array.includes(item) ? array.filter(v => v !== item) : [...array, item]
}

// Returns array of pairs [['value1', 4], ['value2', 3]] etc.
export const toCountPairs = (vals: string[] | number[] | null):any[][] => (_.toPairs(_.countBy(vals)))


function Super(obj) {
  for (let k in obj) {
    if (!Object.hasOwnProperty(this)) this[k] = obj[k]
  }
}

// Returns one object: {value1: 4, value2: 3} etc.
export const getFrequency = (data: any[], key: string):any => {
  return _.countBy(pull(data, key))}

export const sortUniqs = (data: any[], key: string, condition?: any): any[] => {
  // returns array of k/v arrays, ordered by group membership
  if (!condition) condition = (val) => 1 === 1
  let freq = _.toPairs(getFrequency(data.filter(condition), key))
  // alphabetize
  .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  // count category membership
  .sort((a, b) => b[1] - a[1])
  return freq
}
