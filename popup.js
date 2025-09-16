const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const songTitle = document.getElementById('song-title');

function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

playPauseBtn.addEventListener('click', () => {
  sendMessage({ action: 'play-pause' });
});

prevBtn.addEventListener('click', () => {
  sendMessage({ action: 'prev' });
});

nextBtn.addEventListener('click', () => {
  sendMessage({ action: 'next' });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'update-ui') {
    songTitle.textContent = message.song;
    playPauseBtn.textContent = message.isPlaying ? 'Pause' : 'Play';
  }
});

// Request initial state when popup opens
sendMessage({ action: 'get-state' });
