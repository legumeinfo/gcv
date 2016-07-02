var contextControllers = angular.module('contextControllers', []);


// main navigation bar
contextControllers.controller('NavigationCtrl',
function($scope, Viewer, UI) {
  var navigation = this;

  // pass through ui for the view
  navigation.ui = UI;

  // only draw the plot button when the viewer is in search mode
  navigation.plots = false;
  Viewer.subscribeToSearchModeChange($scope, function(e, mode) {
    navigation.plots = mode;
  });
});


// left slider state
contextControllers.controller('StateCtrl',
function($scope, $location, Viewer, Search, UI) {
  var state = this;

  // pass through ui for the view
  state.ui = UI;

  // if the app is in the search state
  state.searching = false;
  Viewer.subscribeToSearchModeChange($scope, function(e, mode) {
    state.searching = mode;
  });

  // context viewer track scrolling
  function scrollErrorCallback() {
    UI.alert("danger", "Invalid scroll size");
  }
  state.step;
  state.scrollLeft = function() {
    if (state.form.$valid) {
      Search.scrollLeft(state.step, state.search, scrollErrorCallback);
    } else {
      scrollCallback();
    }
  };
  state.scrollRight = function() {
    if (state.form.$valid) {
      Search.scrollRight(state.step, state.search, scrollErrorCallback);
    } else {
      scrollCallback();
    }
  };

  // conduct search
  state.search = function(source, gene) {
    UI.hideLeftSlider();
    state.current = 'parameters';
    $location.path('/search/'+source+'/'+gene);
  }

  // change state based on service events
  state.current = 'parameters';
  state.showParameters = function() {
    return state.current == 'parameters';
  }
  UI.subscribeToParametersClick($scope, function(e, leftSliderShowing) {
    if (state.current != 'parameters' || !leftSliderShowing) {
      state.current = 'parameters';
      UI.showLeftSlider();
    } else {
      UI.hideLeftSlider();
    }
  });
  Viewer.subscribeToGeneClick($scope, function(e, g) {
    $scope.$apply(function() {
      state.args = g;
      state.current = 'gene';
    });
    UI.showLeftSlider();
  });
  Viewer.subscribeToLeftAxisClick($scope, function(e, trackID) {
    $scope.$apply(function() {
      state.args = trackID;
      state.current = 'track';
    });
    UI.showLeftSlider();
  });
  Viewer.subscribeToFamilyClick($scope, function(e, family, genes) {
    $scope.$apply(function() {
      state.args = {family: family, genes: genes};
      state.current = 'family';
    });
    UI.showLeftSlider();
  });
});


// landing page
contextControllers.controller('InstructionsCtrl',
function($scope, $routeParams, UI) {
  loadTemplate($routeParams.template);
  UI.disableSliders();
  UI.alert("success", "Welcome!");
});


// basic viewer
contextControllers.controller('BasicCtrl',
function($scope, $routeParams, Basic, Viewer, UI) {
  var basic = this;

  // pass through ui for the view
  basic.ui = UI;

  // tell the viewer it's not in search mode
  Viewer.disableSearch();

  // make buttons for left/right sliders visible
  UI.enableSliders();

  // listen for resize events
  UI.subscribeToResize($scope, function() { Viewer.draw(); });

  // actually draws the viewer
  function draw(tracks) {
    UI.alert("success", tracks.groups.length + ' tracks returned');
    Viewer.init(tracks, {
      "focus": tracks.focus,
      "geneClicked": function() {},
      "leftAxisClicked": function() {}
    });
    UI.hideSpinners();
  }

  // get data (which triggers redraw)
  function getData() {
    UI.showSpinners();
    Basic.get($routeParams.genes.split(','), basic.params,
      function() {
        Basic.filter(basic.params, draw);
      }, function(msg) {
        UI.alert("danger", msg);
      }
    );
  }

  // initialize the parameters form
  var previous_sources = [];
  basic.init = function() {
    // multiselect
    basic.sources = Basic.getSources();
    // assign form values
    UI.loadParams(function(params) {
      function assign(key, value) {
        if (params.hasOwnProperty(key)) {
          var v = params[key];
          if (isNumber(v)) {
            return parseInt(v);
          } else if ($.isArray(v)) {
            return v.slice();
          } return v;
        } return value;
      }
      basic.params = {
        numNeighbors: assign('numNeighbors', 8),
        sources: assign(
          'source', basic.sources.map(function(s) { return s.id; })
        ),
        track_regexp: assign('track_regexp', "")
      };
      previous_sources = basic.params.sources.slice();
    });
    UI.saveParams(basic.params);
    getData();
  }

  // submit parameters form
  basic.submit = function() {
    if (basic.form.$valid) {
      UI.saveParams(basic.params);
      UI.hideLeftSlider();
      if (basic.form.numNeighbors.$pristine &&
          basic.params.sources.compare(previous_sources)) {  // enhancement.js
        Basic.filter(basic.params, draw);
      } else {
        previous_sources = basic.params.sources.slice();
        getData();
      }
    } else {
      UI.alert("danger", "Invalid input parameters");
    }
  }
});


