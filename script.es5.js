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
		localStorage.username = $('#username').val().trim();
		localStorage.period = $('#period').find(':selected').val();
		localStorage.rows = $('#rows').find(':selected').val(), localStorage.cols = $('#cols').find(':selected').val(), localStorage.size = $('#size').find(':selected').val(), localStorage.method = $('#method').find(':selected').val(), localStorage.showName = $('#showName').is(':checked');
		getContent();
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

function getContent() {
	rows = parseInt(localStorage.rows);
	cols = parseInt(localStorage.cols);
	var username = localStorage.username;
	var period = localStorage.period;
	var size = parseInt(localStorage.size);
	var method = parseInt(localStorage.method);
	var showName = localStorage.showName === 'true';
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
