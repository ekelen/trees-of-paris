import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { ParamsService } from './params.service'

import { ITree } from '../model/types/ITree'

import * as _ from 'lodash'
import * as __ from '../util'
import {environment} from '../../environments/environment'

const baseTreeUrl = window.location.href + 'api/trees'

@Injectable()
export class TreesService {
  private _trees: ITree[] = []
  private _trees$: BehaviorSubject<ITree[]>
  trees$: Observable<ITree[]>
  loading: boolean = false

  constructor(
    private http: HttpClient,
    private paramsService: ParamsService) {
      this._trees$ = new BehaviorSubject<ITree[]>(this._trees)
      this.trees$ = this._trees$.asObservable()
  }

  private _loadFromLocal = () => {
    if (localStorage.getItem('trees')) {
      console.log('loading trees from local')
      this._trees = JSON.parse(localStorage.getItem('trees'))
      this._trees$.next(this._trees)
      this.loading = false
    }
  }

  private _loadMock = () => {
        this._trees = environment.mockTrees
        this._trees$.next(environment.mockTrees)
        this.loading = false
  }

  public getTrees = (): void => {

    let params = this.paramsService.serverFriendlyParams
    // console.log('2. server friendly params: ', this.paramsService.serverFriendlyParams)
    this.loading = true

    if (environment.useMyTestData && environment.useMockData) { return this._loadMock() }
    if (environment.useFromLocal) {
      this._loadFromLocal()
      if (this._trees.length) { return }
    }

    // TODO: Better error handling
    if (!params) throw new Error('Need location-based parameters (otherwise dataset is too large).')
    let httpParams = new HttpParams()
    httpParams = httpParams.append('limit', '80000')
    for (let k of Object.keys(params)) {
      httpParams = httpParams.append(k, _.toString(params[k]))
    }
    // console.log('Params before search: ', httpParams)
    this.http.get<ITree[]>(baseTreeUrl + '/search', {params: httpParams})
    .subscribe(
      trees => {
        this.loading = false
        // console.log(`- Got ${trees.length} trees from server.`)
        this._trees = [...trees]
        this._trees$.next([...trees])
        if (trees.length < 10000 && !environment.useFromLocal) { localStorage.setItem('trees', JSON.stringify(trees)) }
      },
      err => {
        this.loading = false
        console.error('Server error: ' + err.message || 'Unknown error.')
      }
    )
  }
}
