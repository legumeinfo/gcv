// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         OnInit,
         ViewChild,
         ViewEncapsulation } from '@angular/core';
import { Observable }        from 'rxjs/Observable';

// App
import { AlignmentService }    from '../../services/alignment.service';
import { FilterService }       from '../../services/filter.service';
import { MicroTracks }         from '../../models/micro-tracks.model';
import { microTracksSelector } from '../../selectors/micro-tracks.selector';

declare var Split: any;

enum ContentTypes {
  VIEWERS,
  PLOTS
}

@Component({
  moduleId: module.id,
  selector: 'search',
  templateUrl: 'search.component.html',
  styleUrls: [ 'search.component.css' ],
  encapsulation: ViewEncapsulation.None
})

export class SearchComponent implements AfterViewInit, OnInit {
  @ViewChild('splitTop') splitTop: ElementRef;
  @ViewChild('splitBottom') splitBottom: ElementRef;

  contentTypes = ContentTypes;
  content;

  microTracks: Observable<MicroTracks>;
  microArgs = {
    'highlight': [],
    'geneClicked': function () {},
    'leftAxisClicked': function () {},
    'autoResize': true,
    'boldFirst': true
  };

  constructor(private _alignmentService: AlignmentService,
              private _filterService: FilterService) { }

  ngAfterViewInit(): void {
    Split([this.splitTop.nativeElement, this.splitBottom.nativeElement], {
      direction: 'vertical',
      minSize: 0
    });
  }

  ngOnInit(): void {
    this.showViewers();
    this.microTracks = Observable.combineLatest(
      this._alignmentService.tracks,
      this._filterService.regexp,
      this._filterService.order
    ).let(microTracksSelector({skipFirst: true}));
  }

  showViewers(): void {
    this.content = this.contentTypes.VIEWERS;
  }

  showPlots(): void {
    this.content = this.contentTypes.PLOTS;
  }
}
