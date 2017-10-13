var d3 = require('d3');

// a helper function that moves things to the back of an svg element
d3.selection.prototype.moveToBack = function() { 
  return this.each(function () { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  });
};

// a helper function that moves things to the front of an svg element
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

export { d3 };