// search viewer
contextControllers.controller('SearchCtrl',
function($scope, $routeParams, Search, Viewer, UI) {
  var search = this;

  // pass through ui for the view
  search.ui = UI;

  // show slider buttons in navigation bar
  UI.enableSliders();

  // tell the viewer it's in search mode
  Viewer.enableSearch();

  // listen for resize events
  UI.subscribeToResize($scope, function() { Viewer.draw(); });

  // draw the viewer
  function draw(num_returned, num_aligned, tracks, sorter) {
    Viewer.init(tracks, {
      "focus": $routeParams.gene,
      "geneClicked": function() {},
      "leftAxisClicked": function() {},
      "rightAxisClicked": function() {},
      "interTrack": true,
      "merge": true,
      "boldFirst": true,
      "sort": sorter
    });
    if (num_returned > 0 && num_aligned > 0) {
      UI.alert(
        "success",
        num_returned+" tracks returned. "+num_aligned+" aligned"
      );
    } else if (num_returned > 0 && num_aligned == 0) {
      UI.alert(
        "warning",
        num_returned+' tracks returned. 0 aligned (<a ' +
        'ng-click="nav.ui.showParameters()">' +
        'Alignment Parameters</a>)'
      );
    } else {
      UI.alert(
        "danger",
        'No tracks returned (<a ' +
        'ng-click="nav.ui.showParameters()">' +
        'Query Parameters</a>)'
      );
    }
    UI.hideSpinners();
  }

  // get data (which triggers redraw)
  function getData() {
    UI.showSpinners();
    Search.get(search.params, function() { Search.align(search.params, draw); },
      function(msg) {
        UI.hideSpinners();
        UI.alert("danger", msg);
      }
    );
  }

  // initialize the parameters form
  var previous_sources = [];
  search.init = function() {
    // multiselect
    search.sources = Search.getSources();
    // radio options
    search.algorithms = Search.getAligners();
    // select options
    search.orderings = Search.getOrderings();
    // assign form values
    UI.loadParams(function(params) {
      function assign(key, value) {
        if (params.hasOwnProperty(key)) {
          var v = params[key];
          if (isNumber(v)) {
            return parseInt(v);
          } else if ($.isArray(v)) {
            return v.slice();
          } return v;
        } return value;
      }
      search.params = {
        numNeighbors: assign('numNeighbors', 8),
        numMatchedFamilies: assign('numMatchedFamilies', 6),
        numNonFamily: assign('numNonFamily', 5),
        algorithm: assign('algorithm', search.algorithms[0].id),
        match: assign('match', 5),
        mismatch: assign('mismatch', -1),
        gap: assign('ga[', -1),
        score: assign('score', 25),
        threshold: assign('threshold', 25),
        track_regexp: assign('track_regexp', ""),
        order: assign('order', search.orderings[0].id),
        sources: assign(
          'source', search.sources.map(function(s) { return s.id; })
        )
      };
      previous_sources = search.params.sources.slice();
    });
    UI.saveParams(search.params);
    // initialize the search service with the query source and gene
    Search.init($routeParams.source, $routeParams.gene, search.params, getData,
      function(msg) {
        UI.alert("danger", msg);
      }
    );
  }

  // submit parameters form
  search.submit = function() {
    if (search.form.$valid) {
      UI.saveParams(search.params);
      UI.hideLeftSlider();
      // if the query didn't change
      if (search.form.numNeighbors.$pristine &&
          search.form.numMatchedFamilies.$pristine &&
          search.form.numNonFamily.$pristine &&
          search.params.sources.compare(previous_sources)) {  // enhancement.js
        Search.align(search.params, draw);
      } else {
        // manually check if the sources changed since $pristine is always false
        previous_sources = search.params.sources.slice();
        getData();
      }
    } else {
      UI.alert("danger", "Invalid input parameters");
    }
  }
});


