//import { getFamilySizeMap } from "../common";
import { MSAHMM } from "../graph/msa-hmm";
import { viterbi } from "./viterbi";

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
const embedPath = (hmm, pId, path, seq) => {
  let i = 0;
  for (let j = 0; j < path.length - 1; j++) {
    const from = path[j];
    const to   = path[j + 1];
    const n    = hmm.getNode(from).attr;
    if (n instanceof MSAHMM.InsertState ||
        n instanceof MSAHMM.MatchState) {
      n.addPath(pId, seq[i++]);
    }
  }
};

/**
 * Gets an embedded sequence"s path through the current topology of the graph.
 * @param{MSAHMM} hmm - The HMM to find the path through.
 * @param{String} pId - The ID of the sequence for which to get the path.
 * return {Array} - An ordered array of state IDs describing the sequence path.
 */
const getPath = (hmm, pId) => {
  const path = ["a"];
  for (let j = 0; j < hmm.numColumns; j++) {
    const i = "i" + j;
    const ipaths = hmm.getNode(i).attr.paths;
    const m = "m" + j;
    const mpaths = hmm.getNode(m).attr.paths;
    const d = "d" + j;
    if (ipaths.hasOwnProperty(pId) || mpaths.hasOwnProperty(pId)) {
      if (ipaths.hasOwnProperty(pId)) {
        for (const p of ipaths[pId]) {
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
  const i = "i" + hmm.numColumns;
  const ipaths = hmm.getNode(i).attr.paths;
  if (ipaths.hasOwnProperty(pId)) {
    for (const p of ipaths[pId]) {
      path.push(i);
    }
  }
  path.push("z");
  return path;
};

/**
 * Converts the insertion states into one or more match states if  traversed by
 * a path. This may invalidate previously generated paths.
 * @param {MSAHMM} hmm - The model to perform surgery one.
 */
const performSurgery = (hmm) => {
  let growBy = 0;
  for (let j = 0; j <= hmm.numColumns; j += (growBy + 1)) {
    growBy = 0;
    const ipaths = hmm.nodes["i" + j].attr.paths;
    // if one or more paths traverses the insert state
    if (Object.keys(ipaths).length > 0) {
      // find the largest number of consecutive insertions
      for (const pId in ipaths) {
        if (ipaths.hasOwnProperty(pId)) {
          growBy = Math.max(growBy, ipaths[pId].length);
        }
      }
      // add growBy new columns to the end of the model and shift probabilities
      const l = hmm.numColumns;
      hmm.numColumns += growBy;
      for (let k = l + growBy - 1; k >= j; k--) {
        const knext  = k + 1;
        const dk = "d" + k;
        const ik = "i" + knext;
        const mk = "m" + k;
        const dknext = "d" + knext;
        const mknext = "m" + knext;
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
          if (k === l + growBy - 1) {
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
          if (k === l) {
            const kprev  = k - 1;
            const dkprev = "d" + kprev;
            const ikprev = "i" + k;
            const mkprev = "m" + kprev;
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
          const shift = k - growBy;
          const shiftNext = shift + 1;
          const dshift = "d" + shift;
          const ishift = "i" + shiftNext;
          const mshift = "m" + shift;
          const dshiftNext = "d" + shiftNext;
          const mshiftNext = "m" + shiftNext;
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
      for (const pId in ipaths) {
        if (ipaths.hasOwnProperty(pId)) {
          for (let k = 0; k < ipaths[pId].length; k++) {
            const o = ipaths[pId][k];
            const m = "m" + (j + k);
            hmm.nodes[m].attr.addPath(pId, o);
          }
        }
      }
      hmm.updateNode("i" + j, new MSAHMM.InsertState());
      // compute the transition probabilities for each inserted column
      if (j === 0) {
        hmm.updateNodeTransitionProbabilities("a");
      }
      for (let k = Math.max(0, j - 1); k < j + growBy; k++) {
        const dk = "d" + k;
        const ik = "i" + (k + 1);
        const mk = "m" + k;
        hmm.updateNodeTransitionProbabilities(dk);
        hmm.updateNodeTransitionProbabilities(ik);
        hmm.updateNodeTransitionProbabilities(mk);
      }
    }
  }
};

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
const sequenceEmissions = (hmm, /*counts,*/ seq, path) => {
  const eseq = [];
  let j = 0;
  for (let i = 1; i < path.length; i++) {
    const n = path[i];
    if (n.startsWith("m") /*&& counts[seq[j]] > 1*/) {
      eseq.push(hmm.getNode(n).attr.emit(seq[j++]));
    } else if (n.startsWith("i")) {
      eseq.push(0);
      j++;
    }
  }
  return eseq;
};

/**
 * Aligns the set of genes to their corresponding Viterbi path.
 * @param{Array} genes - The set of genes to align.
 * @param{Array} path - The corresponding Viterbi path.
 */
const alignToPath = (genes, path) => {
  let x = 0;
  let j = 0;
  let insertionSize = 0;
  for (let i = 1; i < path.length; i++) {
    const n = path[i];
    if (n.startsWith("m") || n.startsWith("d") || n === "z") {
      if (insertionSize > 0) {
        const step = 1 / (insertionSize + 1);
        for (let k = insertionSize; k > 0; k--) {
          genes[j].x = x - (k * step);
          genes[j].y = 0;
          j += 1;
        }
        insertionSize = 0;
      }
      if (n.startsWith("m")) {
      genes[j].x = x;
        genes[j].y = 0;
        j += 1;
      }
      x += 1;
    } else {
      insertionSize++;
    }
  }
};

/**
 * Takes a forward and a reverse emission sequence and creates an orientation
 * sequence that represents the most probable sub-sequences orientations of
 * the sequence from which the emission sequences were derived.
 * @param{Array} eseq1 - The forward orientation emission probability sequence.
 * @param{Array} eseq2 - The reverse orientation emission probability sequence.
 * return{Array} - An orientation sequence with "f" for forward oriented
 * members and "r" for reverse oriented members.
 */
const orientationSequence = (eseq1, eseq2) => {
  // determine if each character was better aligned in the forward (f) or
  // reverse alignment (r), or if they effectively tied (t)
  const merged  = [];
  const rlocs   = [];
  const fcounts = [0];
  for (let i = 0; i < eseq1.length; i++) {
    const p1 = eseq1[i];
    const p2 = eseq2[eseq2.length - (i + 1)];
    if (p1 > p2 /*&& p2 > 0*/) {
      merged.push("f");
      fcounts[rlocs.length] += 1;
    } else if (p1 < p2) {
      merged.push("r");
      rlocs.push(i);
      fcounts.push(0);
    } else {
      merged.push("t");
    }
  }
  rlocs.push(eseq1.length);
  fcounts.push(0);
  // resolve ties and flip characters that fracture larger blocks
  for (let i = 0; i < rlocs.length - 1; i++) {
    const l = rlocs[i];
    // convert t chains between r"s with one or less f"s to r"s
    if (fcounts[i + 1] <= 1) {
      for (let j = l + 1; j < rlocs[i + 1]; j++) {
        merged[j] = "r";
      }
    // flip island r"s
    } else {
      if (l - 1 >= 0 && merged[l - 1] !== "r") {
        merged[l] = "f";
      }
      for (let j = l + 1; j < rlocs[i + 1]; j++) {
        merged[j] = "f";
      }
    }
  }
  // get the edge case - there"s an inversion at the beginning
  if (merged[rlocs[0]] === "r" && fcounts[0] <= 1) {
    for (let j = 0; j < rlocs[0]; j++) {
      merged[j] = "r";
    }
  } else {
    for (let j = 0; j < rlocs[0]; j++) {
      merged[j] = "f";
    }
  }
  return merged;
};

/**
 * Combines a forward and a reverse oriented gene sequence according to an
 * orientation sequence.
 * @param{Array} genes1 - The forward oriented gene sequence.
 * @param{Array} genes2 - The reverse oriented gene sequence.
 * @param{Array} oseq - The orientation sequence that dictates what parts of
 * each oriented gene sequence are represented in the output gene sequence.
 * return{Array} - An oriented gene sequence.
 */
const orientatedGenes = (genes1, genes2, oseq) => {
  const genes = [];
  for (let i = 0; i < oseq.length; i++) {
    if (oseq[i] === "f") {
      genes.push(genes1[i]);
    } else if (oseq[i] === "r") {
      const g = genes2[oseq.length - (i + 1)];
      g.y = 1;
      genes.push(g);
    }
  }
  return genes;
};

/**
 * An HMM based MSA algorithm.
 * @param {Array} tracks - An array of gene arrays to be multi aligned.
 * @return {int} - The computed score.
 */
export function msa(tracks, counts) {
  //const groups = JSON.parse(JSON.stringify(tracks));
  //const counts = getFamilySizeMap({groups});
  const filteredTracks = tracks.map((genes) => {
    return genes.filter((g) => {
      return g.family !== "" && counts[g.family] > 1;
    });
  });
  //for (const group of groups) {
  //  group.genes = group.genes.filter((g) => {
  //    return g.family !== "" && counts[g.family] > 1;
  //  });
  //}
  //const rawGroups = JSON.parse(JSON.stringify(tracks));
  // 1) construct a HMM with a column for each gene in the first track
  //const l = groups[0].genes.length;
  const l = tracks[0].length;
  const families = new Set();
  //for (const group of groups) {
  for (const genes of filteredTracks) {
    //for (const gene of group.genes) {
    for (const gene of genes) {
      const f = gene.family;
      families.add("+" + f);
      families.add("-" + f);
    }
  }
  const hmm = new MSAHMM(l, families);
  // 2) iteratively train the HMM on the filtered tracks
  //for (let i = 0; i < groups.length; i++) {
  for (let i = 0; i < filteredTracks.length; i++) {
    // a) align to HMM
    //const seq1  = groups[i].genes.map((g) => {
    const seq1  = filteredTracks[i].map((g) => {
          return (g.strand === -1 ? "-" : "+") + g.family;
        });
    const path1 = viterbi(hmm, seq1);
    //const seq2  = groups[i].genes.slice().reverse().map((g) => {
  const seq2  = filteredTracks[i].slice().reverse().map((g) => {
          return (g.strand === -1 ? "+" : "-") + g.family;
        });
    const path2 = viterbi(hmm, seq2);
    // b) embed alignment path and update transition and emission probabilities
    if (path1.probability >= path2.probability) {
      embedPath(hmm, i, path1, seq1);
    } else {
      embedPath(hmm, i, path2, seq2);
    }
    // c) if necessary, perform surgery on the graph
    performSurgery(hmm);
  }
  // 3) align the unfiltered tracks to the trained HMM
  //const alignedTracks = tracks.map((genes) => genes.map((gene) => {
  //  return Object.create(gene);
  //}));
  const alignedTracks = [];
  //for (const group of rawGroups) {
  for (const genes of tracks) {
    //const genes1 = JSON.parse(JSON.stringify(group.genes));
    const genes1 = genes.map((gene) => Object.create(gene));
    const seq1 = genes1.map((g) => {
          return (g.strand === -1 ? "-" : "+") + g.family;
        });
    const path1 = viterbi(hmm, seq1);
    const eseq1 = sequenceEmissions(hmm, /*counts,*/ seq1, path1);
    alignToPath(genes1, path1);
    const genes2 = genes.map((gene) => Object.create(gene)).reverse();
    const seq2 = genes2.map((g) => {
          return (g.strand === -1 ? "+" : "-") + g.family;
        });
    const path2 = viterbi(hmm, seq2);
    const eseq2 = sequenceEmissions(hmm, /*counts,*/ seq2, path2);
    //genes2.forEach((g) => { g.strand *= -1; });
    genes2.forEach((g) => { g.reversed = true; });
    alignToPath(genes2, path2);
    if (path1.probability >= path2.probability) {
      const oseq = orientationSequence(eseq1, eseq2);
      //group.genes = orientatedGenes(genes1, genes2, oseq);
      alignedTracks.push(orientatedGenes(genes1, genes2, oseq));
    } else {
      const oseq = orientationSequence(eseq2, eseq1);
      //group.genes = orientatedGenes(genes2, genes1, oseq);
      alignedTracks.push(orientatedGenes(genes2, genes1, oseq));
    }
  }
  return alignedTracks;
}
