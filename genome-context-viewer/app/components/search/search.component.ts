import { Component, OnInit } from '@angular/core';

enum ContentTypes {
  VIEWERS,
  PLOTS
}

@Component({
  moduleId: module.id,
  selector: 'search',
  templateUrl: 'search.component.html',
  styleUrls: [ 'search.component.css' ]
})

export class SearchComponent implements OnInit {
  contentTypes = ContentTypes;
  content;

  ngOnInit(): void {
    this.showViewers();
  }

  showViewers(): void {
    this.content = this.contentTypes.VIEWERS;
  }

  showPlots(): void {
    this.content = this.contentTypes.PLOTS;
  }
}
