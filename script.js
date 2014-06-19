// Code goes here

'use strict';
/*globals angular, localStorage, document, console, window, getComputedStyle, HTMLElement, Blob*/
var ng = angular,
    board = ng.module('board', ['ngAnimate']);

board.controller({main:Main});
// https://docs.angularjs.org/guide/concepts#controller
function Main($scope, TEMPLATES, BOARD_DEFAULT, SETTINGS_DEFAULT,
    MODE, STATE, FLAG) {
  this.load($scope, BOARD_DEFAULT, SETTINGS_DEFAULT);
  for (var fn in this.scope_fns) {
    $scope[fn] = this.scope_fns[fn].bind($scope);
  }
  for (var watch in this.watches) {
    $scope.$watch(watch, this.watches[watch], true);
  }
  var scopeConsts = {MODE:MODE, STATE:STATE, FLAG:FLAG};
  for (var i in scopeConsts) {
    $scope[i] = scopeConsts[i];
  }
  $scope.current_template = $scope.current_template.bind($scope, TEMPLATES);
}

Main.prototype = {
  scope_fns : {
    board_post_process: function(ctxt, canvas) {
      var z = Number(this.settings.zoom);
      if (z > 1) {
        ctxt.lineWidth = Math.min(z-1, z/2);
        ctxt.strokeStyle = 'rgba(0,0,0,0.5)';
        ctxt.beginPath();
        for (var x = 0; x < canvas.width; x += z) {
          ctxt.moveTo(x, 0);
          ctxt.lineTo(x, canvas.height);
        }
        for (var y = 0; y < canvas.height; y += z) {
          ctxt.moveTo(0, y);
          ctxt.lineTo(canvas.width, y);
        }
        ctxt.stroke();
      }
    },
    current_template: function(templates) {
      var tmpl = templates[this.board.mode];
      if (tmpl && tmpl.constructor != String) {
        tmpl = tmpl[this.board.state];
      }
      if (tmpl && tmpl.constructor != String) {
        tmpl = tmpl[this.board.flag];
      }
      return 'templates/' + (tmpl || 'race.html');
    }

  },
  watches: {
    '[board, settings]': function save(bs, obs) {
      if (bs === obs) { return }
      var board = bs.shift(),
          settings = bs.shift();
      localStorage.setItem('board', JSON.stringify(board));
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  },
  load: function load($scope, board_default, settings_default) {
    var saved_board = {},
          saved_settings = {};
      try {
        var _saved_board = localStorage.getItem('board');
        if (_saved_board && _saved_board.length < 1000) {
          saved_board = JSON.parse(_saved_board);
          if (typeof saved_board !== 'object') {
            saved_board = {};
          }
        }
        var _saved_settings = localStorage.getItem('settings');
        if (_saved_settings && _saved_settings.length < 1000) {
          saved_settings = JSON.parse(_saved_settings);
          if (typeof saved_settings !== 'object') {
            saved_settings = {};
          }
        }
      } catch (ex){}
      $scope.board = angular.extend(board_default, saved_board);
      //console.debug(saved_settings);
      $scope.settings = angular.extend(
        settings_default, saved_settings,
        {fontList: ['SmallFonts', 'Roboto', 'Calibri', 'Georgia']}
      );
  }
};

board.config( function($compileProvider) {
  var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);
});