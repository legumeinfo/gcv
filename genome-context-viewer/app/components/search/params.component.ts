import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'params',
  templateUrl: 'params.component.html',
  styleUrls: [ 'params.component.css' ]
})

export class ParamsComponent implements OnInit {
  ngOnInit(): void {
    // get data from service or url or localstorage?
  }
}
