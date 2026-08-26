import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { SearchWidgetComponent } from './search-widget.component';
import { AbstractSearchWidgetComponent } from './abstract-search-widget.component';
import { AppConfig, Server } from '@gcv/core/models';

// Exercises the real DOM: typing into the input, clicking Search, and the
// route → input binding. The widget is the app's search entry point and was
// previously only covered indirectly by the Playwright suite.

describe('SearchWidgetComponent (DOM)', () => {
  let fixture: ComponentFixture<SearchWidgetComponent>;
  let component: SearchWidgetComponent;
  let navigateByUrl: jest.Mock;
  let routeQueryParams: any;

  beforeEach(async () => {
    navigateByUrl = jest.fn();
    routeQueryParams = of({});

    // AppConfig is a throw-on-reinstantiate singleton; create once, reset each run.
    const appConfig = AppConfig.instance ?? new AppConfig();
    appConfig.servers = [
      { id: 'lis', name: 'LIS', search: {} },
      { id: 'nolabel', name: 'No Search Endpoint' }, // lacks `search` → filtered out
    ] as unknown as Server[];
    appConfig.miscellaneous = {
      searchHelpText: 'Try <b>Phvul.002G100400</b>',
    } as any;

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [AbstractSearchWidgetComponent, SearchWidgetComponent],
      providers: [
        { provide: AppConfig, useValue: appConfig },
        { provide: Router, useValue: { navigateByUrl } },
        // getter so a test can swap the params before the component initializes
        {
          provide: ActivatedRoute,
          useValue: {
            get queryParams() {
              return routeQueryParams;
            },
          },
        },
      ],
    }).compileComponents();
  });

  function create(): void {
    fixture = TestBed.createComponent(SearchWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('defaults sources to only the servers exposing a search endpoint', () => {
    create();
    expect(component.model.sources).toEqual(['lis']);
  });

  it('navigates to /search with the typed query and sources on submit', fakeAsync(() => {
    create();
    tick(); // let the template-driven NgModel register its control

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('#query-search');
    input.value = 'Glyma.09G134900';
    input.dispatchEvent(new Event('input')); // drive ngModel view → model
    tick();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement
    ).click();

    expect(navigateByUrl).toHaveBeenCalledWith(
      '/search?q=Glyma.09G134900&sources=lis',
    );
  }));

  it('does not navigate when the query is empty', () => {
    create();
    (
      fixture.nativeElement.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement
    ).click();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('populates the query field from the ?q= route param on init', fakeAsync(() => {
    routeQueryParams = of({ q: 'Medtr3g110360' });
    create();
    tick(); // flush NgModel registration so the model value reaches the input
    fixture.detectChanges();

    expect(component.model.query).toBe('Medtr3g110360');
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('#query-search');
    expect(input.value).toBe('Medtr3g110360');
  }));
});
