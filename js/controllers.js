var contextControllers = angular.module('contextControllers', []);

function _updateObj(src, dest) {
  for (var key in dest) {
    if (dest.hasOwnProperty(key) && src.hasOwnProperty(key)) {
      dest[key] = isNumber(src[key]) ? parseInt(src[key]) : src[key]
    }
  }
}

var dataStore = {
  json: undefined,
  tracks: undefined,
  scores: undefined,
  color: context_color,
  align: function(match, mismatch, gap, threshold, algorithm) {
    tracks = JSON.parse(this.json);
    scores = {};
    var align = algorithm == "repeat" ? repeat : smith;
    // align all the tracks with the query track
    var alignments = [],
        result_tracks = [];
    for (var i = 1; i < tracks.groups.length; i++) {
      var al = align(tracks.groups[0].genes,
                     tracks.groups[i].genes,
                     function get_family( item ) { return item.family; },
                     {match: match,
                      mismatch: mismatch,
                      gap: gap,
                      threshold: threshold});
      var id = tracks.groups[i].species_id+":"+
               tracks.groups[i].chromosome_id;
      if (al !== null) {
        if (scores[id] === undefined) {
          scores[id] = 0;
        }
        scores[id] += al[1];
        if (algorithm == "repeat") {
          for (var j = 0; j < al[0].length; j++) {
            result_tracks.push(clone(tracks.groups[i]));
            alignments.push(al[0][j]);
          }
        } else {
          result_tracks.push(clone(tracks.groups[i]));
          alignments.push(al);
        }
      }
    }
    // merge the alignments
    //contextData = JSON.parse(json);
    tracks.groups = [tracks.groups[0]];
    merge_alignments(tracks, result_tracks, alignments);
  },
  plotData: {local: undefined,
             global: undefined},
  plot: function(params) {
    // helper functions for sorting tracks in viewer
    function sortChromosomes(a, b) {
      if( a.chromosome_name > b.chromosome_name ) {
        return 1;
      } else if ( a.chromosome_name < b.chromosome_name ) {
        return -1;
      } else {
        return 0;
      }
    }
    function sortScores(a, b) {
      var a_id = a.species_id+":"+a.chromosome_id,
          b_id = b.species_id+":"+b.chromosome_id;
      return scores[b_id]-scores[a_id];
    }
    // make the context viewer
    context_viewer('viewer', this.color, tracks,
                   {"gene_clicked":function(){},
                    "left_axis_clicked":function(){},
                    "right_axis_clicked":function(){},
                    "selective_coloring":true,
                    "inter_track":true,
                    "merge":true,
                    "sort":params.ordering==0 ? sortChromosomes:sortScores});
  },
  getGlobalPlot: function() {

  }
}

contextControllers
.controller('ContextCtrl', ['$scope', '$routeParams', '$location', '$cookies',
                            'Context',
function($scope, $routeParams, $location, $cookies, Context) {
  // initialize the form
  $scope.init = function() {
    // default form values
    $scope.formData = {numNeighbors: 5,
                       numMatchedFamilies: 3,
                       numNonFamily: 5,
                       algorithm: "repeat",
                       match: 5,
                       mismatch: -1,
                       gap: -1,
                       threshold: 45};
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

  // get data from the service
  function getData() {
    if ($routeParams.focusName !== undefined) {
      showSpinners();
      Context.get($routeParams.focusName,
                  {numNeighbors: $scope.formData.numNeighbors,
                   numMatchedFamilies: $scope.formData.numMatchedFamilies,
                   numNonFamily: $scope.formData.numNonFamily},
      function(json) {
        hideSpinners();
        dataStore.json = json;
        dataStore.align($scope.formData.match,
                        $scope.formData.mismath,
                        $scope.formData.gap,
                        $scope.formData.threshold);
        dataStore.plot($scope.formData);
        // each gene will need x and y attributes
        // each group (track) will need a group number for repeat inversions
        // generate plot data + clear global plot data
      }, function(response) {
        hideSpinners();
        showAlert(alertEnum.DANGER, "Failed to retrieve data");
      });
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
          dataStore.json === undefined) {
        // trigger the get in the focus controller
        getData();
      }
      // align the results
      // redraw context viewer
      // redraw plots
      // redraw legend
    } else {
      showAlert(alertEnum.DANGER, "Invalid input parameters");
    }
  }
  
  // try to fetch new data whenever the controller is initialized
  if ($routeParams.focusName) {
    $scope.submit();
  }
}]);
