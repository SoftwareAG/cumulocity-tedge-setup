import { Component, EventEmitter, OnInit } from '@angular/core';
import { AlertService } from '@c8y/ngx-components';
import { Observable, Subscription } from 'rxjs';
import { EdgeService } from '../edge.service';
import { EdgeCMDProgress } from '../property.model';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnInit {
  refresh: EventEmitter<any> = new EventEmitter();
  public showACreateCertificate: boolean = false;
  edgeCMDProgress$: Observable<EdgeCMDProgress>;
  edgeCMDResult$: Observable<string>;
  subscriptionProgress; subscriptionResult: Subscription
  showStatusBar: boolean = false;
  message: string
  progress: number;
  commandTerminal: string

  constructor(private edgeService: EdgeService, private alertService: AlertService) { }

  ngOnInit() {
    this.commandTerminal = "# " 
    this.message = "starting ..."
     this.edgeCMDProgress$ = this.edgeService.getCMDProgress()
     this.subscriptionProgress = this.edgeCMDProgress$.subscribe ((st: EdgeCMDProgress) =>  {
        if ( st.status == 'error') {
          this.message = "failed"
          this.alertService.danger (`Starting Thin Edge failed at step: ${st.progress}`)
          //this.showStatusBar = false
        } else if (st.status == 'end-job') {
          this.message = "success"
          this.alertService.success (`Successfully started Thin Edge.`)
          //this.showStatusBar = false
        } else if (st.cmd) {
          this.commandTerminal = this.commandTerminal + "\r\n" + "# "  + st.cmd
        }
        this.progress = 100 * (st.progress + 1) / st.total
     })
     this.edgeCMDResult$ = this.edgeService.getCMDResult()
     this.subscriptionResult = this.edgeCMDResult$.subscribe ((st: string) =>  {
        this.commandTerminal = this.commandTerminal + "\r\n"  + st
   })
  }

  startEdge()  {
    this.edgeService.sendCMDToEdge({cmd: 'start'})
    this.showStatusBar = true
    this.commandTerminal = "Starting Thin Edge ..."
   
  }
  private showManageCertificateDialog(): void {
    this.showACreateCertificate = true;
  }

  private hideManageCertificateDialog(): void {
    this.showACreateCertificate = false;
  }
  public onCloseCertificateDialog(): void {
    this.hideManageCertificateDialog();
  }

  ngOnDestroy(){
    this.subscriptionResult.unsubscribe();
    this.subscriptionProgress.unsubscribe();
  }
}
