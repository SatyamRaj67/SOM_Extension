let playlist = [];
let currentSongIndex = 0;
let isPlaying = false;
let currentVolume = 1;

// Helper to fetch a file and convert it to a Data URL
async function toDataURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function initializePlaylist() {
  chrome.storage.local.get("songs", (result) => {
    if (result.songs && result.songs.length > 0) {
      playlist = result.songs;
    } else {
      // If no songs in storage, fetch from data.json, convert paths to data URLs, and then store them.
      fetch("data.json")
        .then((response) => response.json())
        .then(async (data) => {
          const initialSongs = data.songs;
          const convertedSongs = [];

          for (const song of initialSongs) {
            // Convert relative paths to data URLs
            const [musicDataUrl, coverImgDataUrl] = await Promise.all([
              toDataURL(song.music),
              toDataURL(song.cover_img),
            ]);

            convertedSongs.push({
              ...song,
              music: musicDataUrl,
              cover_img: coverImgDataUrl,
            });
          }

          playlist = convertedSongs;
          chrome.storage.local.set({ songs: playlist }, () => {
          });
        })
        .catch((error) =>
          console.error("BACKGROUND: Error initializing playlist:", error)
        );
    }
  });
}

initializePlaylist();

const offscreenDocumentPath = "offscreen.html";

// ========================
//  ===         Basic Functions           ===
// ========================
async function hasOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  return existingContexts.length > 0;
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: offscreenDocumentPath,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "To play audio in the background",
  });
}

// ========================
//  ===      Message Handling        ===
// ========================
function sendMessageToOffscreen(message) {
  chrome.runtime.sendMessage(message);
}

function updatePopup() {
  if (playlist.length === 0) return;
  chrome.runtime.sendMessage({
    action: "update-ui",
    song: playlist[currentSongIndex],
    isPlaying: isPlaying,
  });
  chrome.runtime.sendMessage({
    action: "update-volume",
    volume: currentVolume,
  });
}

// =======================
// ===   Main Message Listener   ===
// =======================
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;

  await setupOffscreenDocument();

  switch (message.action) {
    case "play-pause":
      isPlaying = !isPlaying;
      sendMessageToOffscreen({
        action: "play-pause",
        isPlaying: isPlaying,
      });
      updatePopup();
      break;

    case "prev":
      currentSongIndex =
        (currentSongIndex - 1 + playlist.length) % playlist.length;
      isPlaying = true;
      // First load the song, then play
      sendMessageToOffscreen({ action: "load", song: playlist[currentSongIndex].music });
      sendMessageToOffscreen({ action: "play" });
      updatePopup();
      break;

    case "next":
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      isPlaying = true;
      // First load the song, then play
      sendMessageToOffscreen({ action: "load", song: playlist[currentSongIndex].music });
      sendMessageToOffscreen({ action: "play" });
      updatePopup();
      break;

    case "play-song":
      currentSongIndex = message.index;
      isPlaying = true;
      // First load the song, then play
      sendMessageToOffscreen({ action: "load", song: playlist[currentSongIndex].music });
      sendMessageToOffscreen({ action: "play" });
      updatePopup();
      break;

    case "song-ended":
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      isPlaying = true;
      // First load the song, then play
      sendMessageToOffscreen({ action: "load", song: playlist[currentSongIndex].music });
      sendMessageToOffscreen({ action: "play" });
      updatePopup();
      break;

    case "seek":
      sendMessageToOffscreen({ action: "seek", time: message.time });
      break;

    case "set-volume":
      currentVolume = message.volume;
      sendMessageToOffscreen({ action: "set-volume", volume: currentVolume });
      break;
    case "get-state":
      updatePopup();
      break;
    case "update-playlist":
      playlist = message.songs;
      break;
  }
});
