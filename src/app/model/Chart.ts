import * as _ from "lodash"
import * as __ from "../util"

import { Options } from "angular-highcharts"
import * as assert from "assert"

import { ITree } from './ITree'

function getScalar(indVar: string) {
  return (["height", "circumference"].includes(indVar))
}

function getUniqueVals (data, indVar) {
  assert(data.length, 'data has no length')
  assert(indVar, 'no inVar provided')
  return _.uniq(data.map(t => t[indVar]))
}

function getCategories(uniqVals, indVar) {
  return getScalar(indVar) ? null : uniqVals
}

function getMinRange(vals, indVar) {
  return getScalar(indVar) ? (_.max(vals) - _.min(vals)) / 10 : null
}

function getSerieData(rawValues, subVar = null) {
  return __.toCountPairs(rawValues).map(p => {
    return {y: p[1], name: p[0], drilldown: subVar ? p[0] : null}
  })
}

function getSerieDrillDown(treeData: ITree[], indVar, subVar, uniqVals) {
  const subvalsById = (id) => (treeData.filter(t => t[indVar] === id).map(t => t[subVar]))
  const serieData = uniqVals.map(id => {
    const pairs = __.toCountPairs(subvalsById(id))
    const seriesObj = {
      id: _.toString(id),
      name: `${id}`,
      data: pairs
    }
    return seriesObj
  })
  assert(serieData.length > 0, 'No serie data.')
  return serieData
}

export function ChartFactory (indVar: string, data: ITree[], subVar?: string | null): Options {
  assert(data.length, 'data has no length.')

  // Is it better to carry these values around, or recalculate each time?
  const rawValues = _.values(data.map(t => t[indVar]))
  const uniqVals = _.uniq(rawValues)
  return {
    // categories: (data) => getCategories(data, indVar),
    chart: { type: 'column'},
    title: { text: 'Trees'},
    xAxis: {
      title: { text: subVar ? `${indVar} > ${subVar}` : indVar },
      minRange: getMinRange(uniqVals, indVar),
      type: 'category',
      //categories: getCategories(uniqVals, indVar)
    },
    yAxis: {
      min: 0,
      title: { text: 'Count' }},
    series: [
      {
        name: 'All trees',
        data: getSerieData(rawValues, subVar)
      }
    ],
    drilldown: {
        series: getSerieDrillDown(data, indVar, subVar, uniqVals)
    }
  }
}

// CONSTANTS

export const INDVARS:string[] = [
  'species', 'genus', 'commonName', 'fullName', 'street',
  'arrondissement', 'distance', 'usage', 'circumference', 'height']
