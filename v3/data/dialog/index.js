/* global locale, filename, filesize */
'use strict';

const args = new URLSearchParams(location.search);

document.title = locale.get('dialogTitle') + ' "' + (args.get('title') || '-') + '"';

if (/Edg/.test(navigator.userAgent)) {
  document.getElementById('remote').style.display = 'none';
}

const category = (() => {
  let index = -1;
  const codes = ['#00008B', '#006400', '#696969', '#800080', '#800000', '#2F4F4F', '#4B0082', '#8B4513', '#191970'];
  const names = {};
  return n => {
    if (names[n] === undefined) {
      index += 1;
      names[n] = codes[index % 9];
    }
    return names[n];
  };
})();

const add = (t => (d, key) => {
  document.body.dataset[key] = true;
  const tbody = document.querySelector(`#list tbody[data-id="${key}"]`);
  const clone = document.importNode(t.content, true);
  const name = filename.guess(d);
  clone.querySelector('[data-id=name]').value = name;
  clone.querySelector('[data-id=category] span').style['background-color'] = category(name);
  clone.querySelector('[data-id=category]').dataset.category = name;
  clone.querySelector('[data-id=size]').textContent = filesize.guess(d);
  clone.querySelector('[data-id=url]').title = clone.querySelector('[data-id=url]').textContent = d.url;
  clone.querySelector('input[type=checkbox]').checked =
    key !== 'images' && key !== 'pages' && name.endsWith('.m3u8') === false;
  tbody.appendChild(clone);
})(document.querySelector('#list template'));

if (args.has('url') && args.get('url') !== '') {
  add({
    url: args.get('url'),
    responseHeaders: JSON.parse(args.get('headers'))
  }, 'applications');
  document.dispatchEvent(new Event('change'));
}
else {
  const tabId = Number(args.get('id'));

  chrome.scripting.executeScript({
    target: {
      tabId
    },
    func: () => ({
      image: self.image,
      video: self.video,
      audio: self.audio
    })
  }).then(r => {
    if (r && r.length) {
      const [{result}] = r;

      for (const type of ['image', 'audio', 'video', 'application']) {
        if (result[type]) {
          for (const [key, d] of Object.entries(result[type])) {
            d.url = key;
            add(d, type + 's');
          }
        }
      }
      document.dispatchEvent(new Event('change'));
    }
  });
}
if (args.has('referrer')) {
  add({
    url: args.get('referrer')
  }, 'pages');
}

// select item
{
  const list = document.getElementById('list');
  list.addEventListener('click', ({target}) => {
    const tr = target.closest('tr');
    const cmd = target.dataset.cmd;
    if (tr && cmd === undefined) {
      const input = tr.querySelector('input[type=checkbox]');
      if (input && input !== target) {
        input.checked = target.tagName === 'INPUT' ? true : !input.checked;
        input.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
    }
    else if (cmd === 'category') {
      const category = target.dataset.category;
      [...document.querySelectorAll('input:checked')].forEach(i => i.checked = false);
      [...document.querySelectorAll(`[data-category="${category}"]`)]
        .map(s => s.closest('tr').querySelector('input'))
        .forEach(i => i.checked = true);
      document.dispatchEvent(new Event('change'));
    }
  });
}

//
chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'exist') {
    response(true);
    chrome.runtime.sendMessage({
      method: 'focus',
      url: request.url
    });
  }
});
