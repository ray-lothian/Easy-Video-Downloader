'use strict';

const filesize = {};
{
  function humanFileSize(bytes, si) {
    bytes = Number(bytes);
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }
    const units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] :
      ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  }
  filesize.guess = d => {
    const size = (d.responseHeaders || [])
      .filter(o => o.name === 'content-length' || o.name === 'Content-Length')
      .map(o => o.value).shift();
    return size ? humanFileSize(size) : '--';
  };
}

filesize.calculate = link => new Promise(resolve => {
  const req = new XMLHttpRequest();
  req.open('GET', link);
  req.onreadystatechange = () => {
    if (req.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
      const s = req.getResponseHeader('Content-Length');
      resolve(s && s !== '0' ? filesize.guess({
        responseHeaders: [{
          name: 'Content-Length',
          value: s
        }]
      }) : '--');
      req.abort();
    }
  };
  req.onerror = () => resolve('--');
  req.send();
});
