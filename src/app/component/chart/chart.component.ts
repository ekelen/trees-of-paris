import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core'
import {ITree} from '../../model/types/ITree'
import {HighChart} from '../../model/HighChart'

import {TreesService} from '../../service/trees.service'

import {Chart} from 'angular-highcharts'
import {InputLabel} from '../../model/types/Chart'

@Component({
  selector: 'app-chart',
  template: `

    <div class="graph-container">
      <div [chart]=chart></div>
      <app-chart-control
        (updateInput1)="onUpdateInput1($event)"
        (updateInput2)="onUpdateInput2($event)"
        (updateShowAll)="toggleShowAll($event)"
        [input1]="input1" [input2]="input2"
        [input1showAll]="input1showAll"></app-chart-control>
    </div>
  `
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() trees: ITree[]
  chartOptions: any = {}
  chart: any

  input1: InputLabel
  input2: InputLabel

  input1showAll = false

  constructor(
    private treesService: TreesService ) {
      this.input1 = 'commonName' // common name by default
      this.input2 = null // no drilldown by default
  }

  ngOnInit() {
    this._redrawChart()
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

  toggleShowAll(showAll: boolean) {
    this.input1showAll = showAll
    this._redrawChart()
  }

  private _redrawChart() {
    this.chartOptions = HighChart(this.trees, 20, this.input1, this.input2, this.input1showAll)
    this.chart = new Chart(this.chartOptions);
  }


}
