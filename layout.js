'use strict';
/*globals board*/
var TEMPLATES = {
		qualify: 'qualify.html',
		race: {
			warmup: 'countdown.html',
			race: {
				green: 'race.html',
				white: 'race.html',
				check: 'finish.html'
			},
			notgreen: {
				yellow: 'lineup.html',
				red: 'lineup.html',
				pre: 'prerace.html'
			}
		}
	},
	MODE = { RACE: 'race', QUALIFY: 'qualify' },
	STATE = {
		NONE: 'none',
		PRE: 'pre',
		WARMUP:'warmup',
		RACE:'race',
		NOTGREEN: 'notgreen',
		START: 'start',
		RESTART: 'restart',
		FINISH:'finish'
	},
	FLAG = {
		PRE: 'pre',
		GREEN:'green',
		YELLOW: 'yellow',
		RED: 'red',
		WHITE: 'white',
		CHECKERED:'check'
	},
	BOARD_DEFAULT = {
		laps:null,
		lineup:[],
		raceOrder:[],
		drivers:[],
		raceName:null,
		raceNumber:0,
		className:null,
		state: STATE.RACE,
		mode: MODE.RACE,
		showDrivers: false,
		flag: FLAG.GREEN,
		warmupTime: null,
		raceTime: null
	},
	SETTINGS_DEFAULT = {
		screen: true,
		zoom: 4,
		fontSize: 22,
		fontFamily: 'Calibri',
		showSettings: true,
		showControlBoard: false,
		showPanels: true,
		showCanvas: false,
		showBoard: true,
		showFlags: true,
		lines: 11,
		styleClasses: ['green', 'transparent', 'halo', 'shadow'],
		raceClasses: x(['Jr', 'Sr'], ['Novice', 'Honda', 'Animal', 'Super Stock'])
			.concat(x(['Light', 'Heavy'], ['Honda 160', 'World Formula']))
			.concat(['Jr Half', 'B', 'AA', 'Mod', 'Heavy Honda']),
		raceTypes: ['Heat', 'Trophy Dash', 'Main Event'],
		showVideos: ['MVI_1653']
	},
	STYLE_CLASSES = ['transparent', 'white', 'green', 'halo', 'shadow', 'none'],
	VIDEOS = {
		files: ['MVI_1653', 'MVI_3010', 'youtubecut', ''],
		formats: {
			'small480x320.mp4': {width:480, type: 'video/mp4; codecs="h264, mp4a"'},
			'webmsd.webm': {width: 720, type: 'video/webm; codecs="vp8, vorbis'}
		},
		youtubes: ['kNWXhn2A08c', 'YxqnbFVd9Ms']
	};

/* do not edit below here */
board.constant({TEMPLATES: TEMPLATES, BOARD_DEFAULT: BOARD_DEFAULT,
	SETTINGS_DEFAULT: SETTINGS_DEFAULT, MODE: MODE, STATE: STATE, FLAG: FLAG,
	STYLE_CLASSES: STYLE_CLASSES, VIDEOS: VIDEOS
});


function x(a, b, sep) {
	sep = sep === undefined ? ' ' : sep;
	return a.reduce(function(result, aa) {
		result.push.apply(result, b.map(cross));
		return result;
		function cross(bb) {
				return aa + sep + bb;
		}
	}, []);
}
