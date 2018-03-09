import * as _ from "lodash"
import * as __ from "../util"
import * as assert from "assert"

import {ITree} from './ITree'
import {CONTINUOUS_VARS} from '../constants/Visualization'
import {DGREEN1, LGREEN1, LGREY1} from '../constants/Style'

const isContinuous = (input: string): boolean => CONTINUOUS_VARS.includes(input)

type X = number | string
type Y = number
type Input = string
type NumPair = [number, Y]
type Pair = [X, Y]

interface Store {
  trees: ITree[],
  nBins: number,
  input1: Input,
  input2: Input
}

const x = (pair: Pair): X => pair[0]
const y = (pair: Pair): Y => pair[1]
const rawBy = (trees: ITree[], input: Input): X[] => trees.map(t => t[input])
const uniqBy = (trees: ITree[], input: Input): X[] => _.uniq(rawBy(trees, input))
const toCountPairs = (vals: X[] | null): Pair => _.toPairs(_.countBy(vals))
const sortPairsByFrequency = (pairs: Pair[]): Pair[] => pairs.sort((a, b) => (y(b) - y(a)))

const max = (vals: number[]): number => _.max(vals)
const isInBin = (val: number, bin: number, bins: number[]): boolean => (_.sortedIndex(bins, val) === bins.indexOf(bin))
const getBinSize = (pairs: Pair[], interval: number): number => Math.ceil(_.max(pairs.map(p => +x(p))) / interval)
const binSize = (max: number, nBins: number): number => Math.ceil(max / nBins)
const bins = (nBins: number, binSize: number): number[] => Array.from(new Array(nBins), (v, i) => ((i + 1) * binSize))
const binnedPairs = (rawPairs: Pair[], bins: number[]): NumPair[] => rawPairs.map(p => {
  const i = _.sortedIndex(bins, +x(p))
  return <NumPair>[bins[i], y(p)]
})
const reducedPairs = (bins: number[], binnedPairs: NumPair[]): NumPair[] => (
  bins.map(b => {
    const binContents = binnedPairs
      .filter(p => +x(p) === b)
      .map(p => y(p))
      .reduce((acc, cur) => acc + cur, 0)
    return<NumPair>[b, binContents]
  })
)

function Bin (trees, nBins) {
  this.trees = trees // just a reference so it's ok
  this.nBins = nBins
}

Bin.prototype.setInput = function(input: string) {
  if (!this.trees) throw new Error('Bin input functions must have tree data.')
  if (!this.nBins) throw new Error('Bin input functions must have tree data.')
  this.input = input
  this.rawVals = rawBy(this.trees, input)
  this.rawPairs = toCountPairs(this.rawVals)
  this.max = _.max(this.rawVals)
  this.binSize = Math.ceil(_.max(this.rawVals) / this.nBins)
  this.bins = Array.from(new Array(this.nBins), (v, i) => ((i + 1) * this.binSize))
  this.binnedPairs = this.rawPairs.map(p => {
    const i = _.sortedIndex(this.bins, +x(p))
    return [this.bins[i], y(p)]
  })
  this.isInBin = function(bin, val) { return _.sortedIndex(this.bins, val) === this.bins.indexOf(bin)}
  this.reducedPairs = this.bins.map(b => {
    const binContents = this.binnedPairs
      .filter(p => +x(p) === b)
      .map(p => y(p))
      .reduce((acc, cur) => acc + cur, 0)
    return [b, binContents]
  })
}




function getBins(pairs, interval = 20) {
  const binSize = getBinSize(pairs, interval)
  const bins = Array.from(new Array(interval), (v, i) => ((i + 1) * Math.ceil(binSize)))
  return bins
}

function reduceContinuousPairs(pairs, interval = 20) {
  const bins = getBins(pairs, interval)

  const binnedPairs = pairs.map(p => {
    const i = _.sortedIndex(bins, +x(p))
    return [bins[i], y(p)]
  })

  const reducedPairs = bins.map((b) => {
    const binContents = binnedPairs
      .filter(p => +x(p) === b)
      .map(p => y(p))
      .reduce((acc, cur) => acc + cur, 0)
    return [b, binContents]
  })
  return reducedPairs
}



function getInput1Sseries(trees, input1, input2 = null, binData) {
  if (isContinuous(input1)) binData.setInput(input1)
  const pairs = toCountPairs(rawBy(trees, input1))
  const serieData = isContinuous(input1) ? reduceContinuousPairs(pairs) : sortPairsByFrequency(pairs)
  const serieData2 = isContinuous(input1) ? binData.reducedPairs : sortPairsByFrequency(pairs)
  //assert.deepEqual(serieData, serieData2, 'Not equal, debug.')
  return serieData
    .map(p => {
    return {y: p[1], name: `${p[0]}`, drilldown: input2 ? `${p[0]}` : null}
  })
}



function getInput2Series(trees, input1, input2) {

  const bins = isContinuous(input1) ? getBins(toCountPairs(rawBy(trees, input1))) : null

  const ids = isContinuous(input1) ?
    bins :
    uniqBy(trees, input1)

  const getInput2PerInput1 = (id) => {
    return trees
      .filter(t => isContinuous(input1) ? isInBin(+(t[input1]), id, bins) : t[input1] === id)
      .map(t => t[input2])
  }

  const serieData = ids.map(id => {
    const pairs = toCountPairs(getInput2PerInput1(id))
    // console.log("pairs", pairs)
    const serieData = isContinuous(input2) ? reduceContinuousPairs(pairs) : pairs
    const seriesObj = {
      id: _.toString(id),
      name: `${id}`,
      data: serieData
    }
    return seriesObj
  })
  // console.log(`serieData.length for ${input2} is ${serieData.length}`)
  assert(serieData.length > 0, 'No serie data.')


  return serieData
}

export function IChart (input1: string, trees: ITree[], input2?: string | null): any {
  console.time('IChart')
  const binData = new Bin(trees, 20)
  // let chartTimer = setTimeout(() => { throw new Error('timeout') }, 3000)
  const data = getInput1Sseries(trees, input1, input2, binData)
  const drilldownData = getInput2Series(trees, input1, input2)
  console.timeEnd('IChart')
  return {
    chart: { type: 'column', backgroundColor: LGREY1 },
    title: { text: 'Trees'},
    xAxis: {
      title: { text: input2 ? `${input1} » ${input2}` : input1 },
      type: 'category',
    },
    yAxis: {
      min: 0,
      title: { text: 'Frequency' }},
    series: [
      {
        name: 'All trees',
        color: DGREEN1,
        data,
      }
    ],
    drilldown: {
        series: drilldownData
    },
    plotOptions: { series: { cropThreshold: 300 } }
  }
}


