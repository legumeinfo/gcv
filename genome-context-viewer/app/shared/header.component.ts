import { Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
  moduleId: module.id,
  selector: 'header',
  templateUrl: 'header.component.html',
  styleUrls: [ 'header.component.css' ]
})

export class HeaderComponent implements OnInit {
  ngOnInit(): void {
    this.toggleBrand();
  }

  toggleBrand(): void {
    $('.navbar-brand span').animate({width: 'toggle'}, 150);
  }
}
