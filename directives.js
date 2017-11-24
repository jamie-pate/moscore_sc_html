board.directive({
	mWith: mWith,
	mImage: mImage,
	mCanvas: mCanvas,
	mCopy: mCopy,
	mTimeScale: mTimeScale,
	mAutoScroll: mAutoScroll,
	video: video,
	noAnimate: noAnimate
});

// https://github.com/angular/angular.js/issues/4368
function mWith($parse, $log) {
	return {
		scope: true,
		link: function(scope, el, attr) {
			var expression = attr.mWith;
			var parts = expression.split(' as ');

			if(parts.length != 2) {
				$log.error("`with` directive expects expression in the form `_expression_ as _expression_`");
				return;
			}

			scope.$watch(parts[0], function(value) {
				scope[parts[1]] = value;
			});
		}
	};
}
function mCopy() {
	return {
		scope: {
			data: '=mCopy'
		},
		link: function($scope, $element) {
			//console.debug($scope, $element);
			$scope.$watch(innerHTML, function(value) {
				$scope.data = value;
				//console.debug($scope);
			});
			function innerHTML() { return $element[0].innerHTML; }
		}
	};
}
function mTimeScale() {
	return {
		require: 'ngModel',
		scope: {
			timeScale:'@mTimeScale'
		},
		link: function($scope, $element, $attrs, ngModel) {
			ngModel.$formatters.push(formatter);
			var timeScales = {
				h: 60*60*1000,
				m: 60*1000,
				s: 1000,
				ms: 1
			};
			ngModel.$parsers.push(parser);
			function formatter(value) {
				return value / timeScales[$scope.timeScale];
			}
			function parser(value) {
				return value * timeScales[$scope.timeScale];
			}
		}
	};
}
function mCanvas() {
	return {
		restrict: 'E',
		replace: true,
		template: '<canvas></canvas>',
		scope: {
			data: '=src',
			zoom: '=',
			post: '='
		},
		link: function($scope, $element) {
			var img = document.createElement('img');
			var canvas = $element[0],
					back = document.createElement('canvas');
			$scope.zoom = $scope.zoom || 1;
			img.onload = function() {
				var z = $scope.zoom,
						w = img.naturalWidth,
						wz = w * z,
						h = img.naturalHeight,
						hz = h * z;
				if (!w || !h) { return; }
				back.width = w;
				back.height = h;
				//console.debug(canvas.width, canvas.height);
				back.style.cssText = [
					'image-rendering: -webkit-optimize-contrast',
					'image-rendering: -moz-crisp-edges',
					'-webkit-font-smoothing : none'].join(';');
				canvas.style.cssText = back.style.cssText;
				canvas.width = wz;
				canvas.height = hz;
				canvas.style.width = wz + 'px';
				canvas.style.height = hz + 'px';
				var ctx = canvas.getContext('2d');
				var bctxt = back.getContext('2d');
				bctxt.drawImage(img, 0, 0, w, h);
				ctx.drawImage(back, 0, 0, wz, hz);
				if ($scope.post) {
					$scope.post(ctx, canvas);
				}

			};
			$scope.$watch('[zoom, post]', function(zoom) {
				img.onload();
			}, true);
			$scope.$watch('data', function(data) {
				if (data) {
					img.src = data;
				}
			});
			img.onload();
		}
	};
}
function mImage() {
	return {
		scope: {
			styles: '=',
			data: '=mImage'
		},
		priority:1000,
		link: function($scope, $element) {
			var DOMURL = window.URL || window.webkitURL || window;
			$scope.$watch(innerHTML, function(value) {
				//console.debug(value);
				//console.debug($element[0])
				value = get_svg();
				var root = $element.children()[0];
				if (!root) { return '';}
				var w = root.offsetWidth,
						h = root.offsetHeight;
				var dataStart = '<svg xmlns="http://www.w3.org/2000/svg" {size}><foreignObject {size}>'.replace(/\{size\}/g, ' width="' + w + '" height="' + h + '" ');
				var dataEnd = '</foreignObject></svg>';
				// var dataStart
				var svg = new Blob(
					[dataStart + value + dataEnd],
					{type: 'image/svg+xml;charset=utf-8'});
				$scope.data =
					//'data:image/svg+xml;charset=utf-8,' + dataStart + value + dataEnd;
					DOMURL.createObjectURL(svg);
				//console.debug($scope.data);
			});
			function innerHTML() {
				return $element[0].innerHTML;
			}
			function get_svg() {

				var src = $element[0];
				var src_elems = src.getElementsByTagName('*');
				var dst = src.cloneNode(true);
				var dst_elems = dst.getElementsByTagName('*');
				for(var i = 0, len = src_elems.length; i < len; ++i) {
					dst_elems[i].style.cssText = getComputedStyle(src_elems[i]).cssText;
					//console.debug(dst_elems[i],dst_elems[i].style.cssText);
				}
				//console.debug(dst.style.cssText);
				var child = ng.element(dst).children()[0];
				if (child) {
					child.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
					if ($scope.styles) {
						//console.debug('style',$scope.styles);
						var styles = child.ownerDocument.createElement('style');
						styles.innerHTML = $scope.styles;
						child.insertBefore(styles, child.firstChild);
					}
				}
				//console.debug(dst.innerHTML);
				return dst.innerHTML;
			}
		}
	};
}

function mAutoScroll() {
	return {
		restrict: 'A', 
		controller: AutoScroll
	};
}

function AutoScroll($element, $interval, $scope, $attrs) {
	var AUTO_SCROLL_INTERVAL = 50,
		AUTO_SCROLL_DURATION = 10000,
		doubleScroll = 0,
		last = Date.now(),
		// TODO: only register interval when autoscroll is enabled
		intvl = $interval(function() {
			if ($scope.$eval($attrs.mAutoScroll)) {
				var maxScroll = ($element[0].scrollHeight - $element[0].clientHeight),
					overScroll = maxScroll * 0.1,
					duration = Date.now() - last,
					scrollIncrement = (maxScroll + overScroll * 2) * (duration / AUTO_SCROLL_DURATION);
				last = Date.now();
				if (maxScroll) {
					doubleScroll = (doubleScroll + scrollIncrement) % (maxScroll + overScroll * 2);
					$element[0].scrollTop = Math.round(doubleScroll - overScroll);
				}
			}
		}.bind(this), AUTO_SCROLL_INTERVAL);
	$scope.$on('$destroy', function() { $interval.cancel(intvl) });
}

function video($timeout) {
	return {
		restrict: 'E',
		link: function(scope, element) {
			$timeout(function() {
				scope.$watch(function() {
					return element[0].paused;
				}, function(paused) {
					element.parent().toggleClass('paused', paused);
				});
			}, 1000);
		}
	}
}

function noAnimate($animate) {
	return {
		restrict: 'A',
		link: function(scope, element) {
			$animate.enabled(element, false);
		}
	}
}
