import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IManagedObject, IMeasurementCreate } from '@c8y/client';
import { ActionControl, AlertService, Column, ColumnDataType, Pagination } from '@c8y/ngx-components';
import { Observable } from 'rxjs';
import { EdgeService } from '../edge.service';
import { properCase, unCamelCase } from './cloud-helper';
//import { ThinEdgeConfiguration } from '../property.model';

export type RowStructure = {
  name: string;
  value: string;
};

@Component({
  selector: 'app-cloud',
  templateUrl: './cloud.component.html',
  styleUrls: ['./cloud.component.css']
})
export class CloudComponent implements OnInit {
  columns: Column[];

  constructor(private formBuilder: FormBuilder, private edgeService: EdgeService, private alertService: AlertService) {
    this.columns = this.getDefaultColumns();
  }

  loginForm: FormGroup;
  edgeConfiguration: any = {}
  rows$: Observable <RowStructure[]> ;
  rows: RowStructure[] = [];
  pagination: Pagination = {
    pageSize: 30,
    currentPage: 1,
  };

  actionControls: ActionControl[] = [];

  ngOnInit() {
    this.edgeService.getEdgeConfiguration().then(config => {
      this.edgeConfiguration = config
      this.loginForm.setValue({
        username: [this.edgeConfiguration.username ? this.edgeConfiguration.username : ''],
        tenantUrl: [this.edgeConfiguration['c8y.url'] ? this.edgeConfiguration['c8y.url'] : ''],
        password: [this.edgeConfiguration.password ? this.edgeConfiguration.password : ''],
      })
      console.log("Intialized configuration:", config)
    })
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      username: [this.edgeConfiguration.username ? this.edgeConfiguration.username : ''],
      tenantUrl: [this.edgeConfiguration['c8y.url'] ? this.edgeConfiguration['c8y.url'] : ''],
      password: [this.edgeConfiguration.password ? this.edgeConfiguration.password : ''],
    });
  }

  async login() {
    const up = {
      'c8y.url': this.loginForm.value.tenantUrl,
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    }
    this.edgeService.updateEdgeConfiguration(up);

    try {
      const res = await this.edgeService.initializeFetchClient()
      console.log("Login response:", res)
      this.alertService.success("Could log in to cloud tenant")
    } catch (err) {
      this.alertService.danger("Failed to login: " + err.message)
    }

    try {
      const { data, res } = await this.edgeService.getDetailsCloudDevice(this.edgeConfiguration['device.id'])
      // ignore those values that are object,because they look ugly when printed    
      Object.keys(data)
        .filter(key => typeof data[key] != 'object')
        .forEach(key => {
          this.rows.push(
            {
              name: properCase(unCamelCase(key)),
              value: data[key]
            })
        });

      // this.rows.push(
      //     {
      //       name: "Samstag",
      //       value: "10:00"
      //     },
      //     {
      //       name: "Sonntag",
      //       value: "12:00"
      //     },
      // )
      this.rows$ = new Observable<RowStructure[]> (observer => {
        observer.next(this.rows);
        observer.complete();
      })
        //console.log("Retrieved cloud data:", data)
    } catch (err) {
      this.alertService.danger("Failed to retrieve details: " + err.message)
    }
  }

  getDefaultColumns(): Column[] {
    return [
      {
        name: 'name',
        header: 'Name',
        path: 'name',
        filterable: true,
      },
      {
        header: 'Value',
        name: 'value',
        sortable: true,
        filterable: true,
        path: 'value',
        dataType: ColumnDataType.TextShort,
      },
    ];
  }
}
