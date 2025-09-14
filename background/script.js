async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play selected song in background",
  });
}

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "PLAY_SONG") {
    await ensureOffscreen();
    chrome.runtime.sendMessage({ type: "LOAD_SONG", file: msg.file });
  }
});
