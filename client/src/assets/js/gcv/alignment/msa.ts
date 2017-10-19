import { getFamilySizeMap } from '../common';
import { MSAHMM }           from '../graph/msa-hmm';
import { viterbi }          from './viterbi';


/**
  * Embeds the given sequence along the given state path in the given HMM.
  * @param{MSAHMM} hmm - The HMM in which to embed the sequence path.
  * @param{String} pId - The ID of the sequence for which the path is being
  * embedded.
  * @param{Array} path - An ordered array of state IDs describing the sequence
  * path to be embedded.
  * @param{Array} seq - An ordered array of strings representing the sequence
  * for which a path is being embedded.
  */
var embedPath = function(hmm, pId, path, seq) {
  var i = 0;
  for (var j = 0; j < path.length - 1; j++) {
    var from = path[j],
        to   = path[j + 1],
        n    = hmm.getNode(from).attr;
    if (n instanceof MSAHMM.InsertState ||
        n instanceof MSAHMM.MatchState) {
      n.addPath(pId, seq[i++]);
    }
  }
}


/**
  * Gets an embedded sequence's path through the current topology of the graph.
  * @param{MSAHMM} hmm - The HMM to find the path through.
  * @param{String} pId - The ID of the sequence for which to get the path.
  * return {Array} - An ordered array of state IDs describing the sequence path.
  */
var getPath = function(hmm, pId) {
  var path = ["a"];
  for (var j = 0; j < hmm.numColumns; j++) {
    var i      = "i" + j,
        ipaths = hmm.getNode(i).attr.paths,
        m      = "m" + j,
        mpaths = hmm.getNode(m).attr.paths,
        d      = "d" + j;
    if (ipaths.hasOwnProperty(pId) || mpaths.hasOwnProperty(pId)) {
      if (ipaths.hasOwnProperty(pId)) {
        for (var k = 0; k < ipaths[pId].length; k++) {
          path.push(i);
        }
      }
      if (mpaths.hasOwnProperty(pId)) {
        path.push(m);
      }
    } else {
      path.push(d);
    }
  }
  var i      = "i" + hmm.numColumns,
      ipaths = hmm.getNode(i).attr.paths;
  if (ipaths.hasOwnProperty(pId)) {
    for (var k = 0; k < ipaths[pId].length; k++) {
      path.push(i);
    }
  }
  path.push("z");
  return path;
}


/**
  * Converts the insertion states into one or more match states if  traversed by
  * a path. This may invalidate previously generated paths.
  * @param {MSAHMM} hmm - The model to perform surgery one.
  */
