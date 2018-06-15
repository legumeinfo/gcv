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

  // the tour
  
  var tour = new Tour({
    name: 'genome-context-viewer',
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
      if (document.location.pathname !== "/instructions") {
        if (confirm("Go to instructions page?")) {
          document.location.href = "/instructions";
        }
      }
    },
    steps: [
      {
        path: "/instructions",
        title: "Welcome!",
        content: "This quick tour will acquaint you with the Genome Context Viewer - a tool for exploring synteny relationships among sets of genomic segments. Use the Next button or &#8594; (right arrow key) to advance the tour.",
        element: "#tour",
        placement: "right",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Search View",
        content: "This is the Search view. It allows you to search across multiple data providers for genomic contexts similar to your query and align the results to the query in a manner that emphasizes structural variation.",
        orphan: true,
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Micro-Synteny Tracks",
        content: "The Micro-Synteny viewer displays the query context (bold) and the results.",
        element: "#micro-synteny",
        placement: "top",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Micro-Synteny Tracks",
        content: "Although the primary representation in a track is of gene order and orientation, intergenic distances are suggested by the differential widths of the bars connecting adjacent genes. Track labels can also be moused-over or clicked for information and options regarding the complete track content.",
        element: "#micro-synteny .query",
        placement: "top",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Macro-Synteny Blocks",
        content: "The chromosome from which the query segment was taken has macro-synteny blocks to other chromosomes computed dynamically, using user-specifiable parameters, and without restriction as to whether they reside in the same database or come from federated service providers. The vertical bar shows the position and extent of the query segment in its chromosomal context, and the colored horizontal blocks show how far synteny extends beyond the current microsynteny view. Macrosynteny blocks may not always be in perfect agreement with the results displayed in the microsynteny tracks as they rely on somewhat different computational techniques, but adjustment of parameters for the two algorithms can be used to make them correspond more closely.",
        element: "#macro-synteny",
        placement: "bottom",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Gene Families Legend",
        content: "The color of each gene in a Genome Context View is determined by the gene family to which it belongs, as indicated in the legend. Colors are assigned dynamically, but memorized in browser storage for consistency during browsing. Genes belonging to families with no other representatives in a view are left uncolored, while genes not belonging to families are both uncolored and have dotted outlines. Since genes in a family tend to have relatively similar sequences, we can use them to predict the functions of newly identified genes based on their relations to other known genes, especially in cases where the genes are found in similar syntenic contexts. Mouse-over of gene families in the legend will highlight all representatives of the family in the current view, while clicking on the families will display a panel listing those same genes with the option to view them in the context of the family's phylogenetic tree.",
        element: "#micro-legend",
        placement: "left",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Organism Legend",
        content: "Needs text.",
        element: "#macro-legend",
        placement: "left",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Dot Plots",
        content: "Dot Plots are useful in visualizing correspondences between pairs of tracks without relying upon alignment. The <strong>plot</strong> link reveals the dot plot for the given result genome track against the query track. (If you cannot see the <strong>plot</strong> links, maximize your browser window)",
        element: "#micro-synteny .micro-plot-link:gt(2):first",
        placement: "right",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
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
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
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
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
        title: "Parameters",
        content: "These parameters allow you to fine-tune the candidate tracks retrieved and the alignments produced from them.",
        element: "#parameters-button",
        placement: "bottom",
      },
      {
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
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
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
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
        path: "/search/lis/phavu.Phvul.002G085200?bintermediate=10&bmask=10&bmatched=20&intermediate=5&matched=4&neighbors=10&sources=lis&algorithm=repeat&gap=-1&match=10&mismatch=-1&score=30&threshold=25",
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
        path: "/instructions",
        title: "The End",
        content: "If you want to learn more about the GCV, check out the documents as well as the white paper.",
        element: "#tour",
        placement: "right",
      },
    ]
  });
  return tour;
})();
