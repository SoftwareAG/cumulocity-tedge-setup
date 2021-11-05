import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EdgeService {
  private statusUrl = '/api/status';
  private calcsUrl = '/api/calc';
  private cmdUrl = '/api/cmd';
  private updateUrl = '/api/update';

  constructor(private http: HttpClient) { }


  updateCertificate( name:string, description:string ,isComplex:boolean) {
    const params = new HttpParams({
      fromObject: {
        name: name,
        description: description,
        isComplex: isComplex.toString()
      }
    });
    const promise = new Promise((resolve, reject) => {
      const apiURL = this.updateUrl;
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

/*    
 const params = new HttpParams({
      fromObject: {
        name: name,
        description: description,
        isComplex: isComplex.toString()
      }
    });
    return this.http.get(this.updateUrl, { params: params })
      .toPromise()
      .then(response => {
        return response;
      })
      .catch( reason => {
        return reason;
      }) 
      ;
  } */
  

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