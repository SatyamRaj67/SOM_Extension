chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "LOAD_SONG") {
    const url = URL.createObjectURL(msg.file);
    const player = document.getElementById("player");
    player.src = url;
    player.play();
  }
});

// Is it working though??