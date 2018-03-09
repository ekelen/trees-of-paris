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
  trees: ITree[]|any[],
  nBins: number,
  input1: Input,
  input2: Input
}

const x = (pair: Pair): X => pair[0]
const y = (pair: Pair): Y => pair[1]
const rawBy = (trees: ITree[], input: Input): X[] => trees.map(t => t[input])
const toCountPairs = (vals: X[] | null): Pair => _.toPairs(_.countBy(vals))
const sortPairsByFrequency = (pairs: Pair[]): Pair[] => pairs.sort((a, b) => (y(b) - y(a)))

const max = (vals: number[]): number => _.max(vals)
const isInBin = (val: number, bin: number, bins: number[]): boolean => (_.sortedIndex(bins, val) === bins.indexOf(bin))
const binSize = (max: number, nBins: number): number => Math.ceil(max / nBins)
const bins = (nBins: number, binSize: number): number[] => Array.from(new Array(nBins), (v, i) => ((i + 1) * binSize))
const binnedPairs = (rawPairs: NumPair[], bins: number[]): NumPair[] => rawPairs.map(p => {
  const i = _.sortedIndex(bins, +x(p))
  return <NumPair>[bins[i], y(p)]
})
const mapToPrimaryChart = (pairs: Pair[], input2: Input) => pairs.map(p => ({y: y(p), name: _.toString(x(p)), drilldown: input2 ? _.toString(x(p)) : null}))
const reducedPairs = (bins: number[], binnedPairs: NumPair[]): NumPair[] => (
  bins.map(b => {
    const binContents = binnedPairs
      .filter(p => +x(p) === b)
      .map(p => y(p))
      .reduce((acc, cur) => acc + cur, 0)
    return<NumPair>[b, binContents]
  })
)

const filterByCat = (trees, input, id) => trees.filter(t => t[input] === id)
const filterByBin = (trees, input, bins, bin) => trees.filter(t => isInBin(+t[input], bin, bins))

function setIds() {
  return ('bins' in this) ? this.bins : this.cats
}

export class DataStore implements Store {
  public contInput1
  public contInput2

  constructor(public trees: ITree[]|any[], public nBins: number, public input1: string, public input2: string) {
    this.contInput1 = isContinuous(input1)
    this.contInput2 = isContinuous(input2)
  }
}

function Series(trees, nBins, input1, input2, input) {
  console.log('Series:', this)
  this.input = input
  this.rawVals = rawBy(trees, input)
  this.rawPairs = toCountPairs(this.rawVals)
}

function LinearSeries(trees, nBins, input1, input2, input) {
  Series.call(this, ...Array.from(arguments), input1)
  console.log('LinearSeries:', this)
  this.max = max(this.rawVals)
  this.binSize = binSize(this.max, nBins)
  this.bins = bins(nBins, this.binSize)
  this.binnedPairs = binnedPairs(this.rawPairs, this.bins)
  this.seriePairs = reducedPairs(this.bins, this.binnedPairs)
}

function NomSeries(trees, nBins, input1, input2, input) {
  Series.call(this, ...Array.from(arguments))
  this.cats = _.uniq(this.rawPairs.map(p => x(p)))
  this.seriePairs = sortPairsByFrequency(this.rawPairs)
}

function PrimarySeries(store: DataStore) {
  const { trees, nBins, input1, input2, contInput1 } = store
  console.log('trees in primarySeries', trees)
  assert(trees.length > 0, 'trees have no length')
  contInput1 ?
    LinearSeries.call(this, trees, nBins, input1, input2, input1) :
    NomSeries.call(this, trees, nBins, input1, input2, input1)
  this.data = mapToPrimaryChart(this.seriePairs, input2)
  this.ids = !this.input2 ? null : setIds.call(this)
}


// function getDrilldown(id: number|string) {
//   const treeGroup = filterByBin(this.trees, this.input1, this.bins, id)
//   let serieData
//   if (treeGroup.length) {
//     let serie = this.contInput2 ? new LinearSeries(treeGroup, this.nBins, this.input1, this.input2, this.input2)  :
//       new NomSeries(treeGroup, this.nBins, this.input1, this.input2, this.input2)
//     serieData = serie.seriePairs
//   }
//   return {
//     data: serieData,
//     id: id
//   }
// }
//
// function getNomDrilldown(id: string) {
//   const treeGroup = filterByCat(this.trees, this.input1, id)
//   let serieData
//   if (treeGroup.length) {
//     let serie = this.contInput2 ? new LinearSeries(treeGroup, this.nBins, this.input1, this.input2, this.input2)  :
//       new NomSeries(treeGroup, this.nBins, this.input1, this.input2, this.input2)
//     console.log(serie)
//     serieData = serie.seriePairs
//   }
//   return !treeGroup.length ? null :
//     {
//       data: serieData,
//       id: id
//     }
// }
//
// function sortDrilldown() {
//   if (this.contInput1) {
//     return this.ids.map(id => getDrilldown.call(this, +id))
//   }
//   else if (!this.contInput1) {
//     return this.ids.map(id => getNomDrilldown.call(this, id))
//       .filter(dat => !!dat)
//   }
// }
//
// function SecondarySeries(trees, nBins, input1, input2) {
//   if (!input2) return
//   PrimarySeries.call(this, ...Array.from(arguments))
//   const secondarySeries = sortDrilldown.call(this)
//   this.secondSeries = secondarySeries.map(dat => ({
//       id: `${dat.id}`,
//       name: `${dat.id}`,
//       data: dat.data
//     })
//   )
//
// }

export function IChart (input1: string, trees: ITree[], input2?: string | null): any {
  console.time('IChart')
  const myData = new DataStore(trees, 20, input1, input2)
  console.log(trees)
  const primarySeries = new PrimarySeries(myData)
  console.log(primarySeries.data)
  // const binData = new Bin(trees, 20)
  // let chartTimer = setTimeout(() => { throw new Error('timeout') }, 3000)
  // const data = getInput1Sseries(trees, input1, input2, binData)
  // const drilldownData = getInput2Series(trees, input1, input2)
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
        data: primarySeries.data,
      }
    ],
    drilldown: {
        series: null
    },
    plotOptions: { series: { cropThreshold: 300 } }
  }
}


