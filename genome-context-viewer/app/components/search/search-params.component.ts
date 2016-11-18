import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'search-params',
  templateUrl: 'search-params.component.html',
  styleUrls: [ 'search-params.component.css' ]
})

export class SearchParamsComponent implements OnInit {
  ngOnInit(): void {
    // get data from service or url or localstorage?
  }
}
