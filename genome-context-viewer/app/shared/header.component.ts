import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'header',
  templateUrl: 'header.component.html',
  styleUrls: [ 'header.component.css' ]
})

export class HeaderComponent implements OnInit {
  ngOnInit(): void {
    $('.navbar-brand span').hide();
  }

  toggleBrand(): void {
    $('.navbar-brand span').animate({width: 'toggle'}, 150);
  }
}
