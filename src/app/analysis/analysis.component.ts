import { Component, OnInit } from '@angular/core';
import { EdgeService } from '../edge.service';
import { IMeasurementCreate } from '@c8y/client';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.css']
})
export class AnalysisComponent implements OnInit {
  title = 'node-express-angular';
  status = 'DOWN';
  result: any;
  cmd: any;
  cmdError: any;

  constructor(private edgeService: EdgeService) { }

  ngOnInit() {
 
    
    this.edgeService
      .getStatus()
      .then((result: any) => {
        this.status = result.status;
      });

    this.edgeService
      .calc(10, 20)
      .then((result: any) => {
        this.result = result.result;
      });

    this.edgeService
      .runCmd("ls", ["-la"])
      .then((result: any) => {
        this.cmd = result;
        //console.log("Result in angular:", result);
      });

    this.edgeService
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
