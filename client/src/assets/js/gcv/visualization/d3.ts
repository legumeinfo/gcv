const d3 = require("d3");

// a helper function that moves things to the back of an svg element
d3.selection.prototype.moveToBack = function() {
  return this.each(function() {
    const firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

// a helper function that moves things to the front of an svg element
d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

// a helper function that creates an attribute for every property in an object's
// htmlAttributes property
d3.selection.prototype.addHTMLAttributes = function (data={htmlAttributes: {}}) {
  return this.each(function (e) {
    const selection = d3.select(this);
    const attributes = e.htmlAttributes || data.htmlAttributes || {}
    for (const attr in attributes) {
      selection.attr(attr, attributes[attr]);
    }
  });
}

export { d3 };
