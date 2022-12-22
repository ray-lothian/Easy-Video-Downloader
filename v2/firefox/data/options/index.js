/* globals locale */
'use strict';

const toast = document.getElementById('toast');

chrome.storage.local.get({
  cookies: false,
  badge: true,
  badgeColor: '#6e6e6e'
}, prefs => {
  document.getElementById('cookies').checked = prefs.cookies;
  document.getElementById('badge').checked = prefs.badge;
  document.getElementById('badgeColor').value = prefs.badgeColor;
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    cookies: document.getElementById('cookies').checked,
    badge: document.getElementById('badge').checked,
    badgeColor: document.getElementById('badgeColor').value
  }, () => {
    toast.textContent = locale.get('optionsSaved');
    window.setTimeout(() => toast.textContent = '', 750);
  });

  chrome.browserAction.setBadgeBackgroundColor({
    color: document.getElementById('badgeColor').value
  });
  if (document.getElementById('badge').checked === false) {
    chrome.tabs.query({
      url: '*://*/*'
    }, tabs => tabs.forEach(tab => chrome.browserAction.setBadgeText({
      tabId: tab.id,
      text: ''
    })));
  }
});

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    window.setTimeout(() => toast.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));
