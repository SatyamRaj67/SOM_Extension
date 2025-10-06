// =========================
// ===    VISUALIZER & UI LOGIC     ===
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
    minHeight: 0,
    maxHeight: 20,
    color: "#fff",
  };

  class Bar {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.currentSize = config.minHeight;
      this.targetSize = this.currentSize;
      this.speed = Math.random() * 1.5 + 0.5;
    }

    update() {
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
      ctx.fillRect(this.x, this.y, this.currentSize, this.height);
    }
  }

  function initVisualizer() {
    canvas.width = 320;
    canvas.height = 500;
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

    if (isVisualizerAnimating || !allBarsAtMin) {
      animationFrameId = requestAnimationFrame(animateVisualizer);
    }
  }

  function startVisualizer() {
    if (isVisualizerAnimating) return;
    isVisualizerAnimating = true;
    cancelAnimationFrame(animationFrameId);
    animateVisualizer();
  }

  function stopVisualizer() {
    isVisualizerAnimating = false;
  }

  initVisualizer();

  window.addEventListener("resize", initVisualizer);

  // ========================
  // ===           UI ELEMENTS            ===
  // ========================
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

  // ======================
  // === Playlist Search ===
  // ======================
  document.getElementById("search-input").addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    const playlistItems = document.querySelectorAll(".playlist-item");

    playlistItems.forEach((item) => {
      let title = item.querySelector("h3").textContent.toLowerCase();
      let artists = item.querySelector("p").textContent.toLowerCase();
      if (title.includes(query) || artists.includes(query)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });

  // =====================
  // ===      Playlist Loading      ===
  // =====================
  const playlistContainer = document.getElementById("playlist-container");
  let songs = []; // Define songs array in a broader scope

  function renderSongItem(song, index) {
    const songItem = document.createElement("li");
    songItem.classList.add("playlist-item");
    songItem.dataset.index = index;
    songItem.innerHTML = `
      <img src="${song.cover_img}" alt="${song.title}">
      <div>
        <h3>${song.title}</h3>
        <p>${song.artists.join(", ")}</p>
      </div>
      <button class="delete-song-btn">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--fg)"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
      </button>
    `;
    songItem.addEventListener("click", (e) => {
      // Prevent playing the song if the delete button was clicked
      if (e.target.closest('.delete-song-btn')) {
        return;
      }
      // Inform the background script to play the selected song
      chrome.runtime.sendMessage({ action: "play-song", index: index });
    });

    const deleteBtn = songItem.querySelector('.delete-song-btn');
    deleteBtn.addEventListener('click', () => {
      removeSong(index);
    });

    // Insert before the "Add Song" button
    playlistContainer.insertBefore(
      songItem,
      document.getElementById("add-song-btn")
    );
  }

  function removeSong(index) {
    songs.splice(index, 1);
    // Re-render the entire playlist
    loadPlaylist();
    // Update storage
    chrome.storage.local.set({ songs: songs }, () => {
      chrome.runtime.sendMessage({ action: "update-playlist", songs: songs });
    });
  }

  function loadPlaylist() {
    chrome.storage.local.get("songs", (result) => {
      // Clear existing playlist items before rendering
      document.querySelectorAll(".playlist-item:not(#add-song-btn)").forEach(item => item.remove());

      if (result.songs && result.songs.length > 0) {
        songs = result.songs;
        songs.forEach((song, index) => {
          renderSongItem(song, index);
        });
        // Request state from background to update UI
        chrome.runtime.sendMessage({ action: "get-state" });
      } else {
        // If storage is empty, it means the background script is likely still converting the initial data.
      }
    });
  }

  if (playlistContainer) {
    loadPlaylist();
  }

  // ========================
  // ===          Player Controls           ===
  // ========================
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
    chrome.runtime.sendMessage({
      action: "set-volume",
      volume: volumeSlider.value,
    });
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

  // ========================
  // ===        Message Listener         ===
  // ========================

  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case "update-ui":
        const { song, isPlaying } = message;
        songImg.src = song.cover_img;
        controlsSongImg.src = song.cover_img;
        songTitle.textContent = song.title;
        songArtist.textContent = song.artists.join(", ");
        playPauseBtn.checked = isPlaying;
        document.documentElement.style.setProperty(
          "--accent",
          song.accent_color
        );

        if (isPlaying) {
          startVisualizer();
        } else {
          stopVisualizer();
        }
        break;

      case "update-time":
        const { currentTime, duration } = message;
        timeline.max = duration;
        timeline.value = currentTime;
        currentTimeEl.textContent = formatTime(currentTime);
        songLengthEl.textContent = formatTime(duration);
        break;

      case "update-volume":
        volumeSlider.value = message.volume;
        break;
    }
  });

  chrome.runtime.sendMessage({ action: "get-state" });

  // =========================
  // === Dialog Box Functions ===
  // =========================
  const dialog = document.getElementById("dialog");
  const form = document.getElementById("dialog-form");
  const addSongBtn = document.getElementById("add-song-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const newSongFileInput = document.getElementById("new-song-file");
  const newSongImageInput = document.getElementById("new-song-image-file");

  function openDialog() {
    form.reset();
    newSongFileInput.dataset.fileName = "";
    newSongImageInput.dataset.fileName = "";
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
  }

  addSongBtn.addEventListener("click", openDialog);
  cancelBtn.addEventListener("click", closeDialog);

  newSongFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      e.target.dataset.fileName = e.target.files[0].name;
    }
  });

  newSongImageInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      e.target.dataset.fileName = e.target.files[0].name;
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const musicFile = newSongFileInput.files[0];
    const imageFile = newSongImageInput.files[0];

    if (!musicFile || !imageFile) {
      alert("Please select both an audio and an image file.");
      return;
    }

    // Helper to read file as a data URL
    const readFileAsDataURL = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    Promise.all([readFileAsDataURL(musicFile), readFileAsDataURL(imageFile)]).then(
      ([musicDataUrl, imageDataUrl]) => {
        const newSong = {
          title: document.getElementById("new-song-title").value,
          artists: document
            .getElementById("new-song-artist")
            .value.split(",")
            .map((artist) => artist.trim()),
          music: musicDataUrl,
          cover_img: imageDataUrl,
          accent_color: document.getElementById("new-song-colour").value || "#000",
        };

        const newIndex = songs.length;
        songs.push(newSong);

        // Save the updated songs array to chrome.storage
        chrome.storage.local.set({ songs: songs }, () => {
          // Inform background script about the update
          chrome.runtime.sendMessage({ action: "update-playlist", songs: songs });
          renderSongItem(newSong, newIndex);
          closeDialog();
        });
      }
    );
  });

  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const isDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isDialog) {
      dialog.close("backdrop");
    }
  });
});

// ========================
// ===          Helper Functions        ===
// ========================
const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};
