import {ITree} from './types/ITree'

import {DGREEN1, LGREY1} from './constants/Style'

import {
  DrilldownSeries,
  NumPair,
  Pair,
  PrimarySeries,
  PrimarySeriesData,
  Store,
  X
} from './types/Chart'

import {
  binnedPairs,
  bins,
  binSize,
  filterByBin,
  filterByCat,
  isContinuous,
  isNumVar,
  mapToDrilldown,
  mapToPrimaryChart,
  max,
  rawBy,
  reducedPairs,
  sortPairsByFrequency,
  toCountPairs,
  x
} from '../util'


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
    const input = isPrimary ? this.input1 : this.input2
    this.rawVals = rawBy(this.trees, input)
    this.rawPairs = <Pair[]>toCountPairs(this.rawVals, isNumVar(input))
    isContinuous(input) ? this._linearSeries() : this._nomSeries()
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
  primarySerie: PrimarySeries
  ids: X[]

  constructor(public trees: ITree[], public config: Store) {
    super(trees, config, true)
    const name = !this.hasDrilldown ? `Trees by ${this.input1}` : `Trees by ${this.input1} » ${this.input2}`
    const data: PrimarySeriesData[] = mapToPrimaryChart(this.seriePairs, this.input2)
    this.ids = this.seriePairs.map(p => x(p))
    this.primarySerie = {
      name,
      color: DGREEN1,
      data
    }
  }
}

class DrillDown extends Series {
  drilldownSerie: DrilldownSeries
  constructor(public trees: ITree[], public config: Store, id: X) {
    super(trees, config, false)
    this.drilldownSerie = mapToDrilldown(id, this.seriePairs)
  }
}

class ChartTreeParser {
  primarySerie: PrimarySeries
  drilldownSeries: DrilldownSeries[]
  config: DataStore

  constructor(public trees, public nBins, public input1, public input2) {
    this.config = new DataStore(nBins, input1, input2)
    this.primarySerie = null
    this.drilldownSeries = null

    const primary = new Primary(this.trees, this.config)
    this.primarySerie = primary.primarySerie
    const {ids} = primary

    if (this.config.hasDrilldown) {
      const filterfn = this.config.contInput1 ? filterByBin : filterByCat
      this.drilldownSeries = ids.map(id => {
        const treeGroup = filterfn(this.trees, this.input1, ids, id)
        if (!treeGroup.length) return null
        let drillDown = new DrillDown(treeGroup, this.config, id)
        return drillDown.drilldownSerie
      })
        .filter(v => !!v)
    }
  }
}

export function HighChart (trees: ITree[], nBins = 20, input1: string, input2?: string | null): any {
  console.time('HighChart')
  const data = new ChartTreeParser(trees, nBins, input1, input2)
  console.timeEnd('HighChart')
  return {
    chart: { type: 'column', backgroundColor: LGREY1 },
    title: { text: 'Trees'},
    xAxis: {
      title: { text: data.primarySerie.name },
      type: 'category',
    },
    yAxis: {
      min: 0,
      title: { text: 'Frequency' }},
    series: [
      data.primarySerie
    ],
    drilldown: {
      series: data.drilldownSeries
    },
    plotOptions: { series: { cropThreshold: 300 } }
  }
}


