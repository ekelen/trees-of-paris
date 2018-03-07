import { Component, AfterViewInit, OnInit, Input, OnChanges, OnDestroy  } from '@angular/core';

import * as assert from "assert"
import { ITree } from '../../model/ITree'
import { IChart } from '../../model/IChart'

import { TreesService } from '../../service/trees.service';

import { Chart } from 'angular-highcharts';

import * as _ from 'lodash'
import * as __ from '../../util'
import {CONTINUOUS_VARS} from '../../constants/Visualization'
import {environment} from '../../../environments/environment'

@Component({
  selector: 'app-chart',
  template: `

    <div class="graph-container">
      <div [chart]=chart></div>
      <app-chart-control
        (indVarUpdated)="handleIndVarUpdated($event)"
        (subVarUpdated)="handleSubVarUpdated($event)"
        (toggleShowAllIndVar)="handleToggleIndVarShowAll($event)"
        [indVar]=input1 [subVar]=input2
        [indVarShowAll]=indVarShowAll></app-chart-control>
    </div>
  `
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() trees: ITree[]
  chartOptions: any = {}
  chart: any

  input1: string
  input2: string

  indVarShowAll = true

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

  handleIndVarUpdated(indVar) {
    this.input1 = indVar
    this._redrawChart()
  }

  handleSubVarUpdated(subVar) {
    this.input2 = subVar
    this._redrawChart()
  }

  handleToggleIndVarShowAll(showAll: boolean) {
    this.indVarShowAll = showAll
    if (showAll || CONTINUOUS_VARS.includes(this.input1)) { return this._redrawChart() }
    const { input1 } = this

    const popularKeys =
    __.sortUniqs(this.trees, input1)
    .slice(0, 19)
    .map(v => v[0])

    const filteredData = this.trees.filter(t => popularKeys.includes(t[input1]))
    this.chartOptions = IChart(input1, filteredData, this.input2)
    this.chart = new Chart(this.chartOptions)
  }

  private _redrawChart() {
    this.chartOptions = IChart(this.input1, this.trees, this.input2)
    this.chart = new Chart(this.chartOptions);
  }


}
