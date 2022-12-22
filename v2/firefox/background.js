'use strict';

let win = {};
const app = {
  callbacks: {},
  blockedIds: []
};
app.on = (id, callback) => {
  app.callbacks[id] = app.callbacks[id] || [];
  app.callbacks[id].push(callback);
};
app.emit = (id, value) => (app.callbacks[id] || []).forEach(c => c(value));

const prefs = {
  enabled: false,
  image: false,
  video: true,
  audio: true,
  version: null,
  faqs: false,
  badge: true,
  badgeColor: '#6e6e6e'
};
document.addEventListener('DOMContentLoaded', () => chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  app.emit('ready', prefs);
}));

chrome.storage.onChanged.addListener(ps => {
  Object.keys(ps).forEach(k => {
    prefs[k] = ps[k].newValue;
    app.emit('prefs.' + k, prefs[k]);
  });
});

app.on('command', ({tab, download = '', responseHeaders = [], instance = false}) => {
  const url = chrome.extension.getURL(
    'data/dialog/index.html?id=' + tab.id +
    '&windowId=' + tab.windowId +
    '&title=' + encodeURIComponent(tab.title || '') +
    '&referrer=' + encodeURIComponent(tab.url || '') +
    '&url=' + encodeURIComponent(download) +
    '&headers=' + encodeURIComponent(JSON.stringify(responseHeaders))
  );
  function create() {
    const prefs = {
      'width': 650,
      'normal-height': 500,
      'compact-height': 300,
      'left': (screen.availLeft || 0) + Math.round((screen.availWidth - 650) / 2)
    };
    prefs.height = instance ? prefs['compact-height'] : prefs['normal-height'];
    prefs.top = (screen.availTop || 0) + Math.round((screen.availHeight - prefs.height) / 2);
    chrome.windows.create({
      url,
      width: prefs.width,
      height: prefs.height,
      left: Math.max(0, prefs.left),
      top: Math.max(prefs.top, 0),
      type: 'popup'
    }, w => {
      if (instance === false) {
        win = w;
      }
      app.blockedIds.push(w.tabs[0].id);
    });
  }
  if (win.id && instance === false) {
    chrome.windows.get(win.id, {
      populate: true
    }, w => {
      if (chrome.runtime.lastError || !w) {
        create();
      }
      else {
        chrome.windows.update(win.id, {
          focused: true
        });
        chrome.tabs.update(w.tabs[0].id, {
          url,
          active: true
        });
      }
    });
  }
  else {
    create();
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
