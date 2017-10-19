import { Component } from '@angular/core';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/styles.css';
import '../assets/css/gcv.css';

@Component({
  selector: 'gcv',
  template: `<router-outlet></router-outlet>`,
  styleUrls: [ 'app.component.css' ]
})

export class AppComponent { }
