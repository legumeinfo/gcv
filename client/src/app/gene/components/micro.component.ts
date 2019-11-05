// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { Gene, Track } from '@gcv/gene/models';
import { GeneService, MicroTracksService } from '@gcv/gene/services';


@Component({
  selector: 'micro',
  styleUrls: ['./golden-content.scss'],
  template: `
    <div #container></div>
  `,
})
export class MicroComponent implements AfterViewInit, OnDestroy {

  @Input() queryTracks: Observable<Track[]>;
  @Input() tracks: Observable<Track[]>;
  @Input() genes: Observable<Gene[]>;
  @Input() colors: any;  // D3 color function
  @Input() options: any = {};
  @Output() plotClick = new EventEmitter();
  @Output() geneClick = new EventEmitter();
  @Output() nameClick = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    combineLatest(this.queryTracks, this.tracks, this.genes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([queryTracks, tracks, genes]) => {
        this._draw(queryTracks, tracks, genes);
      });
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitPlot(track, queryTracks) {
    this.plotClick.emit({track, queryTracks});
  }

  emitGene(gene, family, source) {
    this.geneClick.emit({gene, family, source});
  }

  emitName(track) {
    this.nameClick.emit({track});
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
    genes.forEach((g) => geneMap[g.name] = g);
    return tracks.map((t, j) => {
      // make track
      const track = {
          source: t.source,
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

  private _draw(queryTracks, tracks, genes): void {
    const data = this._shim(tracks, genes);
    this._destroyViewer();
    let options = {
        bold: queryTracks.map((t) => t.name),
        plotClick: (t, i) => this.emitPlot(tracks[i], queryTracks),
        geneClick: (t, g, i) => this.emitGene(g.name, g.family, t.source),
        nameClick: (t, i) => this.emitName(tracks[i])
      };
    options = Object.assign(options, this.options);
    this._viewer = new GCV.visualization.Micro(
        this.container.nativeElement,
        this.colors,
        data,
        options);
  }
}

export function microConfigFactory(
  clusterID: number,
  microTracksService: MicroTracksService,
  geneService: GeneService,
  outputs: any={})
{
  const id = `micro${clusterID}`;
  const options = {autoResize: true};
  let _outputs = {
      plotClick: (id, track, queryTracks) => { /* no-op */ },
      geneClick: (id, gene, family, source) => { /* no-op */ },
      nameClick: (id, track) => { /* no-op */ },
    };
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'micro',
    id: id,
    title: `Micro Synteny Cluster ${clusterID}`,
    componentState: {
      inputs: {
        queryTracks: microTracksService.getSelectedClusterTracks(clusterID),
        tracks: microTracksService.getCluster(clusterID),
        genes: geneService.getClusterGenes(clusterID),
        colors: GCV.common.colors,
        options
      },
      outputs: {
        plotClick: ({track, queryTracks}) => {
          _outputs.plotClick(id, track, queryTracks);
        },
        geneClick: ({gene, family, source}) => {
          _outputs.geneClick(id, gene, family, source);
        },
        nameClick: ({track}) => _outputs.nameClick(id, track),
      },
    },
    isClosable: false
  };
}