var performSurgery = function(hmm) {
  var growBy = 0;
  for (var j = 0; j <= hmm.numColumns; j += (growBy + 1)) { 
    growBy = 0;
    var ipaths = hmm.nodes["i" + j].attr.paths;
    // if one or more paths traverses the insert state
    if (Object.keys(ipaths).length > 0) {
      // find the largest number of consecutive insertions
      for (var pId in ipaths) {
        if (ipaths.hasOwnProperty(pId)) {
          growBy = Math.max(growBy, ipaths[pId].length);
        }
      }
      // add growBy new columns to the end of the model and shift probabilities
      var l = hmm.numColumns;
      hmm.numColumns += growBy;
      for (var k = l + growBy - 1; k >= j; k--) {
        var knext  = k + 1,
            dk     = "d" + k,
            ik     = "i" + knext,
            mk     = "m" + k,
            dknext = "d" + knext,
            mknext = "m" + knext;
        // add new nodes and edges
        if (k >= l) {
          // add new column
          hmm.addNode(dk);
          hmm.addNode(ik);
          hmm.addNode(mk);
          hmm.addEdge(dk, ik);
          hmm.addEdge(ik, ik);
          hmm.addEdge(mk, ik);
          // add new end state transitions
          if (k == l + growBy - 1) {
            hmm.addEdge(dk, "z", hmm.removeEdge("d" + (l - 1), "z"));
            hmm.addEdge(ik, "z", hmm.removeEdge("i" + l, "z"));
            hmm.addEdge(mk, "z", hmm.removeEdge("m" + (l - 1), "z"));
          // add edges between current and previously added new column
          } else {
            hmm.addEdge(dk, dknext);
            hmm.addEdge(dk, mknext);
            hmm.addEdge(ik, dknext);
            hmm.addEdge(ik, mknext);
            hmm.addEdge(mk, dknext);
            hmm.addEdge(mk, mknext);
          }
          // add edges between old last column and first new column
          if (k == l) {
            var kprev  = k - 1,
                dkprev = "d" + kprev,
                ikprev = "i" + k,
                mkprev = "m" + kprev;
            hmm.addEdge(dkprev, dk);
            hmm.addEdge(dkprev, mk);
            hmm.addEdge(ikprev, dk);
            hmm.addEdge(ikprev, mk);
            hmm.addEdge(mkprev, dk);
            hmm.addEdge(mkprev, mk);
          }
        }
        // shift the existing probabilities
        if (k >= j + growBy) {
          var shift      = k - growBy,
              shiftNext  = shift + 1,
              dshift     = "d" + shift,
              ishift     = "i" + shiftNext,
              mshift     = "m" + shift,
              dshiftNext = "d" + shiftNext,
              mshiftNext = "m" + shiftNext;
          // shift nodes
          hmm.updateNode(dk, hmm.getNode(dshift).attr);
          hmm.updateNode(ik, hmm.getNode(ishift).attr);
          hmm.updateNode(mk, hmm.getNode(mshift).attr);
          // shift edges
          if (k < l + growBy - 1) {
            hmm.updateEdge(dk, dknext, hmm.getEdge(dshift, dshiftNext));
            hmm.updateEdge(dk, mknext, hmm.getEdge(dshift, mshiftNext));
            hmm.updateEdge(ik, dknext, hmm.getEdge(ishift, dshiftNext));
            hmm.updateEdge(ik, mknext, hmm.getEdge(ishift, mshiftNext));
            hmm.updateEdge(mk, dknext, hmm.getEdge(mshift, dshiftNext));
            hmm.updateEdge(mk, mknext, hmm.getEdge(mshift, mshiftNext));
          }
          hmm.updateEdge(dk, ik, hmm.getEdge(dshift, ishift));
          hmm.updateEdge(ik, ik, hmm.getEdge(ishift, ishift));
          hmm.updateEdge(mk, ik, hmm.getEdge(mshift, ishift));
        // generate new states
        } else {
          hmm.updateNode(dk, new MSAHMM.State());
          hmm.updateNode(ik, new MSAHMM.InsertState());
          hmm.updateNode(mk, new MSAHMM.MatchState(hmm.characters));
        }
      }
      // expand the inserted paths into the new match states 
      for (var pId in ipaths) {
        if (ipaths.hasOwnProperty(pId)) {
          for (var k = 0; k < ipaths[pId].length; k++) {
            var o = ipaths[pId][k],
                m = "m" + (j + k);
            hmm.nodes[m].attr.addPath(pId, o);
          }
        }
      }
      hmm.updateNode("i" + j, new MSAHMM.InsertState());
      // compute the transition probabilities for each inserted column
      if (j == 0) {
        hmm.updateNodeTransitionProbabilities("a");
      }
      for (var k = Math.max(0, j - 1); k < j + growBy; k++) {
        var dk = "d" + k,
            ik = "i" + (k + 1),
            mk = "m" + k;
        hmm.updateNodeTransitionProbabilities(dk);
        hmm.updateNodeTransitionProbabilities(ik);
        hmm.updateNodeTransitionProbabilities(mk);
      }
    }
  }
}


