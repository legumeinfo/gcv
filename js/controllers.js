var contextControllers = angular.module('contextControllers', []);

contextControllers
.controller('ContextCtrl', ['$scope', '$routeParams', '$location', '$cookies',
                            'Viewer', 'Broadcast',
function($scope, $routeParams, $location, $cookies, Viewer, Broadcast) {
  // initialize the form
  $scope.init = function() {
    // radio options
    $scope.algorithms = [{id: "smith", name: "Smith-Watermn"},
                         {id: "repeat", name: "Repeat"}];
    // select options
    $scope.orderings = [{id: "chromosome", name: "Chromosome"},
                        {id: "distance", name: "Edit distance"}];
    // default form values
    $scope.formData = {numNeighbors: 5,
                       numMatchedFamilies: 3,
                       numNonFamily: 5,
                       algorithm: "repeat",
                       match: 5,
                       mismatch: -1,
                       gap: -1,
                       threshold: 45,
                       order: "chromosome"};
    // override with values from cookie
    var cookie = $cookies.getObject('context');
    if (cookie !== undefined) {
      updateObj(cookie, $scope.formData);
    }
    // override with values from url
    var search = $location.search();
    if (search !== undefined) {
      updateObj(search, $scope.formData);
    }
  }

  // gets data and updates the view when the form is submitted
  $scope.submit = function() {
    if ($scope.form.$valid) {
      toggleSlider('#parameters');
      // in case the form is submitted with invalid values
      $scope.$broadcast('show-errors-check-validity');
      // update the url to reflect the changes
      $location.search($scope.formData);
      // save the new params to the cookie
      $cookies.putObject('context', $scope.formData);
      // only three params require a db query
      if (!($scope.form.numNeighbors.$pristine &&
            $scope.form.numMatchedFamilies.$pristine &&
            $scope.form.numNonFamily.$pristine) ||
          Viewer.tracks() === undefined) {
        getData();
      } else {
        Viewer.align($scope.formData);
      }
    } else {
      showAlert(alertEnum.DANGER, "Invalid input parameters");
    }
  }
  
  // try to fetch new data whenever the controller is initialized
  if ($routeParams.focusName) {
    $scope.submit();
  }

  // private function that fetches data
  function getData() {
    Viewer.get($routeParams.focusName,
                  {numNeighbors: $scope.formData.numNeighbors,
                   numMatchedFamilies: $scope.formData.numMatchedFamilies,
                   numNonFamily: $scope.formData.numNonFamily},
                  function() {
                    Viewer.align($scope.formData);
                    drawViewer();
                  },
                  function(response) {
                    showAlert(alertEnum.DANGER, "Failed to retrieve data");
                  });
  }

  // draw viewer
  var drawViewer = function() {
    // helper functions for sorting tracks
    function byChromosome(a, b) {
      if( a.chromosome_name > b.chromosome_name ) {
        return 1;
      } else if ( a.chromosome_name < b.chromosome_name ) {
        return -1;
      } else {
        return 0;
      }
    }
    function byDistance(a, b) {
      var a_id = a.species_id+":"+a.chromosome_id,
          b_id = b.species_id+":"+b.chromosome_id;
      return scores[b_id]-scores[a_id];
    }
    // make the context viewer
    var colors = contextColors; //TODO: load color from cookie
    contextViewer('viewer', colors, Viewer.tracks(),
                  {"geneClicked": Broadcast.geneClicked,
                   "leftAxisClicked": function(){},
                   "rightAxisClicked": function(){},
                   "selectiveColoring": true,
                   "interTrack": true,
                   "merge": true,
                   "sort": $scope.formData.order == "chromosome" ?
                           byChromosome : byDistance});
  }

  // listen for redraw events
  $scope.$on('redraw', function(event) {
    drawViewer();
    console.log("drawing!");
  });
}]);

contextControllers
.controller('GeneCtrl', ['$scope', 'Gene',
function($scope, Gene) {
  function geneClicked(gene) {
    Gene.get(gene.name, {}, function(json) {
      links = JSON.parse(json);
      var familyNames = getFamilyNameMap(tracks); // TODO: move to service
      var html = '<h4>'+gene.name+'</h4>' // TODO: link to tripal
      html += 'Family: ';
      if (gene.family != '') {
      	html += familyNames[gene.family]; // TODO: link to tripal
      } else {
      	html += 'None';
      }
      html += '<br />';
      // for switching over to json provided by tripal_linkout
      for (var i = 0; i < links.length; i++) {
        html += '<a href="'+links[i].href+'">'+links[i].text+'</a><br/>'
      }
      if (links.meta) {
        html += '<p>'+links.meta+'</p>'
      }
      $('#toggle').html(html);
    }, function(response) {
      showAlert(alertEnum.DANGER, "Failed to retrieve gene data");
    });
  }

  // listen for gene click events
  $scope.$on('geneClicked', function(event) {
    drawViewer();
    console.log("drawing!");
  });
}]);

contextControllers
.controller('FamilyCtrl', ['$scope', 'Family',
function($scope, Family) {

}]);

contextControllers
.controller('PlotCtrl', ['$scope', 'Plot',
function($scope, Plot) {

}]);

contextControllers
.controller('UICtrl', ['$scope', 'Broadcast',
function($scope, Broadcast) {
  // listen for window resizing
  var resizeTimeout;
  $(window).on('resize', function() {
    if (resizeTimeout === undefined) {
      showSpinners();
    }
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = undefined;
      hideSpinners();
      Broadcast.redraw();
    }, 1000);
  });
}]);
