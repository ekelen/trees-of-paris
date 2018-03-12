export type X = number | string
export type Y = number
export type InputLabel = string
export type NumPair = [number, Y]
export type Pair = [X, Y]

export type PrimarySeries = {
  name: string,
  color?: string,
  data: PrimarySeriesData[]
}
export type PrimarySeriesData = {
  name: string,
  y: Y,
  drilldown: string
}
export type DrilldownSeries = {
  name: string,
  id: string,
  data: DrilldownSeriesData
}
export type DrilldownSeriesData = Pair[]

export interface ChartPrefs {
  nBins: number,
  input1: InputLabel,
  input2: InputLabel,
  showAllPref: boolean
}
