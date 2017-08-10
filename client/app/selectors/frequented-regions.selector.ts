import { MicroTracks } from '../models/micro-tracks.model';

declare var Graph: any;

export const frequentedRegionsSelector = () => {
  return state => state
    // args[0] = MicroTracks
    .map((args) => {
      let tracks = Object.assign({}, args[0]);
      let frTracks = JSON.parse(JSON.stringify(tracks)),
          grouped  = [],
          results  = [];
      let aggregateSupport = (fr) => {
        let supporting = fr.supporting.map(n => parseInt(n));
        for (let i = 0; i < fr.descendants.length; i++) {
          supporting = supporting.concat(aggregateSupport(fr.descendants[i]));
        }
        return supporting;
      }
      let j = 0;
      do {
        results = Graph.frequentedRegions(frTracks, 0.5, 10, 2, 3, {omit: [""]});
        let max   = null,
            maxFR = null;;
        for (let i = 0; i < results.length; i++) {
          if (max = null || results[i]["nodes"].length > max) {
            max = results[i]["nodes"].length;
            maxFR = results[i];
          }
        }
        if (maxFR != null) {
          console.log("group" + j);
          console.log(maxFR);
          let supporting = aggregateSupport(maxFR);
          let group = JSON.parse(JSON.stringify(frTracks)).groups.filter(function(t, i) {
            return supporting.indexOf(i) != -1;
          });
          for (let i = 0; i < group.length; i++) {
            let gId = "group" + j + ".";
            group[i]["chromosome_name"] = gId.concat(group[i]["chromosome_name"]);
          }
          grouped = grouped.concat(group);
          frTracks.groups = frTracks.groups.filter(function(t, i) {
            return supporting.indexOf(i) == -1;
          });
        }
        j++;
      } while (results.length > 0);
      tracks.groups = grouped.concat(frTracks.groups);
      return tracks;
    })
};
