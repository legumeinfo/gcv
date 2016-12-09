// Function Enhancement
Function.prototype.method = function(name, fn) {
  this.prototype[name] = fn;
};

// String Enhancement
String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$|\n$|^\n/g, '');
};

String.prototype.isPartOf = function(str) {
  var re = new RegExp('(^|\\s)'+this+'(^|\\s)');
  return re.test(str);
};

// Array Enhancement
Array.prototype.foreach = function(fn) {
  for (var i=0; i<this.length; i++) {
    fn.call(this[i]);
  } // for
};

Array.method('max', function() {
  var i = 0;
  var tmp = this[i];
  for (i=0; i<this.length; i++) {
    if (tmp < this[i])
      tmp = this[i];
  } // for
  return tmp;
} );

Array.prototype.count = function(value) {
  return this.reduce(function(c,el) {
    return el === value ? c+1 : c
  }, 0);
}

// multi dimension array from JavaScript: The Good Parts
Array.matrix = function (m, n, initial) {
  var a, i, j, mat = [];
  for (i = 0; i < m; i += 1) {
    a = [];
    for (j = 0; j < n; j += 1) {
      a[j] = initial;
    }
    mat[i] = a;
  }
  return mat;
};

Array.identity = function (n) {
  var i, mat = Array.matrix(n, n, 0);
  for (i = 0; i < n; i += 1) {
    mat[i][i] = 1;
  }
  return mat;
};

// a function that clones objects
function clone(obj) {
  if (obj == null || typeof(obj) != 'object')
    return obj;
  var temp = obj.constructor(); // changed
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      temp[key] = clone(obj[key]);
    }
  }
  return temp;
}

// checks if a string is a number
function isNumber(n) {
  return !isNaN(parseInt(n)) && isFinite(n);
}

// checks if two arrays have the same content
Array.prototype.compare = function(testArr) {
    if (this.length != testArr.length) return false;
    for (var i = 0; i < testArr.length; i++) {
        if (this[i].compare) { 
            if (!this[i].compare(testArr[i])) return false;
        }
        if (this[i] !== testArr[i]) return false;
    }
    return true;
}
