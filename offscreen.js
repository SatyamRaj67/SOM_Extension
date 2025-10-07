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
  const songUrl = message.song;
  const isDataUrl = songUrl && songUrl.startsWith('data:');

  if (message.action === 'play-pause') {
    if (message.isPlaying) {
      const newSrc = isDataUrl ? songUrl : chrome.runtime.getURL(songUrl);
      if (audioPlayer.src !== newSrc) {
        audioPlayer.src = newSrc;
      }
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  } else if (message.action === 'play') {
    audioPlayer.src = isDataUrl ? songUrl : chrome.runtime.getURL(songUrl);
    audioPlayer.play();
  } else if (message.action === 'seek') {
    audioPlayer.currentTime = message.time;
  } else if (message.action === 'set-volume') {
    audioPlayer.volume = message.volume;
  } else if (message.action === 'stop') {
    audioPlayer.pause();
    audioPlayer.src = "";
  }
});