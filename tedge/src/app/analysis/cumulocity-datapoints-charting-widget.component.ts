/**
 * /*
 * Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @format
 */

 import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
 import { BaseChartDirective, Color, Label, ThemeService } from 'ng2-charts';
 import { ChartDataSets, ChartOptions, ChartPoint } from 'chart.js';
 import { EdgeService } from '../edge.service';
 import { DatePipe } from '@angular/common';
 import * as _ from "lodash";
 import * as moment from "moment";
 import { Observable, Subscription, timer } from 'rxjs';
 import { RawMeasurment } from '../property.model';
 import { flatten, generateNextColor, rangeUnits } from './widget-helper';
 
 @Component({
   selector: "cumulocity-datapoints-charting-widget",
   templateUrl: "./cumulocity-datapoints-charting-widget.component.html",
   styleUrls: ["./cumulocity-datapoints-charting-widget.component.css"],
   providers: [DatePipe, ThemeService]
 })
 
 export class CumulocityDatapointsChartingWidget implements OnDestroy, OnInit, OnChanges {
 
   @ViewChild(BaseChartDirective, { static: true })
   chart: BaseChartDirective;
 
   @Input() config;
   chartType = "line";
   chartData: ChartDataSets[] = [
     //  { data: [], label: "Number of Events", fill: false }
   ];
   chartColors: Color[] = [
     // {
     //   borderColor: "#039BE5",
     //   pointBackgroundColor: "#039BE5"
     // }
   ];
 
   chartLabels: Label[] = []
   chartDataPointList: { [name: string]: number } = { index: 0 };
 
   //rangeUnit: number =  1;
   //rangeUnitCount = 30; // 5 minutes
 
   chartOptions: ChartOptions = {
     // animation: {
     //   animateScale: false,
     //   animateRotate: true,
     //   duration: 1000,
     //   easing: 'linear',
     // },
     elements: {
       line: {
         tension: 0
       }
     },
     responsive: true,
     maintainAspectRatio: false,
     scales: {
       yAxes: [
         {
           ticks: {
             //beginAtZero: true
           },
         },
       ],
       xAxes: [
         {
           type: 'time',
           time: {
             unit: 'second',
             display: true,
             displayFormats: {
               second: 'h:mm:ss a',
               minute: 'h:mm a',
               hour: 'hA',
               day: 'MMM D',
               week: '"week ll',
               month: 'MMM YYYY',
               quarter: '[Q]Q - YYYY',
               year: 'YYYY'
             }
           },
           ticks: {
             autoSkip: true,
             maxTicksLimit: 20
           }
         },
       ],
     },
   };
 
   subscriptionMongoMeasurement: Subscription;
   measurements$: Observable<RawMeasurment>
 
   constructor(
     private edgeService: EdgeService,
   ) { }
 
 
   /**
    * These are the main interfaces to the config
    * and the measurements
    */
 
   ngOnInit() {
     console.log("Widget config:", this.config)
 
     // send empty data to advance graph
     timer(0, 1000).pipe().subscribe(y => {
       const ts = Date.now();
       let t: RawMeasurment = {
         datetime: new Date(),
         payload: ''
       }
       this.pushEventToChartData(t)
     });
 
     this.measurements$ = this.edgeService.getMeasurements()
     this.subscriptionMongoMeasurement = this.measurements$.subscribe((m: RawMeasurment) => {
       //console.log("New Mongo Measurement", m)
       this.pushEventToChartData(m)
     })
     //console.log("Really key",  this.chartData.length)
   }
 
   ngOnChanges(changes: SimpleChanges) {
     for (const propName in changes) {
       const changedProp = changes[propName];
       let fitAxis = (changedProp.currentValue.fitAxis === 'true')
       console.log("Changed config", changedProp, propName, parseInt(changedProp.currentValue.rangeLow), fitAxis)
       if (propName == "config") {
         let options  = {
           responsive: true,
           maintainAspectRatio: true,
           scales: {
             yAxes: [
               {
                 ticks: {
                   //beginAtZero: true
                 },
               },
             ],
             xAxes: [{
               type: 'time',
               time: {
                 unit: rangeUnits[changedProp.currentValue.rangeUnit].unit,
                 display: true,
                displayFormats: {
                  second: 'h:mm:ss a',
                  minute: 'h:mm a',
                  hour: 'hA',
                  day: 'MMM D',
                  week: 'week ll',
                  month: 'MMM YYYY',
                  quarter: '[Q]Q - YYYY',
                  year: 'YYYY'
                }
               },
               ticks: {
                 autoSkip: true,
                 maxTicksLimit: 20,
                //  callback: function(value, index, labels)  {
                //   // Hide the label of every 2nd dataset
                //   return index % 2 === 0 ? labels[index].value : '';
                // },          
               }
             }
             ]
           }
         }
         if (parseInt(changedProp.currentValue.rangeLow)) {
           options.scales.yAxes[0].ticks['min']= parseInt(changedProp.currentValue.rangeLow)
         }
         if (parseInt(changedProp.currentValue.rangeHigh)) {
           options.scales.yAxes[0].ticks['max'] = parseInt(changedProp.currentValue.rangeHigh)
         }
         this.chartOptions = {
           ...this.chartOptions,
           ...options
 
         } as ChartOptions
         console.log("Display", this.chartOptions.scales.xAxes);
         //console.log("Now can change config", changedProp.currentValue.rangeLow, changedProp.currentValue.rangeHigh)
       }
     }
   } 
   private pushEventToChartData(event: RawMeasurment): void {
     const _chartData = this.chartData;
     const _chartLabels = this.chartLabels
 
     // mysterious bug to remove undefined series
     if (this.chartDataPointList.index == 0 && _chartData.length == 1 && _chartData[0].label == undefined) {
       _chartData.splice(0, 1);
     }
 
     // test for event with payload
     if(event && event.payload) {
       let flat = flatten(event.payload)
       //console.log("Log initial ", flat, event);
       for (let key in flat) {
         //console.log("Testing key", this.chartDataPointList[key], key);
         if (key.endsWith('value')) {
           // test if key is already in chartDataPoint
           // add new series
           if (this.chartDataPointList[key] === undefined) {
             _chartData.push({ data: [], label: key.replace(".value",""), fill: false })
             let nextColor = generateNextColor(this.chartDataPointList.index)
             this.chartColors.push({
               borderColor: nextColor,
               pointBackgroundColor: nextColor
             })
             this.chartDataPointList[key] = this.chartDataPointList.index
             //console.log("Adding key", this.chartDataPointList[key], key);
             ++this.chartDataPointList.index
           }
           let dp: ChartPoint = {
             x: moment.parseZone(event.datetime),
             y: flat[key]
           };
           //console.log("New DataPoint",dp );
           (_chartData[this.chartDataPointList[key]].data as ChartPoint[]).push(dp)
          //  _chartData.forEach (cd => {
          //    console.log("Prüfung:", cd.data.length, cd.label)
          //  })
         } else {
           //console.log("Ignore key", this.chartDataPointList[key], key);
         }
       }
       _chartLabels.push(this.getLabel(event));
 
       // test if measuerments by count should be deleted
       if ( rangeUnits[this.config.rangeUnit].id != 0 ) {
         // remove outdated data and labels
         let { from, to } = this.getDateRange();
         _chartData.forEach(cd => {
           //console.log("Comparing label", cd.label, cd.data.length, moment(cd.data['x']).toISOString(), moment(from).toISOString())
           while (cd.data.length>0 && moment(cd.data[0]['x']).isBefore(moment(from))) {
             //console.log("Removing label", cd.data[0])
             cd.data.shift();
           }
          })
          while (moment(_chartLabels[0]).isBefore(moment(from))) {
            _chartLabels.shift();
          }
       } else {
         _chartData.forEach(cd => {
           //console.log("Comparing label", cd.label, cd.data.length, moment(cd.data['x']).toISOString(), moment(from).toISOString())
           while (cd.data.length > this.config.rangeUnitCount) {
             //console.log("Removing label", cd.data[0])
             cd.data.shift();
           }
           while ( _chartLabels.length > this.config.rangeUnitCount) {
             _chartLabels.shift();
           }
         })
 
       }
 
       //console.log("L", _chartData.length)
       this.chartData = _chartData
       this.chartLabels = _chartLabels
       this.update()
     }
   }
 
   private getLabel(event: RawMeasurment): string {
     let formattedDate = moment.parseZone(event.datetime)
     return formattedDate.toISOString()
   }
 
   private update() {
     if (this.chart)
       this.chart.chart.update();
   }
 
   private getDateRange(): { from: Date; to: Date; } {
     let to = Date.now();
 
     let from = new Date(to - rangeUnits[this.config.rangeUnit].id * this.config.rangeUnitCount * 1000);
     return { from, to: new Date(to) };
   }
 
   ngOnDestroy() {
     this.subscriptionMongoMeasurement.unsubscribe();
     this.edgeService.stopMeasurements();
   }
 }
 