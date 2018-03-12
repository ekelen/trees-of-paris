import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core'

import {TreesService} from '../../service/trees.service'
import {ParamsService} from '../../service/params.service'

import {ITree} from '../../model/types/ITree'
import {SearchKind} from '../../model/types/IParams'

@Component({
  selector: 'app-trees',
  template: `
  <div class="container mt-5 pt-5">
  <div *ngIf="paramError" class="jumbotron">{{ errorMessage }}</div>
  <app-loading *ngIf=treeService.loading></app-loading>
    <p *ngIf="!treeService.loading">There are {{trees.length}} valid trees
      <span *ngIf="hasCoords">within 250m of where you live. 
        <span *ngIf="viewChart && hasCoords && trees.length" 
              class="linkStyle" 
              (click)="goClosest()">See more »</span>
      </span>
      <span *ngIf="!hasCoords">in your arrondissement.</span>
      <span *ngIf="!trees.length" class="linkStyle">« Try new location</span></p>
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
        this.hasCoords = params.search_choice === SearchKind.by_coordinates && !!params.user_coordinates
        if (this.hasCoords) this.coordinates = params.user_coordinates
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
