import { Component } from '@angular/core';

import '../assets/css/styles.css';
import '../assets/css/split.css';

// GCV
import '../assets/css/gcv.css';
import '../assets/js/gcv/enhancement.js';
import '../assets/js/gcv/context.js';
import '../assets/js/gcv/min/plot.min.js';
import '../assets/js/gcv/min/viewer.min.js';
import '../assets/js/gcv/min/synteny.min.js';
import '../assets/js/gcv/min/legend.min.js';
import '../assets/js/gcv/min/alignment.min.js';
import '../assets/js/gcv/min/graph.min.js';

@Component({
  selector: 'gcv',
  template: `<router-outlet></router-outlet>`,
  styleUrls: [ 'app.component.css' ]
})

export class AppComponent { }
