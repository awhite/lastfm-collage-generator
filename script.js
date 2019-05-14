let canvas, c;
let downloaded = 0;
const collageInfo = {};
const METHOD_ALBUMS = 1;
const METHOD_ARTISTS = 2;

const TIMEFRAME_TOO_SMALL = 4;
const TIMEFRAME_TOO_SMALL_SPARSE = 3;
const PERFECT = 2;
const RETRY = 1;

$(() => {
  $('#copyright')
    .css('display', 'block')
    .html(`Copyright &copy; Alex White  ${new Date().getFullYear()}`);
  $('#form').submit(e => {
    e.preventDefault();
    localStorage.username = $('#username')
      .val()
      .trim();
    localStorage.period = $('#period')
      .find(':selected')
      .val();
    localStorage.rows = $('#rows')
      .find(':selected')
      .val();
    localStorage.cols = $('#cols')
      .find(':selected')
      .val();
    localStorage.size = $('#size')
      .find(':selected')
      .val();
    localStorage.method = $('#method')
      .find(':selected')
      .val();
    localStorage.showName = $('#showName').is(':checked');
    localStorage.hideMissingArtwork = $('#hideMissing').is(':checked');
    submit();
  });
  $('#method').change(e => {
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
    $(`#${id}`).val(localStorage[id]);
  }
}

function setOverlayLabel() {
  if (
    parseInt(
      $('#method')
        .find(':selected')
        .val()
    ) === METHOD_ALBUMS
  ) {
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
  const username = localStorage.username;
  const period = localStorage.period;
  const API_KEY = 'b7cad0612089bbbfecfc08acc52087f1';
  const limit = collageInfo.rows * collageInfo.cols;
  let currentLimit = limit;

  const setUrlFromLimit = () => {
    switch (collageInfo.method) {
      case METHOD_ALBUMS:
        collageInfo.url = `//ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&period=${period}&api_key=${API_KEY}&limit=${currentLimit}&format=json`;
        break;
      case METHOD_ARTISTS:
        collageInfo.url = `//ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&period=${period}&api_key=${API_KEY}&limit=${currentLimit}&format=json`;
        break;
    }
  };

  const callApi = () => {
    setUrlFromLimit();
    axios
      .get(collageInfo.url)
      .then(({ data }) => {
        console.log(data);
        if (collageInfo.hideMissingArtwork) {
          const artworkStatus = verifyEnoughArtwork(data);
          if (artworkStatus.retryCode !== RETRY) {
            const { links, titles } = artworkStatus;
            makeCollage(links, titles);
          } else {
            console.log(
              `Missing ${artworkStatus.missing} images. Retrying with increased limit...`
            );
            currentLimit += artworkStatus.missing;
            callApi();
          }
        } else {
          const links =
            collageInfo.method === METHOD_ALBUMS
              ? data.topalbums.album.map(({ image }) => image[collageInfo.size]['#text'])
              : data.topartists.artist.map(({ image }) => image[collageInfo.size]['#text']);
          const titles =
            collageInfo.method === METHOD_ALBUMS
              ? data.topalbums.album.map(({ artist, name }) => `${artist.name} – ${name}`)
              : data.topartists.artist.map(({ name }) => name);
          makeCollage(links, titles);
        }
      })
      .catch(error => {
        console.log(error);
        alert('There was an error');
      });
  };
  // End Last.fm specific

  const verifyEnoughArtwork = data => {
    const artworkStatus = {};
    const allLinksAndTitles = [];

    if (collageInfo.method === METHOD_ALBUMS) {
      for (let i = 0; i < data.topalbums.album.length; i++) {
        allLinksAndTitles[i] = {
          link: data.topalbums.album[i].image[collageInfo.size]['#text'],
          title: `${data.topalbums.album[i].artist.name} – ${data.topalbums.album[i].name}`
        };
      }
    } else {
      for (let i = 0; i < data.topartists.artist.length; i++) {
        allLinksAndTitles[i] = {
          link: data.topartists.artist[i].image[collageInfo.size]['#text'],
          title: data.topartists.artist[i].name
        };
      }
    }

    const validLinksAndTitles = allLinksAndTitles.filter(({ link }) => link && link.length > 0);
    const missingLinksAndTitles = allLinksAndTitles.filter(
      ({ link }) => !(link && link.length > 0)
    );
    console.log('missing', missingLinksAndTitles.length);
    console.log('valid', validLinksAndTitles.length);

    artworkStatus.links = validLinksAndTitles.map(({ link }) => link);
    artworkStatus.titles = validLinksAndTitles.map(({ title }) => title);

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
      } else {
        // retry
        artworkStatus.retryCode = RETRY;
      }
    }
    return artworkStatus;
  };

  callApi();
}

function makeCollage(links, titles) {
  for (let i = 0, k = 0; i < collageInfo.rows; i++) {
    for (let j = 0; j < collageInfo.cols; j++, k++) {
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
    let img = new Image(collageInfo.sideLength, collageInfo.sideLength);
    img.crossOrigin = 'Anonymous';
    img.classList.add('img-responsive');
    img.onload = function() {
      c.drawImage(img, i * collageInfo.sideLength, j * collageInfo.sideLength);
      if (showName && title && title.length > 0) {
        printName(i, j, title, true);
      }
      registerDownloaded();
    };
    img.src = link;
  }
}

function printName(i, j, title, overlay = false) {
  c.textAlign = 'center';
  const fontSize = Math.min(
    (collageInfo.sideLength * 1.3) / title.length,
    collageInfo.sideLength / 15
  );
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
    let canvasImg = new Image(
      collageInfo.sideLength * collageInfo.cols,
      collageInfo.sideLength * collageInfo.rows
    );
    canvasImg.src = canvas.toDataURL('image/png');
    canvasImg.classList.add('img-responsive');
    canvasImg.crossOrigin = 'Anonymous';
    canvasImg.style = 'margin: 10px auto;';
    canvasImg.id = 'canvasImg';
    $('#generated').append(canvasImg);
  }
}
