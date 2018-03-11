import { Component, OnInit } from '@angular/core';
import { MapService } from './service/map.service'
import { ParamsService } from './service/params.service'

import * as _ from 'lodash'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'Trees of Paris';
  params: any = {}

  constructor(
    public paramsService: ParamsService) {}

  ngOnInit() {
    this.paramsService.params$.subscribe(
      params => this.params = {...params}
    )
  }

  public changeLocation() {
    this.paramsService.toggleConfirmed(false)
  }
}
