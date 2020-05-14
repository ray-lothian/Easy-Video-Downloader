/* globals downloads */
'use strict';

downloads['tdm'] = {};
downloads['tdm'].executable = {
  Mac: '',
  Win: '',
  Lin: ''
};
downloads['tdm'].download = objs => {
  let id = 'pabnknalmhfecdheflmcaehlepmhjlaa';
  let link = 'https://chrome.google.com/webstore/detail/pabnknalmhfecdheflmcaehlepmhjlaa';
  if (navigator.userAgent.indexOf('Firefox') !== -1) {
    id = 'jid0-dsq67mf5kjjhiiju2dfb6kk8dfw@jetpack';
    link = 'https://addons.mozilla.org/firefox/addon/turbo-download-manager/';
  }
  else if (navigator.userAgent.indexOf('OPR') !== -1) {
    id = 'lejgoophpfnabjcnfbphcndcjfpinbfk';
    link = 'https://addons.opera.com/extensions/details/turbo-download-manager/';
  }
  else if (navigator.userAgent.indexOf('Edg/') !== -1) {
    id = 'mkgpbehnmcnadhklbcigfbehjfnpdblf';
    link = 'https://microsoftedge.microsoft.com/addons/detail/mkgpbehnmcnadhklbcigfbehjfnpdblf';
  }
  chrome.runtime.sendMessage(id, {
    method: 'add-jobs',
    jobs: objs.map(o => ({
      link: o.url,
      filename: o.filename,
      threads: 3
    }))
  }, resp => {
    if (!resp) {
      chrome.tabs.create({
        url: link
      });
    }
  });
  return Promise.resolve();
};
