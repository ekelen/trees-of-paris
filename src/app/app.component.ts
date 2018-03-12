import {Component, OnInit} from '@angular/core'
import {ParamsService} from './service/params.service'
import {IParams, SearchKind} from './model/types/IParams'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'Trees of Paris';
  params: IParams = null
  searchKind = SearchKind

  constructor(
    public paramsService: ParamsService) {
    this.searchKind = SearchKind
  }

  ngOnInit() {
    this.paramsService.params$.subscribe(
      params => {
        this.params = {...params}
      }
    )
  }

  public changeLocation() {
    this.paramsService.toggleConfirmed(false)
  }
}
