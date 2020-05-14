/* globals downloads */
'use strict';

downloads.idm = {};
downloads.idm.executable = {
  Mac: 'open -a "Internet Download Manager" "[HREF]"',
  Win: '"%ProgramFiles(x86)%\\Internet Download Manager\\IDMan.exe" /d "[HREF]"',
  Lin: 'idm -d "[URL]"'
};

downloads.idm.download = (dOBJs, str, quotes = false) => downloads.external().then(() => {
  const download = (d, str) => {
    // remove args that are not provided
    if (!d.referrer) {
      str = str.replace(/\s[^\s]*\[REFERRER\][^\s]*\s/, ' ');
    }
    if (!d.filename) {
      str = str.replace(/\s[^\s]*\[FILENAME\][^\s]*\s/, ' ');
    }
    str = str.replace(/\s[^\s]*\[COOKIES\][^\s]*\s/, ' ');
    return new Promise((resolve, reject) => {
      const [executable, ...argv] = downloads.parse(str, d, quotes);
      chrome.runtime.sendNativeMessage(downloads.id, {
        permissions: ['child_process'],
        args: [executable, ...argv],
        script: String.raw`
          const command = args[0].replace(/%([^%]+)%/g, (_, n) => env[n]);
          function execute() {
            const exe = require('child_process').spawn(command, args.slice(1), {
              detached: true,
              windowsVerbatimArguments: true
            });
            let stdout = '', stderr = '';
            exe.stdout.on('data', data => stdout += data);
            exe.stderr.on('data', data => stderr += data);

            exe.on('close', code => {
              push({code, stdout, stderr});
              done();
            });
          }
          execute();
        `
      }, r => {
        if (r.code === 0) {
          resolve();
        }
        else {
          reject(r.stderr);
        }
      });
    });
  };

  return Promise.all(dOBJs.map(o => download(o, str)));
});
