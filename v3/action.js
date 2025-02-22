/* global onCommand */

const toolbar = {};

toolbar.run = async ({tabId, images, videos, audios}) => {
  // console.log('updating badge', tabId, images, videos, audios);
  chrome.action.setTitle({
    tabId,
    title: `${chrome.i18n.getMessage('name')}

images: ${images}
videos: ${videos}
audios: ${audios}`
  });

  const count = images + videos + audios;

  const prefs = await chrome.storage.local.get({
    badge: true
  });
  if (prefs.badge) {
    chrome.action.setBadgeText({
      tabId,
      text: String(count || '')
    });
  }
};

{
  const once = async () => {
    if (once.done) {
      return;
    }
    once.done = true;

    const prefs = await chrome.storage.local.get({
      badgeColor: '#6e6e6e'
    });
    chrome.action.setBadgeBackgroundColor({
      color: prefs.badgeColor
    });
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

{
  const once = async () => {
    if (once.done) {
      return;
    }
    once.done = true;

    const prefs = await chrome.storage.local.get({
      image: false,
      video: true,
      audio: true
    });

    chrome.contextMenus.create({
      id: 'toggle-video',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextVideos'),
      type: 'checkbox',
      checked: prefs.video
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: 'toggle-audio',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextAudios'),
      type: 'checkbox',
      checked: prefs.audio
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: 'toggle-image',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextImages'),
      type: 'checkbox',
      checked: prefs.image
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: 'clear-list',
      contexts: ['action'],
      title: chrome.i18n.getMessage('contextClear')
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: 'download-link',
      contexts: ['link'],
      title: chrome.i18n.getMessage('contextLinks')
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: 'download-media',
      contexts: ['audio', 'video', 'image'],
      title: chrome.i18n.getMessage('contextMedias')
    }, () => chrome.runtime.lastError);
  };

  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

chrome.storage.onChanged.addListener((ps, type) => {
  if (type === 'session') {
    return;
  }
  if (ps.image) {
    chrome.contextMenus.update('toggle-image', {
      checked: ps.image.newValue
    });
  }
  if (ps.audio) {
    chrome.contextMenus.update('toggle-audio', {
      checked: ps.audio.newValue
    });
  }
  if (ps.video) {
    chrome.contextMenus.update('toggle-video', {
      checked: ps.video.newValue
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'download-link') {
    onCommand({
      tab,
      download: info.linkUrl,
      instance: true
    });
  }
  else if (info.menuItemId === 'download-media') {
    onCommand({
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
