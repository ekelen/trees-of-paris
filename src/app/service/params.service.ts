import {Injectable} from '@angular/core'
import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {Observable} from 'rxjs/Observable'

import * as _ from 'lodash'
import {IParams, SearchKind} from '../model/types/IParams'

@Injectable()
export class ParamsService {
  private _params: IParams;
  private _params$: BehaviorSubject<IParams>
  params$: Observable<IParams>;

  constructor() {
    this._params = {
          first_visit: true,
          user_arrdt: 0,
          user_coordinates: null,
          search_choice: null,
          has_any_location: false,
          confirmed_any_location: false,
        }

    this._params$ = new BehaviorSubject<IParams>(this._params)
    this.params$ = this._params$.asObservable()

    this.params$.subscribe(
      params => {
        this._params = _.cloneDeep(params)
      }
    )
  }

  toggleFirstVisit = (firstVisit: boolean) => {
    this._params$.next({...this._params, first_visit: firstVisit})
  }

  updateCoords = (coords: [number, number]): void => {
    this._params$.next({...this._params, user_coordinates: coords})
  }

  updateArrdt = (arrdt: number): void => {
    this._params$.next({...this._params, user_arrdt: arrdt })
  }

  toggleUserHasLocation = (hasLocation: boolean) => {
    this._params$.next({...this._params, has_any_location: hasLocation})
  }

  changeSearchChoice = (searchChoice: string) => {
    this._params$.next({...this._params, search_choice: SearchKind[searchChoice]})
  }

  toggleConfirmed = (confirmedLocation: boolean) => {
    this._params$.next({...this._params, confirmed_any_location: confirmedLocation})
  }

  get params() {
    return this._params
  }

  get serverFriendlyParams() {
    if (this._params.search_choice === SearchKind.by_arrdt) {
      return {arrondissement: this._params.user_arrdt ? this._params.user_arrdt : ''}
    } else if (this._params.search_choice === SearchKind.by_coordinates) {
        return {geometry: this._params.user_coordinates ? this._params.user_coordinates : '' }
    } else {
      return {}
    }
  }
}
