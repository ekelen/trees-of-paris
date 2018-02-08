import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { HttpClientModule } from '@angular/common/http'
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularGooglePlaceModule } from 'angular-google-place';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as drilldown from 'highcharts/modules/drilldown.src';

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { TreesComponent } from './trees/trees.component'
import { TreesService } from './trees/trees.service'
import { MapComponent } from './map/map.component';
import { MapService } from './map/map.service';
import { ChartComponent } from './chart/chart.component'
import { LoadingComponent } from './loading/loading.component';
import { HomeComponent } from './home/home.component';
import { ParamsService } from './service/params.service';
import { ChartControlComponent } from './chart-control/chart-control.component';

export function highchartsModules() {
  // apply Highcharts Modules to this array
  return [ more, drilldown ];
}

@NgModule({
  declarations: [
    AppComponent,
    TreesComponent,
    AboutComponent,
    MapComponent,
    ChartComponent,
    LoadingComponent,
    HomeComponent,
    ChartControlComponent
  ],
  imports: [
    NgbModule.forRoot(),
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    AngularGooglePlaceModule,
    ChartModule
  ],
  providers: [
    HttpClientModule,
    { provide: HIGHCHARTS_MODULES, useFactory: highchartsModules },
    TreesService,
    MapService,
    ParamsService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
