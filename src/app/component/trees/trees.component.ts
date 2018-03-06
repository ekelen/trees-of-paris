import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core'

import { TreesService } from '../../service/trees.service'
import { MapService } from '../../service/map.service'
import { LoadingComponent } from '../loading/loading.component'
import { ParamsService, IParams } from '../../service/params.service'

import { ITree } from '../../model/ITree'
import { IChart } from '../../model/IChart'
import { IError } from '../../model/IError'

import * as _ from 'lodash'
import * as __ from '../../util'
import {BehaviorSubject} from 'rxjs/BehaviorSubject'

@Component({
  selector: 'app-trees',
  template: `
  <div class="container mt-5 pt-5">
  <div *ngIf="paramError" class="jumbotron">{{ errorMessage }}</div>
  <app-loading *ngIf=treeService.loading></app-loading>
    <p *ngIf="!treeService.loading">There are {{trees.length}} valid trees
      <span *ngIf="coordinates">within 250m of where you live. <span *ngIf="viewChart" class="linkStyle" (click)="goClosest()">See more »</span></span>
      <span *ngIf="!coordinates">in your arrondissement</span></p>
  <app-explore-closest *ngIf="!treeService.loading && !noTreesFound && hasCoords && !viewChart" 
                       [trees]=trees 
                       [coordinates]=coordinates
                        (goChart)="onGoChart()"></app-explore-closest>
  <app-chart *ngIf="!treeService.loading && !noTreesFound && viewChart" [trees]=trees></app-chart>
  </div>
  `
})

export class TreesComponent implements OnInit, AfterViewInit, OnDestroy {
  trees: ITree[] = []
  noTreesFound = true

  subscriptions: any = []
  paramError = false
  errorMessage = ''

  hasCoords = false
  coordinates: [number, number] = null
  viewChart = true

  constructor(
    public treeService: TreesService,
    private paramsService: ParamsService ) {

  }

  ngOnInit() {
    let subs: any = []
    const { treeService, paramsService } = this

    subs.push(treeService.trees$.subscribe(
      trees => {
        this.trees = trees
        this.noTreesFound = !trees.length
      },
      err => {
        console.log(err.message)
        this.noTreesFound = true
      }
    ))

    subs.push(paramsService.params$.subscribe(
      params => {
        this.hasCoords = params.search_choice === 'by_coordinates' && !!params.user_coordinates
        this.coordinates = params.user_coordinates
      },
      err => {
        console.log(err.message)
      }
    ))

    treeService.getTrees()
    subs.forEach(sub => this.subscriptions.push(sub))
  }

  public goClosest = () => {
    this.viewChart = false
  }

  public onGoChart = () => {
    this.viewChart = true
  }

  ngAfterViewInit() { }

  // TODO: Add this everywhere
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

}
