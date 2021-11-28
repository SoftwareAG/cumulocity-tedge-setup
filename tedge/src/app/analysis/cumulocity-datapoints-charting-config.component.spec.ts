import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CumulocityDatapointsChartingConfigComponent } from './cumulocity-datapoints-charting-config.component';

describe('CumulocityDatapointsChartingConfigComponent', () => {
  let component: CumulocityDatapointsChartingConfigComponent;
  let fixture: ComponentFixture<CumulocityDatapointsChartingConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CumulocityDatapointsChartingConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CumulocityDatapointsChartingConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
