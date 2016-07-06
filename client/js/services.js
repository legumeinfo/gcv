var contextServices = angular.module('contextServices', []);

// provides ANGULAR DEPENDENT ui events for all controllers
contextServices.service('UI', function ($localStorage, $location, $rootScope) {
  // the UI services available
  var ui = {};

  // constants
  var ANIMATION_DURATION = 350;

  // alerts
  ui.alertClass = 'alert-info';
  ui.alertMessage = 'Genomic Context Viewer';
  ui.alert = function (type, message) {
    ui.alertClass = "alert-"+type;
    ui.alertMessage = message;
  }

  // dismissible alerts
  ui.clearHelp = function   () {
    $localStorage.context_help = [];
    $rootScope.$broadcast('help-event');
  }
  if ($localStorage.context_help === undefined) {
    ui.clearHelp();
  }
  ui.removeHelp = function (name) {
    $localStorage.context_help.push(name);
  }
  ui.showHelp = function (name) {
    return $localStorage.context_help.indexOf(name) == -1 && ui.sliders;
  }
  ui.subscribeToHelp = function (scope, callback) {
    var handler = $rootScope.$on('help-event', callback);
    scope.$on('$destroy', handler);
  }

  // sliders
  ui.subscribeToParametersClick = function (scope, callback) {
    var handler = $rootScope.$on('parameters-click-event', callback);
    scope.$on('$destroy', handler);
  }
  ui.showParameters = function () {
    $rootScope.$broadcast(
      'parameters-click-event',
      $('#left-slider').is(':visible')
    );
  }
  ui.toggleLeftSlider = function () {
    $('#left-slider').animate({width:'toggle'}, ANIMATION_DURATION);
  }
  ui.showLeftSlider = function () {
    if ($('#left-slider').is(':hidden')) {
      ui.toggleLeftSlider();
    }
  }
  ui.hideLeftSlider = function () {
    if ($('#left-slider').is(':visible')) {
      ui.toggleLeftSlider();
    }
  }
  ui.toggleRightSlider = function () {
    ui.showSpinners();
    $('#right-slider').animate({width:'toggle'}, ANIMATION_DURATION,
    function () {
      ui.hideSpinners();
      resizeEvent();
    });
  }
  ui.showRightSlider = function () {
    if ($('#right-slider').is(':hidden')) {
      ui.toggleRightSlider();
    }
  }
  ui.hideRightSlider = function () {
    if ($('#right-slider').is(':visible')) {
      ui.toggleRightSlider();
    }
  }
  ui.sliders = true;
  ui.enableSliders = function () {
    focusViewer();
    ui.sliders = true;
  }
  ui.disableSliders = function () {
    focusViewer();
    ui.sliders = false;
    ui.hideLeftSlider();
    ui.hideRightSlider();
  }
  function focusViewer() {
    $('#viewer-button').click()
  }

  // the plot element
  ui.hidePlot = function () {
    $('#plot').hide();
  }
  ui.showPlot = function () {
    $('#plot').show();
  }

  // spinners
  var spinner = '<div class="grey-screen">'
    + '<div class="spinner"><img src="img/spinner.gif" /></div></div>';
  ui.showSpinners = function () {
    $('#main').append(spinner);
    $('#legend-wrapper .vertical-scroll').append(spinner);
    ui.showPlotSpinner();
  }
  ui.showPlotSpinner = function () {
    $('#plot .inner-ratio').append(spinner);
  }
  ui.hideSpinners = function () {
    $('.grey-screen').remove();
  }
  ui.showLeftSpinner = function () {
    $('#left-slider-content').append(spinner);
  }

  // resize events
  function resizeEvent() {
    $rootScope.$emit('resize-event');
  }
  ui.subscribeToResize = function (scope, callback) {
    var handler = $rootScope.$on('resize-event', callback);
    scope.$on('$destroy', handler);
  }
  var resizeTimeout;
  $(window).on('resize', function () {
    if (resizeTimeout === undefined) {
      ui.showSpinners();
    }
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = undefined;
      ui.hideSpinners();
      resizeEvent();
    }, 10);
  });

  // loads existing paramters
  ui.loadParams = function (callback) {
    // from memory
    var params = ($localStorage.context) ? $localStorage.context : {};
    // from the url
    params = $.extend(true, params, $location.search());
    callback(params);
  }

  // saves parameters
  ui.saveParams = function (params) {
    // to memory
    if ($localStorage.context === undefined) {
      $localStorage.context = $.extend(true, {}, params);
    } else {
      $localStorage.context = $.extend(true, $localStorage.context, params);
    }
    // to the url without deleting other parameters!
    $location.search($.extend(true, $location.search(), params));
  }

  return ui;
});

