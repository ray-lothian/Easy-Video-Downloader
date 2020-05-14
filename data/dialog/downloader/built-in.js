/* globals downloads */
'use strict';

downloads['built-in'] = {};
downloads['built-in'].executable = {
  Mac: '',
  Win: '',
  Lin: ''
};
downloads['built-in'].download = objs => {
  const download = obj => new Promise(resolve => {
    const opt = {
      url: obj.url
    };
    if (obj.filename) {
      opt.filename = obj.filename;
    }
    chrome.downloads.download(opt, id => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        delete opt.filename;
        chrome.downloads.download(opt, resolve);
      }
      else {
        resolve(id);
      }
    });
  });
  return Promise.all(objs.map(download));
};
