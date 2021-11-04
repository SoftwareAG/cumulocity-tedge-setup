import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, NgModule } from '@angular/core';

//import { AppRoutingModule } from './app-routing.module';
import { RouterModule as ngRouterModule } from '@angular/router';
import { CoreModule, BootstrapComponent, RouterModule, HOOK_NAVIGATOR_NODES, NavigatorNode, CommonModule, AppStateService, LoginService, OptionsService, ApplicationOptions } from '@c8y/ngx-components';
import { ICurrentTenant, IUser } from '@c8y/client';
import { CertificateComponent } from './certificate/certificate.component';
import { BehaviorSubject } from 'rxjs';
import { AnalysisComponent } from './analysis/analysis.component';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    RouterModule.forRoot(),
    ngRouterModule.forRoot(
      [{ path: 'Certificate', component: CertificateComponent }, { path: 'Analysis', component: AnalysisComponent }], // hook the route here
      { enableTracing: false, useHash: true }
    ),
    CoreModule.forRoot(),
    CommonModule
  ],
  providers: [
    {
      provide: HOOK_NAVIGATOR_NODES,
      useValue: [{
        path: 'Certificate',
        label: 'Certificate',
        priority: 90,
        icon: 'certificate',

      }] as NavigatorNode[],
      multi: true
    },
    {
      provide: HOOK_NAVIGATOR_NODES,
      useValue: [{
        path: 'Analysis',
        label: 'Analysis',
        priority: 100,
        icon: 'cog',

      }] as NavigatorNode[],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initAppState,
      multi: true,
      deps: [AppStateService],
    },
  ],
  bootstrap: [BootstrapComponent],
  declarations: [CertificateComponent, AnalysisComponent]
})
export class AppModule { }



/* export function initOptionService(opService: OptionsService) {
  return () => {
    opService.name = "Thin Edge"
  };

} */

export function initAppState(appStateService: AppStateService) {
  return () => {
    const iuser: IUser = {
      id: "tedge",
      userName: "tedgeUser",
      displayName: "tedgeUser",
      email: "tedge@cumulocity.com",
      enabled: true,
      firstName: "First",
      lastName: "User",
      customProperties: [],
      applications: [{
        id: "10000",
        key: "Thin Edge"
      }]

    }
    const userInfo = {
      user: iuser,
      supportUserName: "christof"
    }
    appStateService.setUser(userInfo);
    const edgeTenant = {
      name: "thinEdge",
      domainName: "thinEdge",
      allowCreateTenants: false,
      customProperties : ["userOrigin"]
      }
    appStateService.currentTenant = new BehaviorSubject <ICurrentTenant> ( edgeTenant);
  };
}