import { Component, OnInit } from '@angular/core';
import { ParamsService } from '../../service/params.service'

@Component({
  selector: 'app-home',
  template: `
  <div class="home-container" [ngStyle]="!loading && {'background-image': 'url(' + imgUrl + ')'}">
  <img (load)="onLoad()" [src]=imgUrl />
  <div class="jumbotron home-jumbotron">
    <h1 class="display-3">A forest grows in Paris!</h1>
    <p class="lead">Learn about the thousands of trees outside your door.</p>
    <hr class="my-4">
    <p>To start, search by address or arrondissement.</p>
      <div class="btn btn-primary btn-lg" role="button" (click)="start($event)">Go</div>
    </div>
    </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  imgUrl = 'assets/img/jace-grandinetti_orig_g2fycc_c_scale,w_2800.jpg'
  loading: boolean = true

  constructor(private paramsService: ParamsService) { }

  onLoad() {
    // Change to test lazy loading
    window.setTimeout(() => this.loading = false, 0)
  }

  ngOnInit() {
  }

  public start() {
    this.paramsService.toggleFirstVisit(false)
  }



}
