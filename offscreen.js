const audioPlayer = document.getElementById('audio-player');

audioPlayer.addEventListener('ended', () => {
  chrome.runtime.sendMessage({ action: 'song-ended' });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'play-pause') {
    if (message.isPlaying) {
      if (audioPlayer.src !== chrome.runtime.getURL(message.song)) {
        audioPlayer.src = chrome.runtime.getURL(message.song);
      }
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  } else if (message.action === 'play') {
    audioPlayer.src = chrome.runtime.getURL(message.song);
    audioPlayer.play();
  }
});