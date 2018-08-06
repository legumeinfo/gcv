var defaultTour = (function () {

  // helpers

  var continueTourPromise = function(tour) {
    return new Promise((resolve, reject) => {
      if (!tour._inited && !confirm("Continue tour?")) {
        tour.end();
        reject();
      } else {
        resolve();
      }
    });
  }

  var showPlotPromise = function () {
    return new Promise((resolve) => {
        if (!isVisible()) {
          var selector = "#micro-synteny .micro-plot-link:gt(2):first";
          universalClick(selector, {timeout: Infinity, callback: resolve});
        } else {
          resolve();
        }
      });
  }

  var showLeftSliderPromise = function () {
    return documentReadyPromise()
      // show the left slider if necessary
      .then(() => new Promise((resolve) => {
        if (!isVisible("#left-slider")) {
          var selector = "#parameters-button button";
          universalClick(selector, {timeout: Infinity});
          // wait for the left slider animation
          setTimeout(resolve, 250);
        } else {
          resolve();
        }
      }));
  }

  /*
   * A redirect function that is only called when the next step's path (regexp)
   * doesn't match the current URL. Uses the Angular Router (provided by GCV) to
   * navigate to change the URL path and/or query  params without causing the
   * page to be reloaded.
   * @param {string|RegExp} path - The path of the current step.
   */
  var redirect = function (path) {
    // redirects aren't allowed if the tour has ended
    if (!this.ended()) {
      // assumes if path is a RegExp then the step has a "pathUrl" attribute
      if (path instanceof RegExp) {
        var i = this.getCurrentStep();
        var step = this.getStep(i);
        var queryParams = Object.entries(step.pathUrl.queryParams)
          .map(([p, v]) => p + "=" + v)
          .join("&");
        var url = step.pathUrl.path + "?" + queryParams;
        window.gcvGo(url);
      } else {
        window.gcvGo(path);
      }
    }
  }

  /*
   * Constructs a regular expression that matches the path and query params, but
   * allows for the presence of other query params not defined.
   * @param {string} path - The URL path to be matched.
   * @param {object} queryParams - An object of URL query parameters and values
   * to be matched.
   * @return {RegExp} - The constructed regular expression object.
   */
  var gcvUrlMatch = function (path, queryParams) {
    // escape all "/", ".", and "-" in the path
    var absolutePath = basePath + path;
    var pathRegexp = absolutePath.replace(/[-\/.]/g, "\\$&");
    // are there any required query params?
    var paramsRegexp = "";
    if (Object.keys(queryParams).length !== 0) {
      // check that each param-value pair is somewhere in the URL query params
      var lookArounds = "";
      for (var param in queryParams) {
        if (queryParams.hasOwnProperty(param)) {
          lookArounds += "(?=.*\\b" + param + "=" + queryParams[param] + "\\b)";
        }
      }
      paramsRegexp += "\\?(?=(" + lookArounds + ".*))";
    } else {
      // path must end the URL or be followed by query params
      paramsRegexp += "((\\?(?=((?:&?[^=&]*=[^=&]*)*)))|$)";
    }
    return new RegExp(pathRegexp + paramsRegexp);
  }

  // tour variables

  var basePath = "";
  var instructionsUrl = {
    path: "/instructions",
    queryParams: {}
  };
  var searchUrl = {
    path: "/search/lis/phavu.Phvul.002G085200",
    queryParams: {order: "distance"}
  };

  // the tour
  
  var tour = new Tour({
    name: 'genome-context-viewer',
    basePath: basePath,
    redirect: redirect,
    debug: true,
    orphan: true,
    onShow: (tour) => {
      return continueTourPromise(tour)
        .then(documentReadyPromise);
    },
    onEnd: (tour) => {
      if (document.location.pathname !== basePath + "/instructions") {
        if (confirm("The tour has ended. Go to instructions page?")) {
          document.location.href = basePath + "/instructions";
        }
      }
    },
    steps: [
      {
        path: gcvUrlMatch(instructionsUrl.path, instructionsUrl.queryParams),
        pathUrl: instructionsUrl,
        title: "Welcome!",
        content: "This quick tour will acquaint you with the Genome Context Viewer - a tool for exploring synteny relationships among sets of genomic segments. Use the Next button or &#8594; (right arrow key) to advance the tour.",
        element: "#tour",
        placement: "right",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Search View",
        content: "This is the Search View. It allows you to search across multiple data providers for genomic contexts similar to your query and align the results to the query in a manner that emphasizes structural variation.",
        orphan: true,
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Micro-Synteny Tracks",
        content: "These are Micro-Synteny tracks. Each track represents a genomic context - a neighborhood of genes drawn as triangles on a line. The direction of a triangle represents the orientation of the gene on the chromosome and the thickness of the line between triangles represents intergenic distance.",
        element: "#micro-synteny",
        placement: "right",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Micro Synteny Gene Families",
        content: "Each gene in the Micro-Synteny tracks is colored by the gene family it belongs to, as indicated in this legend. Given the potentially massive number of gene families for a given clade, colors are assigned dynamically as needed, but are consistent within a browsing session. Genes that are the only member of their family in the Micro-Synteny tracks (singletons) are colored white with a solid border, while genes not belonging to any family (orphans) are colored white with a dotted border.",
        element: "#micro-legend",
        placement: "left",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Search Gene",
        content: "A search is performed by entering a gene name and selecting which data provider serves the gene.",
        element: "app-gene-search",
        placement: "top",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(documentReadyPromise)
            // wait for the search widget to load
            .then(() => new Promise((resolve) => {
              var selector = "app-gene-search";
              waitForElement(selector, {callback: resolve});
            }))
            // show the search widget if necessary
            .then(() => new Promise((resolve) => {
              if (!isVisible("app-gene-search form")) {
                var selector = ".gene-search-link";
                universalClick(selector, {timeout: Infinity, callback: resolve});
              } else {
                resolve();
              }
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Query Track",
        content: "A Query Track is constructed from the Search Gene (outlined in bold) and the genes that flank it. The Query Track is then used to search across data providers for Micro-Synteny tracks that have similar Gene Family content to the Query Track.",
        element: "#micro-synteny .query",
        placement: "top",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(documentReadyPromise)
            // wait for the query track to be shown
            .then(() => new Promise((resolve) => {
              var selector = "#micro-synteny .query";
              waitForElement(selector, {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Micro-Synteny Search Results",
        content: "The similar Micro-Synteny tracks found by the search are each aligned to the Query Track based on their Gene Family content. They are then drawn in a manner that emphasizes the alignment, making structural variation more apparent. In the case of an inversion, the inverted segment is also aligned to the query and drawn backwards so that the inversion is visually apparent and the level of structural conservation within the inversion can be assessed. The Query Track is always listed first with a bold label.",
        element: "#micro-synteny",
        placement: "right",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Micro-Synteny Track Ordering",
        content: "The order of the search result Micro-Synteny tracks can be changed using the Track Ordering widget.",
        element: "app-ordering",
        placement: "top",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(documentReadyPromise)
            // wait for the search widget to load
            .then(() => new Promise((resolve) => {
              var selector = "app-ordering";
              waitForElement(selector, {callback: resolve});
            }))
            // show the search widget if necessary
            .then(() => new Promise((resolve) => {
              if (!isVisible("app-ordering form")) {
                var selector = ".track-order-link";
                universalClick(selector, {timeout: Infinity, callback: resolve});
              } else {
                resolve();
              }
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Micro-Synteny Track Filtering",
        content: "The search result Micro-Synteny tracks can be filtered by name using the Track Filtering widget. Advanced filtering can be performed by entering a regular expression",
        element: "app-regexp",
        placement: "top",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(documentReadyPromise)
            // wait for the search widget to load
            .then(() => new Promise((resolve) => {
              var selector = "app-regexp";
              waitForElement(selector, {callback: resolve});
            }))
            // show the search widget if necessary
            .then(() => new Promise((resolve) => {
              if (!isVisible("app-regexp form")) {
                var selector = ".track-regexp-link";
                universalClick(selector, {timeout: Infinity, callback: resolve});
              } else {
                resolve();
              }
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Dot Plots",
        content: "Each Micro-Synteny track has a \"plot\" link that reveals a pairwise Dot Plot between its gene families and that of the Query Track. This is useful for visualizing correspondences between tracks in terms of gene loci, rather than alignment.",
        element: "#micro-synteny .micro-plot-link:gt(2):first",
        placement: "top",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(documentReadyPromise)
            // wait for the dot plot button
            .then(() => new Promise((resolve) => {
              var selector = "#micro-synteny .micro-plot-link:gt(2):first";
              waitForElement(selector, {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Local Dot Plots",
        content: "Local Dot Plots show the correspondences between the genes in the selected track and the Query Track. Each gene in the selected track that shares a family with one or more genes in the Query Track is drawn as one or more points, as determined by the number of correspdonences. The x-coordinates correspond to the loci of the Gene Families on the selected track's chromosome and the y-coordinates correspond to the loci of the Gene Families on the Query Track's chromosome.",
        element: "#local-dot-plot .local-link",
        placement: "top",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(documentReadyPromise)
            // show the dot plot if necessary
            .then(showPlotPromise)
            // show the local dot plot if necessary
            .then(() => new Promise((resolve) => {
              if (!isVisible()) {
                var selector = "#local-global-dot-plots .local-link";
                universalClick(selector, {timeout: Infinity, callback: resolve});
              } else {
                resolve();
              }
            }))
            // wait for the local dot plot
            .then(() => new Promise((resolve) => {
              var selector = "#local-dot-plot .local-link";
              waitForElement(selector, {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Global Dot Plots",
        content: "Similar to Local Dot Plots, Global Dot Plots show gene correspondences between the selected track and the Query Track, but the genes drawn on the x-axis correspond to the entire chromosome of the selected track, rather than just the extent of the track. This gives a better sense for the frequency with which members of the Query Track Gene Families occur outside the context of the selected track and can reveal wider structural relationships.",
        element: "#global-dot-plot .global-link",
        placement: "top",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(documentReadyPromise)
            // show the dot plot if necessary
            .then(showPlotPromise)
            // show the global dot plot if necessary
            .then(() => new Promise((resolve) => {
              if (!isVisible()) {
                var selector = "#local-global-dot-plots .global-link";
                universalClick(selector, {timeout: Infinity, callback: resolve});
              } else {
                resolve();
              }
            }))
            // wait for the global dot plot
            .then(() => new Promise((resolve) => {
              var selector = "#global-dot-plot .global-link";
              waitForElement(selector, {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Macro-Synteny Blocks",
        content: "These are chromosome-scale Macro-Synteny blocks. They are computed on-demand across data providers relative to the chromosome of the Micro-Synteny Query Track. By default, the chromosomes present in the Micro-Synteny tracks are listed first with bold labels and given the same ordering as their Micro-Synteny counterparts. The vertical, semiopaque bar shows the position and extent of the Micro-Synteny Query Track on its chromosome and highlights the Macro-Synteny blocks that are syntenic to this region. The bar can be dragged to a different position to initiate a new search that uses the Micro-Synteny track derived from the newly highlighted region as the Query Track.",
        element: "#macro-synteny",
        placement: "right",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Macro-Synteny Organisms",
        content: "Each block in the Macro-Synteny blocks is colored by the organism it belongs to, as indicated in this legend. The colors are assigned by the data provders that the chromosomes were loaded from. The organism of the Query Gene is given a black, bold outline.",
        element: "#macro-legend",
        placement: "left",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Parameters",
        content: "This \"Parameters\" button reveals a dashboard that allows you to fine-tune the parameters of the algorithms that drive the Search View.",
        element: "#parameters-button",
        placement: "bottom",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Block Parameters",
        content: "Options grouped under \"Block Parameters\" determine how Macro-Synteny blocks are computed.",
        element: "#block-parameters",
        placement: "right",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(showLeftSliderPromise)
            .then(() => new Promise((resolve) => {
              scrollTo(".left-slider-content", "#block-parameters", {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Query Parameters",
        content: "Options grouped under \"Query Parameters\" determine how Micro-Synteny tracks similar to the Query Track are searched for. This includes which data providers will be searched.",
        element: "#query-parameters",
        placement: "right",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(showLeftSliderPromise)
            .then(() => new Promise((resolve) => {
              scrollTo(".left-slider-content", "#query-parameters", {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Alignment Parameters",
        content: "Options grouped under \"Alignment Parameters\" determine how the Micro-Synteny tracks found by the search will be aligned to the Query Track. This includes which alignment algorithm to use, what score a track must have to be displayed, and what score threshold an inversion must meet to be explicitly drawn.",
        element: "#alignment-parameters",
        placement: "right",
        onShow: (tour) => {
          return continueTourPromise(tour)
            .then(showLeftSliderPromise)
            .then(() => new Promise((resolve) => {
              scrollTo(".left-slider-content", "#alignment-parameters", {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(instructionsUrl.path, instructionsUrl.queryParams),
        pathUrl: instructionsUrl,
        title: "The End",
        content: "If you want to learn more about the GCV, check out the documentation as well as the white paper.",
        element: "#tour",
        placement: "right",
      },
    ]
  });
  return tour;
})();
