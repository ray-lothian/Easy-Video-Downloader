/* global app */
'use strict';

{
  app.on('toolbar', ({tabId, images, videos, audios}) => {
    const count = images + videos + audios;

    chrome.storage.local.get({
      badge: true
    }, prefs => {
      if (prefs.badge) {
        chrome.action.setBadgeText({
          tabId,
          text: String(count || '')
        });
      }
    });
    // console.log('updating badge', tabId, images, videos, audios);
    chrome.action.setTitle({
      tabId,
      title: `${chrome.i18n.getMessage('name')}

images: ${images}
videos: ${videos}
audios: ${audios}`
    });
  });


  const once = () => chrome.storage.local.get({
    badgeColor: '#6e6e6e'
  }, prefs => chrome.action.setBadgeBackgroundColor({
    color: prefs.badgeColor
  }));
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

{
  const once = () => chrome.storage.local.get({
    image: false,
    video: true,
    audio: true
  }, prefs => {
    chrome.contextMenus.create({
      id: 'toggle-video',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextVideos'),
      type: 'checkbox',
      checked: prefs.video
    });
    chrome.contextMenus.create({
      id: 'toggle-audio',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextAudios'),
      type: 'checkbox',
      checked: prefs.audio
    });
    chrome.contextMenus.create({
      id: 'toggle-image',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextImages'),
      type: 'checkbox',
      checked: prefs.image
    });
    chrome.contextMenus.create({
      id: 'clear-list',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextClear')
    });
    chrome.contextMenus.create({
      id: 'download-link',
      contexts: ['link'],
      title: chrome.i18n.getMessage('contextLinks')
    });
    chrome.contextMenus.create({
      id: 'download-media',
      contexts: ['audio', 'video', 'image'],
      title: chrome.i18n.getMessage('contextMedias')
    });
  });
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

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
      'toggle-audio': 'audio'
    };
    const key = map[info.menuItemId];

    chrome.storage.local.get({
      image: false,
      video: true,
      audio: true
    }, prefs => chrome.storage.local.set({
      [key]: !prefs[key]
    }));
  }
});
chrome.action.onClicked.addListener(tab => app.emit('command', {tab}));
