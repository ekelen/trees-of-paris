import {Component, EventEmitter, Output, OnInit, AfterViewInit, OnChanges} from '@angular/core'
import { NgForm } from '@angular/forms';
import { Address } from 'angular-google-place';
import { Paris } from '../../constants/Paris'

import { MapService } from '../../service/map.service';
import { ParamsService } from '../../service/params.service'

import * as math from "mathjs"
import * as _ from "lodash"
import * as L from 'leaflet'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: []
})

export class MapComponent implements AfterViewInit, OnChanges {
  public options = {type : 'address', componentRestrictions: { country: 'FR' }}
  errorMessage: string = ''
  hasEnteredValidLocation: boolean = false

  constructor(public mapService: MapService) {

  }

  getFormattedAddress(e: any) {
    this.errorMessage = ''
    if (e.postal_code &&
      _.inRange(parseInt(e.postal_code), 75001, 75020) &&
      _.inRange(parseFloat(e.lat), Paris.min_lat, Paris.max_lat) &&
      _.inRange(parseFloat(e.lng), Paris.min_lng, Paris.max_lng)) {
      this.mapService.search(e.lat, e.lng)
    } else {
      this.errorMessage = 'Please enter a valid address within one of the 20 arrondissements.'
    }
  }

  ngOnChanges() {
    console.log('changes')
    if (this.hasEnteredValidLocation) { this.errorMessage = '' }
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
