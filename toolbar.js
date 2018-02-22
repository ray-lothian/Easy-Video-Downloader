/* globals app, prefs */
'use strict';

{
  const name = chrome.i18n.getMessage('name');

  app.on('toolbar', ({tabId, images, videos, audios}) => {
    const count = images + videos + audios;
    if (prefs.badge) {
      chrome.browserAction.setBadgeText({
        tabId,
        text: String(count || '')
      });
    }
    // console.log('updating badge', tabId, images, videos, audios);
    chrome.browserAction.setTitle({
      title: `${name}

images: ${images}
videos: ${videos}
audios: ${audios}`
    });
  });
  const icon = enabled => chrome.browserAction.setIcon({
    path: {
      '16': 'data/icons/' + (enabled ? '' : 'disabled/') + '16.png',
      '32': 'data/icons/' + (enabled ? '' : 'disabled/') + '32.png',
      '48': 'data/icons/' + (enabled ? '' : 'disabled/') + '48.png',
      '64': 'data/icons/' + (enabled ? '' : 'disabled/') + '64.png'
    }
  });

  app.on('ready', prefs => {
    if (prefs.enabled) {
      icon(true);
    }
    chrome.browserAction.setBadgeBackgroundColor({
      color: prefs.badgeColor
    });
  });
  app.on('prefs.enabled', icon);
}

app.on('ready', prefs => {
  chrome.contextMenus.create({
    id: 'toggle-interrupt',
    contexts: ['browser_action'],
    title: chrome.i18n.getMessage('contextIntrrupt'),
    type: 'checkbox',
    checked: prefs.enabled
  });
  chrome.contextMenus.create({
    id: 'toggle-video',
    contexts: ['browser_action'],
    title: chrome.i18n.getMessage('contextVideos'),
    type: 'checkbox',
    checked: prefs.video
  });
  chrome.contextMenus.create({
    id: 'toggle-audio',
    contexts: ['browser_action'],
    title: chrome.i18n.getMessage('contextAudios'),
    type: 'checkbox',
    checked: prefs.audio
  });
  chrome.contextMenus.create({
    id: 'toggle-image',
    contexts: ['browser_action'],
    title: chrome.i18n.getMessage('contextImages'),
    type: 'checkbox',
    checked: prefs.image
  });
  chrome.contextMenus.create({
    id: 'clear-list',
    contexts: ['browser_action'],
    title: chrome.i18n.getMessage('contextClear')
  });
  chrome.contextMenus.create({
    id: 'download-link',
    contexts: ['link'],
    title: chrome.i18n.getMessage('contextLinks')
  });
  chrome.contextMenus.create({
    id: 'download-media',
    contexts: ['video', 'image'],
    title: chrome.i18n.getMessage('contextMedias')
  });
});
app.on('prefs.enabled', checked => chrome.contextMenus.update('toggle-interrupt', {
  checked
}));
app.on('prefs.image', checked => chrome.contextMenus.update('toggle-image', {
  checked
}));
app.on('prefs.audio', checked => chrome.contextMenus.update('toggle-audio', {
  checked
}));
app.on('prefs.video', checked => chrome.contextMenus.update('toggle-video', {
  checked
}));

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'download-link') {
    app.emit('command', {
      tab,
      download: info.linkUrl,
      instance: true
    });
  }
  else if (info.menuItemId === 'download-media') {
    app.emit('command', {
      tab,
      download: info.srcUrl,
      instance: true
    });
  }
  else {
    const map = {
      'toggle-image': 'image',
      'toggle-video': 'video',
      'toggle-audio': 'audio',
      'toggle-interrupt': 'enabled'
    };
    const key = map[info.menuItemId];
    chrome.storage.local.set({
      [key]: !prefs[key]
    });
  }
});
chrome.browserAction.onClicked.addListener(tab => app.emit('command', {tab}));