/**
  * Computes the emission probabilities for a sequence given a path through an
  * HMM.
  * @param{MSAHMM} hmm - The model that will emit the probabilities.
  * @param{Object} counts - Maps sequence characters to their number of
  * occurrences. Characters with counts less than 2 are given emission
  * probability 0.
  * @param{Array} seq - The sequence to compute emission probabilities for.
  * @param{Array} path - A (Viterbi) path that maps sequence members to HMM
  * match states.
  * return {Array} - A sequence of emission probabilities with corresponding to
  * seq.
  */
var sequenceEmissions = function(hmm, /*counts,*/ seq, path) {
  var eseq = [],
      j    = 0;
  for (var i = 1; i < path.length; i++) {
    var n = path[i];
    if (n.startsWith("m") /*&& counts[seq[j]] > 1*/) {
      eseq.push(hmm.getNode(n).attr.emit(seq[j++]));
    } else if (n.startsWith("i")) {
      eseq.push(0);
      j++;
    }
  }
  return eseq;
}


/**
  * Aligns the set of genes to their corresponding Viterbi path.
  * @param{Array} genes - The set of genes to align.
  * @param{Array} path - The corresponding Viterbi path.
  */
var alignToPath = function(genes, path) {
  var x = 0,
      j = 0,
      insertionSize = 0;
  for (var i = 1; i < path.length; i++) {
    var n = path[i];
    if (n.startsWith("m") || n.startsWith("d") || n == "z") {
      if (insertionSize > 0) {
        var step = 1 / (insertionSize + 1);
        for (var k = insertionSize; k > 0; k--) {
          genes[j++].x = x - (k * step);
        }
        insertionSize = 0;
      }
      if (n.startsWith("m")) {
        genes[j++].x = x;
      }
      x++;
    } else {
      insertionSize++;
    }
  }
}


/**
  * Takes a forward and a reverse emission sequence and creates an orientation
  * sequence that represents the most probable sub-sequences orientations of
  * the sequence from which the emission sequences were derived.
  * @param{Array} eseq1 - The forward orientation emission probability sequence.
  * @param{Array} eseq2 - The reverse orientation emission probability sequence.
  * return{Array} - An orientation sequence with "f" for forward oriented
  * members and "r" for reverse oriented members.
  */
var orientationSequence = function(eseq1, eseq2) {
  // determine if each character was better aligned in the forward (f) or
  // reverse alignment (r), or if they effectively tied (t)
  var merged  = [],
      rlocs   = [],
      fcounts = [0];
  for (var i = 0; i < eseq1.length; i++) {
    var p1 = eseq1[i],
        p2 = eseq2[eseq2.length - (i + 1)];
    if (p1 > p2 /*&& p2 > 0*/) {
      merged.push('f');
      fcounts[rlocs.length] += 1;
    } else if (p1 < p2) {
      merged.push('r');
      rlocs.push(i);
      fcounts.push(0);
    } else {
      merged.push('t');
    }
  }
  rlocs.push(eseq1.length);
  fcounts.push(0);
  // resolve ties and flip characters that fracture larger blocks
  for (var i = 0; i < rlocs.length - 1; i++) {
    var l = rlocs[i];
    // convert t chains between r's with one or less f's to r's
    if (fcounts[i + 1] <= 1) {
      for (var j = l + 1; j < rlocs[i + 1]; j++) {
        merged[j] = 'r';
      }
    // flip island r's
    } else {
      if (l - 1 >= 0 && merged[l - 1] != 'r') {
        merged[l] = 'f';
      }
      for (var j = l + 1; j < rlocs[i + 1]; j++) {
        merged[j] = 'f';
      }
    }
  }
  // get the edge case - there's an inversion at the beginning
  if (merged[rlocs[0]] == 'r' && fcounts[0] <= 1) {
    for (let j = 0; j < rlocs[0]; j++) {
      merged[j] = 'r';
    }
  } else {
    for (let j = 0; j < rlocs[0]; j++) {
      merged[j] = 'f';
    }
  }
  return merged;
}


