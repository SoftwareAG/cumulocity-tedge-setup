import { Component, OnInit } from '@angular/core';
import { StatusService } from '../status.service';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnInit {
  title = 'node-express-angular';
  status = 'DOWN';
  result: any;
  cmd: any;
  cmdError: any;

  constructor(private statusService: StatusService) { }

  ngOnInit() {
    this.statusService
      .getStatus()
      .then((result: any) => {
        this.status = result.status;
      });

    this.statusService
      .calc(10, 20)
      .then((result: any) => {
        this.result = result.result;
      });

    this.statusService
      .runCmd("ls", ["-la"])
      .then((result: any) => {
        this.cmd = result;
        console.log("Result in angular:", result);
      });

    this.statusService
      .runCmd("lxwrong", ["-la"])
      .then((result: any) => {
        this.cmdError = result.data;
        console.log("Should never be called:", result.data);
      }).catch(
        (err) => {
          this.cmdError = err.message;
          console.log("Should be called, since error:", err);
      });
  }

}
