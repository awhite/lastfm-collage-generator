'use strict';

var canvas = void 0,
    c = void 0;
var downloaded = 0;
var collageInfo = {};
var METHOD_ALBUMS = 1;
var METHOD_ARTISTS = 2;

var NOT_ENOUGH = 5;
var TIMEFRAME_TOO_SMALL = 4;
var TIMEFRAME_TOO_SMALL_SPARSE = 3;
var PERFECT = 2;
var RETRY = 1;

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
    localStorage.hideMissingArtwork = $('#hideMissing').is(':checked');
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
  $('#hideMissing').prop('checked', localStorage.hideMissingArtwork === 'true');
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

  getImageLinks();
}

function setCollageInfo() {
  collageInfo.showName = localStorage.showName === 'true';
  collageInfo.hideMissingArtwork = localStorage.hideMissingArtwork === 'true';
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
  // Last.fm specific
  var username = localStorage.username;
  var period = localStorage.period;
  var API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
  var limit = collageInfo.rows * collageInfo.cols;
  var currentLimit = limit;
  var lastTotal = 0;

  var setUrlFromLimit = function setUrlFromLimit() {
    switch (collageInfo.method) {
      case METHOD_ALBUMS:
        collageInfo.url = '//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + currentLimit + '&format=json';
        break;
      case METHOD_ARTISTS:
        collageInfo.url = '//ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=' + username + '&period=' + period + '&api_key=' + API_KEY + '&limit=' + currentLimit + '&format=json';
        break;
    }
  };

  var callApi = function callApi() {
    setUrlFromLimit();
    axios.get(collageInfo.url).then(function (_ref) {
      var data = _ref.data;

      console.log(data);
      if (collageInfo.hideMissingArtwork) {
        var artworkStatus = verifyEnoughArtwork(data);
        if (artworkStatus.retryCode !== RETRY) {
          var links = artworkStatus.links,
              titles = artworkStatus.titles;

          makeCollage(links, titles);
        } else {
          console.log('Missing ' + artworkStatus.missing + ' images. Retrying with increased limit...');
          currentLimit += artworkStatus.missing;
          callApi();
        }
      } else {
        var _links = collageInfo.method === METHOD_ALBUMS ? data.topalbums.album.map(function (_ref2) {
          var image = _ref2.image;
          return image[collageInfo.size]['#text'];
        }) : data.topartists.artist.map(function (_ref3) {
          var image = _ref3.image;
          return image[collageInfo.size]['#text'];
        });
        var _titles = collageInfo.method === METHOD_ALBUMS ? data.topalbums.album.map(function (_ref4) {
          var artist = _ref4.artist,
              name = _ref4.name;
          return artist.name + ' – ' + name;
        }) : data.topartists.artist.map(function (_ref5) {
          var name = _ref5.name;
          return name;
        });
        makeCollage(_links, _titles);
      }
    }).catch(function (error) {
      console.log(error);
      alert('There was an error');
    });
  };
  // End Last.fm specific

  var verifyEnoughArtwork = function verifyEnoughArtwork(data) {
    var artworkStatus = {};
    var allLinksAndTitles = [];

    if (collageInfo.method === METHOD_ALBUMS) {
      for (var i = 0; i < data.topalbums.album.length; i++) {
        allLinksAndTitles[i] = {
          link: data.topalbums.album[i].image[collageInfo.size]['#text'],
          title: data.topalbums.album[i].artist.name + ' – ' + data.topalbums.album[i].name
        };
      }
    } else {
      for (var _i = 0; _i < data.topartists.artist.length; _i++) {
        allLinksAndTitles[_i] = {
          link: data.topartists.artist[_i].image[collageInfo.size]['#text'],
          title: data.topartists.artist[_i].name
        };
      }
    }

    var validLinksAndTitles = allLinksAndTitles.filter(function (_ref6) {
      var link = _ref6.link;
      return link && link.length > 0;
    });
    var missingLinksAndTitles = allLinksAndTitles.filter(function (_ref7) {
      var link = _ref7.link;
      return !(link && link.length > 0);
    });
    console.log('missing', missingLinksAndTitles.length);
    console.log('valid', validLinksAndTitles.length);

    artworkStatus.links = validLinksAndTitles.map(function (_ref8) {
      var link = _ref8.link;
      return link;
    });
    artworkStatus.titles = validLinksAndTitles.map(function (_ref9) {
      var title = _ref9.title;
      return title;
    });

    artworkStatus.missing = allLinksAndTitles.length - validLinksAndTitles.length;
    if (allLinksAndTitles.length < limit) {
      // timeframe doesn't have enough entries
      if (artworkStatus.missing === 0) {
        // all entries have titles
        artworkStatus.retryCode = TIMEFRAME_TOO_SMALL;
      } else {
        // not all entries have titles
        artworkStatus.retryCode = TIMEFRAME_TOO_SMALL_SPARSE;
      }
    } else {
      if (validLinksAndTitles.length >= limit) {
        // perfect scenario
        artworkStatus.retryCode = PERFECT;
        // } else if (lastTotal === allLinksAndTitles) { // no more to get, should make the collage with what we have
        //   artworkStatus.retryCode = NOT_ENOUGH;
      } else {
        // retry
        artworkStatus.retryCode = RETRY;
      }
    }
    lastTotal = allLinksAndTitles.length;
    return artworkStatus;
  };

  callApi();
}

function makeCollage(links, titles) {
  for (var i = 0, k = 0; i < collageInfo.rows; i++) {
    for (var j = 0; j < collageInfo.cols; j++, k++) {
      if (!links[k] || links[k].length === 0) {
        if (!titles[k] || titles[k].length === 0) {
          // not enough images, we are settling for blank bottom corner
          registerDownloaded();
        } else {
          loadImage(null, j, i, titles[k], true);
        }
      } else {
        loadImage(links[k], j, i, titles[k], collageInfo.showName);
      }
    }
  }
}

function loadImage(link, i, j, title, showName) {
  console.log(link, i, j, title, showName);
  if (!link) {
    printName(i, j, title);
    registerDownloaded();
  } else {
    var img = new Image(collageInfo.sideLength, collageInfo.sideLength);
    img.crossOrigin = 'Anonymous';
    img.classList.add('img-responsive');
    img.onload = function () {
      c.drawImage(img, i * collageInfo.sideLength, j * collageInfo.sideLength);
      if (showName && title && title.length > 0) {
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