/**
  * Combines a forward and a reverse oriented gene sequence according to an
  * orientation sequence.
  * @param{Array} genes1 - The forward oriented gene sequence.
  * @param{Array} genes2 - The reverse oriented gene sequence.
  * @param{Array} oseq - The orientation sequence that dictates what parts of
  * each oriented gene sequence are represented in the output gene sequence.
  * return{Array} - An oriented gene sequence.
  */
var orientatedGenes = function(genes1, genes2, oseq) {
  var genes = [];
  for (var i = 0; i < oseq.length; i++) {
    if (oseq[i] == 'f') {
      genes.push(genes1[i]);
    } else if (oseq[i] == 'r') {
      var g = genes2[oseq.length - (i + 1)];
      g.y = 1;
      genes.push(g);
    }
  }
  return genes;
}


/**
  * An HMM based MSA algorithm.
  * @param {Array} tracks - groups attribute of GCV track data.
  * @return {int} - The computed score.
  */
export function msa (tracks) {
  var groups = JSON.parse(JSON.stringify(tracks)),
      counts = getFamilySizeMap({groups: groups});
  for (var i = 0; i < groups.length; i++) {
    groups[i].genes = groups[i].genes.filter(g => {
      return g.family != "" && counts[g.family] > 1;
    });
  }
  var rawGroups = JSON.parse(JSON.stringify(tracks));
  // 1) construct a HMM with a column for each gene in the first track
  var l = groups[0].genes.length,
      families = new Set();
  for (var i = 0; i < groups.length; i++) {
    for (var j = 0; j < groups[i].genes.length; j++) {
      var f = groups[i].genes[j].family;
      families.add('+' + f);
      families.add('-' + f);
    }
  }
  var hmm = new MSAHMM(l, families);
  // 2) iteratively train the HMM on the filtered tracks
  for (var i = 0; i < groups.length; i++) {
    // a) align to HMM
    var seq1  = groups[i].genes.map(g => {
          return (g.strand == -1 ? '-' : '+') + g.family;
        }),
        path1 = viterbi(hmm, seq1),
        seq2  = groups[i].genes.slice().reverse().map(g => {
          return (g.strand == -1 ? '+' : '-') + g.family;
        }),
        path2 = viterbi(hmm, seq2);
    // b) embed alignment path and update transition and emission probabilities
    if (path1.probability >= path2.probability) {
      embedPath(hmm, i, path1, seq1);
    } else {
      embedPath(hmm, i, path2, seq2);
    }
    // c) if necessary, perform surgery on the graph
    performSurgery(hmm);
  }
  // align the unfiltered tracks to the trained HMM
  for (var i = 0; i < rawGroups.length; i++) {
    var genes1 = JSON.parse(JSON.stringify(rawGroups[i].genes)),
        seq1   = genes1.map(g => {
          return (g.strand == -1 ? '-' : '+') + g.family;
        }),
        path1  = viterbi(hmm, seq1),
        eseq1  = sequenceEmissions(hmm, /*counts,*/ seq1, path1);
    alignToPath(genes1, path1);
    var genes2 = JSON.parse(JSON.stringify(genes1)).reverse(),
        seq2   = genes2.map(g => {
          return (g.strand == -1 ? '+' : '-') + g.family;
        }),
        path2  = viterbi(hmm, seq2),
        eseq2  = sequenceEmissions(hmm, /*counts,*/ seq2, path2);
    genes2.forEach((g) => { g.strand *= -1 });
    alignToPath(genes2, path2);
    if (path1.probability >= path2.probability) {
      var oseq = orientationSequence(eseq1, eseq2);
      rawGroups[i].genes = orientatedGenes(genes1, genes2, oseq);
    } else {
      var oseq = orientationSequence(eseq2, eseq1);
      rawGroups[i].genes = orientatedGenes(genes2, genes1, oseq);
    }
  }
  return rawGroups;
}
