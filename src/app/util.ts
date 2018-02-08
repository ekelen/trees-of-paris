import * as _ from "lodash"
import * as assert from "assert"
import * as L from "leaflet"
import * as G from "geojson"
import * as math from "mathjs"

// Geo tools
export const toPoly = (name: string | number, geometry: any): G.Feature<G.Polygon> => ({
  "type": "Feature",
  "properties": {
    "toolTipContent": name
  },
  geometry
})

export const toLatLng = (lat: number, lng: number) => {
  const latCpy = math.round(+lat, 6)
  const lngCpy = math.round(+lng, 6)
  return [latCpy, lngCpy]
}

// DB data tools
export const ARRDTS: number[] = Array.from(new Array(20), (val, i) => i + 1)

export const toCountPairs = (vals: string[] | number[] | null):any[][] => (_.toPairs(_.countBy(vals)))
export const toStr = (obj: any) => (JSON.stringify(obj))
export const prToStr = (obj: any, name = null) => name ? console.log(`${name}: ` + JSON.stringify(obj)) : console.log(JSON.stringify(obj))
export const cl = (obj: any, name = null) => (name ? console.log(`${name}: ` + obj) : console.log(obj))
export const empty = (obj: any): boolean => {
  return !Object.keys(obj).length
}

export const pull = (data: any[], key: string, condition?: any): string[] | number[] => {
  // returns array of primitives (values)
  if (!condition) condition = (val) => 1 === 1
  return data.filter(d => !_.isUndefined(d[key]) && condition(d)).map(d => d[key])
}

export const toggle = (array, item) => {
  return array.includes(item) ? array.filter(v => v !== item) : [...array, item]
}

// returns an array of ints for all occurences of int-like key that can be coerced to an int
export const pullInts = (data: any[], key: string, condition?: any): number[] => {
  if (!condition) condition = (val) => 1 === 1
  return data
  .filter(d => !_.isUndefined(d[key]) && condition(d))
  .map(d => parseInt(d[key]))
  .filter(d => _.isNumber(d))
}

// returns array of primitives (unique values)
export const pullUniq = (data: any[], key: string): string[] =>
  (_.uniqBy(pull(data, key)))

// Returns one object: {value1: 4, value2: 4}
export const getFrequency = (data: any[], key: string): any[] => {
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

// Return array of keys, sorted from highest to lowest frequency among dataset
export const getByFrequency = (mappedDataSet: any[], resultLength = 10): any[] => {
  //this.cl(_.toPairs(_.countBy(mappedDataSet)))
  return _.toPairs(_.countBy(mappedDataSet)) // get count for each item
  .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0) //alphabetize
  .sort((a, b) => b[1] - a[1])
  .slice(0, resultLength)
}




// Return array [{val: [min, max], name: 'min - max'}]
export const createBins = (mappedDataSet: number[]): any[] => {
  // Rule of thumb: number of bins == sqrt of data points
  let binCount = Math.round(Math.sqrt(mappedDataSet.length))
  binCount = binCount > 25 ? 25 : binCount

  // Get min and max from data set
  const min = _.min(mappedDataSet)
  const max = _.max(mappedDataSet)
  //console.log(`min: ${min}, max: ${max}`)

  // Get bin size
  const binSize = Math.round((max - min) / binCount)
  //console.log('binSize: ', binSize)

  // Make sure all our data fits
  assert(mappedDataSet.every(d => _.inRange(d, min, max + 1)), 'Some values not in range.')
  // Okay, so maybe it doesn't, oh well
  // assert(mappedDataSet.every(d => _.inRange(d, min, binSize * binCount)), 'Some values not in bins.')

  // Map value ranges to bins
  let binsMax = Array.from(new Array(binCount),
    (val,i) => (i+1) * binSize)
  const getBinName = (b: number[]) => (binSize === 1 ? `${b[1] - 1}` : `${b[0]} - ${b[1] - 1}`)
  //console.log('binsMax: ', binsMax)
  let bins = binsMax.map((bMax, i) => ([bMax - binSize, bMax]))
  let binCats = bins.map(b => ({val: b, name: getBinName(b)}))
  return binCats
}


// bins must be in {val: [min,max], name: string} form
export const mapDataToBins = (bins: any[], data: number[]): any[] => {
  let returnBins = bins.map(b => ({...b, count: data.filter(v => _.inRange(v, b.val[0], b.val[1])).length}))
  //console.log(returnBins)
  return returnBins
}
