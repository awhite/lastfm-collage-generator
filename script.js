let canvas, c;
let sideLength;
let size;
let cols, rows;
let downloaded = 0;

$(function() {
	$('#copyright').css('display', 'block').html('Copyright &copy; Alex White  ' + new Date().getFullYear());
	$('#form').submit((e) => {
		e.preventDefault();
		getAlbums();
	});
	canvas = document.getElementById('canvas');
	c = canvas.getContext('2d');
});

function getAlbums() {
	$('#loading').css('display', 'block');
	const API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
	let username = $('#username').val();
	let period = $('#duration').find(':selected').val();
	rows = parseInt($('#rows').find(':selected').val());
	cols = parseInt($('#columns').find(':selected').val());
	let limit = rows * cols;
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
	const URL = `http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&period=${period}&api_key=${API_KEY}&limit=${limit}&format=json`;
	$.ajax(URL, {
		type: 'GET',
		dataType: 'json',
		success: function(data, status, xhr) {
			canvas.width = sideLength * cols;
			canvas.height = sideLength * rows;

			c.fillStyle = 'black';
			c.fillRect(0, 0, canvas.width, canvas.height);

			let links = data.topalbums.album.map((album) => album.image[size]['#text']);
			let maxX = sideLength * (cols - 1);
			let maxY = sideLength * (rows - 1);
			for (let i = 0, k = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++, k++) {
					printAlbum(links[k], j, i);
				}
			}
		},
		error: function(xhr, status, error) {
			console.log(status, error);
			alert('There was an error');
		}
	});
}

function printAlbum(link, i, j) {
	let img = new Image(sideLength, sideLength);
	img.onload = function() {
		c.drawImage(img, i * sideLength, j * sideLength);
		downloaded++;
		if (downloaded === cols * rows) {
			$('#loading').css('display', 'none');
			$('#canvas').css('display', 'none');
			let canvasImg = new Image(sideLength * cols, sideLength * rows);
			canvasImg.src = canvas.toDataURL('image/png');
			canvasImg.crossOrigin = 'Anonymous';
			$('#generated').append(canvasImg);
		}
	};
	img.src = link;
}

