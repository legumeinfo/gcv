var defaultTour = (function () {

  // helpers

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
    queryParams: {}
  };

  // the tour
  
  var tour = new Tour({
    name: 'genome-context-viewer',
    basePath: basePath,
    redirect: redirect,
    debug: true,
    orphan: true,
    onShow: (tour) => {
      var i = tour.getCurrentStep();
      var selector = document;
      var step = tour.getStep(i);
      if (step !== undefined && step.element !== undefined) {
        selector = step.element;
      }
      return documentReadyPromise();
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
        content: "This is the Search view. It allows you to search across multiple data providers for genomic contexts similar to your query and align the results to the query in a manner that emphasizes structural variation.",
        orphan: true,
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Micro-Synteny Tracks",
        content: "The Micro-Synteny viewer displays the query context (bold) and the results.",
        element: "#micro-synteny",
        placement: "top",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Micro-Synteny Tracks",
        content: "Although the primary representation in a track is of gene order and orientation, intergenic distances are suggested by the differential widths of the bars connecting adjacent genes. Track labels can also be moused-over or clicked for information and options regarding the complete track content.",
        element: "#micro-synteny .query",
        placement: "top",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Macro-Synteny Blocks",
        content: "The chromosome from which the query segment was taken has macro-synteny blocks to other chromosomes computed dynamically, using user-specifiable parameters, and without restriction as to whether they reside in the same database or come from federated service providers. The vertical bar shows the position and extent of the query segment in its chromosomal context, and the colored horizontal blocks show how far synteny extends beyond the current microsynteny view. Macrosynteny blocks may not always be in perfect agreement with the results displayed in the microsynteny tracks as they rely on somewhat different computational techniques, but adjustment of parameters for the two algorithms can be used to make them correspond more closely.",
        element: "#macro-synteny",
        placement: "bottom",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Gene Families Legend",
        content: "The color of each gene in a Genome Context View is determined by the gene family to which it belongs, as indicated in the legend. Colors are assigned dynamically, but memorized in browser storage for consistency during browsing. Genes belonging to families with no other representatives in a view are left uncolored, while genes not belonging to families are both uncolored and have dotted outlines. Since genes in a family tend to have relatively similar sequences, we can use them to predict the functions of newly identified genes based on their relations to other known genes, especially in cases where the genes are found in similar syntenic contexts. Mouse-over of gene families in the legend will highlight all representatives of the family in the current view, while clicking on the families will display a panel listing those same genes with the option to view them in the context of the family's phylogenetic tree.",
        element: "#micro-legend",
        placement: "left",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Organism Legend",
        content: "Needs text.",
        element: "#macro-legend",
        placement: "left",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Dot Plots",
        content: "Dot Plots are useful in visualizing correspondences between pairs of tracks without relying upon alignment. The <strong>plot</strong> link reveals the dot plot for the given result genome track against the query track. (If you cannot see the <strong>plot</strong> links, maximize your browser window)",
        element: "#micro-synteny .micro-plot-link:gt(2):first",
        placement: "right",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Local Plot",
        content: "All the genes from the result track are displayed as points, with the x-coordinate determined by the physical position of the gene in the result chromosome and the y-coordinate(s) determined by the physical positions of genes belonging to the same family in the query chromosome. Genes in the result track without a corresponding gene in the query are displayed along the \"Outliers\" axis above the plot.",
        element: "#local-dot-plot .local-link",
        placement: "top",
        onShow: () => {
          return documentReadyPromise()
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
        title: "Global Plot",
        content: "Instead of focusing only on the extent of the matched syntenic segment, the global plot displays all instances of genes from the families of the query track across the chromosome from which the matched segment was taken. This gives a better sense for the frequency with which members of these families occur outside the matched context and can reveal wider structural relationships, especially in cases where the chosen search and alignment strategy fails to produce a single track collecting all collinear segments between the result chromosome and the query segment.",
        element: "#global-dot-plot .global-link",
        placement: "top",
        onShow: () => {
          return documentReadyPromise()
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
        title: "Parameters",
        content: "These parameters allow you to fine-tune the candidate tracks retrieved and the alignments produced from them.",
        element: "#parameters-button",
        placement: "bottom",
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Block Parameters",
        content: "Options grouped under \"Block Parameters\" determine how macrosynteny blocks against the query chromosome are determined.",
        element: "#block-parameters",
        placement: "right",
        onShow: () => {
          return showLeftSliderPromise()
            .then(() => new Promise((resolve) => {
              scrollTo(".left-slider-content", "#block-parameters", {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Query Parameters",
        content: "Options grouped under \"Query Parameters\" determine which remote track retrieval services will be invoked and how they should decide whether a segment of a chromosome has sufficiently similar gene family content to the query segment to be considered as a candidate for alignment by the client.",
        element: "#query-parameters",
        placement: "right",
        onShow: () => {
          return showLeftSliderPromise()
            .then(() => new Promise((resolve) => {
              scrollTo(".left-slider-content", "#query-parameters", {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(searchUrl.path, searchUrl.queryParams),
        pathUrl: searchUrl,
        title: "Alignment Parameters",
        content: "Correspondence between the elements of the tracks is determined via sequence alignment algorithms, modified to consider the gene family assignments as the characters of a genomic alphabet. For Smith-Waterman, the orientation (forward/reverse) with the higher score is displayed (assuming it meets scoring criteria). For the Repeat algorithm, all alignments meeting threshold criteria are kept and displayed as related tracks. This has the advantage of nicely capturing inversions.",
        element: "#alignment-parameters",
        placement: "right",
        onShow: () => {
          return showLeftSliderPromise()
            .then(() => new Promise((resolve) => {
              scrollTo(".left-slider-content", "#alignment-parameters", {callback: resolve});
            }));
        },
      },
      {
        path: gcvUrlMatch(instructionsUrl.path, instructionsUrl.queryParams),
        pathUrl: instructionsUrl,
        title: "The End",
        content: "If you want to learn more about the GCV, check out the documents as well as the white paper.",
        element: "#tour",
        placement: "right",
      },
    ]
  });
  return tour;
})();
