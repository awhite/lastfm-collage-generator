let canvas, c;
let downloaded = 0;
const collageInfo = {};
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
		submit();
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

function submit() {
	downloaded = 0;

	setCollageInfo();
	initCanvas();
	
	// Last.fm specific
	const username = localStorage.username;
	const period = localStorage.period;
	const API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
	const limit = collageInfo.rows * collageInfo.cols;
	
	switch(collageInfo.method) {
		case METHOD_ALBUMS:
			collageInfo.url = `//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&period=${period}&api_key=${API_KEY}&limit=${limit}&format=json`;
			break;
		case METHOD_ARTISTS:
			collageInfo.url = `//ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&period=${period}&api_key=${API_KEY}&limit=${limit}&format=json`;
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
		success: function(data, status, xhr) {
			makeCollage(data);
		},
		error: function(xhr, status, error) {
			console.log(status, error);
			alert('There was an error');
		}
	});
}

function makeCollage(data) {
	let links, titles;

	switch (collageInfo.method) {
		case METHOD_ALBUMS:
			links = data.topalbums.album.map((album) => album.image[collageInfo.size]['#text']);
			titles = data.topalbums.album.map((album) => album.artist.name + ' – ' + album.name);
			break;
		case METHOD_ARTISTS:
			links = data.topartists.artist.map((artist) => artist.image[collageInfo.size]['#text']);
			titles = data.topartists.artist.map((artist) => artist.name);
			break;
	}

	for (let i = 0, k = 0; i < collageInfo.rows; i++) {
		for (let j = 0; j < collageInfo.cols; j++, k++) {
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
		let img = new Image(collageInfo.sideLength, collageInfo.sideLength);
		img.crossOrigin = 'Anonymous';
		img.classList.add('img-responsive');
		img.onload = function() {
			c.drawImage(img, i * collageInfo.sideLength, j * collageInfo.sideLength);
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
	const fontSize = Math.min(collageInfo.sideLength * 1.3 / title.length, collageInfo.sideLength / 15);
	c.font = `${fontSize}pt sans-serif`;
	c.fillStyle = 'white';
	const textX = i * collageInfo.sideLength + collageInfo.sideLength / 2;
	let textY;
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
		let canvasImg = new Image(collageInfo.sideLength * collageInfo.cols, collageInfo.sideLength * collageInfo.rows);
		canvasImg.src = canvas.toDataURL('image/png');
		canvasImg.classList.add('img-responsive');
		canvasImg.crossOrigin = 'Anonymous';
		canvasImg.style = 'margin: 10px auto;';
		canvasImg.id = 'canvasImg';
		$('#generated').append(canvasImg);
	}
}
