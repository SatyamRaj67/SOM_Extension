const playlist = ['music/1.mp3', 'music/2.mp3', 'music/3.mp3'];
let currentSongIndex = 0;
let isPlaying = false;

const offscreenDocumentPath = 'offscreen.html';

// async function hasOffscreenDocument() {
//   const existingContexts = await chrome.runtime.getContexts({
//     contextTypes: ['OFFSCREEN_DOCUMENT']
//   });
//   return existingContexts.length > 0;
// }

async function setupOffscreenDocument() {
  // if (await hasOffscreenDocument()) {
  //   return;
  // }
  await chrome.offscreen.createDocument({
    url: offscreenDocumentPath,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'To play audio in the background'
  });
}

function sendMessageToOffscreen(message) {
  chrome.runtime.sendMessage(message);
}

function updatePopup() {
  chrome.runtime.sendMessage({
    action: 'update-ui',
    song: playlist[currentSongIndex].replace('music/', ''),
    isPlaying: isPlaying
  });
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;

  await setupOffscreenDocument();

  switch (message.action) {
    case 'play-pause':

      isPlaying = !isPlaying;

      sendMessageToOffscreen({
        action: 'play-pause',
        song: playlist[currentSongIndex],
        isPlaying: isPlaying
      });

      updatePopup();

      break;

    case 'prev':

      currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;

      isPlaying = true;

      sendMessageToOffscreen({
        action: 'play',
        song: playlist[currentSongIndex]
      });
      
      updatePopup();
      break;
    case 'next':
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      isPlaying = true;
      sendMessageToOffscreen({
        action: 'play',
        song: playlist[currentSongIndex]
      });
      updatePopup();
      break;
    case 'get-state':
      updatePopup();
      break;
  }
});
