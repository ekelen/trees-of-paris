import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ITree } from '../../model/ITree'
import { INDVARS } from '../../model/IChart'

// import * as H from 'highcharts'
import { Chart } from 'angular-highcharts';

import * as _ from 'lodash'
import * as __ from '../../util'

@Component({
  selector: 'app-chart-control',
  template: `
    <div class="d-flex flex-row pt-2 mt-2">

    <div class="p-2">Input variable:</div>
    <select class="p-2" [ngModel]="indVar" (ngModelChange)="onChangeIndvar($event)" name="indVar">
      <option *ngFor="let i of indVars" [value]=i>{{ i }}</option>
    </select>

    <div class="form-check form-check-inline ml-1">
      <input
      class="form-check-input"
      type="checkbox"
      name="inlineRadioOptions"
      [checked]="indVarShowAll"
      (click)="toggleIndVarShowAll($event)">Show All
    </div>

    <div class="p-2">Drilldown by:</div>
    <select class="p-2" [ngModel]="subVar" (ngModelChange)="onChangeSubVar($event)" name="subVar">
      <option *ngFor="let s of subVars" [value]=s>{{ s }}</option>
    </select>
    <div *ngIf="subVar" class="p-2 text-success">Click on any bar on the graph to drill down data!</div>

    </div>
  `,
  styles: []
})

export class ChartControlComponent implements OnInit {
  indVars:string[]
  subVars:string[]

  @Input() indVar:string
  @Input() subVar:string
  @Input() indVarShowAll:boolean

  @Output() indVarUpdated: EventEmitter<any> = new EventEmitter();
  @Output() subVarUpdated: EventEmitter<any> = new EventEmitter();
  @Output() toggleShowAllIndVar: EventEmitter<any> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.indVars = INDVARS.filter(v => v !== this.subVar)
    this.subVars = INDVARS.filter(v => v !== this.indVar)
  }

  onChangeIndvar(e) {
    this.indVarUpdated.emit(e)
  }

  onChangeSubVar(e) {
    this.subVarUpdated.emit(e)
  }

  toggleIndVarShowAll = (e) => {
    e.target.disabled = "true"
    window.setTimeout(() => e.target.disabled = false, 1500);
    let showAll = e.target.checked
    this.toggleShowAllIndVar.emit(showAll)
  }

}
