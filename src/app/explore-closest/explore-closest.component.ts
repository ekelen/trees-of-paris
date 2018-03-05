import {Component, Input, OnInit} from '@angular/core'
import {ITree} from '../model/ITree'
import * as geolib from 'geolib'
import * as L from 'leaflet'
import * as _ from 'lodash'
import {MAPBOX_API_KEY} from '../../environments/environment'

const mapTemplate = 'https://api.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}'
const mapOptions: L.TileLayerOptions = {
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
  zoomControl: false,
  keyboard: false,
  id: 'mapbox.streets',
  accessToken: MAPBOX_API_KEY,
}

const evergreens = ['Juniperus', 'Pinus', 'Picea', 'Thuja', 'Eriobotrya', 'Magnolia', 'Abies']

const flowering = ['Magnolia']

const fruit = ['Malus']


@Component({
  selector: 'app-explore-closest',
  templateUrl: './explore-closest.component.html',
  styles: []
})
export class ExploreClosestComponent implements OnInit {
  myLat: number
  myLon: number
  myGeolibPos: any = {}
  closestTrees: ITree[]
  distanceClosestTree: number = null
  radius: number
  errorMessage = ''

  bounds: any = []

  @Input() trees: ITree[]

  @Input()
    set coordinates(coordinates: [number, number]) {
      this.myLat = (coordinates[0] || null)
      this.myLon = (coordinates[1] || null)
      this.myGeolibPos = {latitude: coordinates[0], longitude: coordinates[1]}
    }
    get coordinates(): [number, number] { return this.myLat && this.myLon ? [this.myLat, this.myLon] : null }

  private map: L.Map
  private streetsLayer: L.TileLayer
  private userMarker: L.Marker
  private markerLayer: L.FeatureGroup

  constructor() {}

  ngOnInit() {
    if (this.trees.length && this.coordinates) {
      // trees are already ordered by distance (mongoDb $nearSphere search)
      this.closestTrees = [...this.trees.slice(0, 100)]
    }
    this.distanceClosestTree = this.distanceFromMe(0)
    this.radius = this.distanceFromMe(this.closestTrees.length - 1)
    const cornerDist = Math.sqrt((Math.pow(this.radius, 2) * 2))
    const northEast = _.values(geolib.computeDestinationPoint(this.myGeolibPos, cornerDist, 315))
    const southWest = _.values(geolib.computeDestinationPoint(this.myGeolibPos, cornerDist, 135))
    this.bounds = [southWest, northEast]
    this.initMap()
  }

  public initMap = () => {
    this._makeLayers()
    this._drawMyPos()
    this._drawTrees()
  }

  private _makeLayers = () => {
    this.streetsLayer = L.tileLayer(mapTemplate, mapOptions)
    this.markerLayer = L.featureGroup()

    this.map = L.map('treeMap', {
      center: this.coordinates,
      zoom: 12,
      layers: [this.streetsLayer, this.markerLayer]
    })

    this.map.fitBounds(this.bounds)
    this.streetsLayer.addTo(this.map)
    this.markerLayer.addTo(this.map)
  }

  private _drawMyPos = () => {
    this._addMarker(this.myLat, this.myLon, 'house')
  }

  private _drawTrees = () => {
    this.closestTrees.forEach(tree => {
      let iconType = tree.notable ?
        'notable' :
        evergreens.includes(tree.genus) ?
          'evergreen' :
          null
      this._addMarker(
        tree.geometry.coordinates[1],
        tree.geometry.coordinates[0],
        iconType,
        JSON.stringify(tree))
    })
  }

  private _addMarker = (lat, lng, type: string, popupContent: any = null) => {
    if (!type) { type  = 'deciduous' }
    if (!popupContent) { popupContent = null }
    let marker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: `../assets/img/${type}-icon-sm.png`})})
    if (popupContent) {
      marker.bindPopup(popupContent)
    }
    marker.addTo(this.markerLayer);
  }

  distanceFromMe(index) { // TODO: Put in utils
    if (!this.trees[index]) {
      this.errorMessage = 'check distanceClosestTree'
      return null }
    return geolib.getDistance(this.myGeolibPos,
      {
        latitude: this.trees[index].geometry.coordinates[1],
        longitude: this.trees[index].geometry.coordinates[0]
      })
  }

}
