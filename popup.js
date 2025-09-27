// =========================
// ===      UI LOGIC       ===
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const favouritesViewBtn = document.getElementById("favourites-view-btn");
  const playerTabBtn = document.getElementById("player-tab-btn");
  const playlistTabBtn = document.getElementById("playlist-tab-btn");
  const wrapper = document.querySelector(".wrapper");
  const navButtons = document.querySelectorAll(".navbar button");

  const handleTabClick = (transform, clickedBtn) => {
    wrapper.style.transform = transform;
    navButtons.forEach((btn) => btn.classList.remove("current"));
    clickedBtn.classList.add("current");
  };

  if (playerTabBtn && playlistTabBtn && favouritesViewBtn && wrapper) {
    playerTabBtn.addEventListener("click", () => {
      document.body.classList.remove("active");
      handleTabClick("translateX(0%)", playerTabBtn);
    });
    playlistTabBtn.addEventListener("click", () => {
      document.body.classList.add("active");
      handleTabClick("translateX(-33.33%)", playlistTabBtn);
    });
    favouritesViewBtn.addEventListener("click", () => {
      document.body.classList.add("active");
      handleTabClick("translateX(-66.67%)", favouritesViewBtn);
    });

    // Set the initial active button
    playerTabBtn.classList.add("current");
  }

  // Load playlist from data.json
  const playlistContainer = document.getElementById("playlist-container");
  if (playlistContainer) {
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        data.songs.forEach((song) => {
          const songItem = document.createElement("div");
          songItem.classList.add("playlist-item");
          songItem.innerHTML = `
            <img src="${song.cover_img}" alt="${
            song.title
          }" class="playlist-item-img">
            <div class="playlist-item-info">
              <p class="playlist-item-title">${song.title}</p>
              <p class="playlist-item-artist">${song.artists.join(", ")}</p>
            </div>
          `;
          playlistContainer.appendChild(songItem);
        });
      })
      .catch((error) => console.error("Error loading playlist:", error));
  }
});

// =========================
// ===      MUSIC PLAYER LOGIC       ===
// =========================
const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const songImg = document.getElementById("song-img");
const controlsSongImg = document.getElementById("controls-song-img");
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
    controlsSongImg.src = song.cover_img;
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
