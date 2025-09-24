const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const songImg = document.getElementById('song-img');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');

playPauseBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'play-pause' });
});

prevBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'prev' });
});

nextBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'next' });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'update-ui') {
    const { song, isPlaying } = message;
    songImg.src = song.cover_img;
    songTitle.textContent = song.title;
    songArtist.textContent = song.artists.join(', ');
    playPauseBtn.checked = isPlaying;
  }
});

// Request initial state when popup opens
chrome.runtime.sendMessage({ action: 'get-state' });
