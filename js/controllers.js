var contextControllers = angular.module('contextControllers', []);

function _update(src, dest) {
  for (var key in dest) {
    if (dest.hasOwnProperty(key) && src.hasOwnProperty(key)) {
      dest[key] = isNumber(src[key]) ? parseInt(src[key]) : src[key]
    }
  }
}

contextControllers
.controller('DataCtrl', ['$scope', '$routeParams', 'Context',
function($scope, $routeParams, Context) {
  $scope.focusName = $routeParams.focusName;
  $scope.data = Context.get({focusName: $routeParams.focusName},
  // success callback
  function(data) {
    // each gene will need x and y attributes
    // each group (track) will need a group number for repeat inversions
    // generate plot data + clear global plot data
  // error callback
  }, function(data, status) {
    // show the user an error message
  });
}]);

contextControllers
.controller('ContextCtrl', ['$scope', '$location', '$cookies', 'Context',
function($scope, $location, $cookies, Context) {
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
    _update(cookie, $scope.formData);
    // override with values from url
    var search = $location.search();
    _update(search, $scope.formData);
  }

  // gets data and updates the view when the form is submitted
  $scope.submit = function() {
    if ($scope.form.$valid) {
      hideHorizontalSlider('#parameters');
      // in case the form is submitted with invalid values
      $scope.$broadcast('show-errors-check-validity');
      // update the url to reflect the changes
      $location.search($scope.formData);
      // save the new params to the cookie
      $cookies.putObject('context', $scope.formData);
      // only three params require a db query
      if (!$scope.form.numNeighbors.$pristine ||
          !$scope.form.numMatchedFamilies.$pristine ||
          !$scope.form.numNonFamily.$pristine) {
        var focusName = 'araip.Araip.12YZL';
        // trigger the get in the focus controller
      }
      // align the results
      // redraw context viewer
      // redraw plots
      // redraw legend
    } else {
      showAlert(alertEnum.DANGER, "Invalid input parameters");
    }
  }

  // all the things that will trigger an update
  // when the parameter form is submitted
  // when the url changes, i.e. scrolling
  $scope.$on('$locationChangeStart', function(event) {
    if ($scope.form.$invalid) {
      event.preventDefault();
    } else {
      $scope.submit();
  }});
}]);
