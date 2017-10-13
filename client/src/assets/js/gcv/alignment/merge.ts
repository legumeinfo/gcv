/**
  * Merges overlapping tracks from the same group to maximize alignment score.
  * @param {object} data - The micro-synteny viewer data to be merged.
  */
export function merge (data) {
  // make a copy of the data (tracks)
  var tracks = JSON.parse(JSON.stringify(data));
  if (data.groups.length > 0) {
    // groups tracks by group id
    var groups = {};
    for (var i = 1; i < tracks.groups.length; i++) {  // skip first (query) track
      var track = tracks.groups[i];
      groups[track.id] = groups[track.id] || [];
      groups[track.id].push(track);
    }
    tracks.groups = [tracks.groups[0]];
    // try to merge each partition
    for (var id in groups) {
      if (!groups.hasOwnProperty(id)) {
        continue;
      }
      var groupTracks = groups[id],
          merged = [];  // which tracks have been merged into another
      // iterate pairs of tracks to see if one is a sub-inversion of the other
      for (var j = 0; j < groupTracks.length; j++) {
        if (merged.indexOf(j) != -1) continue;
        var jTrack = groupTracks[j],
            jLevels = 0,
            jIds = jTrack.genes.map(function (g) { return g.id; });
        for (var k = j + 1; k < groupTracks.length; k++) {
          if (merged.indexOf(j) != -1 || merged.indexOf(k) != -1) continue;
          var kTrack = groupTracks[k],
              kLevels = 0,
              kIds = kTrack.genes.map(function (g) { return g.id; });
          // compute the intersection
          var overlap = jIds.filter(function (jId) {
            return kIds.indexOf(jId) != -1;
          });
          if (overlap.length > 0) {
            // j is the inversion
            if (kIds.length > jIds.length) {
              // get index list
              var indices = overlap.map(function (jId) {
                return kIds.indexOf(jId);
              });
              // compute the score of the inverted sequence before inverting
              var min = Math.min.apply(null, indices),
                  max = Math.max.apply(null, indices);
              var startGene = kTrack.genes[min],
                  endGene = kTrack.genes[max];
              var score = endGene.suffixScore - startGene.suffixScore;
              // perform the inversion if it will improve the super-track's score
              if (jTrack.score > score) {
                merged.push(j);
                // increment the level counter
                kLevels++;
                // perform the inversion
                jTrack.genes.reverse();
                var args = [min, max - min + 1],
                    geneArgs = args.concat(jTrack.genes);
                Array.prototype.splice.apply(kTrack.genes, geneArgs);
                // adjust inversion scores and y coordinates
                max = min + jTrack.genes.length;
                var pred = (min > 0) ? kTrack.genes[min - 1].suffixScore : 0;
                for (var l = min; l < max; l++) {
                  kTrack.genes[l].suffixScore += pred;
                  kTrack.genes[l].y = kLevels;
                }
                // adjust post-inversion scores
                var adjustment = jTrack.score - score;
                for (var l = max; l < kTrack.genes.length; l++) {
                  kTrack.genes[l].suffixScore += adjustment;
                }
                kTrack.score += adjustment;
              }
            // k is the inversion
            } else if (jIds.length >= kIds.length) {
              // get index list
              var indices = overlap.map(function (jId) {
                return jIds.indexOf(jId);
              });
              // compute the score of the inverted sequence before inverting
              var min = Math.min.apply(null, indices),
                  max = Math.max.apply(null, indices);
              var startGene = jTrack.genes[min],
                  endGene = jTrack.genes[max];
              var score = endGene.suffixScore - startGene.suffixScore;
              // perform the inversion if it will improve the super-track's score
              if (kTrack.score > score) {
                merged.push(k);
                // increment the level counter
                jLevels++;
                // perform the inversion
                kTrack.genes.reverse();
                var args = [min, max - min + 1],
                    geneArgs = args.concat(kTrack.genes),
                    idArgs = args.concat(kIds);
                Array.prototype.splice.apply(jTrack.genes, geneArgs);
                Array.prototype.splice.apply(jIds, idArgs);
                // adjust inversion scores and y coordinates
                max = min + kTrack.genes.length;
                var pred = (min > 0) ? jTrack.genes[min - 1].suffixScore : 0;
                for (var l = min; l < max; l++) {
                  jTrack.genes[l].suffixScore += pred;
                  jTrack.genes[l].y = jLevels;
                }
                // adjust post-inversion scores
                var adjustment = kTrack.score - score;
                for (var l = max; l < jTrack.genes.length; l++) {
                  jTrack.genes[l].suffixScore += adjustment;
                }
                jTrack.score += adjustment;
              }
            }
          }
        }
        // add the track if it wasn't merged during its iteration
        if (merged.indexOf(j) == -1) {
          tracks.groups.push(jTrack);
        }
      }
    }
  }
  return tracks;
}
