/* globals downloads */
'use strict';

downloads['built-in'] = {};
downloads['built-in'].executable = {
  Mac: '',
  Win: '',
  Lin: '',
};
downloads['built-in'].download = objs => {
  const download = obj => new Promise(resolve => chrome.downloads.download({
    url: obj.url,
    filename: obj.filename
  }, resolve));
  return Promise.all(objs.map(download));
};
