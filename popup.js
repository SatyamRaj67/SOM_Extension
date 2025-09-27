const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const songImg = document.getElementById("song-img");
const songTitle = document.getElementById("song-title");
const songArtist = document.getElementById("song-artist");
const timeline = document.getElementById("timeline");
const currentTimeEl = document.querySelector(".current-time");
const songLengthEl = document.querySelector(".song-length");

playPauseBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "play-pause" });
});

prevBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "prev" });
});

nextBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "next" });
});

timeline.addEventListener("input", () => {
  chrome.runtime.sendMessage({ action: "seek", time: timeline.value });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "update-ui") {
    const { song, isPlaying } = message;
    songImg.src = song.cover_img;
    songTitle.textContent = song.title;
    songArtist.textContent = song.artists.join(", ");
    playPauseBtn.checked = isPlaying;

    document.documentElement.style.setProperty("--accent", song.accent_color);
  } else if (message.action === "update-time") {
    const { currentTime, duration } = message;

    timeline.max = duration;
    timeline.value = currentTime;

    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60)
        .toString()
        .padStart(2, "0");
      return `${minutes}:${seconds}`;
    };

    currentTimeEl.textContent = formatTime(currentTime);
    songLengthEl.textContent = formatTime(duration);
  }
});

// Request initial state when popup opens
chrome.runtime.sendMessage({ action: "get-state" });

// RANDOM SHIT
document.addEventListener("DOMContentLoaded", () => {
  const toggleViewBtn = document.getElementById("toggle-view-btn");
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener("click", () => {
      document.body.classList.toggle("active");
    });
  }
});
