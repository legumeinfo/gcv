// Angular
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
// app
import { Process, ProcessStatus, ProcessStatusStream } from '@gcv/gene/models';
import { statusToClass, statusToIcon } from '@gcv/gene/components/pipeline.shim';


@Component({
    selector: 'gcv-process-tooltip',
    template: `
    @if (process.status|async; as processStatus) {
      <ul class="list-group list-group-flush">
        <li class="list-group-item fw-bold {{ statusToClass(processStatus) }}">
          <i class="fas {{ statusToIcon(processStatus) }}"></i>&nbsp;<span [innerHTML]="processStatus.description"></span>
        </li>
        @for (subprocess of subprocesses|async; track subprocess) {
          @if (subprocess|async; as status) {
            <li class="list-group-item {{ statusToClass(status) }}">
              <i class="fas {{ statusToIcon(status) }}"></i>&nbsp;<span [innerHTML]="status.description"></span>
            </li>
          }
        }
      </ul>
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProcessTooltipComponent {

  // IO

  @Input() process: Process;

  // aggregate subprocesses into array for iteration in template
  get subprocesses(): Observable<ProcessStatusStream[]> {
    return this.process.subprocesses.pipe(
      scan((accumulator, stream): ProcessStatusStream[] => {
        accumulator.push(stream);
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
