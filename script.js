// Code goes here

'use strict';
/*globals angular, localStorage, document, console, window, getComputedStyle, HTMLElement, Blob*/
var ng = angular,
		board = ng.module('board', [/*'ngAnimate', */'moscore']),
		REFRESH_INTERVAL = 250,
		RETRY_INTERVAL = 5000;

board.controller({main:Main});
// https://docs.angularjs.org/guide/concepts#controller
function Main($scope, $location, $http, $timeout, TEMPLATES, BOARD_DEFAULT, SETTINGS_DEFAULT,
		MODE, STATE, FLAG, STYLE_CLASSES, VIDEOS) {
	this._$http = $http;
	this._$timeout = $timeout;
	this._$location = $location;
	this._$scope = $scope;
	$scope.$on('$locationChangeSuccess', function() {
		$scope.params = this.parseUrlParams();
	}.bind(this));
	this.load($scope, BOARD_DEFAULT, SETTINGS_DEFAULT);
	for (var fn in this.scope_fns) {
		$scope[fn] = this.scope_fns[fn].bind($scope);
	}
	for (var watch in this.watches) {
		$scope.$watch(watch, this.watches[watch].bind($scope), true);
	}
	var scopeConsts = {MODE:MODE, STATE:STATE, FLAG:FLAG, STYLE_CLASSES: STYLE_CLASSES, VIDEOS: VIDEOS};
	for (var i in scopeConsts) {
		$scope[i] = scopeConsts[i];
	}
	$scope.current_template = $scope.current_template.bind($scope, TEMPLATES);
	$scope.reset = function() {
		$scope.settings = angular.extend({}, SETTINGS_DEFAULT);
	}
	$scope.resetSize = function() {
		$scope.settings.fontSize = SETTINGS_DEFAULT.fontSize;
		$scope.settings.zoom = SETTINGS_DEFAULT.zoom;
	}
	$scope.flagGif = function() {
		if ($scope.board.flag && $scope.board.flag == $scope.flagGif.transitioned) {
			var flag = $scope.board.flag;
			if (flag == 'done') {
				flag = 'check';
			}
			return 'media/' + flag + 'flag.gif';
		} else {
			// destroy the flaggif for at least one browser frame!
			requestAnimationFrame(function() {
				$scope.$apply(function() {
					$scope.flagGif.transitioned = $scope.board.flag;
				});
			});
			return null;
		}
	}
	var af = {};
	$scope.videoUrls = function() {
		return $scope.settings.showVideos.filter(function(url) { return url }).map(function(url) { return allFormats(url)});
		function allFormats(url) {
			af[url] = af[url] || getFormats(url);
			return af[url];
		}
		function getFormats(url) {
			var formats = Object.keys(VIDEOS.formats).map(function(name) {
					var format = VIDEOS.formats[name];
					return {url: 'media/' + url + '.' + name, type: format.type};
				});
			formats.urls = formats.map(function(f) { return f.url + ' w' + f.width }).join(',');
			return formats;
		}
	}
	$scope.youtubeUrl = function(id) {
		return 'https://www.youtube.com/embed/' + id + '?autoplay=1';
	}
	$scope.playVideos = function($event) {
		var v = $event.target.parentNode.querySelectorAll('video'),
			i, paused = false;
		for (i = 0; i < v.length; ++i) {
			paused = paused || v[i].paused;
		}
		for (var i = 0; i < v.length; ++i) {
			if (paused) {
				v[i].play();
			} else {
				v[i].pause();
			}
		}
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
		// NOTE: for these methods: `this` is bound to $scope
		'settings': function save(settings, oldSettings) {
			this.settings.fontSizePt = settings && /pt$/.test(settings.fontSize) ?
				parseFloat(settings.fontSize) : null;
			if (settings === oldSettings) { return }
			localStorage.setItem('settings', JSON.stringify(settings));
		},
		'settings.fontSizePt': function(value, oldValue) {
			if (value !== oldValue && value) {
				this.settings.fontSize = value + 'pt';
			}
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
			if (data.warmupTime) {
				data.warmupTime = new Date(data.warmupTime);
			}
			if (data.drivers && typeof data.drivers === 'object') {
				data.sortedDrivers = Object.keys(data.drivers).sort(function(a, b) {
					return sortNumber(a) - sortNumber(b);
					function sortNumber(n) {
						switch (n) {
							case '0': return 10;
							case 'X': return 11;
							case 'C': return 12;
						}
						return parseInt(n);
					}
				}).map(function(k) {
					return {pos: k, name: data.drivers[k]};
				});
			}
			$scope.board = data;
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
	},
	parseUrlParams: function() {
		var search = this._$location.search(),
			$scope = this._$scope;
		return Object.keys(search).reduce(readParam, {});

		function readParam(result, key) {
			var value = deepValue(search[key], key),
				noParse = value !== null;
			if (value === null) {
				value = search[key];
			}

			switch(key) {
				case 'size':
					result[key] = getSize(value.split('x'));
					break;
				 default:
					result[key] = noParse ? value :
						(value === undefined ? true : $scope.$eval(value));
			}
			return result;	

			function deepValue(value, key) {
				var currentValue = value;
				if (/^(board|settings)\./.test(key)) {
					var parts = key.split('.'),
						mergeValue,
						mergeKey;

					key = parts.shift();
					mergeValue = $scope[key]
					currentValue = mergeValue;
					while (mergeKey = parts.shift()) {
						// Reflected XSS leak! normally shouldn't $scope.$eval url params ¯\_(ツ)_/¯
						currentValue = currentValue[mergeKey] = parts.length ?
							(currentValue[mergeKey] || {}) :
							$scope.$eval(value);
					}
	
					value = angular.merge($scope[key], mergeValue);
				}
				return currentValue;
			}
		}

		function getSize(size) {

			var MIN_FONT_SIZE = 20,
				MIN_LINES = 2,
				size = {
					x: parseInt(size[0], 10),
					y: parseInt(size[1], 10)
				};
			var newSize = {};
			// eval this aftter all the other settings are pulled from the url
			$scope.$evalAsync(function() { 

				var lines = $scope.settings && $scope.settings.lines || Math.max(MIN_LINES, Math.round(size.y / MIN_FONT_SIZE));
				Object.assign(newSize, {
					x: size.x + 'px',
					y: size.y + 'px',
					fontSize: Math.round(size.y / lines) + 'px'
				});
				if ($scope.settings && !$scope.params['settings.fontSize'] && !$scope.params['settings.fontSizePt']) {
					$scope.settings.fontSizePt = null;
					$scope.settings.fontSize = newSize.fontSize;
				}
			});
			return newSize;
		}
	}
};

board.config(function($compileProvider, $sceDelegateProvider) {
	var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);
	$sceDelegateProvider.resourceUrlWhitelist([
		'self',
		'https://www.youtube.com/embed/**'
	]);
});
