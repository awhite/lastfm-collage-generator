'use strict';

var canvas = void 0,
    c = void 0;
var downloaded = 0;
var collageInfo = {};
var METHOD_ALBUMS = 1;
var METHOD_ARTISTS = 2;

$(function () {
	$('#copyright').css('display', 'block').html('Copyright &copy; Alex White  ' + new Date().getFullYear());
	$('#form').submit(function (e) {
		e.preventDefault();
		localStorage.username = $('#username').val().trim();
		localStorage.period = $('#period').find(':selected').val();
		localStorage.rows = $('#rows').find(':selected').val();
		localStorage.cols = $('#cols').find(':selected').val();
		localStorage.size = $('#size').find(':selected').val();
		localStorage.method = $('#method').find(':selected').val();
		localStorage.showName = $('#showName').is(':checked');
		submit();
	});
	$('#method').change(function (e) {
		setOverlayLabel();
	});
	canvas = document.getElementById('canvas');
	c = canvas.getContext('2d');
	setFieldsFromLocalStorage();
});

function setFieldsFromLocalStorage() {
	setFieldFromLocalStorage('username');
	setFieldFromLocalStorage('period');
	setFieldFromLocalStorage('rows');
	setFieldFromLocalStorage('cols');
	setFieldFromLocalStorage('size');
	setFieldFromLocalStorage('method');
	$('#showName').prop('checked', localStorage.showName === 'true');
	setOverlayLabel();
}

function setFieldFromLocalStorage(id) {
	if (localStorage[id]) {
		$('#' + id).val(localStorage[id]);
	}
}

function setOverlayLabel() {
	if (parseInt($('#method').find(':selected').val()) === METHOD_ALBUMS) {
		$('#showNameLabel').html('Overlay album name');
	} else {
		$('#showNameLabel').html('Overlay artist name');
	}
}

function submit() {
	downloaded = 0;

	setCollageInfo();
	initCanvas();

	// Last.fm specific
	var username = localStorage.username;
	var period = localStorage.period;
	var API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
	var limit = collageInfo.rows * collageInfo.cols;

	switch (collageInfo.method) {
		case METHOD_ALBUMS:
			collageInfo.url = '//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + limit + '&format=json';
			break;
		case METHOD_ARTISTS:
			collageInfo.url = '//ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + limit + '&format=json';
			break;
	}
	// End Last.fm specific

	getImageLinks();
}

function setCollageInfo() {
	collageInfo.showName = localStorage.showName === 'true';
	collageInfo.method = parseInt(localStorage.method);
	collageInfo.size = parseInt(localStorage.size);
	collageInfo.rows = parseInt(localStorage.rows);
	collageInfo.cols = parseInt(localStorage.cols);

	collageInfo.imageNum = collageInfo.rows * collageInfo.cols;

	switch (collageInfo.size) {
		case 0:
			collageInfo.sideLength = 34;
			break;
		case 1:
			collageInfo.sideLength = 64;
			break;
		case 2:
			collageInfo.sideLength = 174;
			break;
		default:
			collageInfo.sideLength = 300;
			break;
	}
}

function initCanvas() {
	$('#canvasImg').remove();
	$('#canvas').css('display', 'inline');
	$('#loading').css('display', 'block');

	canvas.width = collageInfo.sideLength * collageInfo.cols;
	canvas.height = collageInfo.sideLength * collageInfo.rows;

	c.fillStyle = 'black';
	c.fillRect(0, 0, canvas.width, canvas.height);
}

function getImageLinks() {
	$.ajax(collageInfo.url, {
		type: 'GET',
		dataType: 'json',
		success: function success(data, status, xhr) {
			makeCollage(data);
		},
		error: function error(xhr, status, _error) {
			console.log(status, _error);
			alert('There was an error');
		}
	});
}

function makeCollage(data) {
	var links = void 0,
	    titles = void 0;

	switch (collageInfo.method) {
		case METHOD_ALBUMS:
			links = data.topalbums.album.map(function (album) {
				return album.image[collageInfo.size]['#text'];
			});
			titles = data.topalbums.album.map(function (album) {
				return album.artist.name + ' – ' + album.name;
			});
			break;
		case METHOD_ARTISTS:
			links = data.topartists.artist.map(function (artist) {
				return artist.image[collageInfo.size]['#text'];
			});
			titles = data.topartists.artist.map(function (artist) {
				return artist.name;
			});
			break;
	}

	for (var i = 0, k = 0; i < collageInfo.rows; i++) {
		for (var j = 0; j < collageInfo.cols; j++, k++) {
			if (!links[k] || links[k].length === 0) {
				loadImage(null, j, i, titles[k], true);
			} else {
				loadImage(links[k], j, i, titles[k], collageInfo.showName);
			}
		}
	}
}

function loadImage(link, i, j, title, showName) {
	if (!link) {
		printName(i, j, title);
		registerDownloaded();
	} else {
		var img = new Image(collageInfo.sideLength, collageInfo.sideLength);
		img.crossOrigin = 'Anonymous';
		img.classList.add('img-responsive');
		img.onload = function () {
			c.drawImage(img, i * collageInfo.sideLength, j * collageInfo.sideLength);
			if (showName) {
				printName(i, j, title, true);
			}
			registerDownloaded();
		};
		img.src = link;
	}
}

function printName(i, j, title) {
	var overlay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

	c.textAlign = 'center';
	var fontSize = Math.min(collageInfo.sideLength * 1.3 / title.length, collageInfo.sideLength / 15);
	c.font = fontSize + 'pt sans-serif';
	c.fillStyle = 'white';
	var textX = i * collageInfo.sideLength + collageInfo.sideLength / 2;
	var textY = void 0;
	if (overlay) {
		c.shadowBlur = 5;
		c.shadowColor = '#2b2b2b';
		c.shadowOffsetX = 2;
		c.shadowOffsetY = 2;
		c.textBaseline = 'bottom';
		textY = j * collageInfo.sideLength + collageInfo.sideLength - collageInfo.sideLength / 30;
	} else {
		textY = j * collageInfo.sideLength + collageInfo.sideLength / 2;
		c.textBaseline = 'middle';
	}
	c.fillText(title, textX, textY);
}

function registerDownloaded() {
	downloaded++;
	if (downloaded === collageInfo.imageNum) {
		$('#loading').css('display', 'none');
		$('#canvas').css('display', 'none');
		var canvasImg = new Image(collageInfo.sideLength * collageInfo.cols, collageInfo.sideLength * collageInfo.rows);
		canvasImg.src = canvas.toDataURL('image/png');
		canvasImg.classList.add('img-responsive');
		canvasImg.crossOrigin = 'Anonymous';
		canvasImg.style = 'margin: 10px auto;';
		canvasImg.id = 'canvasImg';
		$('#generated').append(canvasImg);
	}
}
