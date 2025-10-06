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
    case "load":
      // Load a new song if the source is different
      if (message.song && audioPlayer.src !== message.song) {
        audioPlayer.src = message.song;
        audioPlayer.load(); // Explicitly load the new source
      }
      break;

    case "play":
      // Play the currently loaded song
      audioPlayer.play();
      break;

    case "play-pause":
      // Toggle play/pause based on the state from background.js
      if (message.isPlaying) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
      break;

    case "seek":
      audioPlayer.currentTime = message.time;
      break;

    case "set-volume":
      audioPlayer.volume = message.volume;
      break;
  }
});
