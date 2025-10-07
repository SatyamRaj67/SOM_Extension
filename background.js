let playlist = [];
let currentSongIndex = 0;
let isPlaying = false;
let currentVolume = 1;

// Initialize playlist from storage or data.json
chrome.storage.local.get("playlist", (result) => {
  if (result.playlist) {
    playlist = result.playlist;
  } else {
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        playlist = data.songs;
        chrome.storage.local.set({ playlist: playlist });
      });
  }
});

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
  if (playlist.length === 0) {
    // Handle empty playlist case
    chrome.runtime.sendMessage({ action: "update-ui-empty" });
    return;
  }
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
      if (playlist.length === 0) return;
      isPlaying = !isPlaying;

      sendMessageToOffscreen({
        action: "play-pause",
        song: playlist[currentSongIndex].music,
        isPlaying: isPlaying,
      });

      updatePopup();

      break;

    case "prev":
      if (playlist.length === 0) return;
      currentSongIndex =
        (currentSongIndex - 1 + playlist.length) % playlist.length;

      isPlaying = true;

      sendMessageToOffscreen({
        action: "play",
        song: playlist[currentSongIndex].music,
      });

      updatePopup();
      break;

    case "next":
      if (playlist.length === 0) return;
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      isPlaying = true;
      sendMessageToOffscreen({
        action: "play",
        song: playlist[currentSongIndex].music,
      });
      updatePopup();
      break;

    case "play-song":
      currentSongIndex = message.index;
      isPlaying = true;
      sendMessageToOffscreen({
        action: "play",
        song: playlist[currentSongIndex].music,
      });
      updatePopup();
      break;

    case "song-ended":
      if (playlist.length === 0) return;
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      isPlaying = true;
      sendMessageToOffscreen({
        action: "play",
        song: playlist[currentSongIndex].music,
      });
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
      // Also send the full playlist to the popup when it opens
      chrome.runtime.sendMessage({
        action: "update-playlist",
        playlist: playlist,
      });
      break;
    case "add-song":
      playlist.push(message.song);
      chrome.storage.local.set({ playlist: playlist }, () => {
        chrome.runtime.sendMessage({
          action: "update-playlist",
          playlist: playlist,
        });
      });
      break;
    case "remove-song":
      const removeIndex = message.index;
      if (removeIndex < 0 || removeIndex >= playlist.length) return;

      playlist.splice(removeIndex, 1);
      chrome.storage.local.set({ playlist: playlist });

      // Adjust current song if needed
      if (isPlaying) {
        if (currentSongIndex === removeIndex) {
          currentSongIndex = removeIndex % playlist.length;
          if (playlist.length > 0) {
            sendMessageToOffscreen({
              action: "play",
              song: playlist[currentSongIndex].music,
            });
          } else {
            isPlaying = false;
            sendMessageToOffscreen({ action: "stop" });
          }
        } else if (currentSongIndex > removeIndex) {
          currentSongIndex--;
        }
      }
      updatePopup();
      chrome.runtime.sendMessage({
        action: "update-playlist",
        playlist: playlist,
      });
      break;
  }
});
