'use strict';

var win = {};
var app = {
  callbacks: {},
  blockedIds: []
};
app.on = (id, callback) => {
  app.callbacks[id] = app.callbacks[id] || [];
  app.callbacks[id].push(callback);
};
app.emit = (id, value) => (app.callbacks[id] || []).forEach(c => c(value));

var prefs = {
  enabled: false,
  image: false,
  video: true,
  audio: true,
  forbidenKeyword: [],
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
      'width': 600,
      'normal-height': 500,
      'compact-height': 300,
      'left': screen.availLeft + Math.round((screen.availWidth - 600) / 2),
    };
    prefs.height = instance ? prefs['compact-height'] : prefs['normal-height'];
    prefs.top = screen.availTop + Math.round((screen.availHeight - prefs.height) / 2);
    chrome.windows.create({
      url,
      width: prefs.width,
      height: prefs.height,
      left: prefs.left,
      top: prefs.top,
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

// FAQs & Feedback
app.on('ready', () => {
  const version = chrome.runtime.getManifest().version;
  const pversion = prefs.version;
  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/easy-video-downloader.html?version=' + version +
          '&type=' + (pversion ? ('upgrade&p=' + pversion) : 'install')
      });
    });
  }
});
{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}
