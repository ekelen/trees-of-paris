import * as _ from "lodash"
import * as __ from "../util"
import * as assert from "assert"

import {ITree} from './ITree'
import {CONTINUOUS_VARS} from '../constants/Data'
import {DGREEN1, LGREEN1, LGREY1} from '../constants/Style'
import Timer = NodeJS.Timer

const isContinuous = (input: string) => CONTINUOUS_VARS.includes(input)
const x = (pair: [any, any]) => pair[0]
const y = (pair: [any, any]) => pair[1]
const rawBy = (trees, input) => trees.map(t => t[input])
const uniq = (arr) => _.uniq(arr)
const uniqBy = (trees, input) => _.uniq(rawBy(trees, input))
const sortPairsByFrequency = pairs => pairs.sort((a, b) => (y(b) - y(a)))

function getBins(pairs, interval = 20) {
  const binSize = Math.ceil(_.max(pairs.map(p => +x(p))) / interval)
  const bins = Array.from(new Array(interval), (v, i) => Math.ceil((i + 1) * binSize))
  assert(bins.length * binSize >= _.max(pairs.map(p => +x(p))), `${bins.length} (length) * binsize ${binSize} is smaller than max value.`)
  assert(isInBin(_.max(pairs.map(p => +x(p))), _.last(bins), bins), `${_.max(pairs.map(p => +x(p)))} is not in last bin ${_.last(bins)}`)
  //assert(_.max(pairs.map(p => +x(p)) > (bins.length - 2) * binSize), `max ${_.max(pairs.map(p => +x(p)))} is smaller than second-largest bin, ${bins[bins.length - 2]}`)
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
    // .sort((a, b) => x(a) - x(b)) // bins already sorted
}



function getInput1Sseries(trees, input1, input2 = null) {
  const pairs = __.toCountPairs(rawBy(trees, input1))
  const serieData = isContinuous(input1) ? reduceContinuousPairs(pairs) : sortPairsByFrequency(pairs)
  return serieData
    .map(p => {
    return {y: p[1], name: p[0], drilldown: input2 ? _.toString(p[0]) : null}
  })
}

const isInBin = (val, bin, bins) => {
  return (_.sortedIndex(bins, val) === bins.indexOf(bin))
}

function getInput2Series(trees, input1, input2) {

  console.log(`calling getInput2Series for ${input1} > ${input2}`)

  const bins = isContinuous(input1) ? getBins(__.toCountPairs(rawBy(trees, input1))) : null

  const ids = isContinuous(input1) ?
    bins :
    uniqBy(trees, input1)

  const getInput2PerInput1 = (id) => {
    return trees
      .filter(t => isContinuous(input1) ? isInBin(+(t[input1]), id, bins) : t[input1] === id)
      .map(t => t[input2])
  }

  const serieData = ids.map(id => {
    const pairs = __.toCountPairs(getInput2PerInput1(id))
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
  assert(trees.length, 'data has no length.')
  console.log(input1, input2)
  setTimeout(() => { throw new Error('timeout') }, 1000)
  const data = getInput1Sseries(trees, input1, input2)
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


