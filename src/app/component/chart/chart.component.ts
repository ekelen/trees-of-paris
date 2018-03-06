import { Component, AfterViewInit, OnInit, Input, OnChanges  } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import * as math from "mathjs"

import * as assert from "assert"
import { ITree } from '../../model/ITree'
import { IChart } from '../../model/IChart'

import { TreesService } from '../../service/trees.service';

import { Chart } from 'angular-highcharts';

import * as _ from 'lodash'
import * as __ from '../../util'

@Component({
  selector: 'app-chart',
  template: `

  <div class="graph-container">
  <div [chart]=chart></div>
  <app-chart-control
  (indVarUpdated)="handleIndVarUpdated($event)"
  (subVarUpdated)="handleSubVarUpdated($event)"
  (toggleShowAllIndVar)="handleToggleIndVarShowAll($event)"
  [indVar]=indVar [subVar]=subVar
  [indVarShowAll]=indVarShowAll></app-chart-control>
  </div>
`
})
export class ChartComponent implements OnInit, OnChanges {
  @Input() trees: ITree[]
  chartOptions: any = {}
  chart: any


  indVar: string
  subVar: string

  indVarShowAll = true

  constructor(
    private treesService: TreesService ) {
      this.indVar = 'commonName' // common name by default
      this.subVar = null // no drilldown by default
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this._redrawChart()
  }

  handleIndVarUpdated(indVar) {
    this.indVar = indVar
    this._redrawChart()
  }

  handleSubVarUpdated(subVar) {
    this.subVar = subVar
    this._redrawChart()
  }

  handleToggleIndVarShowAll(showAll: boolean) {
    this.indVarShowAll = showAll
    if (showAll) { return this._redrawChart() }
    const { indVar } = this

    const popularKeys =
    __.sortUniqs(this.trees, indVar)
    .slice(0, 20)
    .map(v => v[0])

    const filteredData = this.trees.filter(t => popularKeys.includes(t[indVar]))
    this.chartOptions = IChart(indVar, filteredData, this.subVar)
    this.chart = new Chart(this.chartOptions)
  }

  private _redrawChart() {
    this.chartOptions = IChart(this.indVar, this.trees, this.subVar)
    this.chart = new Chart(this.chartOptions);
  }
}
