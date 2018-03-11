import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core'

import {INPUTS} from '../../model/constants/Visualization'
import {InputLabel} from '../../model/types/Chart'

@Component({
  selector: 'app-chart-control',
  template: `
    <div class="d-flex flex-row pt-2 mt-2">

      <div class="p-2">Input variable:</div>
      <select class="p-2" [ngModel]="input1" (ngModelChange)="onChangeIndvar($event)"
              name="indVar">
        <option *ngFor="let i of input1opts" [value]=i>{{ i }}</option>
      </select>

      <div class="form-check form-check-inline ml-1">
        <input
          class="form-check-input"
          type="checkbox"
          name="inlineRadioOptions"
          [checked]="primaryShowAll"
          (click)="toggleIndVarShowAll($event)">Show All
      </div>

      <div class="p-2">Drilldown by:</div>
      <select class="p-2" [ngModel]="input2" (ngModelChange)="onChangeSubVar($event)"
              name="subVar">
        <option *ngFor="let s of input2opts" [value]=s>{{ s }}</option>
      </select>
      <div *ngIf="input2" class="p-2 text-success">Click on any bar on the graph to drill down
        data!
      </div>

    </div>
  `,
  styles: []
})

export class ChartControlComponent implements OnInit, OnChanges {
  input1opts: InputLabel[]
  input2opts: InputLabel[]

  @Input() input1: InputLabel
  @Input() input2: InputLabel
  @Input() primaryShowAll: boolean

  @Output() updatePrimVar: EventEmitter<any> = new EventEmitter();
  @Output() updateDrilldownVar: EventEmitter<any> = new EventEmitter();
  @Output() filterShowAllPrimaryVar: EventEmitter<any> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.input1opts = <InputLabel[]>INPUTS.filter(v => v !== this.input2)
    this.input2opts = <InputLabel[]>INPUTS.filter(v => v !== this.input1)
  }

  onChangeIndvar(e) {
    this.updatePrimVar.emit(e)
  }

  onChangeSubVar(e) {
    this.updateDrilldownVar.emit(e)
  }

  toggleIndVarShowAll = (e) => {
    e.target.disabled = "true"
    window.setTimeout(() => e.target.disabled = false, 1500);
    let showAll = e.target.checked
    this.filterShowAllPrimaryVar.emit(showAll)
  }

}
