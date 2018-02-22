/* globals locale, filename, filesize */
'use strict';

var args = window.location.search.substr(1).split('&').reduce((p, c) => {
  const [key, value] = c.split('=');
  p[key] = decodeURIComponent(value);
  return p;
}, {});
document.title = locale.get('dialogTitle') + ' "' + (args.title || '-') + '"';

var category = (() => {
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

var add = (t => (d, key) => {
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

if (args.url) {
  add({
    url: args.url,
    responseHeaders: JSON.parse(args.headers)
  }, 'applications');
  document.dispatchEvent(new Event('change'));
}
else {
  chrome.runtime.sendMessage({
    method: 'requests',
    tabId: args.id
  }, response => {
    ['images', 'audios', 'videos', 'applications']
    .filter(key => response[key])
    .forEach(key => {
      Object.keys(response[key]).forEach(name => {
        const d = response[key][name];
        add(d, key);
      });
    });
    document.dispatchEvent(new Event('change'));
  });
}
if (args.referrer) {
  add({
    url: args.referrer
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
    }
  });
}
