import * as _ from "lodash"
import * as G from "geojson"
import * as math from "mathjs"
import {
  DrilldownSeries,
  DrilldownSeriesData,
  InputLabel,
  NumPair,
  Pair,
  PrimarySeriesData,
  X,
  Y
} from './model/types/Chart'
import {CONTINUOUS_VARS, NUM_VARS} from './model/constants/Visualization'
import {ITree} from './model/types/ITree'

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

// -------------- Chart Tools

export const x = (pair: Pair): X => pair[0]
export const y = (pair: Pair): Y => pair[1]
export const rawBy = (trees: ITree[], input: InputLabel): X[] => trees.map(t => t[input])
export const toCountPairs = (vals: X[], toNumber: boolean): Pair[] => _.toPairs(_.countBy(vals)).map(p => toNumber ? ([+x(p), y(p)]) : p)
export const sortPairsByFrequency = (pairs: Pair[]): Pair[] => pairs.sort((a, b) => (y(b) - y(a)))
export const isContinuous = (input: string): boolean => CONTINUOUS_VARS.includes(input)
export const isNumVar = (input: InputLabel): boolean => NUM_VARS.includes(input)
export const max = (vals: number[]): number => _.max(vals)
export const isInBin = (val: number, bin: number, bins: number[]): boolean => (_.sortedIndex(bins, val) === bins.indexOf(bin))
export const binSize = (max: number, nBins: number): number => Math.ceil(max / nBins)
export const bins = (nBins: number, binSize: number): number[] => Array.from(new Array(nBins), (v, i) => ((i + 1) * binSize))
export const binnedPairs = (rawPairs: NumPair[], bins: number[]): NumPair[] => rawPairs.map(p => {
  const i = _.sortedIndex(bins, +x(p))
  return <NumPair>[bins[i], y(p)]
})
export const mapToPrimaryChart = (pairs: Pair[], input2: InputLabel): PrimarySeriesData[] => pairs.map(p => ({
  y: y(p),
  name: _.toString(x(p)),
  drilldown: input2 ? _.toString(x(p)) : null
}))
export const mapToDrilldown = (id: X, data: DrilldownSeriesData): DrilldownSeries => (<DrilldownSeries>{
  id: `${id}`,
  name: `${id}`,
  data: <DrilldownSeriesData> data
})
export const reducedPairs = (bins: number[], binnedPairs: NumPair[]): NumPair[] => (
  bins.map(b => {
    const binContents = binnedPairs
      .filter(p => +x(p) === b)
      .map(p => y(p))
      .reduce((acc, cur) => acc + cur, 0)
    return <NumPair>[+b, binContents]
  })
)
export const filterByCat = (trees, input, bins, id) => trees.filter(t => t[input] === id)
export const filterByBin = (trees, input, bins, bin): ITree[] => trees.filter(t => isInBin(+t[input], +bin, bins))
