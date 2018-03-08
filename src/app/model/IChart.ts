import * as _ from "lodash"
import * as __ from "../util"
import * as assert from "assert"

import {ITree} from './ITree'
import {CONTINUOUS_VARS} from '../constants/Visualization'
import {DGREEN1, LGREEN1, LGREY1} from '../constants/Style'

const isContinuous = (input: string) => CONTINUOUS_VARS.includes(input)
const x = (pair: [any, any]) => pair[0]
const y = (pair: [any, any]) => pair[1]
const rawBy = (trees, input) => trees.map(t => t[input])
const uniq = (arr) => _.uniq(arr)
const uniqBy = (trees, input) => _.uniq(rawBy(trees, input))
const toCountPairs = (vals: string[] | number[] | null):any[][] => (_.toPairs(_.countBy(vals)))

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

const sortPairsByFrequency = pairs => pairs.sort((a, b) => (y(b) - y(a)))
const getBinSize = (pairs, interval) => Math.ceil(_.max(pairs.map(p => +x(p))) / interval)
const isInBin = (val, bin, bins) => (_.sortedIndex(bins, val) === bins.indexOf(bin))

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
  let chartTimer = setTimeout(() => { throw new Error('timeout') }, 3000)
  const data = getInput1Sseries(trees, input1, input2, binData)
  const drilldownData = getInput2Series(trees, input1, input2)
  console.timeEnd('IChart')
  global.clearTimeout(chartTimer)
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


