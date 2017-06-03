let canvas, c;
let sideLength;
let cols, rows;
let downloaded = 0;

$(function() {
	$('#copyright').css('display', 'block').html('Copyright &copy; Alex White  ' + new Date().getFullYear());
	$('#form').submit((e) => {
		e.preventDefault();
		getAlbums(
			$('#username').val(), 
			$('#duration').find(':selected').val(),
			parseInt($('#rows').find(':selected').val()),
			parseInt($('#columns').find(':selected').val()),
			parseInt($('#size').find(':selected').val()));
	});
	canvas = document.getElementById('canvas');
	c = canvas.getContext('2d');
	// getAlbums();
});

function getAlbums(username = 'aaapwww', period = '1month', _rows = 5, _cols = 5, size = 3) {
	rows = _rows;
	cols = _cols;
	$('#canvasImg').remove();
	downloaded = 0;
	$('#canvas').css('display', 'inline');
	$('#loading').css('display', 'block');
	const API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
	let limit = rows * cols;
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
	const URL = `//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&period=${period}&api_key=${API_KEY}&limit=${limit}&format=json`;
	$.ajax(URL, {
		type: 'GET',
		dataType: 'json',
		success: function(data, status, xhr) {
			canvas.width = sideLength * cols;
			canvas.height = sideLength * rows;

			c.fillStyle = 'black';
			c.fillRect(0, 0, canvas.width, canvas.height);

			let links = data.topalbums.album.map((album) => album.image[size]['#text']);
			let titles = data.topalbums.album.map((album) => album.artist.name + ' – ' + album.name);
			for (let i = 0, k = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++, k++) {
					if (!links[k] || links[k].length === 0) {
						printAlbum(null, j, i, titles[k]);
					} else {
						printAlbum(links[k], j, i);
					}
				}
			}
		},
		error: function(xhr, status, error) {
			console.log(status, error);
			alert('There was an error');
		}
	});
}

function printAlbum(link, i, j, title) {
	if (title) {
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		const fontSize = sideLength * 1.3 / title.length;
		c.font = `${fontSize}pt sans-serif`;
		c.fillStyle = 'white';
		c.fillText(title, i * sideLength + sideLength / 2, j * sideLength + sideLength / 2);
		registerDownloaded();
	} else {
		let img = new Image(sideLength, sideLength);
		img.crossOrigin = 'Anonymous';
		img.classList.add('img-responsive');
		img.onload = function() {
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
		let canvasImg = new Image(sideLength * cols, sideLength * rows);
		canvasImg.src = canvas.toDataURL('image/png');
		canvasImg.classList.add('img-responsive');
		canvasImg.crossOrigin = 'Anonymous';
		canvasImg.style = 'margin: 10px auto;';
		canvasImg.id = 'canvasImg';
		$('#generated').append(canvasImg);
	}
}
