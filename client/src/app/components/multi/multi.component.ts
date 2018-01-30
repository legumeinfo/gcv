// Angular + dependencies
import { AfterViewInit,
         Component,
         ElementRef,
         ViewChild,
         ViewEncapsulation } from '@angular/core';
import { Observable }        from 'rxjs/Observable';
import * as Split            from 'split.js';
import { GCV }               from '../../../assets/js/gcv';

// App
import { AlignmentService }    from '../../services/alignment.service';
import { Family }              from '../../models/family.model';
import { FilterService }       from '../../services/filter.service';
import { Gene }                from '../../models/gene.model';
import { Group }               from '../../models/group.model';
import { MicroTracks }         from '../../models/micro-tracks.model';
import { microTracksSelector } from '../../selectors/micro-tracks.selector';
import { UrlService }          from '../../services/url.service';

enum AccordionTypes {
  REGEXP,
  ORDER
}

@Component({
  moduleId: module.id.toString(),
  selector: 'multi',
  templateUrl: 'multi.component.html',
  styleUrls: [ 'multi.component.css' ],
  encapsulation: ViewEncapsulation.None
})

export class MultiComponent implements AfterViewInit {
  // view children

  // EVIL: ElementRefs nested in switch cases are undefined when parent or child
  // AfterViewInit hooks are called, so routines that depend on them are called
  // via their setters.
  private _left: ElementRef;
  @ViewChild('left')
  set left(el: ElementRef) {
    this._left = el;
    this._splitViewers();
  }
  private _right: ElementRef;
  @ViewChild('right')
  set right(el: ElementRef) {
    this._right = el;
    this._splitViewers();
  }

  // UI

  // what to show in left slider
  selectedDetail;

  // micro viewer accordion
  accordionTypes = AccordionTypes;
  accordion = null;

  // data
  queryGenes: string[];
  microTracks: MicroTracks;
  microLegend: any;

  // viewers
  microColors = GCV.common.colors;
  microArgs: any;
  microLegendArgs: any;

  // constructor

  constructor(private _alignmentService: AlignmentService,
              private _filterService: FilterService,
              private _urlService: UrlService) {
    // subscribe to multi query genes
    this._urlService.multiQueryGenes
      .subscribe(genes => this.queryGenes = genes);
  }

  // Angular hooks

  private _onMicroTracks(tracks): void {
    if (tracks.groups.length > 0 && tracks.groups[0].genes.length > 0) {
      // compute how many genes each family has
      let familySizes = (tracks.groups.length > 1)
                        ? GCV.common.getFamilySizeMap(tracks)
                        : undefined;

      // micro viewer arguments
      this.microArgs = {
        geneClick: function (g, track) {
          this.selectGene(g);
        }.bind(this),
        nameClick: function (t) {
          this.selectTrack(t);
        }.bind(this),
        autoResize: true,
        selectiveColoring: familySizes,
        highlight: this.queryGenes
      };

      // micro legend arguments
      let highlight = tracks.groups.reduce((l, group) => {
        let families = group.genes
          .filter(g => this.queryGenes.indexOf(g.name) !== -1)
          .map(g => g.family);
        return l.concat(families);
      }, []);
      var orderedUniqueFamilyIds = new Set();
      tracks.groups.forEach(group => {
        group.genes.forEach(gene => {
          orderedUniqueFamilyIds.add(gene.family);
        });
      });
      var familyMap = {};
      tracks.families.forEach(f => {
        familyMap[f.id] = f;
      });
      var uniqueFamilies = [];
      orderedUniqueFamilyIds.forEach(id => {
        if (familyMap[id] !== undefined) uniqueFamilies.push(familyMap[id]);
      });
      var d = ",";
      var singletonIds = ["singleton"].concat(uniqueFamilies.filter(f => {
        return familySizes === undefined || familySizes[f.id] == 1;
      }).map(f => f.id)).join(d);
      this.microLegendArgs = {
        autoResize: true,
        keyClick: function (f) {
          this.selectFamily(f);
        }.bind(this),
        highlight: highlight,
        selectiveColoring: familySizes,
        selector: 'family',
        blank: {name: "Singletons", id: singletonIds},
        blankDashed: {name: "Orphans", id: ""},
        multiDelimiter: d
      }

      // micro legend data
      var presentFamilies = tracks.groups.reduce((l, group) => {
        return l.concat(group.genes.map(g => g.family));
      }, []);
      this.microLegend = uniqueFamilies.filter(f => {
        return presentFamilies.indexOf(f.id) != -1 && f.name != '';
      });

      // micro track data
      this.microTracks = tracks;
    }
  }

  ngAfterViewInit(): void {
    // don't subscribe to data until view loaded so drawing doesn't fail
    Observable
      .combineLatest(
        this._alignmentService.alignedMicroTracks,
        this._filterService.regexp,
        this._filterService.order
      )
      .let(microTracksSelector())
      .subscribe(tracks => {
        this._onMicroTracks(tracks)
      });
  }

  // private

  private _splitViewers(): void {
    if (this._left !== undefined && this._right !== undefined) {
      let leftEl = this._left.nativeElement,
          rightEl = this._right.nativeElement;
      Split([leftEl, rightEl], {
        sizes: [70, 30],
        gutterSize: 8,
        cursor: 'col-resize',
        minSize: 0
      })
    }
  }

  // public

  // micro-synteny
  setAccordion(e: any, value: any): void {
    e.stopPropagation();
    this.accordion = (this.accordion == value) ? null : value;
  }

  // left slider
  // EVIL: typescript checks types at compile time so we have to explicitly
  // instantiate those that will be checked by left-slider at run-time

  hideLeftSlider(): void {
    this.selectedDetail = null;
  }


  selectParams(): void {
    this.selectedDetail = {};
  }

  selectGene(gene: Gene): void {
    let g = Object.assign(Object.create(Gene.prototype), gene);
    this.selectedDetail = g;
  }

  selectFamily(family: Family): void {
    let f = Object.assign(Object.create(Family.prototype), family);
    this.selectedDetail = f;
  }

  selectTrack(track: Group): void {
    let t = Object.assign(Object.create(Group.prototype), track);
    this.selectedDetail = t;
  }
}
