var documentReadyPromise = function () {
  return new Promise((resolve) => {
    document.addEventListener("readystatechange", (event) => {
      if (event.target.readyState === "complete") {
        resolve();
      }
    });
  });
};

var isVisible = function (selector) {
  const element = document.querySelector(selector);
  return element != null &&
         window.getComputedStyle(element).visibility == "visible" &&
         element.offsetWidth > 0;
};

var waitForElement = function (selector, options={}) {
  options.callback = options.callback || ((element) => {});
  options.timeout = options.timeout || Infinity;
  options.error = options.error || (() => {});
  var ms = 100;
  const element = document.querySelector(selector);
  if (element != null) {
    options.callback(element);
  } else if (options.timeout > 0) {
    setTimeout(() => {
      options.timeout -= ms;
      waitForElement(selector, options);
    }, ms);
  } else {
    options.error();
  }
};

var dispatchMouseEvent = function (mouseEvent, element) {
  let e = document.createEvent("UIEvents");
  e.initUIEvent(mouseEvent, true, true, window, 1);
  element.dispatchEvent(e);
};

var universalMouseEvent = function (mouseEvent, selector, options={}) {
  var callback = options.callback || ((element) => {});
  options.callback = (element) => {
    dispatchMouseEvent(mouseEvent, element);
    callback();
  };
  options.timeout = options.timeout || 0;
  options.error = options.error || (() => {});
  const element = document.querySelector(selector);
  if (element !== null) {
    options.callback(element);
  } else if (options.timeout > 0) {
    waitForElement(selector, options);
  }
};

var universalMouseover = function (selector, options={}) {
  universalMouseEvent("mouseover", selector, options);
};

var universalMouseout = function (selector, options={}) {
  universalMouseEvent("mouseout", selector, options);
};

var universalClick = function (selector, options={}) {
  universalMouseEvent("click", selector, options);
};

var scrollToSelector = function (selector, options={}) {
  options.behavior = options.behavior || "smooth";
  options.block = options.block || "start";
  options.inline = options.inline || "nearest";
  const element = document.querySelector(selector);
  if (element != null) {
    element.scrollIntoView(options);
  }
};
