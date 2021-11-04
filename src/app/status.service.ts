import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private statusUrl = '/api/status';
  private calcsUrl = '/api/calc';
  private cmdUrl = '/api/cmd';

  constructor(private http: HttpClient) { }

  // Get the status
  getStatus(): Promise<void | any> {
    return this.http.get(this.statusUrl)
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
    return this.http.get(this.calcsUrl, { params: params })
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
    return this.http.post(this.cmdUrl, params)
      .toPromise()
      .then(response => {
        console.log ("Resulting cmd:", response);
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