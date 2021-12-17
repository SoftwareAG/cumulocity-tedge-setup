import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IExternalIdentity, Client, BasicAuth, FetchClient, IFetchOptions, IFetchResponse, IdentityService, InventoryService, IdReference } from '@c8y/client';
import { EdgeCMDProgress, MeasurmentType, RawMeasurment } from './property.model';
import { Socket } from 'ngx-socket-io';
import { Observable, from } from 'rxjs';
import { map } from "rxjs/operators"

const C8Y_URL = 'c8y';
const LOGIN_URL = `/tenant/currentTenant`
const EDGE_CONFIGURATION_URL = '/api/edgeConfiguration'
const ANALYTICS_CONFIGURATION_URL = '/api/analyticsConfiguration'
const PROXY_CONFIG_URL = '/config';
const DOWNLOADCERTIFICATE_URL = "/api/certificate";
const MEASUREMENT_URL = "/api/measurement";
const STATUS_URL = "/api/status";
const SERIES_URL =  "/api/series";

@Injectable({
  providedIn: 'root'
})
export class EdgeService {
  private fetchClient: FetchClient;

  private edgeConfiguration: any = {}
  private inventoryService: InventoryService;
  private identityService: IdentityService;

  constructor(private http: HttpClient,
    private socket: Socket) {
    //Object.assign(this.edgeConfiguration, CONFIG_CLOUD)
  }

  /*   async loadConfiguration(): Promise<any> {
    const config = await this.http
    .get<ThinEdgeConfiguration>(CONFIGURATION_URL)
    .toPromise();
    Object.keys(config).forEach(key => { this.edgeConfiguration[key] = config[key] })
    return config;
  } */

  getLastMeasurements(displaySpan: number): Promise<RawMeasurment[]> {
    const promise = new Promise<any[]>((resolve, reject) => {
      const params = new HttpParams({
        fromObject: {
          displaySpan: displaySpan.toString(),
        }
      });
      this.http
        .get<RawMeasurment[]>(MEASUREMENT_URL, { params: params} )
        .toPromise()
        .then((res: any[]) => {
          // Success
          resolve(res);
        },
          err => {
            // Error
            reject(err);
          }
        );
    });
    return promise;
  }

  getMeasurements(dateFrom: Date, dateTo: Date): Promise<RawMeasurment[]> {
    const promise = new Promise<any[]>((resolve, reject) => {
      const params = new HttpParams({
        fromObject: {
          dateFrom: dateFrom.toString(),
          dateTo: dateTo.toString(),
        }
      });
      this.http
        .get<RawMeasurment[]>(MEASUREMENT_URL, { params: params} )
        .toPromise()
        .then((res: any[]) => {
          // Success
          resolve(res);
        },
          err => {
            // Error
            reject(err);
          }
        );
    });
    return promise;
  }

  sendCMDToEdge(msg) {
    this.socket.emit('cmd-in', msg);
  }

  getCMDProgress(): Observable<EdgeCMDProgress> {
    // return this.socket.fromEvent('cmd-edge').pipe(map((data) => JSON.stringify(data)));
    return this.socket.fromEvent('cmd-progress');
  }

  getRealtimeMeasurements(): Observable<RawMeasurment> {
    this.socket.emit('new-measurement', 'start');
    const obs = this.socket.fromEvent <string>('new-measurement').pipe( map ( m => JSON.parse(m)))
    return obs;
  }

  stopMeasurements(): void {
    this.socket.emit('new-measurement', 'stop');
  }

  getCMDResult(): Observable<string> {
    return this.socket.fromEvent('cmd-result');
  }

  updateEdgeConfiguration(edgeConfiguration: any) {
    this.edgeConfiguration = {
      ...this.edgeConfiguration,
      ...edgeConfiguration,
    }
    console.log("Updated edgeConfiguration:", edgeConfiguration, this.edgeConfiguration);
  }

  getEdgeStatus(): Promise<any> {
    return this.http
      .get<any>(STATUS_URL)
      .toPromise()
      .then(res => {
        console.log("New status", res)
        return res
      })
  }
  getEdgeConfiguration(): Promise<any> {
    return this.http
      .get<any>(EDGE_CONFIGURATION_URL)
      .toPromise()
      .then(config => {
        Object.keys(config).forEach(key => { this.edgeConfiguration[key] = config[key] })
        return this.edgeConfiguration
      })
  }

  getSeries(): Promise<any> {
    return this.http
      .get<MeasurmentType[]>(SERIES_URL)
      .toPromise()
      .then(config => {
        return config
      })
  }

  getAnalyticsConfiguration(): Promise<any> {
    return this.http
      .get<any>(ANALYTICS_CONFIGURATION_URL)
      .toPromise()
      .then(config => {
        return config
      })
  }

  setAnalyticsConfiguration(config): Promise<any> {
    //console.log("Configuration to be stored:", config)
    return this.http
      .post<any>(ANALYTICS_CONFIGURATION_URL, config)
      .toPromise()
      .then(config => {
        return config
      })
  }

  downloadCertificate(): any {
    const promise = new Promise((resolve, reject) => {
      const apiURL = DOWNLOADCERTIFICATE_URL;
      const params = new HttpParams({
        fromObject: {
          deviceId: this.edgeConfiguration['device.id'],
        }
      });
      this.http
        .get(apiURL, { params: params, responseType: 'blob' as 'json' })
        .toPromise()
        .then((res: any) => {
          // Success
          resolve(res);
        },
          err => {
            // Error
            reject(err);
          }
        );
    });
    return promise;
  }

  getDetailsCloudDevice(externalDeviceId: string) {
    const identity: IExternalIdentity = {
      type: 'c8y_Serial',
      externalId: externalDeviceId
    }
    return this.identityService.detail(identity).then(result => {
      return this.inventoryService.detail(result.data.managedObject.id)
    })

  }

  async initializeFetchClient(): Promise<IFetchResponse> {
    const auth = new BasicAuth({
      user: this.edgeConfiguration.username,
      password: this.edgeConfiguration.password,
    });
    const client = new Client(auth, C8Y_URL);
    client.setAuth(auth);
    this.fetchClient = client.core;
    this.inventoryService = new InventoryService(this.fetchClient);
    this.identityService = new IdentityService(this.fetchClient);

    const params = {
      proxy: 'https://' + this.edgeConfiguration['c8y.url']
    }

    const options: IFetchOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    let loginPromise: Promise<IFetchResponse> = this.fetchClient.fetch(LOGIN_URL, options)
      .then(response => {
        //console.log ("Resulting cmd:", response);
        return response;
      })
      .catch(err => {
        console.log("Could not login:" + err.message)
        return err;
      })

    let promise = this.http.post(PROXY_CONFIG_URL, params)
      .toPromise()
      .then(response => {
        //console.log ("Resulting cmd:", response);
        return response;
      })
      .catch(err => console.log("Could not set backend proxy"))
      .then((success) => {
        return loginPromise;
      })
    return promise
  }

  updateCertificate(name: any, description: any, isComplex: any) {
    throw new Error('Method not implemented.');
  }

  // Error handling
  private error(error: any) {
    let message = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(message);
  }
}
