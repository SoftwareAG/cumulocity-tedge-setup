import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { EdgeService } from '../edge.service';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.css']
})
export class AnalysisComponent implements OnInit, OnDestroy {
  title = 'node-express-angular';
  public showDialog: boolean = false;
  public onChangeConfig: EventEmitter<any> = new EventEmitter();
  subscription: any;

  constructor(private edgeService: EdgeService) { }
  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }


  public onCloseDialog(): void {
    this.showDialog = false;
  }

  public toogleDialog() {
    console.log("Show dialog", this.showDialog)
    this.showDialog = !this.showDialog
  }


  configurationChanged(event) {
    console.log("Configuration changed:", event)
    this.showDialog = false;
  }
  ngOnInit() {
    this.subscription = this.onChangeConfig.subscribe(config => {
      console.log("Configuration changed:", config)
      this.showDialog = false;
    })
  }
}