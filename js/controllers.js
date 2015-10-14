var contextControllers = angular.module('contextControllers', []);

contextControllers
.controller('ViewerCtrl', ['$scope', '$routeParams', '$location', '$cookies',
                            'Viewer', 'Broadcast',
function($scope, $routeParams, $location, $cookies, Viewer, Broadcast) {
  var focusName;
  // initialize the form
  $scope.init = function() {
    // radio options
    $scope.algorithms = [{id: "smith", name: "Smith-Watermn"},
                         {id: "repeat", name: "Repeat"}];
    // select options
    $scope.orderings = [{id: "chromosome", name: "Chromosome"},
                        {id: "distance", name: "Edit distance"}];
    // default form values
    $scope.params = {numNeighbors: 8,
                       numMatchedFamilies: 6,
                       numNonFamily: 5,
                       algorithm: "repeat",
                       match: 5,
                       mismatch: -1,
                       gap: -1,
                       threshold: 25,
                       order: "chromosome"};
    // override with values from cookie
    var cookie = $cookies.getObject('context');
    if (cookie !== undefined) {
      updateObj(cookie, $scope.params);
    }
    // override with values from url
    var search = $location.search();
    if (search !== undefined) {
      updateObj(search, $scope.params);
    }
  }

  // gets data and updates the view when the form is submitted
  $scope.submit = function() {
    if ($scope.form.$valid) {
      $scope.showSpinners();
      $scope.hideLeftSlider();
      // in case the form is submitted with invalid values
      $scope.$broadcast('show-errors-check-validity');
      // update the url to reflect the changes
      $location.search($scope.params);
      // save the new params to the cookie
      $cookies.putObject('context', $scope.params);
      // only three params require a db query
      if (!($scope.form.numNeighbors.$pristine &&
            $scope.form.numMatchedFamilies.$pristine &&
            $scope.form.numNonFamily.$pristine) ||
          Viewer.tracks() === undefined ||
          ($routeParams.focusName !== undefined &&
           focusName != $routeParams.focusName)) {
        focusName = $routeParams.focusName;
        getData();
      } else {
        Viewer.align($scope.params);
        drawViewer();
      }
    } else {
      $scope.alert("danger", "Invalid input parameters");
    }
  }
  
  // try to fetch new data whenever the controller is initialized
  if ($routeParams.focusName !== undefined && Viewer.tracks() === undefined ||
      focusName != $routeParams.focusName) {
    $scope.submit();
  }

  // private function that fetches data
  function getData() {
    Viewer.get($routeParams.focusName,
                  {numNeighbors: $scope.params.numNeighbors,
                   numMatchedFamilies: $scope.params.numMatchedFamilies,
                   numNonFamily: $scope.params.numNonFamily},
                  function(response) {
                    $scope.alert("danger", "Failed to retrieve data");
                    $scope.hideSpinners();
                  });
  }

  // private function that draws viewer
  var drawViewer = function() {
    // helper functions for sorting tracks
    function byChromosome(a, b) {
      return a.chromosome_name.localeCompare(b.chromosome_name);
    }
    function byDistance(a, b) {
      var scores = Viewer.scores();
      var a_id = a.id,
          b_id = b.id;
      return scores[b_id]-scores[a_id];
    }
    // make the context viewer
    var colors = Viewer.colors();
    contextViewer('viewer', colors, Viewer.tracks(),
                  {"geneClicked": Broadcast.geneClicked,
                   "leftAxisClicked": Broadcast.leftAxisClicked,
                   "rightAxisClicked": Broadcast.rightAxisClicked,
                   "selectiveColoring": true,
                   "interTrack": true,
                   "merge": true,
                   "boldFirst": true,
                   "sort": $scope.params.order == "chromosome" ?
                           byChromosome : byDistance});
	contextLegend('legend', colors, Viewer.tracks(),
                  {"legendClick": Broadcast.familyClicked});
    // report how things went
    var returned = Viewer.returned();
    var aligned = Viewer.aligned();
    if (returned > 0 && aligned > 0) {
      $scope.alert("success", returned+" tracks returned. "+aligned+" aligned");
    } else if (returned > 0 && aligned == 0) {
      $scope.alert("warning", returned+' tracks returned. 0 aligned (<a ' +
                   'ng-click="showLeftSlider(\'#parameters\', $event)">' +
                   'Alignment Parameters</a>)');
    } else {
      $scope.alert("danger", 'No tracks returned (<a ' +
                   'ng-click="showLeftSlider(\'#parameters\', $event)">' +
                   'Query Parameters</a>)');
    }
    $scope.hideSpinners();
  }

  // listen for new data event
  $scope.$on('newData', function(event) {
    Viewer.align($scope.params);
    drawViewer();
  });

  // listen for redraw events
  $scope.$on('redraw', function(event) {
    drawViewer();
  });

  // scroll stuff
  $scope.step;
  function scroll(index) {
    Viewer.getQueryGene(index,
      function(geneName) {
        $location.path(geneName);
        $routeParams.focusName = geneName;
        $scope.submit();
      }, function() {
        $scope.alert("danger", "Failed to scroll");
      });
  }

  // scroll left
  $scope.scrollLeft = function(event) {
    event.stopPropagation();
    var step = parseInt($scope.step);
    if (step <= $scope.params.numNeighbors) {
      scroll($scope.params.numNeighbors-step);
    } else {
      $scope.alert("danger", "Invalid scroll size");
    }
  };
  // scroll right
  $scope.scrollRight =function(event) {
    event.stopPropagation();
    var step = parseInt($scope.step);
    if (step <= $scope.params.numNeighbors) {
      scroll(step+$scope.params.numNeighbors);
    } else {
      $scope.alert("danger", "Invalid scroll size");
    }
  };
}]);

