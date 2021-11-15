import { Component, OnInit } from '@angular/core';
import { EdgeService } from '../edge.service';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.css']
})
export class AnalysisComponent implements OnInit {
  title = 'node-express-angular';

  constructor(private edgeService: EdgeService) { }

  ngOnInit() {
   
  }
}