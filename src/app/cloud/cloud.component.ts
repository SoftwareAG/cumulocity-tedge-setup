import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IManagedObject, IMeasurementCreate } from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { EdgeService } from '../edge.service';
import { CloudConfiguration, ThinEdgeConfiguration } from '../property.model';

@Component({
  selector: 'app-cloud',
  templateUrl: './cloud.component.html',
  styleUrls: ['./cloud.component.css']
})
export class CloudComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private edgeService: EdgeService, private alertService: AlertService) { }
  loginForm: FormGroup;
  edgeConfiguration: ThinEdgeConfiguration;
  cloudConfiguration : CloudConfiguration;
  Object : Object ;
  cloudDeviceDetails: IManagedObject;

  ngOnInit() {
    this.edgeService.getEdgeConfiguration().then ( config => {
      this.edgeConfiguration = config
    })
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      username: [this.cloudConfiguration.username],
      tenantUrl: [this.edgeConfiguration.tenantUrl],
      password: [this.cloudConfiguration.password],
    });
  }


  login() {
    (async () => {
      try{
        const res = await this.edgeService.initializeFetchClient(
          { tenantUrl:  this.loginForm.value.tenantUrl }, 
          { password:  this.loginForm.value.password,  username: this.loginForm.value.username}
        )
        if (res.status == 200) {
          this.alertService.success("Successfully logged in!")
        } else {
          this.alertService.danger("Error login:" + res.statusText)
        }
        console.log("Tried to login:", res)

      } catch (err){
        this.alertService.danger("Error when trying tp login: " + err.message)
      }
    })();

    (async () => {
      try{
        const {data, res} = await this.edgeService.getDetailsCloudDevice( this.edgeConfiguration.deviceId )
        this.cloudDeviceDetails = data
/*         if (res.status == 200) {
          this.alertService.success("Successfully logged in!")
        } else {
          this.alertService.danger("Error login:" + res.statusText)
        } */
        console.log("Tried to login:", res)

      } catch (err){
        this.alertService.danger("Error when trying tp login: " + err.message)
      }
    })();
  }

  createMeasurement(deviceId: string) {
    const t = Math.random() * 30 + 15
    const mandantoryObject: Partial<IMeasurementCreate> = {
      sourceId: deviceId,
      c8y_Temperature: { T: { unit: '°C', value: t } },
    };
    (async () => {
      const { data, res } = await this.edgeService.createMeasurement(mandantoryObject);
      console.log("New measure:", data)
    })();
  }

}
