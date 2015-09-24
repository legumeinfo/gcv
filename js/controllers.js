var contextControllers = angular.module('contextControllers', []);

function _updateObj(src, dest) {
  for (var key in dest) {
    if (dest.hasOwnProperty(key) && src.hasOwnProperty(key)) {
      dest[key] = isNumber(src[key]) ? parseInt(src[key]) : src[key]
    }
  }
}

contextControllers
.controller('ContextCtrl', ['$scope', '$routeParams', '$location', '$cookies',
                            'Context', 'Broadcast',
function($scope, $routeParams, $location, $cookies, Context, Broadcast) {
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
      _updateObj(cookie, $scope.formData);
    }
    // override with values from url
    var search = $location.search();
    if (search !== undefined) {
      _updateObj(search, $scope.formData);
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
          json === undefined) {
        getData();
      } else {
        align();
      }
    } else {
      showAlert(alertEnum.DANGER, "Invalid input parameters");
    }
  }
  
  // try to fetch new data whenever the controller is initialized
  if ($routeParams.focusName) {
    $scope.submit();
  }

  // controller data
  var json; // data for the current search params
  var tracks; // aligned tracks
  var scores; // scores of aligned tracks
  var colors = contextColors; //TODO: load color from cookie
  var familyNames; // family id-name map

  // private function that fetches data
  function getData() {
    Context.get($routeParams.focusName,
                {numNeighbors: $scope.formData.numNeighbors,
                 numMatchedFamilies: $scope.formData.numMatchedFamilies,
                 numNonFamily: $scope.formData.numNonFamily},
                function(newJson) {
                  json = newJson;
                  // TODO: clear gene cache, clear plot cache
                  alignTracks();
                },
                function(response) {
                  showAlert(alertEnum.DANGER, "Failed to retrieve data");
                });
  }

  // private function that performs alignments
  function alignTracks() {
    tracks = JSON.parse(json);
    scores = {};
    var aligner = $scope.formData.algorithm == "repeat" ? repeat : smith;
    // align all the tracks with the query track
    var alignments = [],
        resultTracks = [];
    for (var i = 1; i < tracks.groups.length; i++) {
      var al = aligner(tracks.groups[0].genes,
                       tracks.groups[i].genes,
                       function(item) { return item.family; },
                       $scope.formData);
      var id = tracks.groups[i].species_id+":"+
               tracks.groups[i].chromosome_id;
      if (al !== null) {
        if (scores[id] === undefined) {
          scores[id] = 0;
        }
        scores[id] += al[1];
        if ($scope.formData.algorithm == "repeat") {
          for (var j = 0; j < al[0].length; j++) {
            resultTracks.push(clone(tracks.groups[i]));
            alignments.push(al[0][j]);
          }
        } else {
          resultTracks.push(clone(tracks.groups[i]));
          alignments.push(al);
        }
      }
    }
    // merge the alignments
    tracks.groups = [tracks.groups[0]];
    mergeAlignments(tracks, resultTracks, alignments);
    familyNames = getFamilyNameMap(tracks);
    // draw viewer with new alignments
    $scope.drawViewer();
  }
  // success: clear gene cache, clear plot cache

  // draw viewer
  $scope.drawViewer = function() {
    // callback functions
    function geneClicked(gene) {
      Gene.get(gene.name, {}, function(json) {
        links = JSON.parse(json);
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
    contextViewer('viewer', colors, tracks,
                  {"geneClicked": Broadcast.geneClicked,
                   "leftAxisClicked": function(){},
                   "rightAxisClicked": function(){},
                   "selectiveColoring": true,
                   "interTrack": true,
                   "merge": true,
                   "sort": $scope.formData.order == "chromosome" ?
                           byChromosome : byDistance});
  }
}]);

contextControllers
.controller('GeneCtrl', ['$scope', 'Gene',
function($scope, Gene) {

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
function($scope, UI) {

}]);
