import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlertService } from '@c8y/ngx-components';
import { Observable, Subscription } from 'rxjs';
import { EdgeService } from '../edge.service';
import { EdgeCMDProgress, ThinEdgeConfiguration } from '../property.model';


@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {
  refresh: EventEmitter<any> = new EventEmitter();
  public showACreateCertificate: boolean = false;
  edgeCMDProgress$: Observable<EdgeCMDProgress>;
  edgeCMDResult$: Observable<string>;
  subscriptionProgress; subscriptionResult: Subscription
  showStatusBar: boolean = false;
  message: string
  progress: number;
  commandTerminal: string
  command: string
  configutationForm: FormGroup
  edgeConfiguration: ThinEdgeConfiguration

  constructor(private edgeService: EdgeService, private alertService: AlertService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.initalizeTerminal()
    this.edgeService.getEdgeConfiguration().then ( config => {
      this.edgeConfiguration = config
    })
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
        this.commandTerminal = this.commandTerminal + "\r\n" + "# " + st.cmd
      }
      this.progress = 100 * (st.progress + 1) / st.total
    })
    this.edgeCMDResult$ = this.edgeService.getCMDResult()
    this.subscriptionResult = this.edgeCMDResult$.subscribe((st: string) => {
      this.commandTerminal = this.commandTerminal + st
    })
  }
  initForm() {
    this.configutationForm = this.formBuilder.group({
      tenantUrl: [this.edgeConfiguration.tenantUrl],
      deviceId: [this.edgeConfiguration.deviceId],
    });
  }

  startEdge() {
    this.command = 'start'
    this.initalizeTerminal()
    this.edgeService.sendCMDToEdge({ cmd: this.command })
    this.commandTerminal = "Starting Thin Edge ..."
  }

  configureEdge() {
    this.command = 'configure'
    this.initalizeTerminal()
    this.edgeService.sendCMDToEdge({
      cmd: this.command,
      deviceId: this.edgeConfiguration.deviceId,
      tenantUrl: this.edgeConfiguration.tenantUrl.replace('https://','').replace('/', '')
    })
    this.edgeService.getEdgeConfiguration().then ( config => {
      this.edgeConfiguration = config
    })
    this.commandTerminal = "Configure Thin Edge ..."
  }

  resetEdge() {
    this.command = 'reset'
    this.initalizeTerminal()
    this.edgeService.sendCMDToEdge({ cmd: this.command })
    this.edgeService.getEdgeConfiguration().then ( config => {
      this.edgeConfiguration = config
    })
    this.commandTerminal = "Resetting Thin Edge ..."
  }

  async downloadCertificate() {
    this.commandTerminal = "Download Certificate  ..."
    try {
      const data = await this.edgeService.downloadCertificate()
      const url= window.URL.createObjectURL(data);
      window.open(url);
      console.log("New download:", url)
      //window.location.assign(res.url);
    } catch (error) {
      console.log(error);
      this.alertService.danger(`Download failed!`)
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