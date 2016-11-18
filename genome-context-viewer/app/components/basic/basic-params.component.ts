import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'basic-params',
  templateUrl: 'basic-params.component.html',
  styleUrls: [ 'basic-params.component.css' ]
})

export class BasicParamsComponent implements OnInit {
  ngOnInit(): void {
    // get data from service or location or location storage?
  }
}
