import { Component, OnInit } from '@angular/core';

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
    <p class="lead">
      <a class="btn btn-primary btn-lg" [routerLink]="['/map']" role="button">Go</a>
    </p>
    </div>
    </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  imgUrl = 'assets/img/jace-grandinetti_orig_g2fycc_c_scale,w_2800.jpg'
  loading: boolean = true

  constructor() { }

  onLoad() {
    // Test lazy loading
    window.setTimeout(() => this.loading = false, 0)
  }

  ngOnInit() {
  }



}
