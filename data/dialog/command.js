/* globals downloads, locale, filesize */
'use strict';

// notify
const notify = e => {
  const msg = e.message || e;
  if (msg) {
    const n = document.getElementById('notify');
    window.clearTimeout(notify.id);
    n.textContent = msg;
    notify.id = window.setTimeout(() => n.textContent = '', 4000);
  }
};

const utils = {};
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

    const next = () => downloads[downloader.value]
      .download(objs, command.value, quotes.checked)
      .then(downloads.enable).catch(e => {
        notify(e);
        console.error(e);
        downloads.guide();
        downloads.enable();
      });

    const permissions = [];
    if (downloader.value === 'idm' || downloader.value === 'wget') {
      permissions.push('nativeMessaging');
    }
    if (downloader.value === 'wget') {
      permissions.push('cookies');
    }
    if (permissions.length) {
      chrome.permissions.request({
        permissions
      }, granted => {
        if (granted) {
          if (chrome.runtime.sendNativeMessage) {
            next();
          }
          else if (confirm('Restart is needed. Proceed?')) {
            location.reload();
          }
        }
        else {
          downloader.value = 'built-in';
          downloader.dispatchEvent(new Event('change'));
          downloads.enable();
          notify('Try with the built-in download manager');
        }
      });
    }
    else {
      next();
    }
  }
  else if (cmd === 'copy') {
    const links = utils.trs().map(tr => tr.querySelector('[data-id=url]').textContent).join('\n');
    navigator.clipboard.writeText(links).then(() => {
      notify(locale.get('dialogCopied'));
    }).catch(e => notify(e.message));
  }
  else if (cmd === 'size') {
    target.disabled = true;
    Promise.all(utils.trs(false).map(tr => {
      const size = tr.querySelector('[data-id=size]');
      if (size.textContent === '--') {
        size.textContent = '...';
        const link = tr.querySelector('[data-id=url]');
        return filesize.calculate(link.textContent).then(s => {
          size.textContent = s;
        });
      }
    })).then(() => target.disabled = false);
  }
  else if (cmd === 'rename') {
    const pattern = document.getElementById('pattern').value || 'name-[#].[ext]';
    [...document.querySelectorAll('input:checked')]
      .map(i => i.closest('tr').querySelector('input[type=text]'))
      .forEach((i, index) => {
        const re = /#=(\d+)/.exec(pattern);
        const offset = re && re.length ? Number(re[1]) : 1;
        const n = ('000' + (index + offset)).substr(-3);
        const ext = i.value.split('.').pop();
        i.value = pattern
          .replace('[ext]', ext)
          .replace(/\[#=*\d*\]/, n);
      });
  }
});

document.getElementById('remote').addEventListener('click', e => {
  const id = e.target.dataset.id;
  if (id) {
    chrome.tabs.create({
      url: `https://webbrowsertools.com/${id}/`
    });
  }
});