// responsible for storing context viewer data and drawing the viewer and legend
contextServices.service('Viewer',
function ($rootScope, UI) {
  var scope;
  var tracks;
  var args;
  var colors = contextColors;  // context.js

  // the services provided by Viewer
  var services = {};

  // whether the current viewer is for a search or not
  services.enableSearch = function () {
    $rootScope.$broadcast('search-mode-event', true);
  }
  services.disableSearch = function () {
    $rootScope.$broadcast('search-mode-event', false);
  }
  services.subscribeToSearchModeChange = function (scope, callback) {
    var handler = $rootScope.$on('search-mode-event', callback);
    scope.$on('$destroy', handler);
  }

  // how new track data is loaded for the context viewer
  services.init = function (new_tracks, new_args) {
    // initialize the new tracks
    tracks = new_tracks;
    // save the new viewer arguments
    args = new_args;
    // draw the viewer
    services.draw();
  }

  services.equip = function (tracks) {
    var reference = tracks.groups[0].chromosome_name;
    for (var i = 0; i < tracks.groups.length; i++) {
      // guarantee each track has a unique id and the reference name
      tracks.groups[i].reference = reference;
      tracks.groups[i].id = i;
      for (var j = 0; j < tracks.groups[i].genes.length; j++) {
        // guarantee each gene has x and y attributes
        tracks.groups[i].genes[j].x = j;
        tracks.groups[i].genes[j].y = i;
      }
    }
  }

  // (re)draws the context viewer
  services.draw = function () {
    if (tracks !== undefined && args !== undefined) {
      // arguments the controllers need not know about
      var selective = tracks.groups.length > 1;
      args.selectiveColoring = selective;
      args.width = $('#main').innerWidth();
      if (args.hasOwnProperty('geneClicked')) {
        args.geneClicked = function (gene) {
          services.geneClickEvent(gene);
        };
      }
      if (args.hasOwnProperty('leftAxisClicked')) {
        args.leftAxisClicked = function (trackID) {
          $rootScope.$broadcast('left-axis-click-event', trackID);
        };
      }
      if (args.hasOwnProperty('rightAxisClicked')) {
        args.rightAxisClicked = function (trackID) {
          services.rightAxisClickEvent(trackID);
        };
      }
      // draw the viewer
      contextViewer('viewer-content', colors, tracks, args);  // context.js
      // draw the legend
      contextLegend('legend-content', colors, tracks, {  // context.js
        "legendClick": function (family, genes) {
          $rootScope.$broadcast('family-click-event', family, genes);
        },
        "selectiveColoring": selective
      });
    }
  }

  // resolves a track id to a track
  services.getTrack = function (trackID, successCallback, errorCallback) {
    var track;
    for (var i = 0; i < tracks.groups.length; i++) {
      if (tracks.groups[i].id == trackID) {             
        track = tracks.groups[i];
        break;
      }
    }
    if (track !== undefined) {
      // the center of the track is considered the focus
      track.focus = track.genes[~~((track.genes.length-1)/2)];
      successCallback(track);
    } else {
      errorCallback();
    }
  }

  // publications controllers can subscribe to
  services.subscribeToGeneClick = function (scope, callback) {
    var handler = $rootScope.$on('gene-click-event', callback);
    scope.$on('$destroy', handler);
  };
  services.geneClickEvent = function (gene) {
    $rootScope.$broadcast('gene-click-event', gene);
  };
  services.subscribeToLeftAxisClick = function (scope, callback) {
    var handler = $rootScope.$on('left-axis-click-event', callback);
    scope.$on('$destroy', handler);
  };
  services.subscribeToRightAxisClick = function (scope, callback) {
    var handler = $rootScope.$on('right-axis-click-event', callback);
    scope.$on('$destroy', handler);
  };
  services.rightAxisClickEvent = function (trackID) {
    $rootScope.$broadcast('right-axis-click-event', trackID);
  }
  services.subscribeToFamilyClick = function (scope, callback) {
    var handler = $rootScope.$on('family-click-event', callback);
    scope.$on('$destroy', handler);
  };

  return services;
});

