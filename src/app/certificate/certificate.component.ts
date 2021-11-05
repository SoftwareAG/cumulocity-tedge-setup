import { Component, EventEmitter, OnInit } from '@angular/core';
import { EdgeService } from '../edge.service';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnInit {
  refresh: EventEmitter<any> = new EventEmitter();
  public showACreateCertificate: boolean = false;

  constructor() {}

  ngOnInit() {}


  private showManageCertificateDialog(): void {
    this.showACreateCertificate = true;
  }

  private hideManageCertificateDialog(): void {
    this.showACreateCertificate = false;
  }
  public onCloseCertificateDialog(): void {
    this.hideManageCertificateDialog();
  }
}
