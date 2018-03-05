import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Subject }    from 'rxjs/Subject';
import { BehaviorSubject }    from 'rxjs/BehaviorSubject';

import { MAPBOX_API_KEY } from '../../environments/environment';
import { ParamsService } from '../service/params.service'

import * as L from 'leaflet'
import * as G from 'geojson'

import * as _ from 'lodash'
import * as __ from '../util'

const file = '../../assets/data/arrdts_v2.json'
const basePlaceUrl = 'https://maps.googleapis.com/maps/api/js'

const center: [number, number] = [48.8566, 2.3522]
const zoom: number = 12

const mapTemplate = 'https://api.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}'
const mapOptions: L.TileLayerOptions = {
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
  zoomControl: false,
  minZoom: zoom,
  maxZoom: zoom,
  keyboard: false,
  id: 'mapbox.streets',
  accessToken: MAPBOX_API_KEY,
}

interface MapModel {
  user_arrdt: number
  user_coordinates: [number, number]
  show_arrdts: boolean
}

@Injectable()
export class MapService {
  private _mapStore: MapModel

  private _user_arrdt$: BehaviorSubject<number>
  public user_arrdt$: Observable<number>

  private _coordinates$: BehaviorSubject<[number, number]>
  public coordinates$: Observable<[number, number]>

  private map: L.Map
  private arrdtLayer: L.FeatureGroup
  private streetsLayer: L.TileLayer
  private userMarker: L.Marker
  private markerLayer: L.FeatureGroup

  constructor(
    private http: HttpClient,
    private paramsService: ParamsService) {
    this._mapStore = {
      user_arrdt: 0,
      user_coordinates: null,
      show_arrdts: true
    }

    this.paramsService.params$.subscribe(
      params => {
        this._mapStore.user_arrdt = params.user_arrdt;
        this._mapStore.user_coordinates = params.user_coordinates;
      }
    )
  }

  get user_arrdt() {
    return this._mapStore.user_arrdt
  }

  get user_coordinates() {
    return this._mapStore.user_coordinates
  }

  get show_arrdts() {
    return this._mapStore.show_arrdts
  }

  public toggleShowArrdts = () => {
    const showArrdts = !this._mapStore.show_arrdts
    this._mapStore.show_arrdts = showArrdts
    this._resetMap()
    this.map.removeLayer(showArrdts ? this.markerLayer : this.arrdtLayer)
    this.map.addLayer(showArrdts ? this.arrdtLayer : this.markerLayer)
  }

  public initMap = () => {
    //console.log('initMap')
    this._makeLayers()
    this._loadArrdts()
  }

  private _resetMap = () => {
    this.arrdtLayer.setStyle({'fillColor': 'gray'})
    this.paramsService.updateArrdt(0)
    this.paramsService.updateCoords(null)
    this.paramsService.toggleUserHasLocation(false)
    // this._mapStore.user_coordinates = null
    // this._mapStore.user_arrdt = 0
  }

  public search = (lat: number, lng: number) => {
    const latLngExp = __.toLatLng(lat, lng)
    this.paramsService.updateCoords(latLngExp)
    this.paramsService.changeSearchChoice('by_coordinates')
    this.paramsService.toggleUserHasLocation(true)
    this._addMarker(lat, lng)
  }

  public confirmLocation = (confirmsLocation: boolean) => {
    this.paramsService.toggleConfirmed(confirmsLocation)
  }

  private _toggleArddt = (e, arr, feature): void => {
    const { user_arrdt } = this._mapStore
    const removing = user_arrdt === arr.int
    this.arrdtLayer.setStyle({'fillColor': 'gray'})
    feature.setStyle({'fillColor' : removing ? 'gray' : 'limegreen'})
    this.paramsService.updateArrdt(removing ? 0 : arr.int)
    this.paramsService.changeSearchChoice('by_arrdt')
    this.paramsService.toggleUserHasLocation(!removing)
  }

  private _addMarker = (lat, lng) => {
    this.userMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: '../assets/img/marker-icon.png', shadowUrl: '../assets/img/marker-shadow.png'})})
      .addTo(this.markerLayer);
  }

  private _makeLayers = () => {
    this.arrdtLayer = L.featureGroup()
    this.streetsLayer = L.tileLayer(mapTemplate, mapOptions)
    this.markerLayer = L.featureGroup()

    this.map = L.map('map', {
      center,
      zoom,
      layers: [this.streetsLayer, this.arrdtLayer]
    });
    const baseMaps = {'Streets': this.streetsLayer}
    const overlayMaps = {'Arrdts': this.arrdtLayer, 'Marker': this.markerLayer}

    L.control.layers(baseMaps, overlayMaps).addTo(this.map);
  }

  private _getJSON(): Observable<any> {
    return this.http.get(file)
  }

  private _loadArrdts = () => {
    this._getJSON().subscribe(
    data => {
      data.forEach(arr => {
        function onEachFeature(feature, layer) {
          if (feature.properties && feature.properties.toolTipContent) {
            layer.bindTooltip(feature.properties.toolTipContent);
          }
        }

        let arrFeature = L.geoJSON(__.toPoly(arr.name, arr.poly),
          {onEachFeature: onEachFeature})
          .setStyle({color: 'gray'})
          .on('click', (e) => this._toggleArddt(e, arr, arrFeature))
          .addTo(this.arrdtLayer)
        })
    },
    err => console.log(err),
    () => console.log('Completed'));
  }
}