// responsible for curating data for the basic viewer
contextServices.service('Basic', function ($http, $q, Viewer) {
  var ERROR = -1;
  var tracks;

  // the services provided
  var services = {};

  // where tracks can be loaded from
  var sources = {
    lis: {
      name: "Legume Information System",
      get: 'http://localhost:8000/services/basic_tracks_tree_agnostic/'
    }
  };
  services.getSources = function () {
    return Object.keys(sources).map(function (value, index) {
      return {id: value, name: sources[value].name};
    });
  }

  // centers the given set of tracks on the focus family
  function center(params) {
    returned = tracks.groups.length;
    var length = params.numNeighbors*2+1;
    var centered = {};
    for (var i = 0; i < tracks.groups.length; i++) {
      // does the track need to be centered?
      if (tracks.groups[i].genes.length < length) {
        // find the gene it should be centered on
        var j;
        for (j = 0; j < tracks.groups[i].genes.length; j++) {
          if (tracks.groups[i].genes[j].family == tracks.focus &&
              centered[tracks.groups[i].genes[j].id] === undefined) {
            centered[tracks.groups[i].genes[j].id] = true;
            break;
          }
        }
        // center the track
        var offset = params.numNeighbors-j;
        for (j = 0; j < tracks.groups[i].genes.length; j++) {
          tracks.groups[i].genes[j].x = offset+j;
        }
      }
    }
  }

  // removes tracks that don't meet the filter regular expression
  services.filter = function (params, callback) {
    var track_filter = (params.track_regexp === undefined ? undefined :
                        new RegExp(params.track_regexp));
    var filtered_tracks = $.extend(true, {}, tracks);
    if (track_filter !== undefined) {
      filtered_tracks.groups = filtered_tracks.groups.filter(function (track) {
        return track_filter.test(track.chromosome_name);
      });
    }
    callback(filtered_tracks);
  }

  // get the tracks to display
  services.get = function (genes, params, successCallback, errorCallback) {
    // generate a promise for each service
    var args = {
      genes: genes,
      numNeighbors: params.numNeighbors
    }
    var promises = []; 
    for (var i in params.sources) {
      var src = params.sources[i];
      if (sources.hasOwnProperty(src) &&
          sources[src].hasOwnProperty('get')) {
        promises.push(
          $http({url: sources[src].get, method: "POST", data: args}).then(
            (function (src) {  // gotta have that source
              return function (response) {
                return {source: src, response: response};
              }
            })(src),
            function (response) { return ERROR; }
          )
        );
      }
    }
    // wait for all the promises to be fulfilled
    $q.all(promises).then(function (dataset) {
      var error_count = 0;
      // aggregate all the results into a single object
      tracks = {'families': [], 'groups': []};
      for (var i = 0; i < dataset.length; i++) {
        if (dataset[i] !== ERROR) {
          var src = dataset[i].source;
          var d = JSON.parse(dataset[i].response.data);
          // tag each track and its genes with their source
          for (var j = 0; j < d.tracks.groups.length; j++) {
              d.tracks.groups[j].source = src;
              for (var k in d.tracks.groups[j].genes) {
                d.tracks.groups[j].genes[k].source = src;
              }
          }
          if (d.family !== undefined) {
            tracks.focus = d.family;
          }
          // aggregate the result tracks
          tracks.families = tracks.families.concat(d.tracks.families);
          tracks.groups = tracks.groups.concat(d.tracks.groups);
        } else {
          error_count++;
        }
      }
      if (error_count < promises.length) {
        if (tracks.groups.length > 0) {
          // equip the tracks for the viewer
          Viewer.equip(tracks);
          // center the tracks on the focus family
          center(tracks, params);
          // ready to proceed
          successCallback();
        } else {
          errorCallback('No tracks returned');
        }
      } else {
        errorCallback('Failed to retrieve data');
      }
    },
    function (reason) { errorCallback(reason); });
  }

  return services;
});

