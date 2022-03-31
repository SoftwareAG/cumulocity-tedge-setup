import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '@c8y/ngx-components';
import { Observable, Subscription } from 'rxjs';
import { EdgeService } from '../edge.service';
import { EdgeCMDProgress } from '../property.model';


@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {
  refresh: EventEmitter<any> = new EventEmitter();
  public showCreateCertificate: boolean = false;
  edgeCMDProgress$: Observable<EdgeCMDProgress>;
  edgeCMDResult$: Observable<string>;
  subscriptionProgress; subscriptionResult: Subscription
  showStatusBar: boolean = false;
  message: string
  progress: number;
  commandTerminal: string
  command: string
  configurationForm: FormGroup
  loginForm: FormGroup;
  edgeConfiguration: any = {}

  constructor(private edgeService: EdgeService, private alertService: AlertService, private formBuilder: FormBuilder) {
   }

  ngOnInit() {
    this.initalizeTerminal()
    this.getNewConfiguration()
    this.initForm()
    this.edgeCMDProgress$ = this.edgeService.getCMDProgress()
    this.subscriptionProgress = this.edgeCMDProgress$.subscribe((st: EdgeCMDProgress) => {
      if (st.status == 'error') {
        this.message = "failed"
        this.alertService.danger(`Running command ${this.command} failed at step: ${st.progress}`)
        this.commandTerminal = this.commandTerminal + "\r\n" + "# "
        this.showStatusBar = false
      } else if (st.status == 'end-job') {
        this.message = "success"
        this.alertService.success(`Successfully completted command ${this.command}`)
        this.commandTerminal = this.commandTerminal + "\r\n" + "# "
        this.showStatusBar = false
      } else if (st.cmd) {
        this.commandTerminal = this.commandTerminal + "\r\n" + "# " + st.cmd + "\r\n"
      }
      this.progress = 100 * (st.progress + 1) / st.total
    })
    this.edgeCMDResult$ = this.edgeService.getCMDResult()
    this.subscriptionResult = this.edgeCMDResult$.subscribe((st: string) => {
      this.commandTerminal = this.commandTerminal + st
    })
  }
  initForm() {
    this.configurationForm = this.formBuilder.group({
      tenantUrl: [(this.edgeConfiguration['c8y.url'] ? this.edgeConfiguration['c8y.url']: ''), Validators.required],
      deviceId: [(this.edgeConfiguration['device.id'] ? this.edgeConfiguration['device.id']: ''), Validators.required],
    });

    this.loginForm = this.formBuilder.group({
      username: [this.edgeConfiguration.username ? this.edgeConfiguration.username : ''],
      password: [this.edgeConfiguration.password ? this.edgeConfiguration.password : ''],
    });
  }

  startEdge() {
    this.command = 'start'
    this.initalizeTerminal()
    this.edgeService.sendCMDToEdge({ cmd: this.command })
    this.commandTerminal = "Starting Thin Edge ..."
  }

  stopEdge() {
    this.command = 'stop'
    this.initalizeTerminal()
    this.edgeService.sendCMDToEdge({ cmd: this.command })
    this.commandTerminal = "Stopping Thin Edge ..."
  }

  configureEdge() {
    const up = {
      'device.id': this.configurationForm.value.deviceId,
      'c8y.url': this.configurationForm.value.tenantUrl,
    }
    this.edgeService.updateEdgeConfiguration (up);
    this.getNewConfiguration()
    this.command = 'configure'
    this.initalizeTerminal()
    let url =  this.configurationForm.controls['tenantUrl'].value.replace('https://','').replace('/', '')
    this.edgeService.sendCMDToEdge({
      cmd: this.command,
      deviceId: this.configurationForm.value.deviceId,
      tenantUrl: url
    })
    this.commandTerminal = "Configure Thin Edge ..."
  }
  getNewConfiguration() {
    this.edgeService.getEdgeConfiguration().then ( config => {
      this.edgeConfiguration = config
      this.configurationForm.setValue ({
        tenantUrl: this.edgeConfiguration['c8y.url'] ? this.edgeConfiguration['c8y.url']: '',
        deviceId: this.edgeConfiguration['device.id'] ? this.edgeConfiguration['device.id']: '',
      })
    })
  }

  resetEdge() {
    this.command = 'reset'
    this.initalizeTerminal()
    this.edgeService.sendCMDToEdge({ cmd: this.command })
    this.getNewConfiguration()
    this.commandTerminal = "Resetting Thin Edge ..."
  }

  async downloadCertificate() {
    this.commandTerminal = "Download Certificate  ..."
    try {
      const data = await this.edgeService.downloadCertificate("blob")
      const url= window.URL.createObjectURL(data);
      window.open(url);
      console.log("New download:", url)
      //window.location.assign(res.url);
    } catch (error) {
      console.log(error);
      this.alertService.danger(`Download failed!`)
    }
  }

  async updateCloudConfiguration(){
    const up = {
      'c8y.url': this.loginForm.value.tenantUrl,
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    }
    this.edgeService.updateEdgeConfiguration(up);
    let res = await this.edgeService.initFetchClient();
  }

  async upload() {
    this.updateCloudConfiguration();

    try {
      const res = await this.edgeService.uploadCertificate()
      console.log("Upload response:", res)
      if (res.status < 300){
        this.alertService.success("Uploaded certificate to cloud tenant")
      } else {
        this.alertService.danger("Failed to upload certificate!")
      }
    } catch (err) {
      this.alertService.danger("Failed to upload certificate: " + err.message)
    }

  }

  onChange (event) {
    console.log("Change event:", event)
  }
  onKeydown (event) {
    if (event.key === "Enter") {
      console.log("Execute:",event);
    } else {
    console.log("Ignoring:", event)
    }
  }
  initalizeTerminal() {
    this.showStatusBar = true
    this.commandTerminal = "# "
    this.message = ""
  }

  ngOnDestroy() {
    this.subscriptionResult.unsubscribe();
    this.subscriptionProgress.unsubscribe();
  }
}