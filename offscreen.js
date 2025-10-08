const audioPlayer = document.getElementById('audio-player');

audioPlayer.addEventListener('timeupdate', () => {
  chrome.runtime.sendMessage({
    action: 'update-time',
    currentTime: audioPlayer.currentTime,
    duration: audioPlayer.duration
  });
});

audioPlayer.addEventListener('ended', () => {
  chrome.runtime.sendMessage({ action: 'song-ended' });
});

chrome.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case 'play-pause': {
      const songUrl = message.song;
      if (!songUrl) return;
      const isDataUrl = songUrl.startsWith('data:');

      if (message.isPlaying) {
        const newSrc = isDataUrl ? songUrl : chrome.runtime.getURL(songUrl);
        if (audioPlayer.src !== newSrc) {
          audioPlayer.src = newSrc;
        }
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
      break;
    }
    case 'play': {
      const songUrl = message.song;
      if (!songUrl) return;
      const isDataUrl = songUrl.startsWith('data:');
      audioPlayer.src = isDataUrl ? songUrl : chrome.runtime.getURL(songUrl);
      audioPlayer.play();
      break;
    }
    case 'seek':
      audioPlayer.currentTime = message.time;
      break;
    case 'set-volume':
      audioPlayer.volume = message.volume;
      break;
    case 'stop':
      audioPlayer.pause();
      audioPlayer.src = "";
      break;
  }
});