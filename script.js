let canvas, c;
let sideLength;
let cols, rows;
let downloaded = 0;
const METHOD_ALBUMS = 1;
const METHOD_ARTISTS = 2;

$(function() {
	$('#copyright').css('display', 'block').html('Copyright &copy; Alex White  ' + new Date().getFullYear());
	$('#form').submit((e) => {
		e.preventDefault();
		localStorage.username = $('#username').val().trim();
		localStorage.period = $('#period').find(':selected').val();
		localStorage.rows = $('#rows').find(':selected').val();
		localStorage.cols = $('#cols').find(':selected').val();
		localStorage.size = $('#size').find(':selected').val();
		localStorage.method = $('#method').find(':selected').val();
		localStorage.showName = $('#showName').is(':checked');
		getContent();
	});
	$('#method').change((e) => {
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
		$(`#${id}`).val(localStorage[id]);
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
	const username = localStorage.username;
	const period = localStorage.period;
	const size = parseInt(localStorage.size);
	const method = parseInt(localStorage.method);
	const showName = localStorage.showName === 'true';
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
	let url;
	switch(method) {
		case METHOD_ALBUMS:
			url = `//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&period=${period}&api_key=${API_KEY}&limit=${limit}&format=json`;
			break;
		case METHOD_ARTISTS:
			url = `//ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&period=${period}&api_key=${API_KEY}&limit=${limit}&format=json`;
			break;
	}
	$.ajax(url, {
		type: 'GET',
		dataType: 'json',
		success: function(data, status, xhr) {
			canvas.width = sideLength * cols;
			canvas.height = sideLength * rows;

			c.fillStyle = 'black';
			c.fillRect(0, 0, canvas.width, canvas.height);

			let links, titles;
			switch(method) {
				case METHOD_ALBUMS:
					links = data.topalbums.album.map((album) => album.image[size]['#text']);
					titles = data.topalbums.album.map((album) => album.artist.name + ' – ' + album.name);
					break;
				case METHOD_ARTISTS:
					links = data.topartists.artist.map((artist) => artist.image[size]['#text']);
					titles = data.topartists.artist.map((artist) => artist.name);
					break;
			}
			for (let i = 0, k = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++, k++) {
					if (!links[k] || links[k].length === 0) {
						printItem(null, j, i, titles[k], true);
					} else {
						printItem(links[k], j, i, titles[k], showName);
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

function printItem(link, i, j, title, showName) {
	if (!link) {
		printName(i, j, title);
		registerDownloaded();
	} else {
		let img = new Image(sideLength, sideLength);
		img.crossOrigin = 'Anonymous';
		img.classList.add('img-responsive');
		img.onload = function() {
			c.drawImage(img, i * sideLength, j * sideLength);
			if (showName) {
				printName(i, j, title, true);
			}
			registerDownloaded();
		};
		img.src = link;
	}
}

function printName(i, j, title, overlay = false) {
	c.textAlign = 'center';
	const fontSize = Math.min(sideLength * 1.3 / title.length, sideLength / 15);
	c.font = `${fontSize}pt sans-serif`;
	c.fillStyle = 'white';
	const textX = i * sideLength + sideLength / 2;
	let textY;
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
		let canvasImg = new Image(sideLength * cols, sideLength * rows);
		canvasImg.src = canvas.toDataURL('image/png');
		canvasImg.classList.add('img-responsive');
		canvasImg.crossOrigin = 'Anonymous';
		canvasImg.style = 'margin: 10px auto;';
		canvasImg.id = 'canvasImg';
		$('#generated').append(canvasImg);
	}
}
