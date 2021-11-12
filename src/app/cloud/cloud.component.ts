import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IMeasurementCreate } from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { EdgeService } from '../edge.service';
import { TenantInfo } from '../property.model';

@Component({
  selector: 'app-cloud',
  templateUrl: './cloud.component.html',
  styleUrls: ['./cloud.component.less']
})
export class CloudComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private edgeService: EdgeService, private alertService: AlertService) { }
  loginForm: FormGroup;
  tenantInfo: TenantInfo;

  ngOnInit() {
    this.tenantInfo = this.edgeService.getTenantInfo();
/*     (async () => {
      const data = await this.edgeService.initializeFetchClient(
        {
          username: "christof.strack@softwareag.com",
          password: "Manage250!",
          tenantUrl: "https://ck2.eu-latest.cumulocity.com",
          tenantId: "t306817378"
        } as TenantInfo
      )
      console.log("Tried login:", data)
    })(); */
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      username: [this.tenantInfo.username],
      tenantId: [this.tenantInfo.tenantId],
      tenantUrl: [this.tenantInfo.tenantUrl],
      password: [this.tenantInfo.password],
    });
  }


  login() {
    (async () => {
      try{
        const res = await this.edgeService.initializeFetchClient(
          {
            username: this.loginForm.value.username,
            password:  this.loginForm.value.password,
            tenantUrl:  this.loginForm.value.tenantUrl,
            tenantId:  this.loginForm.value.tenantId,
          } as TenantInfo
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
  }

  createMeasurement() {
    const mandantoryObject: Partial<IMeasurementCreate> = {
      sourceId: "490229",
      c8y_Temperature: { T: { unit: '°C', value: 51 } },
    };
    (async () => {
      const { data, res } = await this.edgeService.createMeasurement(mandantoryObject);
      console.log("New measure:", data)
    })();
  }

}
