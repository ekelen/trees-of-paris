import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core'
import { Router, ActivatedRoute, ParamMap } from '@angular/router'

import { TreesService } from './trees.service'
import { MapService } from '../map/map.service'
import { LoadingComponent } from '../loading/loading.component'
import { ParamsService, IParams } from '../service/params.service'

import { ITree } from '../model/ITree'
import { ChartFactory } from '../model/Chart'
import { IError } from '../model/Error'

import * as _ from 'lodash'
import * as __ from '../util'

@Component({
  selector: 'app-trees',
  template: `
  <div class="container mt-5 pt-5">
  <div *ngIf="paramError" class="jumbotron">{{ errorMessage }}</div>
  <app-loading *ngIf=treeService.loading></app-loading>
  <app-chart *ngIf="trees && trees.length" [trees]=trees></app-chart>
  </div>
  `
})

export class TreesComponent implements OnInit, AfterViewInit, OnDestroy {
  trees: ITree[] = []
  subscriptions: any = []
  paramError = false
  errorMessage = ''
  loading = false

  constructor(
    private treeService: TreesService,
    private mapService: MapService,
    private paramsService: ParamsService,
    private router: Router ) {

  }

  private _redirectWithError = (message: string) => {
    this.paramError = true
    this.errorMessage = message
    window.setTimeout(() => this.router.navigate(['/map']), 2500)
  }

  ngOnInit() {
    let subs: any = []
    const { treeService, paramsService } = this
    if (!paramsService.params.has_any_location)
      return this._redirectWithError("You must choose a location. Redirecting...")

    subs.push(treeService.trees$.subscribe(
      trees => {
        this.trees = trees
        this.loading = false
      },
      err => {
        console.log(err.message)
        this.loading = false
      }
    ))

    treeService.getTrees()
    subs.forEach(sub => this.subscriptions.push(sub))
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

}