contextControllers
.controller('GeneCtrl', ['$scope', 'Gene',
function($scope, Gene) {
  $scope.geneHtml = '';
  // listen for gene click events
  $scope.$on('geneClicked', function(event, gene) {
    Gene.get(gene.name, function(links) {
      var familyNames = Gene.familyNames();
      var html = '<h4>'+gene.name+'</h4>' // TODO: link to tripal
      html += 'Family: ';
      if (gene.family != '') {
      	html += familyNames[gene.family]; // TODO: link to tripal
      } else {
      	html += 'None';
      }
      html += '<br />';
      // add track search link
      html += '<a href="#/'+gene.name+'">Search for similar contexts</a><br/>';
      // for switching over to json provided by tripal_linkout
      for (var i = 0; i < links.length; i++) {
        html += '<a href="'+links[i].href+'">'+links[i].text+'</a><br/>'
      }
      if (links.meta) {
        html += '<p>'+links.meta+'</p>'
      }
      $scope.geneHtml = html;
      $scope.$apply();
      $scope.showLeftSlider('#gene');
    }, function(response) {
      $scope.alert("danger", "Failed to retrieve gene data");
    });
  });
}]);

contextControllers
.controller('TrackCtrl', ['$scope', 'Track',
function($scope, Track) {
  $scope.trackHtml = '';
  // listen for track click events
  $scope.$on('leftAxisClicked', function(event, trackID) {
    Track.get(trackID, function(track) {
      var familyNames = Track.familyNames();
      var html = '<h4><a href="/chado/organism/'+track.species_id+'/">' +
                 track.species_name+'</a> - <a href="/chado/feature/' +
                 track.chromosome_id+'/">'+track.chromosome_name+'</a></h4>';
      // add track search link
      var focus = track.genes[track.genes.length/2];
      html += '<a href="#/'+focus.name+'">Search for similar contexts</a><br/>';
      // add a link for each gene
      var genes = '<ul>';
      var families = [];
      track.genes.forEach(function(g) {
      	genes += '<li><a href="/chado/feature/'+g.name+'/">'+g.name+'</a>: ' +
                 g.fmin+' - '+g.fmax+'</li>';
      	if (g.family != '') {
      		genes += '<ul><li>Family: <a href="/chado_phylotree/' +
                     familyNames[g.family]+'/">'+familyNames[g.family] +
                     '</a></li></ul>';
      	}
      });
      genes += '</ul>';
      html += 'Genes:'+genes;
      $scope.trackHtml = html;
      $scope.$apply();
      $scope.showLeftSlider('#track');
    }, function() {
      $scope.alert("danger", "Failed to retrieve track data");
    })});
}]);

contextControllers
.controller('FamilyCtrl', ['$scope', 'Family',
function($scope, Family) {
  $scope.familyHtml = '';
  $scope.$on('familyClicked', function(event, family, genes) {
    var familyNames = Family.familyNames();
    html = '<h4><a href="#'+familyNames[family]+'/">' +
           familyNames[family]+'</a></h4>'; // TODO: link to tripal
    html += 'Genes:<ul>';
    genes.each(function(f) {
      html += '<li><a href="#'+f.name+'/">'+f.name+'</a>: ' +
              f.fmin+' - '+f.fmax+'</li>';
    });
    html += '</ul>';
    $scope.familyHtml = html;
    $scope.$apply();
    $scope.showLeftSlider('#family');
  });
}]);

