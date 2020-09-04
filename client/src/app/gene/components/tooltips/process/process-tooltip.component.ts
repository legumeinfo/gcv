// Angular
import { Component, Input } from '@angular/core';
import { scan } from 'rxjs/operators';
// app
import { Process, ProcessStatus } from '@gcv/gene/models';
import { statusToClass, statusToIcon } from '@gcv/gene/components/pipeline.shim';


@Component({
  selector: 'gcv-process-tooltip',
  template: `
    <ng-container *ngIf="process.status|async; let processStatus">
      <ul class="list-group list-group-flush">
        <li class="list-group-item font-weight-bold {{ statusToClass(processStatus) }}">
          <i class="fas {{ statusToIcon(processStatus) }}"></i>&nbsp;<span [innerHTML]="processStatus.description"></span>
        </li>
        <ng-template ngFor let-subprocess [ngForOf]="subprocesses|async">
          <ng-container *ngIf="subprocess|async; let status">
            <li class="list-group-item {{ statusToClass(status) }}">
              <i class="fas {{ statusToIcon(status) }}"></i>&nbsp;<span [innerHTML]="status.description"></span>
            </li>
          </ng-container>
        </ng-template>
      </ul>
    </ng-container>
  `,
})
export class ProcessTooltipComponent {

  // IO

  @Input() process: Process;
  // aggregate subprocesses into array for iteration in template
  get subprocesses() {
    return this.process.subprocesses.pipe(
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, [])
    );
  }

  // public methods

  statusToClass(status: ProcessStatus): string {
    const c = statusToClass(status);
    return `list-group-item-${c}`;
  }

  statusToIcon(status: ProcessStatus): string {
    return statusToIcon(status);
  }

}
