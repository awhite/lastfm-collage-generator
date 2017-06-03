'use strict';

var canvas = void 0,
    c = void 0;
var sideLength = void 0;
var cols = void 0,
    rows = void 0;
var downloaded = 0;

$(function () {
	$('#copyright').css('display', 'block').html('Copyright &copy; Alex White  ' + new Date().getFullYear());
	$('#form').submit(function (e) {
		e.preventDefault();
		getAlbums($('#username').val(), $('#duration').find(':selected').val(), parseInt($('#rows').find(':selected').val()), parseInt($('#columns').find(':selected').val()), parseInt($('#size').find(':selected').val()));
	});
	canvas = document.getElementById('canvas');
	c = canvas.getContext('2d');
	// getAlbums();
});

function getAlbums() {
	var username = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'aaapwww';
	var period = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '1month';

	var _rows = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

	var _cols = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;

	var size = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 3;

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
	var URL = '//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + limit + '&format=json';
	$.ajax(URL, {
		type: 'GET',
		dataType: 'json',
		success: function success(data, status, xhr) {
			canvas.width = sideLength * cols;
			canvas.height = sideLength * rows;

			c.fillStyle = 'black';
			c.fillRect(0, 0, canvas.width, canvas.height);

			var links = data.topalbums.album.map(function (album) {
				return album.image[size]['#text'];
			});
			var titles = data.topalbums.album.map(function (album) {
				return album.artist.name + ' – ' + album.name;
			});
			for (var i = 0, k = 0; i < rows; i++) {
				for (var j = 0; j < cols; j++, k++) {
					if (!links[k] || links[k].length === 0) {
						printAlbum(null, j, i, titles[k]);
					} else {
						printAlbum(links[k], j, i);
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

function printAlbum(link, i, j, title) {
	if (title) {
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		var fontSize = sideLength * 1.3 / title.length;
		c.font = fontSize + 'pt sans-serif';
		c.fillStyle = 'white';
		c.fillText(title, i * sideLength + sideLength / 2, j * sideLength + sideLength / 2);
		registerDownloaded();
	} else {
		var img = new Image(sideLength, sideLength);
		img.crossOrigin = 'Anonymous';
		img.classList.add('img-responsive');
		img.onload = function () {
			c.drawImage(img, i * sideLength, j * sideLength);
			registerDownloaded();
		};
		img.src = link;
	}
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
