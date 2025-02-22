{
  const push = async (type, d) => {
    const prefs = await chrome.storage.local.get({
      image: false,
      video: true,
      audio: true
    });

    if (prefs[type] === false) {
      return;
    }
    const tabId = d.tabId;
    const r = await chrome.scripting.executeScript({
      target: {
        tabId
      },
      func: (type, d) => {
        self[type] = self[type] || {};

        const exists = d.url in self[type];

        self[type][d.url] = {
          timestamp: Date.now(),
          type,
          responseHeaders: (d.responseHeaders || [])
            .filter(o => ['content-type', 'content-length', 'content-disposition'].includes(o.name))
        };
        // delete old entries
        const keys = Object.keys(self[type]);
        if (keys.length > 500) {
          keys.sort((a, b) => self[type][b].timestamp - self[type][a].timestamp);

          for (const key of keys.slice(500)) {
            delete self[type][key];
          }
        }

        return {
          exists,
          image: self.image,
          video: self.video,
          audio: self.audio
        };
      },
      args: [type, d]
    }).catch(() => {});

    if (r && r.length) {
      const [{result}] = r;

      if (result.exists === false) {
        toolbar.run({
          tabId,
          images: Object.keys(result?.image || {}).length,
          videos: Object.keys(result?.video || {}).length,
          audios: Object.keys(result?.audio || {}).length
        });
      }
    }
  };

  const onHeadersReceived = d => {
    const {type, responseHeaders, tabId} = d;

    if (tabId < 0) {
      return;
    }
    if (type === 'image') {
      push('image', d);
    }
    else {
      // prevent YouTube video link detection!
      if (d.url.includes('googlevideo.')) {
        return;
      }

      const contentType = responseHeaders
        .filter(o => o.name === 'content-type' || o.name === 'Content-Type')
        .map(o => o.value).shift() || '';
      // console.log(type, contentType, d)
      if (
        contentType.startsWith('text/') ||
        contentType.startsWith('application/json')
      ) {
        return;
      }

      if (
        contentType.startsWith('image/') ||
        ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg'].some(a => d.url.includes(a))
      ) {
        push('image', d);
      }
      if (
        contentType.startsWith('audio/') ||
        ['application/vnd.apple.mpegurl', 'application/x-mpegURL'].includes(contentType) ||
        ['.pcm', '.wav', '.mp3', '.aac', '.ogg', '.wma', '.m3u8', '.mpd'].some(a => d.url.includes(a))
      ) {
        push('audio', d);
        if (type === 'media') {
          return;
        }
      }
      if (
        contentType.startsWith('video/') ||
        ['.flv', '.avi', '.wmv', '.mov', '.mp4', '.webm', '.mkv'].some(a => d.url.includes(a))
      ) {
        push('video', d);
        if (type === 'media') {
          return;
        }
      }
    }
  };

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'clear-list') {
      chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        func: () => {
          delete self.image;
          delete self.video;
          delete self.audio;
        }
      });

      toolbar.run({
        tabId: tab.id,
        images: 0,
        videos: 0,
        audios: 0
      });
    }
  });

  const observe = {
    install: async () => {
      const prefs = await chrome.storage.local.get({
        image: false,
        video: true,
        audio: true
      });

      observe.remove();

      let types = [];
      if (prefs.image) {
        types.push('image', 'xmlhttprequest', 'other');
      }
      if (prefs.video || prefs.audio) {
        types.push('media', 'xmlhttprequest', 'other');
      }

      types = types.filter((s, i, l) => {
        return l.indexOf(s) === i;
      });

      if (types.length) {
        chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {
          urls: ['*://*/*'],
          types
        }, ['responseHeaders']);
      }
    },
    remove: () => {
      chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
    }
  };

  chrome.storage.onChanged.addListener((ps, type) => {
    if (type === 'session') {
      return;
    }
    if (ps.image || ps.audio || ps.video) {
      observe.install();
    }
  });
  observe.install();
}
