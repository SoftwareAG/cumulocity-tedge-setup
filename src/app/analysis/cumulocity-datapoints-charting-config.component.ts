
import { Component, OnInit, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'cumulocity-datapoints-charting-config',
  templateUrl: './cumulocity-datapoints-charting-config.component.html',
  styleUrls: ['./cumulocity-datapoints-charting-config.component.less']
})
export class CumulocityDatapointsChartingConfigComponent implements OnInit {

  constructor() { }
  @Output() onChangeConfig = new EventEmitter<any>();
  ngOnInit() {
  }

  public onChangeClicked(): void {

    this.onChangeConfig.emit({config: "changed"});
  }
}
