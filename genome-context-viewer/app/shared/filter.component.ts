import { Component } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'filter',
  template: `
    <form class="navbar-form navbar-left">
      <div class="form-group">
        <input type="text" class="form-control" placeholder="e.g. name1|name4|name2">
      </div>
      <button type="submit" class="btn btn-default">Filter</button>
    </form>
  `,
  styles: [ '' ]
})

export class FilterComponent { }
