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

type PrimarySeries = {
  name: string,
  color?: string,
  data: PrimarySeriesData[]
}

type PrimarySeriesData = {
  name: string,
  y: Y,
  drilldown: string
}

type DrilldownSeries = {
  name: string,
  id: string,
  data: DrilldownSeriesData
}

type DrilldownSeriesData = Pair[]

const x = (pair: Pair): X => pair[0]
const y = (pair: Pair): Y => pair[1]
const rawBy = (trees: ITree[], input: Input): X[] => trees.map(t => t[input])
const toCountPairs = (vals: X[] | null): Pair[] => _.toPairs(_.countBy(vals))
const sortPairsByFrequency = (pairs: Pair[]): Pair[] => pairs.sort((a, b) => (y(b) - y(a)))

const max = (vals: number[]): number => _.max(vals)
const isInBin = (val: number, bin: number, bins: number[]): boolean => (_.sortedIndex(bins, val) === bins.indexOf(bin))
const binSize = (max: number, nBins: number): number => Math.ceil(max / nBins)
const bins = (nBins: number, binSize: number): number[] => Array.from(new Array(nBins), (v, i) => ((i + 1) * binSize))
const binnedPairs = (rawPairs: NumPair[], bins: number[]): NumPair[] => rawPairs.map(p => {
  const i = _.sortedIndex(bins, +x(p))
  return <NumPair>[bins[i], y(p)]
})
const mapToPrimaryChart = (pairs: Pair[], input2: Input): PrimarySeriesData[] => pairs.map(p => ({y: y(p), name: _.toString(x(p)), drilldown: input2 ? _.toString(x(p)) : null}))
const mapToDrilldown = (id: string, data: DrilldownSeriesData): DrilldownSeries => (<DrilldownSeries>{
  id: `${id}`,
  name: `${id}`,
  data: <DrilldownSeriesData> data
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
const filterByCat = (trees, input, bins, id) => trees.filter(t => t[input] === id)
const filterByBin = (trees, input, bins, bin) => trees.filter(t => isInBin(+t[input], +bin, bins))

interface Store {
  nBins: number,
  input1: Input,
  input2: Input
}

class DataStore implements Store {
  public contInput1
  public contInput2
  public hasDrilldown

  constructor(public nBins: number, public input1: string, public input2: string) {
    this.hasDrilldown = !!input2
    this.contInput1 = isContinuous(input1)
    this.contInput2 = isContinuous(input2)
  }
}

class Series extends DataStore {
  public rawVals: X[]
  public rawPairs: Pair[]

  public seriePairs: Pair[]

  constructor(public trees, public store: Store, public isPrimary: boolean) {
    super(store.nBins, store.input1, store.input2)
    this.rawVals = rawBy(this.trees, isPrimary ? this.input1 : this.input2)
    this.rawPairs = <Pair[]>toCountPairs(this.rawVals)
    this.contInput1 ? this._linearSeries() : this._nomSeries()
  }

  private _linearSeries = () => {
    const _max = max(<number[]>this.rawVals)
    const _binSize = binSize(_max, this.nBins)
    const _bins = bins(this.nBins, _binSize)
    const _binnedPairs = binnedPairs(<NumPair[]>this.rawPairs, _bins)
    this.seriePairs = reducedPairs(_bins, _binnedPairs)
  }

  private _nomSeries = () => {
    this.seriePairs = sortPairsByFrequency(this.rawPairs)
  }

}

class Primary extends Series {
  serieData: PrimarySeriesData[]
  primarySeries: PrimarySeries
  ids: Input[]

  constructor(public trees: ITree[], public config: Store) {
    super(trees, config, true)
    const name = !this.hasDrilldown ? `Trees by ${this.input1}` : `Trees by ${this.input1} » ${this.input2}`
    this.serieData = mapToPrimaryChart(this.seriePairs, this.input2)
    this.ids = this.serieData.map(dat => dat.drilldown)
    this.primarySeries = {
      name: name,
      color: LGREEN1,
      data: this.serieData
    }
  }
}

class DrillDown extends Series {
  drilldownSeriesData: DrilldownSeries
  constructor(public trees: ITree[], public config: Store, id: Input) {
    super(trees, config, false)
    this.drilldownSeriesData = mapToDrilldown(id, this.seriePairs)
  }
}

class MakeThings {
  primarySeries: PrimarySeries
  drilldownSeries: DrilldownSeries[]
  hasDrilldown: boolean
  contInput1: boolean
  contInput2: boolean
  config: DataStore
  ids: Input[]

  constructor(public trees, public nBins, public input1, public input2) {
    this.config = new DataStore(nBins, input1, input2)
  }

  public init = () => {
    this._getPrimary()
    this._getDrillDown()
  }

  private _getPrimary = () => {
    const primary = new Primary(this.trees, this.config)
    this.primarySeries = primary.primarySeries
    this.ids = primary.ids
  }

  private _getDrillDown = () => {
    if (!this.hasDrilldown || !this.ids || !this.ids.length) return
    const filterfn = this.contInput1 ? filterByBin : filterByCat
    const drilldownItems = this.ids.map((id, i) => {
      const treeGroup = filterfn(this.trees, this.input1, this.ids, id)
      let drillDown = new DrillDown(treeGroup, this.config, id)
      return <DrilldownSeries>mapToDrilldown(id, <DrilldownSeriesData>drillDown.seriePairs)
    })
    this.drilldownSeries = drilldownItems
  }

}

export function IChart (input1: string, trees: ITree[], input2?: string | null): any {
  console.time('IChart')
  const myData = new DataStore(trees, 20, input1, input2)
  const primarySeries = new PrimarySeries(myData)
  const drilldownSeries = input2 ? new DrilldownSeries(primarySeries) : null
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


