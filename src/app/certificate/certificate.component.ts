import { Component, EventEmitter, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { EdgeService } from '../edge.service';
import { StatusEdgeStart } from '../property.model';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnInit {
  refresh: EventEmitter<any> = new EventEmitter();
  public showACreateCertificate: boolean = false;
  statusEdgeStart$: Observable<StatusEdgeStart>;

  constructor(private edgeService: EdgeService) { }

  ngOnInit() {}

  startEdge()  {
    this.edgeService.startEdge("Start Thin Edge");
    this.statusEdgeStart$ = this.edgeService.getStatusEdgeStart()
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
}
