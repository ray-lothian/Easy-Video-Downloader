'use strict';

const app = {
  callbacks: {}
};
app.on = (id, callback) => {
  app.callbacks[id] = app.callbacks[id] || [];
  app.callbacks[id].push(callback);
};
app.emit = (id, value) => (app.callbacks[id] || []).forEach(c => c(value));

self.importScripts('action.js');
self.importScripts('observe.js');

chrome.storage.onChanged.addListener((ps, type) => {
  if (type === 'session') {
    return;
  }
  Object.keys(ps).forEach(k => {
    app.emit('prefs.' + k, ps[k].newValue);
  });
});

app.on('command', ({tab, download = '', responseHeaders = [], instance = false}) => {
  const url =
    '/data/dialog/index.html?id=' + tab.id +
    '&windowId=' + tab.windowId +
    '&title=' + encodeURIComponent(tab.title || '') +
    '&referrer=' + encodeURIComponent(tab.url || '') +
    '&url=' + encodeURIComponent(download) +
    '&headers=' + encodeURIComponent(JSON.stringify(responseHeaders));
  async function create() {
    const win = await chrome.windows.getCurrent();

    const prefs = {
      'width': 650,
      'normal-height': 500,
      'compact-height': 300,
      'left': (win.left || 0) + Math.round((win.width - 650) / 2)
    };
    prefs.height = instance ? prefs['compact-height'] : prefs['normal-height'];
    prefs.top = (win.top || 0) + Math.round((win.height - prefs.height) / 2);
    chrome.windows.create({
      url,
      width: prefs.width,
      height: prefs.height,
      left: Math.max(0, prefs.left),
      top: Math.max(prefs.top, 0),
      type: 'popup'
    });
  }
  chrome.runtime.sendMessage({
    method: 'exists',
    url
  }, r => {
    chrome.runtime.lastError;
    if (r !== true) {
      create();
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'focus') {
    chrome.windows.update(sender.tab.windowId, {
      focused: true
    });
    chrome.tabs.update(sender.tab.id, {
      url: request.url,
      active: true
    });
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
