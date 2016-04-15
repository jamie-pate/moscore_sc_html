// Code goes here

'use strict';
/*globals angular, localStorage, document, console, window, getComputedStyle, HTMLElement, Blob*/
var ng = angular,
		board = ng.module('board', ['ngAnimate', 'moscore']),
		REFRESH_INTERVAL = 250,
		RETRY_INTERVAL = 5000;

board.controller({main:Main});
// https://docs.angularjs.org/guide/concepts#controller
function Main($scope, $http, $timeout, TEMPLATES, BOARD_DEFAULT, SETTINGS_DEFAULT,
		MODE, STATE, FLAG, STYLE_CLASSES, VIDEOS) {
	this._$http = $http;
	this._$timeout = $timeout;
	this.load($scope, BOARD_DEFAULT, SETTINGS_DEFAULT);
	for (var fn in this.scope_fns) {
		$scope[fn] = this.scope_fns[fn].bind($scope);
	}
	for (var watch in this.watches) {
		$scope.$watch(watch, this.watches[watch], true);
	}
	var scopeConsts = {MODE:MODE, STATE:STATE, FLAG:FLAG, STYLE_CLASSES: STYLE_CLASSES, VIDEOS: VIDEOS};
	for (var i in scopeConsts) {
		$scope[i] = scopeConsts[i];
	}
	$scope.current_template = $scope.current_template.bind($scope, TEMPLATES);
	$scope.reset = function() {
		$scope.settings = angular.extend({}, SETTINGS_DEFAULT);
	}
	$scope.videoUrls = function() {
		return $scope.settings.showVideos.filter(function(url) { return url }).map(function(url) { return 'media/' + url});
	}
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
		'settings': function save(settings, oldSettings) {
			if (settings === oldSettings) { return }
			localStorage.setItem('settings', JSON.stringify(settings));
		}
	},
	load: function load($scope, board_default, settings_default) {
		var saved_board = {},
					saved_settings = {};
			try {
				var _saved_settings = localStorage.getItem('settings');
				if (_saved_settings && _saved_settings.length < 1000) {
					saved_settings = JSON.parse(_saved_settings);
					if (typeof saved_settings !== 'object') {
						saved_settings = {};
					}
					if (saved_settings.showBoard || saved_settings.showCanvas) {
						saved_settings.showBoard = true;
					}
				}
			} catch (ex){}
			$scope.board = angular.extend(board_default, saved_board);
			//console.debug(saved_settings);
			$scope.settings = angular.extend({},
				settings_default, saved_settings,
				{fontList: ['SmallFonts', 'Roboto', 'Calibri', 'Georgia']}
			);
		this.updateState($scope);
	},
	updateState: function($scope) {
		this._$http.get('state.json').then(function(response) {
			var data = response.data;
			if (data.raceTime) {
				data.raceTime = new Date(data.raceTime);
			}
			$scope.board = response.data;
			$scope.error = null;
			this._$timeout(function() {
				this.updateState($scope);
			}.bind(this), REFRESH_INTERVAL);
		}.bind(this),
		function(error) {
			this._$timeout(this.updateState.bind(this, $scope), RETRY_INTERVAL);
			$scope.connected = false;
			switch (error.status) {
				case 0: $scope.error = 'Unable to connect';
				break;
				default: $scope.error = 'Error: ' + error.status;
			}
		}.bind(this));
	}
};

board.config( function($compileProvider) {
	var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);
});