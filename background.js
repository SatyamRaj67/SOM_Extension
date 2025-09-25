let playlist = [];
let currentSongIndex = 0;
let isPlaying = false;

const offscreenDocumentPath = "offscreen.html";

// =======================
//  ===      Load Playlist Data       ===
// =======================

fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    playlist = data.songs;
  });

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
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;

  await setupOffscreenDocument();

  switch (message.action) {
    // Handle Play/Pause Request
    case "play-pause":
      isPlaying = !isPlaying;

      sendMessageToOffscreen({
        action: "play-pause",
        song: playlist[currentSongIndex].music,
        isPlaying: isPlaying,
      });

      updatePopup();

      break;

    // Handle Previous Song Request
    case "prev":
      currentSongIndex =
        (currentSongIndex - 1 + playlist.length) % playlist.length;

      isPlaying = true;

      sendMessageToOffscreen({
        action: "play",
        song: playlist[currentSongIndex].music,
      });

      updatePopup();
      break;

    // Handle Next Song Request
    case "next":
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      isPlaying = true;
      sendMessageToOffscreen({
        action: "play",
        song: playlist[currentSongIndex].music,
      });
      updatePopup();
      break;

    // Handle Song Ended Request
    case "song-ended":
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      isPlaying = true;
      sendMessageToOffscreen({
        action: "play",
        song: playlist[currentSongIndex].music,
      });
      updatePopup();
      break;

    // Handle seek
    case "seek":
      sendMessageToOffscreen({ action: "seek", time: message.time });
      break;

    // Handle Startup State Request
    case "get-state":
      updatePopup();
      break;
  }
});
