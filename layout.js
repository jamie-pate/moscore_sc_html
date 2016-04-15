'use strict';
/*globals board*/
var TEMPLATES = {
		qualify: 'qualify.html',
		race: {
			pre: 'prerace.html',
			warmup: 'countdown.html',
			race: {
				green: 'race.html',
				white: 'race.html',
				check: 'finish.html'
			},
			notgreen: {
				yellow: 'lineup.html',
				red: 'lineup.html',
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
		zoom: 3,
		fontSize: 24,
		fontFamily: 'Calibri',
		showSettings: true,
		showControlBoard: true,
		raceClasses: x(['Jr', 'Sr'], ['Novice', 'Honda', 'Animal', 'Super Stock'])
			.concat(x(['Light', 'Heavy'], ['Honda 160', 'World Formula']))
			.concat(['Jr Half', 'B', 'AA', 'Mod', 'Heavy Honda']),
		raceTypes: ['Heat', 'Trophy Dash', 'Main Event']
	}

/* do not edit below here */
board.constant({TEMPLATES: TEMPLATES, BOARD_DEFAULT: BOARD_DEFAULT,
	SETTINGS_DEFAULT: SETTINGS_DEFAULT, MODE: MODE, STATE: STATE, FLAG: FLAG});


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
