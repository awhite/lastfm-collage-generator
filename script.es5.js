'use strict';

var canvas = void 0,
    c = void 0;
var sideLength = void 0;
var size = void 0;
var cols = void 0,
    rows = void 0;
var downloaded = 0;

$(function () {
	$('#copyright').css('display', 'block').html('Copyright &copy; Alex White  ' + new Date().getFullYear());
	$('#form').submit(function (e) {
		e.preventDefault();
		getAlbums();
	});
	canvas = document.getElementById('canvas');
	c = canvas.getContext('2d');
});

function getAlbums() {
	$('#canvasImg').remove();
	downloaded = 0;
	$('#canvas').css('display', 'inline');
	$('#loading').css('display', 'block');
	var API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
	var username = $('#username').val();
	var period = $('#duration').find(':selected').val();
	rows = parseInt($('#rows').find(':selected').val());
	cols = parseInt($('#columns').find(':selected').val());
	var limit = rows * cols;
	size = parseInt($('#size').find(':selected').val());
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
	var URL = 'http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + limit + '&format=json';
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
			var maxX = sideLength * (cols - 1);
			var maxY = sideLength * (rows - 1);
			for (var i = 0, k = 0; i < rows; i++) {
				for (var j = 0; j < cols; j++, k++) {
					printAlbum(links[k], j, i);
				}
			}
		},
		error: function error(xhr, status, _error) {
			console.log(status, _error);
			alert('There was an error');
		}
	});
}

function printAlbum(link, i, j) {
	var img = new Image(sideLength, sideLength);
	img.crossOrigin = 'Anonymous';
	img.onload = function () {
		c.drawImage(img, i * sideLength, j * sideLength);
		downloaded++;
		if (downloaded === cols * rows) {
			$('#loading').css('display', 'none');
			$('#canvas').css('display', 'none');
			var canvasImg = new Image(sideLength * cols, sideLength * rows);
			canvasImg.src = canvas.toDataURL('image/png');
			canvasImg.crossOrigin = 'Anonymous';
			canvasImg.style = 'margin:10px;';
			canvasImg.id = 'canvasImg';
			$('#generated').append(canvasImg);
		}
	};
	img.src = link;
}
