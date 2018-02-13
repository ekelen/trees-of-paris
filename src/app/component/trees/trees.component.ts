import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core'

import { TreesService } from '../../service/trees.service'
import { MapService } from '../../service/map.service'
import { LoadingComponent } from '../loading/loading.component'
import { ParamsService, IParams } from '../../service/params.service'

import { ITree } from '../../model/ITree'
import { ChartFactory } from '../../model/Chart'
import { IError } from '../../model/Error'

import * as _ from 'lodash'
import * as __ from '../../util'

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

  constructor(
    public treeService: TreesService,
    public mapService: MapService,
    private paramsService: ParamsService ) {

  }

  ngOnInit() {
    let subs: any = []
    const { treeService, paramsService } = this

    subs.push(treeService.trees$.subscribe(
      trees => {
        this.trees = trees
      },
      err => {
        console.log(err.message)
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