// responsible for curating data for the search viewer
contextServices.service('Search', function ($http, $q, $rootScope, Viewer) {
  var ERROR = -1;
  var source;
  var gene;
  var query;
  var tracks;

  // the services provided by Search
  var services = {};

  // available alignment algorithms
  var aligners = {
    smith: {
      name: "Smith-Waterman",
      algorithm: smith  // smith.js
    },
    repeat: {
      name: "Repeat",
      algorithm: repeat  // repeat.js
    }
  };
  services.getAligners = function () {
    return Object.keys(aligners).map(function (value, index) {
      return {id: value, name: aligners[value].name};
    });
  }

  // how result tracks can be ordered
  var orderings = {
    chromosome: {
      name: "Chromosome",
      algorithm: function (a, b) {
        return a.chromosome_name.localeCompare(b.chromosome_name);
      }
    },
    distance: {
      name: "Edit distance",
      algorithm: function (a, b) {
        var diff = b.score-a.score
        // if group have the same score
        if (diff == 0) {
          // if sorting alphabetically doesn't resolve the ordering
          if (a.chromosome_name == b.chromosome_name) {
            // try and sort by group?
            if (a.id == b.id) {
              // sort by track start position
              // assumes genes list is already sorted by x location
              return a.genes[0].x-b.genes[0].x;
            }
            return a.id-b.id;
          }
          return (a.chromosome_name > b.chromosome_name) ? 1 : -1;
        }
        return diff;
      }
    }
  };
  services.getOrderings = function () {
    return Object.keys(orderings).map(function (value, index) {
      return {id: value, name: orderings[value].name};
    });
  }

  // where tracks can be loaded from
  var sources = {
    lis: {
      name: "Legume Information System",
      init: 'http://localhost:8000/services/gene_to_query/',
      get: 'http://localhost:8000/services/search_tracks_tree_agnostic/'
    }
  };
  services.getSources = function () {
    return Object.keys(sources).map(function (value, index) {
      return {id: value, name: sources[value].name};
    });
  }

  // align the result tracks to the query
  services.align = function(params, callback) {
    var aligned = $.extend(true, {}, tracks);
    var scores = {};
    var num_aligned = 0;
    var aligner = aligners[params.algorithm].algorithm;
    // align all the tracks with the query track
    var alignments = [],
        resultTracks = [];
    var track_filter = (params.track_regexp === undefined ? undefined :
                        new RegExp(params.track_regexp));
    for (var i = 1; i < aligned.groups.length; i++) {
      var al = aligner(aligned.groups[0].genes,
                       aligned.groups[i].genes,
                       function(item) { return item.family; },
                       params);
      var id = aligned.groups[i].id;
      if (al !== null && al[1] >= params.score &&
          (track_filter === undefined ||
          track_filter.test(aligned.groups[i].chromosome_name))) {
        for (var j = 0; j < al[0].length; j++) {
          resultTracks.push(clone(aligned.groups[i]));
          alignments.push(al[0][j]);
        }
        if (al[0].length > 0) {
          if (scores[id] === undefined) {
            scores[id] = 0;
          }
          scores[id] += al[1];
          num_aligned++;
        }
      }
    }
    // merge the alignments
    aligned.groups = [aligned.groups[0]];
    mergeAlignments(aligned, resultTracks, alignments);  // context.js
    // add scores to tracks
    for (var i = 1; i < aligned.groups.length; i++) {
      aligned.groups[i].score = scores[aligned.groups[i].id];
    }
    // filter the original tracks by which ones were aligned
    var filtered_tracks = {
      groups: tracks.groups.filter(function(track) {
        return scores.hasOwnProperty(track.id) || track.id == query.id;
      }),
      numNeighbors: params.numNeighbors
    };
    filtered_tracks.groups.sort(orderings[params.order].algorithm);
    // send the tracks into the wild
    $rootScope.$broadcast('new-filtered-tracks-event', filtered_tracks);
    callback(
      tracks.groups.length-1,
      num_aligned,
      aligned,
      orderings[params.order].algorithm
    );
  }

  // initializes a new query by resolving a focus gene into a query track
  services.init = function (source, gene, params, successCallback, errorCallback) {
    if (sources.hasOwnProperty(source) &&
        sources[source].hasOwnProperty('init')) {
      var args = {
        gene: gene,
        numNeighbors: params.numNeighbors
      };
      $http({url: sources[source].init, method: "POST", data: args})
      .then(
        function (response) {
          query = JSON.parse(response.data);
          query.source = source;
          for (var i in query.genes) {
            query.genes[i].source = source;
          }
          $rootScope.$broadcast('new-query-event', query);
          return successCallback();
        }, function (response) { return errorCallback(response); }
      );
    } else {
      errorCallback('"'+source+'" is not a valid service provider');
    }
  }

  // distributes the new query
  services.subscribeToNewQuery = function (scope, callback) {
    var handler = $rootScope.$on('new-query-event', callback);
    scope.$on('$destroy', handler);
  }

  // queries all the selected providers
  services.get = function (params, successCallback, errorCallback) {
    // generate a promise for each service
    var args = {
      query: query.genes.map(function (g) { return g.family; }),
      numNeighbors: params.numNeighbors,
      numMatchedFamilies: params.numMatchedFamilies,
      numNonFamily: params.numNonFamily
    };
    var promises = [];
    for (var i in params.sources) {
      var src = params.sources[i];
      if (sources.hasOwnProperty(src) &&
          sources[src].hasOwnProperty('get')) {
        promises.push(
          $http({url: sources[src].get, method: "POST", data: args}).then(
            (function (src) {  // gotta have that source
              return function (response) {
                return {source: src, response: response};
              }
            })(src),
            function (response) { return ERROR; }
          )
        );
      }
    }
    // wait for all the promises to be fulfilled
    $q.all(promises).then(function (dataset) {
      var error_count = 0;
      // aggregate all the results into a single object
      var new_tracks = {'families': [], 'groups': [query]};
      for (var i = 0; i < dataset.length; i++) {
        if (dataset[i] != ERROR) {
          var src = dataset[i].source;
          var d = JSON.parse(dataset[i].response.data);
          // tag each track and its genes with their source
          for (var j = 0; j < d.groups.length; j++) {
            d.groups[j].source = src;
            for (var k in d.groups[j].genes) {
              d.groups[j].genes[k].source = src;
            }
          }
          // remove the query if present
          if (src == query.source) {
            d.groups = d.groups.filter(function (track) {
              if (track.species_id == query.species_id &&
                  track.chromosome_id == query.chromosome_id &&
                  track.genes.length >= query.genes.length) {
                var gene_ids = track.genes.map(function (g) { return g.id; });
                for (var j = query.genes.length; j--;) {
                  if (gene_ids.indexOf(query.genes[j].id) == -1 )
                    return true;
                } return false;
              } return true;
            });
          }
          // aggregate the remaining tracks
          new_tracks.families = new_tracks.families.concat(d.families);
          new_tracks.groups = new_tracks.groups.concat(d.groups);
        } else {
          error_count++;
        }
      }
      if (error_count < promises.length) {
        tracks = new_tracks;
        // equip the tracks for the viewer
        Viewer.equip(tracks);
        successCallback();
      } else {
        errorCallback('Failed to retrieve data');
      }
    },
    function (reason) { errorCallback(reason); });
  }

  // distributes the new set of tracks filtered by which were aligned
  services.subscribeToNewFilteredTracks = function (scope, callback) {
    var handler = $rootScope.$on('new-filtered-tracks-event', callback);
    scope.$on('$destroy', handler);
  }

  // scroll the query track
  function scroll(step, m, successCallback, errorCallback) {
    var half = ~~(query.genes.length/2);
    if (step > 0 && step <= half) {
      successCallback(query.source, query.genes[half+(m*step)].name);
    } else {
      errorCallback();
    }
  }
  services.scrollLeft = function (step, successCallback, errorCallback) {
    scroll(step, -1, successCallback, errorCallback)
  }
  services.scrollRight = function (step, successCallback, errorCallback) {
    scroll(step, 1, successCallback, errorCallback)
  }
  
  return services;
});

