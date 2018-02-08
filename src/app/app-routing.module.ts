import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent }    from './home/home.component'
import { AppComponent }     from './app.component'
import { MapComponent }     from './map/map.component'
import { AboutComponent }   from './about/about.component';
import { TreesComponent }   from './trees/trees.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'map', component: MapComponent },
  { path: 'trees', component: TreesComponent },
  { path: '**', redirectTo: ''}
];

@NgModule({
  exports: [ RouterModule ],
  imports: [
    RouterModule.forRoot(routes)
  ]
})

export class AppRoutingModule {

}
