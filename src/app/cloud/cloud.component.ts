import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IManagedObject, IMeasurementCreate } from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { EdgeService } from '../edge.service';
//import { ThinEdgeConfiguration } from '../property.model';

@Component({
  selector: 'app-cloud',
  templateUrl: './cloud.component.html',
  styleUrls: ['./cloud.component.css']
})
export class CloudComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private edgeService: EdgeService, private alertService: AlertService) { }
  loginForm: FormGroup;
  edgeConfiguration: any = {}
  Object : Object ;
  cloudDeviceDetails: IManagedObject;

  ngOnInit() {
    this.edgeService.getEdgeConfiguration().then ( config => {
      this.edgeConfiguration = config
      this.loginForm.setValue ({
        username: [ this.edgeConfiguration.username ?  this.edgeConfiguration.username :''],
        tenantUrl: [this.edgeConfiguration['c8y.url'] ?  this.edgeConfiguration['c8y.url']: ''],
        password: [this.edgeConfiguration.password ? this.edgeConfiguration.password: ''],
      })
      console.log("Intialized configuration:", config)
    })
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      username: [ this.edgeConfiguration.username ?  this.edgeConfiguration.username :''],
      tenantUrl: [this.edgeConfiguration['c8y.url'] ?  this.edgeConfiguration['c8y.url']: ''],
      password: [this.edgeConfiguration.password ? this.edgeConfiguration.password: ''],
    });
  }

  login() {
    const up = {
      'c8y.url': this.loginForm.value.tenantUrl,
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    } 
    this.edgeService.updateEdgeConfiguration (up);

    (async () => {
      try{
        const res = await this.edgeService.initializeFetchClient()
        console.log("Login response:", res)
        this.alertService.success("Could log in to cloud tenant")
      } catch (err){
        this.alertService.danger("Failed to login: " + err.message)
      }
    })();

    (async () => {
      try{
        const {data, res} = await this.edgeService.getDetailsCloudDevice( this.edgeConfiguration['device.id'] )
        // ignore those values that are object,because they look ugly when printed    
        Object.keys(data)
        .filter(key => typeof data[key] == 'object' )
        .forEach(key => delete data[key]);
        this.cloudDeviceDetails = data
        console.log("Retrieved cloud data:", res)
      } catch (err){
        this.alertService.danger("Failed to retrieve details: " + err.message)
      }
    })();
  }
}
