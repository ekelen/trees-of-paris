import { Component, EventEmitter, Output, OnInit, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Address } from 'angular-google-place';

import { Paris } from '../constants/Paris'
import { MapService } from './map.service';

import * as math from "mathjs"
import * as _ from "lodash"
import * as L from 'leaflet'

@Component({
  selector: 'app-dashboard',
  templateUrl: './map.component.html',
  styleUrls: []
})

export class MapComponent implements AfterViewInit {
  public options = {type : 'address', componentRestrictions: { country: 'FR' }}
  errorMessage: ''

  constructor(
    private mapService: MapService,
    private router: Router) {
  }

  getFormattedAddress(e: any) {
    this.errorMessage = ''
   if (e.postal_code &&
     _.inRange(parseInt(e.postal_code), 75001, 75020) &&
     _.inRange(parseFloat(e.lat), Paris.min_lat, Paris.max_lat) &&
     _.inRange(parseFloat(e.lng), Paris.min_lng, Paris.max_lng)) {
      this.mapService.search(e.lat, e.lng)
    } else
      this.errorMessage = "Please enter a valid address within one of the 20 arrondissements."
    }

  ngAfterViewInit() {
    this.mapService.initMap()
  }

  toggleMapMode(e) {
    this.errorMessage = ''
    this.mapService.toggleShowArrdts()
  }

  go() {
    const param = this.mapService.user_coordinates ? 'geometry--' + this.mapService.user_coordinates.join() : 'arrondissement--' + this.mapService.user_arrdt
    console.log(param)
    this.router.navigate(['trees', encodeURIComponent(param)]);
  }

}
