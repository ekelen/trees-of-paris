import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { HttpClient, HttpHeaders, HttpParams, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { URLSearchParams, QueryEncoder } from '@angular/http'
import { Subject }    from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as G from "geojson"
import { MapService } from './map.service'
import { ParamsService, IParams } from './params.service'

import { IError } from '../model/Error'
import { ITree } from '../model/ITree'

import * as _ from 'lodash'
import * as __ from '../util'

const baseTreeUrl = "http://localhost:8080/api/trees"
const file = "./assets/data/arrdts_v2.json"

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

  private _loadFromLocal = ():boolean => {
    if (localStorage.getItem('trees')) {
      this._trees = JSON.parse(localStorage.getItem('trees'))
      this._trees$.next(this._trees)
      this.loading = false
      console.log('---- RETURNED TREES FROM LOCAL STORAGE -----\n')
      return true
    } else {
      return false
    }
  }

  public getTrees = (): void => {
    let params = this.paramsService.serverFriendlyParams
    // console.log('2. server friendly params: ', this.paramsService.serverFriendlyParams)
    this.loading = true

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
        console.log(`- Got ${trees.length} trees from server.`)
        this._trees = [...trees]
        this._trees$.next([...trees])
        if (trees.length < 10000) localStorage.setItem('trees', JSON.stringify(trees))
      },
      err => {
        this.loading = false
        console.log('getTrees err', err.message)
      }
    )
  }
}
