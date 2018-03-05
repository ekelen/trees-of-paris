import { Component, OnInit, OnDestroy } from '@angular/core'

@Component({
  selector: 'app-loading',
  template: `
  <p>
    Loading<span *ngFor="let loop of loops"> . </span>
  </p>`
})
export class LoadingComponent implements OnInit, OnDestroy {
  timer: any
  loops: number[]

  constructor() {
  }

  ngOnInit() {
    let i = 1
    this.timer = setInterval(() => {
      this.loops = Array(i % 10).fill('.')
      i = i === 10 ? 1 : i + 1
    }, 400)
  }

  ngOnDestroy() {
    clearInterval(this.timer)
  }

}