contextControllers
.controller('PlotCtrl', ['$scope', 'Plot', 'Broadcast',
function($scope, Plot, Broadcast) {
  var familySizes;
  var colors;
  var selectedTrack;
  function drawPlots() {
    familySizes = Plot.familySizes();
    colors = Plot.colors();
    localPlots = Plot.getAllLocal();
    $('#plots').html('');
    var dim = $('#main').innerWidth()/3;
    for (var trackID in localPlots) {
        var id = "plot"+trackID;
        $('#plots').append('<div id="'+id+'" class="col-lg-4">derp</div>');
        synteny(id, familySizes, colors, localPlots[trackID],
                {"geneClicked": Broadcast.geneClicked,
                 "width": dim});
    }
  }
  $scope.$on('newData', function(event) {
    Plot.plot();
    drawPlots();
  });
  $scope.$on('redraw', function(event) {
    $('#plots').html('');
    $('#local-plot').html('');
    $('#global-plot').html('');
    drawPlots();
    if ($('#local-plot').is(':visible')) {
      $scope.plotLocal();
    } else if ($('#global-plot').is(':visible')) {
      $scope.plotGlobal();
    }
  });
  $scope.$on('rightAxisClicked', function(event, trackID) {
    $scope.showRightSlider();
    selectedTrack = trackID;
    if ($('#local-plot').is(':visible')) {
      $scope.plotLocal();
    } else if ($('#global-plot').is(':visible')) {
      $scope.plotGlobal();
    }
  });
  $scope.plotLocal = function() {
    if (selectedTrack !== undefined) {
      Plot.getLocal(selectedTrack,
        function(data) {
          synteny('local-plot', familySizes, colors, data,
                  {"geneClicked": Broadcast.geneClicked,
                   "width": $('#right-slider .inner-ratio').innerWidth()});
        }, function() {
          $scope.alert("danger", "Failed to retrieve plot data");
      });
    }
  };
  $scope.plotGlobal = function() {
    if (selectedTrack !== undefined) {
      Plot.getGlobal(selectedTrack,
        function(data) {
          synteny('global-plot', familySizes, colors, data,
                  {"geneClicked": Broadcast.geneClicked,
                   "width": $('#right-slider .inner-ratio').innerWidth()});
        }, function() {
          $scope.alert("danger", "Failed to retrieve plot data");
      });
    }
  }
}]);

contextControllers
.controller('UICtrl', ['$scope', 'Broadcast',
function($scope, Broadcast) {
  // listen for window resizing
  var resizeTimeout;
  $(window).on('resize', function() {
    if (resizeTimeout === undefined) {
      $scope.showSpinners();
    }
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = undefined;
      $scope.hideSpinners();
      Broadcast.redraw();
    }, 1000);
  });

  // make all divs in the left slider except the target
  function switchActive(target) {
    $.each(['#parameters', '#gene', '#family', '#track'], function(i, e) {
      if (e == target) { $(e).show(); }
      else { $(e).hide(); }
    });
  };
  
  // slider animation
  $scope.toggleLeftSlider = function(event) {
    if (event !== undefined) {
      event.stopPropagation();
    }
    $('#left-slider').animate({width:'toggle'}, 350);
  }
  $scope.showLeftSlider = function(target, event) {
    if (event !== undefined) {
      event.stopPropagation();
    }
    if (target == '#parameters' && $('#parameters').is(':visible')) {
      $scope.hideLeftSlider();
    } else {
      switchActive(target);
      if ($('#left-slider').is(':hidden')) {
        $scope.toggleLeftSlider();
      }
    }
  }
  $scope.hideLeftSlider = function(event) {
    if (event !== undefined) {
      event.stopPropagation();
    }
    if ($('#left-slider').is(':visible')) {
      $scope.toggleLeftSlider();
    }
  }
  $scope.toggleRightSlider = function(event) {
    if (event !== undefined) {
      event.stopPropagation();
    }
    $scope.showSpinners();
    $('#right-slider').animate({width:'toggle'}, 350,
                               function() {
                                   $scope.hideSpinners();
                                   Broadcast.redraw();
                                 });
  }
  $scope.showRightSlider = function(target, event) {
    if (event !== undefined) {
      event.stopPropagation();
    }
    if ($('#right-slider').is(':hidden')) {
      $scope.toggleRightSlider();
    }
  }

  $scope.alertClass = "alert-info";
  $scope.alertMessage = "Your context is loading";
  $scope.alert = function(type, message, link) {
    $scope.alertClass = "alert-"+type;
    $scope.alertMessage = message;
  }

  // what to do at the beginning and end of window resizing
  $scope.showSpinners = function() {
    $('#main').append(spinner);
    $('#legend-wrapper .vertical-scroll').append(spinner);
    $('#plot .inner-ratio').append(spinner);
  }
  $scope.hideSpinners = function() {
    $('.grey-screen').remove();
  }
  var spinner = '<div class="grey-screen">'
              + '<div class="spinner"><img src="img/spinner.gif" /></div>'
              + '</div>';

  // add tab functionality
  $('ul.tabs').each(function() {
    // for each set of tabs, we want to keep track of
    // which tab is active and it's associated content
    var $active, $content, $links = $(this).find('a');
    // if the location.hash matches one of the links, use that as the active tab
    // if no match is found, use the first link as the initial active tab
    $active = $($links.filter('[href="'+location.hash+'"]')[0] || $links[0]);
    $active.closest('li').addClass('active');
    $content = $($active[0].hash);
    // Hide the remaining content
    $links.not($active).each(function () {
      $(this.hash).hide();
    });
    // Bind the click event handler
    $(this).on('click', 'a', function(e) {
      // Make the old tab inactive.
      $active.closest('li').removeClass('active');
      $content.hide();
      // Update the variables with the new link and content
      $active = $(this);
      $content = $(this.hash);
      // Make the tab active.
      $active.closest('li').addClass('active');
      $content.show();
      // Prevent the anchor's default click action
      e.preventDefault();
    });
  });
}]);
