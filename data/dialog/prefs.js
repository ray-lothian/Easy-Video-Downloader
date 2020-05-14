/* globals downloads */
'use strict';

{
  const prefs = {
    'built-in': '',
    'idm': '',
    'fdm': '',
    'wget': '',
    'quotes': false
  };
  const quotes = document.getElementById('quotes');

  chrome.storage.local.get(prefs, ps => {
    Object.assign(prefs, ps);
    quotes.checked = prefs.quotes;
  });

  const command = document.getElementById('command');
  const downloader = document.getElementById('downloader');
  downloader.addEventListener('change', ({target}) => {
    const os = navigator.platform.substr(0, 3);
    command.value = prefs[target.value] || downloads[target.value].executable[os];
    command.dispatchEvent(new Event('input', {
      bubbles: true
    }));
  });
  const save = document.querySelector('[data-cmd=save]');
  command.addEventListener('input', () => {
    save.disabled = command.value === '' ||
      command.value === prefs[downloader.value] ||
      downloader.value === 'built-in';
  });

  save.addEventListener('click', () => {
    prefs[downloader.value] = command.value;
    chrome.storage.local.set({
      [downloader.value]: command.value,
      quotes: quotes.checked
    });
  });
}
