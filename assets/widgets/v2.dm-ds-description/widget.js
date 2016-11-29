import angular from 'angular';
import 'dictionary';
import 'ngReact';
import 'custom-react-directives';

// console.log("REACT",React);
let m = angular.module('app.widgets.v2.dm-ds-description', ['app.dictionary','app.dps','ngFileUpload','react','custom-react-directives'])
  m.controller('DataManagerDSInfoController', function ($scope, $http, $dps, EventEmitter, 
    APIProvider, pageSubscriptions, $lookup, $translate,$modal, user, i18n, $scroll) {
    

    const eventEmitter = new EventEmitter($scope);
    $scope.lookup = $lookup;
    $scope.tagList = [];
    $scope.key = undefined; 


   
    $scope.formatDate = i18n.formatDate;
    $scope.dps = $dps;
    
    $scope.download = function(item){
      item.download = true;
     // $http.get("./api/dataset/download/"+item.dataset.id)
      $dps.get("/api/dataset/download/"+item.dataset.id)
        .success(function(){
          item.download = false;
        })
    }

    $scope.selectSource = function(key){
      console.log("Select Source")
      eventEmitter.emit('setLookupKey', key,"#Datasource");
      // let query = [{"dataset.source":[{equals:key}]}];
      let query = "$[?(@.dataset.source=='{{}}')]".split("{{}}").join(key);
      eventEmitter.emit('searchQuery', query);
    }

    $scope.selectTopic = function(key){
      console.log("Select Topic")
      eventEmitter.emit('setLookupKey', key, "#Topic");
      // let query = [{"dataset.topics":[{includes:key}]}];
      let query = "$[?(@.dataset.topics.contains(function(d){return d.startWith('{{}}')}))]".split("{{}}").join(key);
      eventEmitter.emit('searchQuery', query);
    }

    
    $scope.lookup = $lookup;
   

    var prepareTopics = function(topics){
      var simple_topics = [];
      topics = (topics.forEach) ? topics : [topics];
      topics.forEach(function(item){
        item.split("/").forEach(function(t){
          if(simple_topics.filter(function(s){return s === t}).length === 0){simple_topics.push(t)}
        });
      })
      return simple_topics;
    }

    $scope.prepareTopics = prepareTopics;

    
    
    new APIProvider($scope)
      .config(() => {
        console.log(`widget ${$scope.widget.instanceName} is (re)configuring...`);
        $scope.title = $scope.widget.title;
        
        $scope.s_listeners = ($scope.widget.s_listeners) ? $scope.widget.s_listeners.split(",") : [];
        
        pageSubscriptions().removeListeners({
          emitter: $scope.widget.instanceName,
          signal: "searchQuery"
        })

        pageSubscriptions().addListeners(
          $scope.s_listeners.map((item) =>{
            return {
                emitter: $scope.widget.instanceName,
                receiver: item.trim(),
                signal: "searchQuery",
                slot: "searchQuery"
            }
          })
        );
        

        $scope.l_listeners = ($scope.widget.l_listeners) ? $scope.widget.l_listeners.split(",") : [];
        
        pageSubscriptions().removeListeners({
          emitter: $scope.widget.instanceName,
          signal: "setLookupKey"
        })
        
        pageSubscriptions().addListeners(
          $scope.l_listeners.map((item) =>{
            return {
                emitter: $scope.widget.instanceName,
                receiver: item.trim(),
                signal: "setLookupKey",
                slot: "setLookupKey"
            }
          })
        );
       
      })

      .provide('setDataSet', (evt, value) => {
        console.log("getDataSet", value)
        $scope.ds = value;
        if($scope.ds){
          
          eventEmitter.emit('setLookupKey', undefined);
          $scope.topics = prepareTopics($scope.ds.dataset.topics);
          $scope.ds.dataset.$periodicity = $translate.instant('WIDGET.V2.DM-DS-DESCRIPTION.'+$scope.ds.dataset.periodicity); 
          $scroll($scope)
        }  
      })

      .translate(() => { 
        if($scope.ds)
        $scope.ds.dataset.$periodicity = $translate.instant('WIDGET.V2.DM-DS-DESCRIPTION.'+$scope.ds.dataset.periodicity); 
      })

      .removal(() => {
        console.log('Find Result widget is destroyed');
      });
  })



