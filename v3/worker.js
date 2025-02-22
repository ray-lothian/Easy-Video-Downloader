'use strict';

if (typeof importScripts !== 'undefined') {
  self.importScripts('action.js');
  self.importScripts('observe.js');
}

const onCommand = async ({tab, download = '', responseHeaders = [], instance = false}) => {
  const args = new URLSearchParams();
  args.set('id', tab.id);
  args.set('windowId', tab.windowId);
  args.set('title', tab.title || '');
  args.set('referrer', tab.url || '');
  args.set('url', download);
  args.set('headers', JSON.stringify(responseHeaders));

  const url = '/data/dialog/index.html?' + args.toString();

  const r = await chrome.runtime.sendMessage({
    method: 'exists',
    url
  }).catch(() => '');

  if (r !== true) {
    const win = await chrome.windows.getCurrent();

    const prefs = {
      'width': 650,
      'normal-height': 500,
      'compact-height': 400,
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
};
chrome.action.onClicked.addListener(tab => onCommand({tab}));

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
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
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
