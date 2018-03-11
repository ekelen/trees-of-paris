import {AfterViewInit, Component} from '@angular/core'
import {PARIS} from '../../model/constants/Paris'

import {MapService} from '../../service/map.service'
import * as _ from "lodash"

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: []
})

export class MapComponent implements AfterViewInit {
  public options = {type : 'address', componentRestrictions: { country: 'FR' }}
  errorMessage: string = ''
  userArrdt = 0
  coordinates: [number, number] = null
  showArrdts: boolean = false

  constructor(public mapService: MapService) {
    mapService.mapStore$.subscribe(
      data => {
        this.errorMessage = ''
        this.userArrdt = data.user_arrdt
        this.coordinates = data.user_coordinates
        this.showArrdts = data.show_arrdts
      }
    )
  }

  getFormattedAddress(e: any) {
    this.errorMessage = ''
    if (e.postal_code &&
      _.inRange(parseInt(e.postal_code), 75001, 75020) &&
      _.inRange(parseFloat(e.lat), PARIS.min_lat, PARIS.max_lat) &&
      _.inRange(parseFloat(e.lng), PARIS.min_lng, PARIS.max_lng)) {
      this.mapService.search(e.lat, e.lng)
    } else {
      this.errorMessage = 'Please enter a valid address within one of the 20 arrondissements.'
    }
  }

  ngAfterViewInit() {
    this.mapService.initMap()
  }

  toggleMapMode(e) {
    this.errorMessage = ''
    this.mapService.toggleShowArrdts()
  }

  go(e) {
    if (Array.from(e.target.classList).includes('disabled')) {
      this.errorMessage = 'Choose an arrondissement or an address first.'
      return false }
    this.mapService.confirmLocation(true)
  }

}
