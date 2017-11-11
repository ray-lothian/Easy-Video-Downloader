'use strict';

{
  const downloader = document.getElementById('downloader');
  const d = localStorage.getItem('downloader');
  if (d) {
    downloader.value = d;
    downloader.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  }
  downloader.addEventListener('change', () => localStorage.setItem('downloader', downloader.value));
}
