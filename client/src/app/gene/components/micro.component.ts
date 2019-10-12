// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { Gene, Track } from '@gcv/gene/models';

@Component({
  selector: 'micro',
  styles: [`
    div {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
    }
  `],
  template: `
    <div #container></div>
  `,
})
export class MicroComponent implements AfterViewInit, OnDestroy {

  @Input() tracks: Observable<Track[]>;
  @Input() genes: Observable<Gene[]>;
  @Input() colors: any;  // D3 color function
  @Output() plot = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    combineLatest(
      this.tracks,
      this.genes)
      .pipe(
        takeUntil(this._destroy),
        map(([tracks, genes]) => this._shim(tracks, genes)))
      .subscribe((data) => this._draw(data));
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitPlot() {
    this.plot.emit();
  }

  // private

  // use the "breakpoint reversal sort" technique to identify segments
  // (inversions and rearrangements) and their orientations
  private _coordinatesToSegments(a: any[]) {
    const indexes = a.map((e, i) => i);
    indexes.sort((i, j) => a[j]-a[i]);
    let segment = indexes[0];
    const segments = {
        indexSegments: {},
        segmentOrientations: {}
      };
    segments.indexSegments[indexes[0]] = segment;
    const setSegmentOrientation = (i) => {
        const diff = indexes[i-1]-segment;
        segments.segmentOrientations[segment] = (diff < 0) ? '-' : '+';
      };
    for (let i = 1; i < indexes.length; i++) {
      let diff = indexes[i]-indexes[i-1];
      // a breakpoint
      if (diff !== 1 && diff !== -1) {
        setSegmentOrientation(i);
        segment = indexes[i];
      }
      segments.indexSegments[indexes[i]] = segment;
    }
    setSegmentOrientation(indexes.length);
    return segments;
  }

  // convert track and gene data into a visualization friendly format
  private _shim(tracks, genes) {
    const geneMap = {};
    genes.forEach((g) => {
      geneMap[g.name] = g;
    });
    return tracks.map((t, j) => {
      // make track
      const track = {
          genus: t.genus,
          species: t.species,
          chromosome_name: t.name,
          genes: []
        };
      // make track genes
      t.genes.forEach((name, i) => {
        const x = t.alignment[i];
        if (x !== null) {
          const gene = {
              name: name,
              family: t.families[i],
              x: x,
              fmin: 0,
              fmax: 0
            };
          if (name in geneMap) {
            Object.assign(gene, geneMap[name]);
          }
          track.genes.push(gene);
        }
      });
      // use track segments to assign y values and reverse strands
      const segments = this._coordinatesToSegments(track.genes.map((g) => g.x));
      let prevSegment = -1;
      let y = -1;
      track.genes.forEach((g, i) => {
        const segment = segments.indexSegments[i];
        const orientation = segments.segmentOrientations[segment];
        if (segment !== prevSegment) {
          y += 1;
        }
        g.y = y%2;
        g.segment = segment;
        if (g.strand !== undefined && orientation ===  '-') {
          g.strand *= -1;
        }
        prevSegment = segment;
      });
      return track;
    });
  }

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(data): void {
    this._destroyViewer();
    this._viewer = new GCV.visualization.Micro(
        this.container.nativeElement,
        this.colors,
        data,
        {autoResize: true});
  }
}
