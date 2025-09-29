// =========================
// ===       VISUALIZER & UI LOGIC          ===
// =========================
document.addEventListener("DOMContentLoaded", () => {
  // --- Visualizer Setup ---
  const canvas = document.getElementById("visualizer-canvas");
  const ctx = canvas.getContext("2d");
  let bars = [];
  let isVisualizerAnimating = false;
  let animationFrameId;

  const config = {
    barWidth: 5,
    gap: 5,
    minHeight: 2,
    maxHeight: 20,
    color: "#fff",
  };

  class Bar {
    constructor(x, y, width, height, isVertical = false) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.isVertical = isVertical;
      this.currentSize = config.minHeight;
      this.targetSize = this.currentSize;
      this.speed = Math.random() * 1.5 + 0.5;
    }

    update() {
      // If animating, set a new random target. If not, target minimum height.
      if (isVisualizerAnimating) {
        if (Math.abs(this.targetSize - this.currentSize) < 1) {
          this.targetSize =
            Math.random() * (config.maxHeight - config.minHeight) +
            config.minHeight;
        }
      } else {
        this.targetSize = config.minHeight;
      }
      this.currentSize +=
        (this.targetSize - this.currentSize) * 0.1 * this.speed;
    }

    draw() {
      ctx.fillStyle = config.color;
      if (this.isVertical) {
        ctx.fillRect(this.x, this.y, this.currentSize, this.height);
      } else {
        ctx.fillRect(this.x, this.y, this.width, this.currentSize);
      }
    }
  }

  function initVisualizer() {
    canvas.width = 320; // Match body width
    canvas.height = 500; // Match total height
    bars = [];
    const totalBarSpace = config.barWidth + config.gap;

    for (let i = 0; i < canvas.height; i += totalBarSpace) {
      bars.push(new Bar(0, i, 0, config.barWidth, true));
    }

    for (let i = 0; i < canvas.height; i += totalBarSpace) {
      const bar = new Bar(0, i, 0, config.barWidth, true);
      bar.draw = function () {
        ctx.fillStyle = config.color;
        ctx.fillRect(
          canvas.width - this.currentSize,
          this.y,
          this.currentSize,
          this.height
        );
      };
      bars.push(bar);
    }
  }

  function animateVisualizer() {
    let allBarsAtMin = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bars.forEach((bar) => {
      bar.update();
      bar.draw();
      if (Math.ceil(bar.currentSize) > config.minHeight) {
        allBarsAtMin = false;
      }
    });

    // Continue animating if the visualizer is active or if bars haven't settled.
    if (isVisualizerAnimating || !allBarsAtMin) {
      animationFrameId = requestAnimationFrame(animateVisualizer);
    }
  }

  function startVisualizer() {
    if (isVisualizerAnimating) return;
    isVisualizerAnimating = true;
    // Cancel any previous frame to avoid multiple loops
    cancelAnimationFrame(animationFrameId);
    animateVisualizer();
  }

  function stopVisualizer() {
    isVisualizerAnimating = false;
    // The animation loop will now see the flag is false and animate bars to minHeight.
  }

  initVisualizer();
  window.addEventListener("resize", initVisualizer);

  // --- UI Logic ---
  const aboutViewBtn = document.getElementById("about-view-btn");
  const playerTabBtn = document.getElementById("player-tab-btn");
  const playlistTabBtn = document.getElementById("playlist-tab-btn");
  const wrapper = document.querySelector(".wrapper");
  const navButtons = document.querySelectorAll(".navbar button");

  const handleTabClick = (transform, clickedBtn) => {
    wrapper.style.transform = transform;
    navButtons.forEach((btn) => btn.classList.remove("current"));
    clickedBtn.classList.add("current");
  };

  if (playerTabBtn && playlistTabBtn && aboutViewBtn && wrapper) {
    playerTabBtn.addEventListener("click", () => {
      document.body.classList.remove("active");
      handleTabClick("translateX(0%)", playerTabBtn);
    });
    playlistTabBtn.addEventListener("click", () => {
      document.body.classList.add("active");
      handleTabClick("translateX(-33.33%)", playlistTabBtn);
    });
    aboutViewBtn.addEventListener("click", () => {
      document.body.classList.add("active");
      handleTabClick("translateX(-66.67%)", aboutViewBtn);
    });
    playerTabBtn.classList.add("current");
  }

  // --- Playlist Loading ---
  const playlistContainer = document.getElementById("playlist-container");
  if (playlistContainer) {
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        data.songs.forEach((song, index) => {
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
          songItem.addEventListener("click", () => {
            chrome.runtime.sendMessage({ action: "play-index", index: index });
          });
        });
      })
      .catch((error) => console.error("Error loading playlist:", error));
  }

  // --- Music Player Logic & Event Listeners ---
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
  const volumeBtn = document.getElementById("volume-btn");
  const volumeSlider = document.getElementById("volume-slider");
  const volumeControl = document.querySelector(".volume-control");

  volumeBtn.addEventListener("click", () => {
    volumeControl.classList.toggle("active");
  });

  volumeSlider.addEventListener("input", () => {
    chrome.runtime.sendMessage({ action: "set-volume", volume: volumeSlider.value });
  });

  volumeSlider.addEventListener("change", () => {
    volumeControl.classList.remove("active");
  });

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

      // Control visualizer based on playback state
      if (isPlaying) {
        startVisualizer();
      } else {
        stopVisualizer();
      }
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
    } else if (message.action === "update-volume") {
      volumeSlider.value = message.volume;
    }
  });

  // Request initial state when popup opens
  chrome.runtime.sendMessage({ action: "get-state" });
});
