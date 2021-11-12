import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Client, BasicAuth, FetchClient, MeasurementService, IMeasurementCreate, IResult, IMeasurement, IFetchOptions, IFetchResponse } from '@c8y/client';
import { StatusEdgeStart, TenantInfo } from './property.model';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

const STATUS_URL = '/api/status';
const CALC_URL = '/api/calc';
const CMD_URL = '/api/cmd';
const UPDATE_URL = '/api/update';
const C8Y_URL = 'c8y';
const LOGIN_URL = `/tenant/currentTenant`
const CONFIG_URL = '/config';

@Injectable({
  providedIn: 'root'
})
export class EdgeService {

  private fetchClient: FetchClient;
  private measurementService: MeasurementService;
  private tenantInfo: TenantInfo = {
    username: 'christof.strack@softwareag.com',
    password: 'Manage250!',
    tenantId: 't306817378',
    tenantUrl: 'https://ck2.eu-latest.cumulocity.com'
  };

  constructor(private http: HttpClient,
    private socket: Socket) { }

  startEdge(msg: string) {
    this.socket.emit('start', msg);
  }

  getStatusEdgeStart() :Observable <StatusEdgeStart>{
   // return this.socket.fromEvent('start-edge').pipe(map((data) => JSON.stringify(data)));
    return this.socket.fromEvent('start-edge');
  }

  getTenantInfo(): TenantInfo {
    return this.tenantInfo;
  }

  initializeFetchClient(tenantInfo: TenantInfo): Promise<void | any> {
    this.tenantInfo = tenantInfo;
    const auth = new BasicAuth({
      user: this.tenantInfo.username,
      password: this.tenantInfo.password,
      tenant: this.tenantInfo.tenantId
    });
    const client = new Client(auth, C8Y_URL);
    client.setAuth(auth);
    this.fetchClient = client.core;
    this.measurementService = new MeasurementService(this.fetchClient);
    const params = {
      proxy: this.tenantInfo.tenantUrl
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

    return this.http.post(CONFIG_URL, params)
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

  // Get the status
  getStatus(): Promise<void | any> {
    return this.http.get(STATUS_URL)
      .toPromise()
      .then(response => {
        return response;
      })
      .catch(this.error);
  }

  // calc
  calc(a: number, b: number): Promise<void | any> {
    const params = new HttpParams({
      fromObject: {
        a: a.toString(),
        b: b.toString(),
      }
    });
    return this.http.get(CALC_URL, { params: params })
      .toPromise()
      .then(response => {
        return response;
      })
      .catch(this.error);
  }

  // run cmd
  runCmd(cmd: string, args: string[]): Promise<void | any> {
    const params = {
      cmd: cmd,
      args: args
    }
    return this.http.post(CMD_URL, params)
      .toPromise()
      .then(response => {
        //console.log ("Resulting cmd:", response);
        return response;
      })
  }

  // Error handling
  private error(error: any) {
    let message = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(message);
  }
}