// responsible for curating data for the search viewer
contextServices.service('Synteny', function ($http, $q, $rootScope, Viewer) {

  var ERROR = -1;
  var data;
  var ELEMENT = 'synteny';
  var viewArgs = {}

  // where tracks can be loaded from
  var sources = {
    lis: {
      get: 'http://localhost:8000/services/synteny/'
    }
  };

  return {
    // queries all the selected providers
    get: function (query, successCallback, errorCallback) {
      // generate a promise for each service
      var args = {chromosome: query.chromosome_id};
      var promises = [];
      if (sources.hasOwnProperty(query.source) &&
          sources[query.source].hasOwnProperty('get')) {
        $http({url: sources[query.source].get, method: "POST", data: args}).then(
          function (response) {
            viewArgs.viewport = {
              start: query.genes[0].fmin,
              stop: query.genes[query.genes.length-1].fmax
            }
            data = response.data;
            successCallback();
          }, errorCallback
        )
      } else {
        errorCallback('"' + query.source + '" is not a valid service provider');
      }
    },
    draw: function (nameClick, blockClick) {
      // update the viewer arguments
      viewArgs.nameClick = nameClick;
      viewArgs.blockClick = blockClick;
      // draw the viewer
      if (data !== undefined) {
        document.getElementById(ELEMENT).innerHTML = '';
        Synteny.draw(ELEMENT, data, viewArgs);
      }
    }
  };
});

