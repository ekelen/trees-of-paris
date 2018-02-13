import { Component, OnInit } from '@angular/core';
import { MapService } from './map/map.service'
import { ParamsService } from './service/params.service'
import { Routes, Router } from '@angular/router';

import * as _ from 'lodash'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Trees of Paris';
  params:any = {}

  constructor(
    private paramsService: ParamsService,
    private router: Router) {}

  ngOnInit() {
    this.paramsService.params$.subscribe(
      params => this.params = {...params}
    )
  }
}
