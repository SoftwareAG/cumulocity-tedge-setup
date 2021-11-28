import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { EdgeService } from '../edge.service';
//import { Terminal } from "xterm";

@Component({
  selector: 'app-configuration',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.less', './xterm.css'],
  encapsulation: ViewEncapsulation.None,
})
export class StatusComponent implements OnInit {
//  public term: Terminal;
  container: HTMLElement;
  status: string;
  configuration: string
  constructor(private edgeService: EdgeService,) { }

  
  @ViewChild('myTerminal', {static: false}) terminalDiv: ElementRef;

  ngOnInit() {
    this.edgeService.getEdgeConfiguration().then( data => {
      //console.log ("Result configuration", data )
      const remove = ['password'];

      Object.keys(data)
        .filter(key => remove.includes(key))
        .forEach(key => delete data[key]);
      this.configuration =  data //JSON.stringify(data, null, "\t")
    })

    this.edgeService.getEdgeStatus().then( data => {
      console.log ("Result status", data )
      this.status =  data.result
    })

  }
/*   ngAfterViewInit (){
    this.term = new Terminal();
    this.term.open(this.terminalDiv.nativeElement);
    this.term.writeln('Welcome to xterm.js');
    this.term.onData( (data) => {
      this.term.write(data);
   }); */

  }
