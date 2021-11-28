
import { Component, OnInit, EventEmitter, Output, Input} from '@angular/core';
import { RawListItem } from '../property.model';
import { rangeUnits } from './widget-helper';

@Component({
  selector: 'cumulocity-datapoints-charting-config',
  templateUrl: './cumulocity-datapoints-charting-config.component.html',
  styleUrls: ['./cumulocity-datapoints-charting-config.component.less']
})
export class CumulocityDatapointsChartingConfigComponent implements OnInit {

  constructor() { }
  @Output() onChangeConfig = new EventEmitter<any>();
  @Input() config;

  rangeUnits: RawListItem[] = rangeUnits

  ngOnInit() {
  }

  public onChangeClicked(): void {
    this.onChangeConfig.emit(this.config);
  }

  public updateConfig(): void {
    console.log("Update configuration", this.config)
  }
}
