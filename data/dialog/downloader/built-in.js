/* globals downloads */
'use strict';

downloads['built-in'] = {};
downloads['built-in'].executable = {
  Mac: '',
  Win: '',
  Lin: '',
};
downloads['built-in'].download = objs => {
  const download = obj => new Promise(resolve => {
    const opt = {
      url: obj.url,
    };
    if (obj.filename) {
      opt.filename = obj.filename;
    }
    chrome.downloads.download(opt, resolve);
  });
  return Promise.all(objs.map(download));
};
