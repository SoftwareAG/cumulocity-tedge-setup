import { Component, OnInit } from '@angular/core';
import { AlertService } from '@c8y/ngx-components';
import { EdgeService } from '../edge.service';


@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnInit {
  public showACreateCertificate: boolean = false;

  constructor(private edgeService: EdgeService, private alertService: AlertService) { }

  ngOnInit() {
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
  }
}