contextServices.factory('Gene', function ($http) {
  return {
    get: function (name, source, successCallback, errorCallback) {
      // list of all services
      var sources = {
        lis: 'http://legumeinfo.org/gene_links/'+name+'/json',
      }
      if (sources.hasOwnProperty(source)) {
        $http({url: sources[source], method: "GET"})
           .then(function (response) { successCallback(response.data); },
                 function (response) { errorCallback(response); });
      } else {
        errorCallback('"'+source+'" is not a valid service provider');
      }
    },
  }
});

contextServices.service('Plot', function ($http, Viewer, UI) {
  var query;
  var localPlots;
  var localIdToIndex;
  var globalPlots;
  var familySizes;
  var familyMap = {};
  var colors = contextColors;  // context.js

  // plots a track against the query
  function plotPoints(track) {
    var plot_genes = [];
    for (var j = 0; j < track.genes.length; j++) {
      if (track.genes[j].family in familyMap) {
        for (var k = 0; k < familyMap[track.genes[j].family].length; k++) {
          track.genes[j].x = ((track.genes[j].fmin/2)+(track.genes[j].fmax/2));
          track.genes[j].y = familyMap[track.genes[j].family][k];
        }
      } else {
        track.genes[j].x = ((track.genes[j].fmin/2)+(track.genes[j].fmax/2));
        track.genes[j].y = -1;
      }
      plot_genes.push(track.genes[j]);
    }
    return plot_genes;
  }
  
  // prepare the local tracks for plotting
  function plotLocals(tracks) {
    localPlots = [];
    localIdToIndex = {};
    globalPlots = {};

    // make a map of points all genes will be plotted against
    familyMap = {};
    for (var i = 0; i < tracks.groups[0].genes.length; i++) {
      var g = tracks.groups[0].genes[i];
      if (g.family in familyMap) {
        familyMap[g.family].push((g.fmin/2)+(g.fmax/2));
      } else if (g.family != '') {
        familyMap[g.family] = [(g.fmin/2)+(g.fmax/2)];
      }
    }
    // plot all the genes against the list of points
    for (var i = 0; i < tracks.groups.length; i++) {
      var id = tracks.groups[i].id;
      var index = localPlots.length;
      localIdToIndex[id] = index;
      localPlots.push($.extend(true, {}, tracks.groups[i]));
      localPlots[index].genes = plotPoints(localPlots[index]);
    }
  }

  // draws a plot
  function draw(element, data, dim) {
    $(element).html('');
    plot(element.substr(1), familySizes, colors, data, {  // plot.js
      "geneClicked":  function (gene) { Viewer.geneClickEvent(gene); },
      "plotClicked": function (trackID) { Viewer.rightAxisClickEvent(trackID); },
      "width": dim
    });
  }

  return {
    init: function (tracks) {
      if (tracks.groups.length > 0) {
        query = tracks.groups[0].genes.map(function (g) { return g.family; });
        familySizes = getFamilySizeMap(tracks)  // context.js
        plotLocals(tracks);
      }
    },
    local: function (trackID, errorCallback) {
      if (localIdToIndex[trackID] !== undefined) {
        var dim = $('#right-slider .inner-ratio').innerWidth();
        draw('#local-plot', localPlots[localIdToIndex[trackID]], dim)
      } else {
        errorCallback();
      }

    },
    global: function (trackID, errorCallback) {
      // list of all services
      var sources = {
        'lis': 'http://localhost:8000/services/global_plot_provider_agnostic/',
      };
      if (localIdToIndex[trackID] !== undefined) {
        var dim = $('#right-slider .inner-ratio').innerWidth();
        var local = localPlots[localIdToIndex[trackID]];
        if (globalPlots[trackID] !== undefined) {
          draw('#global-plot', globalPlots[trackID], dim);
        } else if (sources.hasOwnProperty(local.source)) {
          UI.showPlotSpinner();
          $http({url: sources[local.source], method: "POST",
            data: {
              query: query,
              chromosomeID: local.chromosome_id
            }
          }).then(function (response) {
            var track = $.extend(true, {}, local);
            globalPlots[trackID] = track;
            track.genes = response.data;
            for (var i in track.genes) {
              track.genes[i].source = local.source;
            }
            globalPlots[trackID].genes = plotPoints(track);
            draw('#global-plot', globalPlots[trackID], dim);
            UI.hideSpinners();
          }, function (response) {
            UI.hideSpinners();
            errorCallback();
          });
        }
      } else {
        errorCallback();
      }
    },
    allLocal: function () {
      if (localPlots !== undefined) {
        $('#plots-content').html('');
        var dim = $('#main').innerWidth()/3;
        for (var i = 0; i < localPlots.length; i++) {
          var id = "plot"+i;
          $('#plots-content').append(
            '<div id="' + id + '" class="col-lg-4"></div>'
          );
          draw('#'+id, localPlots[i], dim);
        }
      }
    }
  }
});
