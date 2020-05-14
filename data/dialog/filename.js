'use strict';

const filename = {};
filename.guess = d => {
  let url = d.url;
  const disposition = (d.responseHeaders || [])
    .filter(o => o.name === 'content-disposition' || o.name === 'Content-Disposition')
    .map(o => o.value).shift();
  let name;
  if (disposition) {
    const tmp = /filename=([^;]*)/.exec(disposition);
    if (tmp && tmp.length) {
      name = tmp[1].replace(/["']$/, '').replace(/^["']/, '');
    }
  }
  if (!name) {
    url = url.replace(/\/$/, '');
    const tmp = /(title|filename)=([^&]+)/.exec(url);
    if (tmp && tmp.length) {
      name = tmp[2];
    }
    else {
      name = url.substring(url.lastIndexOf('/') + 1);
    }
    name = decodeURIComponent(name.split('?')[0].split('&')[0]) || 'unknown';
  }
  // extracting extension from file name
  const se = /\.\w{2,}$/.exec(name);
  if (se && se.length) {
    name = name.replace(se[0], '');
  }
  // removing exceptions
  name = name.trim().replace(/[\\/:*?"<>|]/g, '-').substring(0, 240);
  name = name || 'unknown';

  if (se && se.length) {
    return name + se[0];
  }
  return name;
};
