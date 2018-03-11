import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core'
import {ITree} from '../../model/types/ITree'
import {HighChart} from '../../model/HighChart'

import {TreesService} from '../../service/trees.service'

import {Chart} from 'angular-highcharts'
import {isContinuous, sortUniqs} from '../../util'
import {environment} from '../../../environments/environment'
import {InputLabel} from '../../model/types/Chart'

@Component({
  selector: 'app-chart',
  template: `

    <div class="graph-container">
      <div [chart]=chart></div>
      <app-chart-control
        (updatePrimVar)="onUpdateInput1($event)"
        (updateDrilldownVar)="onUpdateInput2($event)"
        (filterShowAllPrimaryVar)="handleToggleIndVarShowAll($event)"
        [input1]="input1" [input2]="input2"
        [primaryShowAll]="input1showAll"></app-chart-control>
    </div>
  `
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() trees: ITree[]
  chartOptions: any = {}
  chart: any

  input1: InputLabel
  input2: InputLabel

  input1showAll = true

  constructor(
    private treesService: TreesService ) {
    if (environment.useMyTestChart) {
      this.input1 = environment.myTestChart.input1
      this.input2 = environment.myTestChart.input2
    } else {
      this.input1 = 'commonName' // common name by default
      this.input2 = null // no drilldown by default
    }
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this._redrawChart()
  }

  ngOnDestroy() {
  }

  onUpdateInput1(newInput1) {
    this.input1 = newInput1
    this._redrawChart()
  }

  onUpdateInput2(newInput2) {
    this.input2 = newInput2
    this._redrawChart()
  }

  handleToggleIndVarShowAll(showAll: boolean) {
    this.input1showAll = showAll
    if (showAll || isContinuous(this.input1)) { return this._redrawChart() }
    const { input1, input2 } = this

    const popularKeys =
    sortUniqs(this.trees, input1)
    .slice(0, 19)
    .map(v => v[0])

    const filteredData = this.trees.filter(t => popularKeys.includes(t[input1]))
    this.chartOptions = HighChart(filteredData, 20, input1, input2)
    this.chart = new Chart(this.chartOptions)
  }

  private _redrawChart() {
    this.chartOptions = HighChart(this.trees, 20, this.input1, this.input2)
    this.chart = new Chart(this.chartOptions);
  }


}
