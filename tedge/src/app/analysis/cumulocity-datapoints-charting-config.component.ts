
import { Component, OnInit, EventEmitter, Output, Input} from '@angular/core';
import { EdgeService } from '../edge.service';
import { MeasurmentType, RawListItem } from '../property.model';
import { rangeUnits } from './widget-helper';

@Component({
  selector: 'cumulocity-datapoints-charting-config',
  templateUrl: './cumulocity-datapoints-charting-config.component.html',
  styleUrls: ['./cumulocity-datapoints-charting-config.component.less']
})
export class CumulocityDatapointsChartingConfigComponent implements OnInit {

  constructor(public edgeService: EdgeService) { }

  @Output() onChangeConfig = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<any>();
  @Input() config;
  measurementTypes: MeasurmentType[] = []
  isHidden: boolean = false;

  rangeUnits: RawListItem[] = rangeUnits

  async ngOnInit() {
    this.measurementTypes = await this.edgeService.getSeries();
  }

  public onSaveClicked(): void {
    this.onChangeConfig.emit(this.config);
  }

  public onCloseClicked(): void {
    this.onClose.emit();
  }

  public updateConfig(): void {
    console.log("Update configuration", this.config)
  }

  public updateFitAxis() {
    console.log("Adapting fit, before:", this.config)
    this.config.fitAxis = !this.config.fitAxis
    if (this.config.fitAxis) {
      delete this.config.rangeLow;
      delete this.config.rangeHigh;
    }
    console.log("Adapting fit, after:", this.config)
  }
}