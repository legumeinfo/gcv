/*
 * Source:
 *	  http://my.so-net.net.tw/tzuyichao/javascript/forfun/smithwaterman/smith.waterman.html
 * Author:
 *    Terence Chao, 2009
 */

// define the default accessor
function default_accessor(item) {
    return item;
}

// let's compute scores over and over again...
var s = function(first, second, scoring) {
	if (first === second && first != '') {
		return scoring.match;
	} return scoring.mismatch;
}


var smith_align = function(sequence, reference, accessor, scoring) {
    var rows = reference.length + 1;
    var cols = sequence.length + 1;
    var a = Array.matrix(rows, cols, 0);
    var i = 0, j = 0;
    var choice = [0, 0, 0, 0];
    
    // populate the matrix
    var max = 0,
        max_i = 0,
        max_j = 0;
    for (i=1; i<rows; i++) {
        for (j=1; j<cols; j++) {
            choice[0] = 0;
            choice[1] = a[i-1][j-1] +
            s( accessor(reference[i-1]), accessor(sequence[j-1]), scoring );
            choice[2] = a[i-1][j] + scoring.gap;
            choice[3] = a[i][j-1] + scoring.gap;
            a[i][j] = choice.max();
            if (a[i][j] >= max) {
                max = a[i][j];
                max_i = i;
                max_j = j;
            }
        }
    }

    // traceback
    i = max_i;
    j = max_j;
    var score = max,
        score_diag,
        score_up,
        score_left;
    var ref = [];
    var seq = [];
    while (i > 0 && j > 0) {
        score = a[i][j];
        if (score == 0) {
            break;
        }
		//total_score += score;
        score_diag = a[i-1][j-1];
        score_up = a[i][j-1];
        score_left = a[i-1][j];
        if (score === (score_diag +
           s(accessor(reference[i-1]), accessor(sequence[j-1]), scoring ))) {
            ref.unshift( clone(reference[i-1]));
            seq.unshift( clone(sequence[j-1]));
            i -= 1;
            j -= 1;
        } else if (score === (score_left + scoring.gap)) {
            ref.unshift(clone(reference[i-1]));
            seq.unshift(null);
            i -= 1;
        } else if (score === (score_up + scoring.gap)) {
            ref.unshift(null);
            seq.unshift(clone(sequence[j-1]));
            j -= 1;
		} else {
			break;
		}
    }
    
    while (j > 0) {
        ref.unshift(null);
        seq.unshift(clone(sequence[j-1]));
        j -= 1;
    }
    
    return [seq, ref, max];
};

// returns the higher scoring alignment - forward or reverse
var smith = function(sequence, reference, accessor, scoring) {
    if (accessor === undefined) {
        accessor = default_accessor;
    }
    if (scoring === undefined) {
        scoring = {};
    }
    if (scoring.match === undefined) {
        scoring.match = 5;
    }
    if (scoring.mismatch === undefined) {
        scoring.mismatch = 0;
    }
    if (scoring.gap === undefined) {
        scoring.gap = -1;
    }
	var forward = smith_align(sequence, reference, accessor, scoring);
    reference_clone = reference.slice(0);
	reference_clone.reverse();
	var reverse = smith_align(sequence, reference_clone, accessor, scoring);
    var output;
	if (forward[2] >= reverse[2]) {
        output = forward
	} else {
        // clone each object in the array
        // flip the strand for each selected gene
        for (var i = 0; i < reverse[1].length; i++) {
            if (reverse[1][i] != null) {
                reverse[1][i].strand = -1*reverse[1][i].strand;
            }
        }
        output = reverse;
    }
    return [[[output[0], output[1]]], output[2]];
}
