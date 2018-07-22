(function($){

	var Datafeed = function() {}

	function getParameterByName(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	// Supported resolutions.
	var config = {
		supported_resolutions: ["1", "3", "5", "15", "30", "60", "120", "240", "D"]
	};

	/**
	*
	* This call is intended to provide the object filled with the configuration data.
	* This data partially affects the chart behavior and is called server-side customization.
	* Charting Library assumes that you will call the callback function and pass your datafeed
	* configurationData as an argument. Configuration data is an object; for now, the following
	* properties are supported.
	*
	* @para {callback}
	*/
	Datafeed.prototype.onReady = function(callback) {
		if ($('#easymarkets-charts iframe').length) {
			var iframe_id =  $('#easymarkets-charts iframe').attr('id');
			$('#'+iframe_id).css({
				'min-height': '850px'
			});
		}

		setTimeout(function() {
			callback(config);
		}, 0);
	}

	// only need searchSymbols when search is enabled
	Datafeed.prototype.searchSymbols = function(userInput, exchange, symbolType, onResultReadyCallback) {
		console.log('CALLED SEARCH SYMBOLS');
	}

	// CHART RESOLVE SYMBOL.
	Datafeed.prototype.resolveSymbol = function(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {

		console.log('CALLED RESOLVE SYMBOL');

		// @todo - replace with EM Chart data
		var split_data = symbolName.split(/[:/]/);

		var category = split_data[0];
		var buy = split_data[0];
		var sell = split_data[1];

		var instrument_settings = {};

		var symbol_stub = {
			name: symbolName,
			description: '',
			type: 'crypto',
			session: '24x7',
			timezone: 'America/New_York',
			ticker: symbolName,
			minmov: 1,
			exchange: category,
			pricescale: 100000000,
			has_intraday: true,
			intraday_multipliers: ["1", "3", "5", "15", "30", "60", "120", "240", "D"],
			supported_resolutions: ["1", "3", "5", "15", "30", "60", "120", "240", "D"],
			volume_precision: 8,
			data_status: 'streaming',
		}

		if (sell.match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
			symbol_stub.pricescale = 100
		}

		setTimeout(function() {
			onSymbolResolvedCallback(symbol_stub)
		}, 0);

	}

	// Adjust the return data diff between individual results based on resolution of chart
	// var timeScaleSec = (resolution !== 'D' ? 60 * resolution : 86400);
	// CHART LOAD 3
	Datafeed.prototype.getBars = function(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {

		// Split Symbol
		var split_symbol = symbolInfo.name.split(/[:/]/);

		// Fetch date to ISO.
		var toDate = new Date(to).format('isoDateTime').replace('T', ' ');

		// Does not cotain minutes at the moment.
		var url = resolution === 'D' ? '/data/histoday' : resolution >= 60 ? '/data/histohour' : '/data/histohour'

		var qs = {
			e: split_symbol[0],
			fsym: split_symbol[1],
			tsym: split_symbol[2],
			toTs:  to ? to : '',
			limit: 500
		};

		var api_root = 'https://min-api.cryptocompare.com';
		console.log(${api_root});

		$.ajax({
			cache: false,
			dataType: "json",
			url: `${api_root}${url}?` + jQuery.param(qs),
			success: function(data) {

				if (data.Data.length && data.Response === 'Success') {
					var chart_data = [];

					//find Min and MAX from sample 0 to 2 index
					data.Data.forEach(function(el, index) {

							var sample_data = {
								time: el.time * 1000, //TradingView requires bar time in ms
								low: el.low,
								high: el.high,
								open: el.open,
								close: el.close,
								//volume: el.volumefrom
							};

							chart_data.push(sample_data);
							chartStr = JSON.stringify(chart_data);

					});

					if (chart_data.length) {
						onHistoryCallback(chart_data, {noData: true});
					}
					else {
						onHistoryCallback(chart_data, {noData: false});
					}
				} else {
					onErrorCallback('NO DATA');
					//onHistoryCallback(chart_data, {noData: false});
				}
			},
			error: function(data) {
				if (data.Response && data.Response === 'Error') {
					console.log('CryptoCompare API error:',data.Message)
					return []
				}
			},
		});
	}

	Datafeed.prototype.subscribeBars = function(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) {
			console.log('CALLED SUBSCRIBE BARS');
	}

	Datafeed.prototype.unsubscribeBars = function(subscriberUID) {
		console.log('CALLED UNSUBSCRIBE BARS');
	}

	/* optional methods */
	Datafeed.prototype.getServerTime = function(callback) {
		console.log('CALLED GET SERVER TIME');
	}

	Datafeed.prototype.calculateHistoryDepth = function(resolution, resolutionBack, intervalBack) {
		console.log('CALLED CALCULATE HISTORY DEPTH');
	}

	Datafeed.prototype.getMarks = function(symbolInfo, startDate, endDate, onDataCallback, resolution) {
		console.log('CALLED GET MARKS');
	}

	Datafeed.prototype.getTimeScaleMarks = function(symbolInfo, startDate, endDate, onDataCallback, resolution) {
		console.log('CALLED GET TIME SCALE MARKS');
	}

	// Initialize Class
	var datafeed = new Datafeed();

	var category = "Coinbase";
	var instrument = "BTC/EUR";

	var widgetOptions = {
		debug: true,
		symbol: `${category}:${instrument}`,
		datafeed: datafeed, // our datafeed object
		interval: '15',
		timeframe: '1M',
		width: 900,
		height: 600,
		container_id: 'easymarkets-charts',
		library_path: 'charting_library/',
		chartsStorageUrl: 'https://saveload.tradingview.com',
		chartsStorageApiVersion: '1.1',
		locale: 'en',
		disabled_features: ['use_localstorage_for_settings'],
		enabled_features: [],
		client_id: 'test',
		user_id: 'public_user_id',
		fullscreen: false,
		autosize: true,
		overrides: {
			"mainSeriesProperties.style": 3,
			"symbolWatermarkProperties.color" : "#944",
			"volumePaneSize": "tiny"
		},
		favorites: {
			intervals: ["1", "3", "5", "15", "30", "60", "120", "240", "D"],
			chartTypes: ["Area", "Line", "Candles"]
		}
	};

	// Init Trading View Chart
	TradingView.onready(function() {

		console.log('TRADING VIEW READY TO START');

		var widget = window.tvwidget = new TradingView.widget(widgetOptions);

		widget.onChartReady(function() {
			console.log('Chart has loaded');
		});
	});

})(jQuery);
