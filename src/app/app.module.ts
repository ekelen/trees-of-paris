import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { HttpClientModule } from '@angular/common/http'
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularGooglePlaceModule } from 'angular-google-place';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as drilldown from 'highcharts/modules/drilldown.src';

import { AppComponent } from './app.component';
import { MapComponent } from './component/map/map.component';
import { TreesComponent } from './component/trees/trees.component'
import { ChartComponent } from './component/chart/chart.component'
import { LoadingComponent } from './component/loading/loading.component';
import { HomeComponent } from './component/home/home.component';
import { ChartControlComponent } from './component/chart-control/chart-control.component';

import { TreesService } from './service/trees.service'
import { MapService } from './service/map.service';
import { ParamsService } from './service/params.service';

export function highchartsModules() {
  // apply Highcharts Modules to this array
  return [ more, drilldown ];
}

@NgModule({
  declarations: [
    AppComponent,
    TreesComponent,
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
