import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EdgeService } from '../edge.service';
import { RawListItem } from '../property.model';
import { rangeUnits } from './widget-helper';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.css']
})
export class AnalysisComponent implements OnInit, OnDestroy {

  public showDialog: boolean = false;
  public onChangeConfig: EventEmitter<any> = new EventEmitter();

  rangeUnits: RawListItem[] = rangeUnits
  config: any = {
    rangeUnit: 2,
    rangeUnitCount : 30,
    diagramName: 'Analytics'
  }

  constructor(private edgeService: EdgeService) { }
    
  async ngOnInit() {
    let c = await this.edgeService.getAnalyticsConfiguration()
    console.log("Loaded configuration :", c)
    this.config = {
      ...this.config,
      ...c
    }
  }
  configurationChanged(event) {
    console.log("Configuration changed:", event)
    this.edgeService.setAnalyticsConfiguration(event).then( c => {
      this.config = c
      console.log("Configuration was saved:", c )
      
    })
    this.showDialog = false;
  }
  ngOnDestroy(): void {  }
}