/* globals downloads, locale, filesize */
'use strict';

// notify
var notify = (e = {}) => chrome.notifications.create(null, {
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: locale.get('name'),
  message: e.message || e,
});

var utils = {};
utils.trs = (selected = true) => [
  ...document.querySelectorAll('#list input[type=checkbox]' + (selected ? ':checked' : ''))
].map(i => i.closest('tr'));
utils.inputs = id => [...document.querySelectorAll(`tbody[data-id="${id}"] input[type=checkbox]`)];

// okay and copy
{
  const ok = document.querySelector('[data-cmd=download]');
  const copy = document.querySelector('[data-cmd=copy]');
  const test = document.querySelector('[data-cmd=test]');
  const warning = document.getElementById('warning');
  const command = document.getElementById('command');
  document.addEventListener('change', () => {
    const len = utils.trs().length;
    copy.disabled = ok.disabled = len === 0;
    warning.dataset.visible = len > 10;
    test.disabled = len === 0 || command.value === '';
  });
}
// select
document.addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;
  if (cmd === 'select-all' || cmd === 'select-none') {
    const id = target.closest('thead').dataset.id;

    utils.inputs(id).forEach(input => {
      input.checked = cmd === 'select-all';
      input.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    });
  }
  else if (cmd === 'test') {
    const quotes = document.getElementById('quotes');
    const command = document.getElementById('command');
    const tr = document.querySelector('#list input[type=checkbox]:checked').closest('tr');

    const [executable, ...argv] = downloads.parse(command.value, {
      filename: tr.querySelector('[data-id=name]').value,
      url: tr.querySelector('[data-id=url]').textContent
    }, quotes.checked);
    window.alert(`${executable}

${argv.join('\n')}`);
  }
  else if (cmd === 'download') {
    const objs = utils.trs().map(tr => ({
      filename: tr.querySelector('[data-id=name]').value,
      url: tr.querySelector('[data-id=url]').textContent
    }));
    const downloader = document.getElementById('downloader');
    const quotes = document.getElementById('quotes');
    const command = document.getElementById('command');
    downloads.disable();
    downloads[downloader.value].download(objs, command.value, quotes.checked).then(downloads.enable).catch(e => {
      notify(e);
      console.error(e);
      downloads.guide();
      downloads.enable();
    });
  }
  else if (cmd === 'copy') {
    const links = utils.trs().map(tr => tr.querySelector('[data-id=url]').textContent).join('\n');
    document.addEventListener('copy', function(e) {
      e.clipboardData.setData('text/plain', links);
      e.preventDefault();
    });
    if (document.execCommand('copy')) {
      notify(locale.get('dialogCopied'));
    }
    else {
      notify(locale.get('dialogCopyError'));
    }
  }
  else if (cmd === 'size') {
    target.disabled = true;
    Promise.all(utils.trs(false).map(tr => {
      const size = tr.querySelector('[data-id=size]');
      if (size.textContent === '--') {
        size.textContent = '...';
        const link = tr.querySelector('[data-id=url]');
        return filesize.calculate(link.textContent).then(s => size.textContent = s);
      }
    })).then(() => target.disabled = false);
  }
});
