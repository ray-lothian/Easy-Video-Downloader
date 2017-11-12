/* globals locale */
'use strict';

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
    const info = document.getElementById('info');
    info.textContent = locale.get('optionsSaved');
    window.setTimeout(() => info.textContent = '', 750);
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
