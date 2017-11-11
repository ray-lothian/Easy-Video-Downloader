/* globals downloads */
'use strict';

downloads.wget = {};
downloads.wget.executable = {
  Mac: `/usr/bin/osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "cd ~/Desktop && wget --user-agent=\\"[USERAGENT]\\" --referer=\\"[REFERRER]\\" --continue --load-cookies=[COOKIES] \\"[HREF]\\""'`,
  Win: `cmd.exe /C 'start cmd.exe "/S /K ""%ProgramFiles(x86)%\\GnuWin32\\bin\\wget.exe" --user-agent="[USERAGENT]" --referer="[REFERRER]" --no-check-certificate --continue --load-cookies=[COOKIES] "[HREF]"""'`,
  Lin: `xterm -hold -e 'wget --user-agent="[USERAGENT]" --referer="[REFERRER]" --no-check-certificate --continue --load-cookies=[COOKIES] "[HREF]"'`,
};

downloads.wget.download = (dOBJs, str, quotes = false) => downloads.external().then(() => {
  const download = (d, str) => {
    return downloads.cookies().then(cookies => new Promise((resolve, reject) => {
      const [executable, ...argv] = downloads.parse(str, d, quotes);
      chrome.runtime.sendNativeMessage(downloads.id, {
        permissions: ['child_process', 'path', 'os', 'crypto', 'fs'],
        args: [cookies, executable, ...argv],
        script: String.raw`
          const cookies = args[0];
          const command = args[1].replace(/%([^%]+)%/g, (_, n) => env[n]);
          function execute() {
            const exe = require('child_process').spawn(command, args.slice(2), {
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

          if (cookies) {
            const filename = require('path').join(
              require('os').tmpdir(),
              'download-with-' + require('crypto').randomBytes(4).readUInt32LE(0) + ''
            );
            require('fs').writeFile(filename, cookies, e => {
              if (e) {
                push({code: 1, stderr: 'cannot create tmp file'});
                done();
              }
              else {
                args = args.map(s => s.replace(/\[COOKIES\]/g, filename));
                execute();
              }
            });
          }
          else {
            args = args.map(s => s.replace(/\[COOKIES\]/g, '.'));
            execute();
          }
        `
      }, r => {
        if (r.code === 0) {
          resolve();
        }
        else {
          reject(r.stderr);
        }
      });
    }));
  };

  return Promise.all(dOBJs.map(o => download(o, str)));
});
