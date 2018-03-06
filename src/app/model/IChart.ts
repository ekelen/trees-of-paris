import * as _ from "lodash"
import * as __ from "../util"
import * as assert from "assert"

import {ITree} from './ITree'
import {SCALAR_VARS} from '../constants/Data'
import {DGREEN1, LGREEN1, LGREY1} from '../constants/Style'

function sortDataByFrequency(pairs) {
  return pairs.sort((a, b) => {
    return b[1] - a[1]
  })
}

function getScalarPairs(pairs, interval = 20) {
  const y = (pair) => pair[1]
  const x = (pair) => +pair[0]
  const binSize = _.max(pairs.map(p => x(p))) / interval
  console.log('binSize', binSize)

  const bins = Array.from(new Array(interval), (v, i) => (i + 1) * binSize)
  console.log('bins', bins)

  const binnedPairs = pairs.map(p => {
    const binMax = Math.ceil(binSize * Math.round(x(p) / interval))
    return [binMax, y(p)]
  })
  // console.log(__.toCountPairs(binnedPairs.map(p => y(p))))
  return __.toCountPairs(binnedPairs.map(p => y(p))).sort((a, b) => x(a) - x(b))
}

function getScalar(indVar: string) {
  return (SCALAR_VARS.includes(indVar))
}

function getCategories(uniqVals, indVar) {
  return getScalar(indVar) ? null : uniqVals
}

function getTickInterval(vals, indVar) {
  return getScalar(indVar) ? (_.max(vals)) / 20 : undefined
}

function getIndSerieData(rawValues, indVar, subVar = null) {
  const pairs = __.toCountPairs(rawValues)
  //console.log(pairs)
  const serieData = getScalar(indVar) ? getScalarPairs(pairs) : sortDataByFrequency(pairs)
  return serieData
    .map(p => {
    return {y: p[1], name: p[0], drilldown: subVar ? p[0] : null}
  })
}

function getSerieDrillDown(treeData: ITree[], indVar, subVar, uniqVals) {
  const subvalsById = (id) => (treeData.filter(t => t[indVar] === id).map(t => t[subVar]))
  const serieData = uniqVals.map(id => {
    const pairs = __.toCountPairs(subvalsById(id))
    const serieData = getScalar(subVar) ? getScalarPairs(pairs) : pairs
    const seriesObj = {
      id: _.toString(id),
      name: `${id}`,
      data: serieData
    }
    return seriesObj
  })
  assert(serieData.length > 0, 'No serie data.')
  return serieData
}

export function IChart (indVar: string, data: ITree[], subVar?: string | null): any {
  assert(data.length, 'data has no length.')

  // Is it better to carry these values around, or recalculate each time?
  const rawValues = _.values(data.map(t => t[indVar]))
  const uniqVals = _.uniq(rawValues)

  return {
    // categories: (data) => getCategories(data, indVar),
    chart: { type: 'column', backgroundColor: LGREY1 },
    title: { text: 'Trees'},
    xAxis: {
      title: { text: subVar ? `${indVar} > ${subVar}` : indVar },
      // minTickInterval: getTickInterval(uniqVals, indVar),
      type: 'category',
    },
    yAxis: {
      min: 0,
      title: { text: 'Count' }},
    series: [
      {
        name: 'All trees',
        color: DGREEN1,
        data: getIndSerieData(rawValues, indVar, subVar)
      }
    ],
    drilldown: {
        series: getSerieDrillDown(data, indVar, subVar, uniqVals)
    },
    plotOptions: { series: { cropThreshold: 300 } }
  }
}