// selected gene content
contextControllers
.controller('GeneCtrl',
function($scope, Gene, Viewer, UI) {
  var gene = this;

  function getGene(g) {
    UI.showLeftSpinner();
    Gene.get(g.name, g.source, function(links) {
      gene.source = g.source;
      gene.name = g.name;
      gene.family = g.family;
      gene.links = links;
      UI.hideSpinners();
    }, function(response) {
      UI.alert("danger", response);
      UI.hideSpinners();
    });
  }

  gene.init = function(g) {
    getGene(g);
  }

  Viewer.subscribeToGeneClick($scope, function(e, g) {
    getGene(g);
  });
});


// selected track content
contextControllers
.controller('TrackCtrl',
function($scope, Viewer, UI) {
  var track = this;

  function getData(trackID) {
    UI.showLeftSpinner();
    Viewer.getTrack(trackID, function(t) {
      track.source = t.source;
      track.species_name = t.species_name;
      track.chromosome_name = t.chromosome_name
      track.focus = t.focus;
      track.genes = t.genes;
      UI.hideSpinners();
    }, function(response) {
      UI.alert("danger", "Failed to retrieve track data");
      UI.hideSpinners();
    });
  }

  track.init = function(trackID) {
    getData(trackID);
  }

  Viewer.subscribeToLeftAxisClick($scope, function(e, trackID) {
    getData(trackID);
  });
});


// selected family content
contextControllers
.controller('FamilyCtrl',
function($scope, Viewer, UI) {
  var family = this;

  function getData(f, g) {
    UI.showLeftSpinner();
    family.name = f;
    family.genes = g;
    family.gene_list = family.genes.map(function(g){return g.name;}).join(',');
    UI.hideSpinners();
  }

  family.init = function(args) {
    getData(args.family, args.genes);
  }

  Viewer.subscribeToFamilyClick($scope, function(e, f, g) {
    getData(f, g);
  });
});


// draws plots
contextControllers
.controller('PlotCtrl',
function($scope, Plot, Viewer, Search, UI) {
  var plot = this;

  // pass through ui for the view
  plot.ui = UI;

  // if the plot element is viewing the local or global element
  var type = 'local';

  // the last track selected
  var selectedTrack;

  // if the app is in the search state
  plot.searching = false;
  Viewer.subscribeToSearchModeChange($scope, function(e, mode) {
    plot.searching = mode;
  });

  // (re)initialize when new tracks are available
  Search.subscribeToNewFilteredTracks($scope, function(e, tracks) {
    Plot.init(tracks);
    Plot.allLocal();
  });

  // draws chooses which plot to draw
  function localOrGloabl() {
    if (selectedTrack !== undefined) {
      if (type == 'local') {
        Plot.local(selectedTrack, function() {
          UI.alert("danger", "Failed to retrieve plot data");
        });
      } else if (type == 'global') {
        Plot.global(selectedTrack, function() {
          UI.alert("danger", "Failed to retrieve plot data");
        });
      }
    }
  }

  // redraw plots when a resize event occurs
  UI.subscribeToResize($scope, function(e) {
    Plot.allLocal();
    localOrGloabl();
  });

  // draw a plot what the viewer's plot button is clicked
  Viewer.subscribeToRightAxisClick($scope, function(e, trackID) {
    UI.showPlot();
    UI.showRightSlider();
    selectedTrack = trackID;
    localOrGloabl();
  });

  // draw a local plot
  plot.local = function() {
    type = 'local';
    if (selectedTrack !== undefined) {
      Plot.local(selectedTrack, function() {
        UI.alert("danger", "Failed to retrieve plot data");
      });
    }
  };

  // draw a global plot
  plot.global = function() {
    type = 'global';
    if (selectedTrack !== undefined) {
      Plot.global(selectedTrack, function() {
        UI.alert("danger", "Failed to retrieve plot data");
      });
    }
  }
});


// determines whether or not the show dismissible alert elements with help info
contextControllers
.controller('HelpCtrl',
function($scope, UI) {
  var help = this;

  // does the help have an existing state?
  help.init = function(name) {
    help.name = name;
    help.show = UI.showHelp(help.name);
  }

  // remove the help but don't save it
  help.remove = function() {
    help.show = false;
  }

  // remove the help and remember it
  help.saveRemove = function() {
    help.show = false;
    UI.removeHelp(help.name);
  }

  // get notified when to show again
  UI.subscribeToHelp($scope, function() {
    help.show = UI.showHelp(help.name);
  });
});
