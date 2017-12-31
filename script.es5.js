'use strict';

var canvas = void 0,
    c = void 0;
var sideLength = void 0;
var cols = void 0,
    rows = void 0;
var downloaded = 0;
var METHOD_ALBUMS = 1;
var METHOD_ARTISTS = 2;

$(function () {
	$('#copyright').css('display', 'block').html('Copyright &copy; Alex White  ' + new Date().getFullYear());
	$('#form').submit(function (e) {
		e.preventDefault();
		getContent($('#username').val().trim(), $('#duration').find(':selected').val(), parseInt($('#rows').find(':selected').val()), parseInt($('#columns').find(':selected').val()), parseInt($('#size').find(':selected').val()), parseInt($('#method').find(':selected').val()), $('#showName').is(':checked'));
	});
	$('#method').change(function (e) {
		setOverlayLabel();
	});
	canvas = document.getElementById('canvas');
	c = canvas.getContext('2d');
	setOverlayLabel();
});

function setOverlayLabel() {
	if (parseInt($('#method').find(':selected').val()) === METHOD_ALBUMS) {
		$('#showNameLabel').html('Overlay album name');
	} else {
		$('#showNameLabel').html('Overlay artist name');
	}
}

function getContent() {
	var username = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'aaapwww';
	var period = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '1month';

	var _rows = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

	var _cols = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;

	var size = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 3;
	var method = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : METHOD_ALBUMS;
	var showName = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : true;

	rows = _rows;
	cols = _cols;
	$('#canvasImg').remove();
	downloaded = 0;
	$('#canvas').css('display', 'inline');
	$('#loading').css('display', 'block');
	var API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
	var limit = rows * cols;
	switch (size) {
		case 0:
			sideLength = 34;
			break;
		case 1:
			sideLength = 64;
			break;
		case 2:
			sideLength = 174;
			break;
		default:
			sideLength = 300;
			break;
	}
	var url = void 0;
	switch (method) {
		case METHOD_ALBUMS:
			url = '//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + limit + '&format=json';
			break;
		case METHOD_ARTISTS:
			url = '//ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + limit + '&format=json';
			break;
	}
	$.ajax(url, {
		type: 'GET',
		dataType: 'json',
		success: function success(data, status, xhr) {
			canvas.width = sideLength * cols;
			canvas.height = sideLength * rows;

			c.fillStyle = 'black';
			c.fillRect(0, 0, canvas.width, canvas.height);

			var links = void 0,
			    titles = void 0;
			switch (method) {
				case METHOD_ALBUMS:
					links = data.topalbums.album.map(function (album) {
						return album.image[size]['#text'];
					});
					titles = data.topalbums.album.map(function (album) {
						return album.artist.name + ' – ' + album.name;
					});
					break;
				case METHOD_ARTISTS:
					links = data.topartists.artist.map(function (artist) {
						return artist.image[size]['#text'];
					});
					titles = data.topartists.artist.map(function (artist) {
						return artist.name;
					});
					break;
			}
			for (var i = 0, k = 0; i < rows; i++) {
				for (var j = 0; j < cols; j++, k++) {
					if (!links[k] || links[k].length === 0) {
						printItem(null, j, i, titles[k], true);
					} else {
						printItem(links[k], j, i, titles[k], showName);
					}
				}
			}
		},
		error: function error(xhr, status, _error) {
			console.log(status, _error);
			alert('There was an error');
		}
	});
}

function printItem(link, i, j, title, showName) {
	if (!link) {
		printName(i, j, title);
		registerDownloaded();
	} else {
		var img = new Image(sideLength, sideLength);
		img.crossOrigin = 'Anonymous';
		img.classList.add('img-responsive');
		img.onload = function () {
			c.drawImage(img, i * sideLength, j * sideLength);
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
	var fontSize = Math.min(sideLength * 1.3 / title.length, sideLength / 15);
	c.font = fontSize + 'pt sans-serif';
	c.fillStyle = 'white';
	var textX = i * sideLength + sideLength / 2;
	var textY = void 0;
	if (overlay) {
		c.shadowBlur = 5;
		c.shadowColor = '#2b2b2b';
		c.shadowOffsetX = 2;
		c.shadowOffsetY = 2;
		c.textBaseline = 'bottom';
		textY = j * sideLength + sideLength - sideLength / 30;
	} else {
		textY = j * sideLength + sideLength / 2;
		c.textBaseline = 'middle';
	}
	c.fillText(title, textX, textY);
}

function registerDownloaded() {
	downloaded++;
	if (downloaded === cols * rows) {
		$('#loading').css('display', 'none');
		$('#canvas').css('display', 'none');
		var canvasImg = new Image(sideLength * cols, sideLength * rows);
		canvasImg.src = canvas.toDataURL('image/png');
		canvasImg.classList.add('img-responsive');
		canvasImg.crossOrigin = 'Anonymous';
		canvasImg.style = 'margin: 10px auto;';
		canvasImg.id = 'canvasImg';
		$('#generated').append(canvasImg);
	}
}
