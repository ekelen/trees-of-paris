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
          [checked]="input1showAll"
          (click)="toggleShowAll($event)">Show All
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
  @Input() input1showAll: boolean

  @Output() updateInput1: EventEmitter<any> = new EventEmitter();
  @Output() updateInput2: EventEmitter<any> = new EventEmitter();
  @Output() updateShowAll: EventEmitter<any> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.input1opts = <InputLabel[]>INPUTS.filter(v => v !== this.input2)
    this.input2opts = <InputLabel[]>INPUTS.filter(v => v !== this.input1)
  }

  onChangeIndvar(e) {
    this.updateInput1.emit(e)
  }

  onChangeSubVar(e) {
    this.updateInput2.emit(e)
  }

  toggleShowAll = (e) => {
    e.target.disabled = "true"
    window.setTimeout(() => e.target.disabled = false, 1500);
    let showAll = e.target.checked
    this.updateShowAll.emit(showAll)
  }

}
