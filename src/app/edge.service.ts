import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IExternalIdentity, Client, BasicAuth, FetchClient, MeasurementService, IMeasurementCreate, IResult, IMeasurement, IFetchOptions, IFetchResponse, IdentityService, InventoryService } from '@c8y/client';
import { CloudConfiguration, EdgeCMDProgress, ThinEdgeConfiguration } from './property.model';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { CONFIG_CLOUD } from './TEST_CONFIG'

const UPDATE_URL = '/api/update';
const C8Y_URL = 'c8y';
const LOGIN_URL = `/tenant/currentTenant`
const CONFIGURATION_URL = '/api/configuration'
const PROXY_CONFIG_URL = '/config';
const DOWNLOADCERTIFICATE_URL = "/api/certificate";

@Injectable({
  providedIn: 'root'
})
export class EdgeService {

  private fetchClient: FetchClient;
  private measurementService: MeasurementService;
  private edgeConfiguration: ThinEdgeConfiguration 
  private inventoryService: InventoryService;
  private identityService: IdentityService;
  private cloudConfiguration: CloudConfiguration;

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

  sendCMDToEdge(msg) {
    this.socket.emit('cmd-in', msg);
  }

  getCMDProgress(): Observable<EdgeCMDProgress> {
    // return this.socket.fromEvent('cmd-edge').pipe(map((data) => JSON.stringify(data)));
    return this.socket.fromEvent('cmd-progress');
  }

  getCMDResult(): Observable<string> {
    return this.socket.fromEvent('cmd-result');
  }

  getEdgeConfiguration(): Promise<ThinEdgeConfiguration> {
    return this.http
      .get<ThinEdgeConfiguration>(CONFIGURATION_URL)
      .toPromise()
      .then ( config => {
        Object.keys(config).forEach(key => { this.edgeConfiguration[key] = config[key] })
        return this.edgeConfiguration
      })
  }

  downloadCertificate(): any {
    const promise = new Promise((resolve, reject) => {
      const apiURL = DOWNLOADCERTIFICATE_URL;
      const params = new HttpParams({
        fromObject: {
          deviceId: this.edgeConfiguration.deviceId,
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
    };
    return this.identityService.detail(identity).then ( result => {
          return this.inventoryService.detail(result.data.managedObject.id)
    })
/*     (async () => {
      const { data, res } = await this.identityService.detail(identity)
      console.log("External", data, res)
    })(); */
  }


  initializeFetchClient(edgeConfiguration: ThinEdgeConfiguration, cloudConfiguration: CloudConfiguration): Promise<void | any> {
    this.cloudConfiguration = cloudConfiguration;
    const auth = new BasicAuth({
      user: this.cloudConfiguration.username,
      password: this.cloudConfiguration.password,
    });
    const client = new Client(auth, C8Y_URL);
    client.setAuth(auth);
    this.fetchClient = client.core;
    this.measurementService = new MeasurementService(this.fetchClient);
    this.inventoryService = new InventoryService(this.fetchClient);
    this.identityService = new IdentityService(this.fetchClient);

    const params = {
      proxy: this.edgeConfiguration.tenantUrl
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
        console.log("could not login:" + err.message)
        return err;
      })

    return this.http.post(PROXY_CONFIG_URL, params)
      .toPromise()
      .then(response => {
        //console.log ("Resulting cmd:", response);
        return response;
      })
      .catch(err => console.log("could not set backend proxy"))
      .then((success) => {
        return loginPromise;
      }
      )
  }

  createMeasurement(mandantoryObject: Partial<IMeasurementCreate>): Promise<IResult<IMeasurement>> {
    return this.measurementService.create(mandantoryObject);
  }

  updateCertificate(name: string, description: string, isComplex: boolean): Promise<any> {
    const params = new HttpParams({
      fromObject: {
        name: name,
        description: description,
        isComplex: isComplex.toString()
      }
    });
    const promise = new Promise((resolve, reject) => {
      const apiURL = UPDATE_URL;
      this.http
        .get(apiURL, { params: params })
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

  // Error handling
  private error(error: any) {
    let message = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(message);
  }
}