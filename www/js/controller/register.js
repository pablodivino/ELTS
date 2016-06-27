angular.module('app.register', ['ionic-modal-select'])

  .controller('registerCtrl', ['$scope', '$interval', 'SISOSprints', 'LocationFactory', 'ProfileFactory', '$ionicLoading', '$ionicModal', '$ionicPopup',
    function($scope, $interval, SISOSprints, LocationFactory, ProfileFactory, $ionicLoading, $ionicModal, $ionicPopup){

      $scope.user = {fname: '', lname: ''};
      $scope.dialog = {title: 'Search User', buttonLabel:'Find User'};
      $scope.someModel = null;
      $scope.locations = LocationFactory.get();//['Location 1', 'Location 1', 'Location 2', 'Location 3', 'Location 4', 'Location 5'];
      $scope.myTimes = [];

      $scope.record = {
            "fname": "",
            "mname": "",
            "lname": "",
            "mfname": "",
            "mlname": "",
            "contact": "",
            "location": "",
            "time": new Date().toLocaleTimeString().replace(/:\d+ /, ' ')
      };

      $scope.$on('$ionicView.beforeEnter', function () {

        if(!ProfileFactory.isEmpty()){

          var profileData = ProfileFactory.get();
          Object.keys(profileData).forEach(function(key) {
            $scope.record[key] = profileData[key];
          });
        }
      });

      $scope.showCheckoutBtn = function(){
        return ($scope.record._id !== undefined) && ($scope.record._id !== '');
      };

      $scope.ph_numbr = /^(\+?(\d{1}|\d{2}|\d{3})[- ]?)?\d{3}[- ]?\d{3}[- ]?\d{4}$/;
      $scope.timePattern = /^(0?[1-9]|1[012])(:[0-5]\d) [APap][mM]$/;

      $scope.save = function(){
        SISOSprints.post($scope.record, function (result) {
          if (typeof result !== undefined && typeof result._id !== undefined) {
            $scope.record._id = result._id;

            $ionicLoading.show({template: 'Check-In Saved!', noBackdrop: true, duration: 2200});
            var profileData = {};
            Object.keys(result).forEach(function(key) {
              if(key !== '_id' && key !== 'time' && key !== '__v'){
                profileData[key] = result[key];
              }
            });
            ProfileFactory.set(profileData);
          }
        });
      };

      $scope.delete = function(){

        var confirmPopup = $ionicPopup.confirm({
          title: '<b>Confirm Sign Out</b>',
          template: 'Check-Out will delete the record'
        });

      confirmPopup.then(function (res) {
        if(res && typeof $scope.record._id !== undefined && $scope.record._id !== ""){
          SISOSprints.delete({id: $scope.record._id}, function (result) {
            $ionicLoading.show({template: 'Sign Out!', noBackdrop: true, duration: 2200});

            $scope.record = {
                "fname": "",
                "mname": "",
                "lname": "",
                "mfname": "",
                "mlname": "",
                "contact": "",
                "location": "",
                "time": "",
                "_id": ""
            };

            // TODO must be a function to reuse preload
            if(!ProfileFactory.isEmpty()){

              var profileData = ProfileFactory.get();
              Object.keys(profileData).forEach(function(key) {
                $scope.record[key] = profileData[key];
              });
            }

          });
        }
      });

    };

    $ionicModal.fromTemplateUrl('templates/userDialog.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal){
        $scope.userDialog = modal;
    });

    $scope.$on('modal.hidden', function(){
        $scope.user = {fname: '', lname: ''};
    });
    $scope.$on('modal.show', function(){
      //console.log('OPEN DIAL');
      //
    });

    $scope.searchUser = function(u) {
        if(u.fname !== '' && u.lname !== ''){
          SISOSprints.get(u, function (recs) {
            if (typeof recs !== undefined && recs.length > 0) {
              $scope.record = recs[0];
              $ionicLoading.show({template: 'User Found!', noBackdrop: true, duration: 2200});
              $scope.userDialog.hide();
            }else{
              $ionicLoading.show({template: 'User Not Found!', noBackdrop: true, duration: 2200});
            }
          });
        }else{
          $ionicLoading.show({template: 'User name must not be empty!', noBackdrop: true, duration: 2200});
        }
      };

    $scope.myDynamicTimes = function () {

      var currentTime = new Date();
      currentTime.setMinutes(-15);
      var curMinute = currentTime.getMinutes();
      var rawQuarter = precision(curMinute / 15);
      var quarter = Math.ceil(rawQuarter);
      if (quarter === 0) quarter = 1;

      if (rawQuarter <= 3) {
        currentTime.setMinutes(quarter * 15, 0, 0);
      } else {
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      }

      // creates times for every lapse of times (15 minutes --> [1000 * 60 * 15])
      if ($scope.myTimes.length === 0 || getLapseOfTime(currentTime) !== $scope.myTimes[0]['hour']) {
        for (var i = 0; i < 7; i++) {
          $scope.myTimes[i] = {"hour": getLapseOfTime(currentTime), "checked": false};
          currentTime = new Date(currentTime.getTime() + (1000 * 60 * 15));
        }
      }

      function precision(n) {
        return (n * 100) / 100;
      }

      function getLapseOfTime(date) {
        return date.toLocaleTimeString().replace(/:\d+ /, ' ');
      }

    };
    // calculate for first-time
    $scope.myDynamicTimes();

    // recalculate every 5 min ---> [1000 * 60 * 5]
    $interval($scope.myDynamicTimes, 1000 * 60 * 5);

  }]);
