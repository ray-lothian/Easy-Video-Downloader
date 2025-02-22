/* globals Parser, args */
'use strict';

const downloads = {
  id: 'com.add0n.node'
};

downloads.cookies = (url = args.get('referrer')) => {
  if (!url || !chrome.cookies) {
    return Promise.resolve('');
  }
  return new Promise(resolve => chrome.storage.local.get({
    cookies: false
  }, prefs => prefs.cookies ? chrome.cookies.getAll({
    url
  }, arr => resolve(arr.map(o => o.name + '=' + o.value).join('; '))) : resolve('')));
};

downloads.parse = (str, {url, filename}, quotes = false) => {
  filename = filename || ' ';
  url = new URL(url);
  const termref = {
    lineBuffer: str.replace(/\[HREF\]/g, url.href)
      .replace(/\[HOSTNAME\]/g, url.hostname)
      .replace(/\[PATHNAME\]/g, url.pathname)
      .replace(/\[HASH\]/g, url.hash)
      .replace(/\[PROTOCOL\]/g, url.protocol)
      .replace(/\[FILENAME\]/g, filename)
      .replace(/\[REFERRER\]/g, args.get('referrer'))
      .replace(/\[USERAGENT\]/g, navigator.userAgent)
      .replace(/\[PROMPT\]/g, () => window.prompt('User input'))
      .replace(/\\/g, '\\\\')
  };
  const parser = new Parser();
  parser.parseLine(termref);

  if (quotes) {
    termref.argv = termref.argv.map((a, i) => {
      if (termref.argQL[i]) {
        return termref.argQL[i] + a + termref.argQL[i];
      }
      return a;
    });
  }

  return termref.argv;
};

{
  const ok = document.querySelector('[data-cmd=download]');
  downloads.disable = () => ok.disabled = true;
  downloads.enable = () => ok.disabled = false;
}

downloads.external = () => new Promise((resolve, reject) => chrome.runtime.sendNativeMessage(downloads.id, {
  cmd: 'version'
}, r => {
  if (r) {
    resolve();
  }
  else {
    reject(Error('Native client is not present. Cannot communicate with operating system.'));
  }
}));

downloads.guide = () => {
  const opt = {
    url: '/data/helper/index.html'
  };
  if (args.has('windowId')) {
    opt.windowId = Number(args.get('windowId'));
  }
  chrome.tabs.create(opt);
};
