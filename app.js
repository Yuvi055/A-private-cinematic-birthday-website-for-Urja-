// ===============================
// URJA BIRTHDAY WEBSITE
// FINAL CLEAN APP.JS
// ===============================

const SUPABASE_URL =
  "https://euifwxbpmutuodqtgrus.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_3N78RDU-j93U3oO5FG3fQg_YRx5djWm";

const BUCKET = "urja-memories";
const SIGNED_URL_SECONDS = 300;

// Your uploaded song-video file.
// Its audio track will be used as background music.
const BACKGROUND_MUSIC_PATH =
  "WhatsApp Video 2026-09-19 at 9.40.31 PM.mp4";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let memories = [];

// ===============================
// AUDIO SYSTEM
// ===============================

let backgroundMusic = null;
let backgroundMusicReady = false;
let musicStarted = false;

async function prepareBackgroundMusic() {
  try {
    const url = await signedUrl(
      BACKGROUND_MUSIC_PATH
    );

    if (!url) return;

    backgroundMusic = new Audio(url);

    backgroundMusic.loop = true;
    backgroundMusic.preload = "auto";
    backgroundMusic.volume = 0;

    backgroundMusicReady = true;

    console.log("Background music ready.");
  } catch (error) {
    console.error(
      "Background music setup error:",
      error
    );
  }
}

function playIntroSound() {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return;

    const ctx = new AudioContext();

    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      140,
      ctx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      620,
      ctx.currentTime + 0.7
    );

    gain.gain.setValueAtTime(
      0.0001,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.16,
      ctx.currentTime + 0.08
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.95
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(
      ctx.currentTime + 1
    );
  } catch (error) {
    console.log(
      "Intro sound unavailable:",
      error
    );
  }
}

function startBackgroundMusic() {
  if (
    !backgroundMusicReady ||
    !backgroundMusic
  ) {
    console.log(
      "Background music is not ready yet."
    );
    return;
  }

  musicStarted = true;

  // Start inside the user's click gesture.
  backgroundMusic.volume = 0;

  backgroundMusic
    .play()
    .then(() => {
      // Fade in smoothly
      let volume = 0;

      const fadeTimer =
        setInterval(() => {
          volume += 0.05;

          if (volume >= 0.35) {
            volume = 0.35;
            clearInterval(
              fadeTimer
            );
          }

          if (backgroundMusic) {
            backgroundMusic.volume =
              volume;
          }
        }, 80);
    })
    .catch((error) => {
      console.log(
        "Background music waiting:",
        error
      );
    });
}

function pauseBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
  }
}

function resumeBackgroundMusic() {
  if (
    backgroundMusic &&
    musicStarted &&
    backgroundMusic.paused
  ) {
    backgroundMusic
      .play()
      .catch(() => {});
  }
}

function anyMemoryVideoPlaying(
  currentVideo = null
) {
  const videos = [
    ...document.querySelectorAll(
      "#videos video"
    ),
    ...document.querySelectorAll(
      "#media video"
    )
  ];

  return videos.some(
    (video) =>
      video !== currentVideo &&
      !video.paused &&
      !video.ended
  );
}

function connectVideoToMusic(
  video
) {
  if (!video) return;

  video.addEventListener(
    "play",
    function () {
      pauseBackgroundMusic();
    }
  );

  video.addEventListener(
    "pause",
    function () {
      if (
        !anyMemoryVideoPlaying(
          video
        )
      ) {
        resumeBackgroundMusic();
      }
    }
  );

  video.addEventListener(
    "ended",
    function () {
      if (
        !anyMemoryVideoPlaying(
          video
        )
      ) {
        resumeBackgroundMusic();
      }
    }
  );
}

// ===============================
// SECURITY
// ===============================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

// ===============================
// SIGNED URL
// ===============================

async function signedUrl(path) {
  const {
    data,
    error
  } = await client.storage
    .from(BUCKET)
    .createSignedUrl(
      path,
      SIGNED_URL_SECONDS
    );

  if (error) {
    console.error(
      "Signed URL error:",
      error
    );
    return null;
  }

  return data?.signedUrl || null;
}

// ===============================
// VIEWER SESSION
// ===============================

async function ensureViewerSession() {
  const {
    data: {
      session
    }
  } = await client.auth.getSession();

  if (session?.user) {
    return true;
  }

  const {
    data,
    error
  } =
    await client.auth.signInAnonymously();

  if (error) {
    console.error(
      "Anonymous viewer login error:",
      error
    );
    return false;
  }

  return !!data?.session;
}

// ===============================
// INTRO
// ===============================

// ===============================
// INTRO
// ===============================

function setupIntro() {
  const enterBtn =
    document.getElementById("enterBtn");

  const intro =
    document.getElementById("intro");

  if (!enterBtn || !intro) {
    console.error(
      "Intro elements not found."
    );
    return;
  }

  const header =
    document.querySelector("header");

  const main =
    document.querySelector("main");

  document.body.classList.add(
    "intro-active"
  );

  if (header) {
    header.style.setProperty(
      "display",
      "none",
      "important"
    );
  }

  if (main) {
    main.style.setProperty(
      "display",
      "none",
      "important"
    );
  }

  enterBtn.classList.remove("hidden");
  enterBtn.style.display =
    "inline-block";

  enterBtn.onclick = function () {

    // Prevent double taps
    if (
      enterBtn.dataset.started === "1"
    ) {
      return;
    }

    enterBtn.dataset.started = "1";
    enterBtn.disabled = true;

    // Start cinematic sound
    // from the user's tap
    playIntroSound();
    startBackgroundMusic();

    // Restart intro animation
    // together with sound
    const introVideo =
      document.getElementById(
        "introVideo"
      );

    if (introVideo) {
      try {
        introVideo.currentTime = 0;
        introVideo.muted = false;
        introVideo.volume = 1;

        introVideo
          .play()
          .catch((error) => {
            console.log(
              "Intro video:",
              error
            );
          });
      } catch (error) {
        console.log(
          "Intro playback:",
          error
        );
      }
    }

    // Give animation + sound
    // time to play together
    setTimeout(function () {

      intro.style.setProperty(
        "display",
        "none",
        "important"
      );

      intro.style.setProperty(
        "visibility",
        "hidden",
        "important"
      );

      intro.style.setProperty(
        "pointer-events",
        "none",
        "important"
      );

      if (header) {
        header.style.setProperty(
          "display",
          "flex",
          "important"
        );

        header.style.setProperty(
          "visibility",
          "visible",
          "important"
        );

        header.style.setProperty(
          "opacity",
          "1",
          "important"
        );
      }

      if (main) {
        main.style.setProperty(
          "display",
          "block",
          "important"
        );

        main.style.setProperty(
          "visibility",
          "visible",
          "important"
        );

        main.style.setProperty(
          "opacity",
          "1",
          "important"
        );
      }

      document.body.classList.remove(
        "intro-active"
      );

   

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }, 1600);
  };
}
// ===============================
// LOAD MEMORIES
// ===============================

async function loadMemories() {
  const {
    data,
    error
  } = await client
    .from("memories")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Memories error:",
      error
    );
    return;
  }

  memories = data || [];

  await loadIntroVideo();

  // Hero photo
  const hero =
    document.querySelector(
      ".hero"
    );

  if (hero) {
    const heroPhoto =
      memories.find(
        (item) =>
          item.type === "photo"
      );

    if (heroPhoto) {
      const heroUrl =
        await signedUrl(
          heroPhoto.path
        );

      if (heroUrl) {
        const heroPhotoElement =
          document.getElementById(
            "heroPhoto"
          );

        if (heroPhotoElement) {
          heroPhotoElement.src =
            heroUrl;
        }

        hero.style.backgroundImage =
          `linear-gradient(
            90deg,
            rgba(0,0,0,0.98) 0%,
            rgba(0,0,0,0.75) 38%,
            rgba(0,0,0,0.20) 70%,
            rgba(0,0,0,0.05) 100%
          ),
          url("${heroUrl}")`;

        hero.style.backgroundSize =
          "cover";

        hero.style.backgroundPosition =
          "right center";

        hero.style.backgroundRepeat =
          "no-repeat";
      }
    }
  }

  const photos =
    memories.filter(
      (item) =>
        item.type === "photo"
    );

  const videos =
    memories.filter(
      (item) =>
        item.type === "video"
    );

  await Promise.all([
    renderMedia(
      "photos",
      photos
    ),
    renderMedia(
      "videos",
      videos
    )
  ]);

  await renderAdmin();
}

// ===============================
// INTRO VIDEO
// ===============================

async function loadIntroVideo() {
  const introVideo =
    document.getElementById(
      "introVideo"
    );

  if (!introVideo) {
    return;
  }

  const firstVideo =
    memories.find(
      (item) =>
        item.type === "video"
    );

  if (!firstVideo) {
    return;
  }

  const url =
    await signedUrl(
      firstVideo.path
    );

  if (!url) {
    return;
  }

  introVideo.src = url;
  introVideo.muted = true;
  introVideo.playsInline = true;
  introVideo.load();

  introVideo
    .play()
    .catch(() => {
      console.log(
        "Intro autoplay waiting."
      );
    });
}

// ===============================
// MEDIA RENDER
// ===============================

async function renderMedia(
  containerId,
  items
) {
  const container =
    document.getElementById(
      containerId
    );

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML =
      '<p class="empty-state">Coming soon ❤️</p>';
    return;
  }

  const cards =
    await Promise.all(
      items.map(
        async (item) => {
          const url =
            await signedUrl(
              item.path
            );

          if (!url) {
            return null;
          }

          const card =
            document.createElement(
              "article"
            );

          card.className =
            "memory-card";

          if (
            item.type === "video"
          ) {
            card.innerHTML = `
              <div class="media-wrapper">
                <video
                  src="${escapeHtml(
                    url
                  )}"
                  controls
                  playsinline
                  preload="metadata">
                </video>
              </div>

              <div class="memory-title">
                ${escapeHtml(
                  item.title ||
                  "A Special Memory"
                )}
              </div>
            `;

            const video =
              card.querySelector(
                "video"
              );

            connectVideoToMusic(
              video
            );
          } else {
            card.innerHTML = `
              <div class="media-wrapper">
                <img
                  src="${escapeHtml(
                    url
                  )}"
                  alt="${escapeHtml(
                    item.title ||
                    "Urja Memory"
                  )}"
                  loading="lazy">
              </div>

              <div class="memory-title">
                ${escapeHtml(
                  item.title ||
                  "A Special Memory"
                )}
              </div>
            `;
          }

          // Open full-screen viewer
          card.addEventListener(
            "click",
            function (event) {

              if (
                item.type ===
                  "video" &&
                event.target.closest(
                  "video"
                )
              ) {
                return;
              }

              openMediaModal(
                url,
                item.type,
                item.title ||
                  "A Special Memory"
              );
            }
          );

          return card;
        }
      )
    );

  cards.forEach(
    (card) => {
      if (card) {
        container.appendChild(
          card
        );
      }
    }
  );
}

// ===============================
// FULL SCREEN VIEWER
// ===============================

function openMediaModal(
  url,
  type,
  title
) {
  const modal =
    document.getElementById(
      "modal"
    );

  const media =
    document.getElementById(
      "media"
    );

  if (!modal || !media) {
    return;
  }

  media.innerHTML = "";

  if (type === "video") {
    const video =
      document.createElement(
        "video"
      );

    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;

    media.appendChild(video);

    connectVideoToMusic(
      video
    );

    video
      .play()
      .catch(() => {});
  } else {
    const img =
      document.createElement(
        "img"
      );

    img.src = url;
    img.alt =
      title ||
      "Urja Memory";

    media.appendChild(img);
  }

  const titleElement =
    document.createElement(
      "div"
    );

  titleElement.className =
    "modal-title";

  titleElement.textContent =
    title ||
    "Urja Memory";

  media.appendChild(
    titleElement
  );

  modal.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";
}

function closeModal(event) {
  const modal =
    document.getElementById(
      "modal"
    );

  if (!modal) return;

  if (
    event.target === modal ||
    event.target.classList.contains(
      "close"
    )
  ) {
    modal.classList.add(
      "hidden"
    );

    const media =
      document.getElementById(
        "media"
      );

    if (media) {
      const video =
        media.querySelector(
          "video"
        );

      if (video) {
        video.pause();
      }

      media.innerHTML = "";
    }

    document.body.style.overflow =
      "";

    resumeBackgroundMusic();
  }
}

document.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key !==
      "Escape"
    ) {
      return;
    }

    const modal =
      document.getElementById(
        "modal"
      );

    if (
      modal &&
      !modal.classList.contains(
        "hidden"
      )
    ) {
      modal.classList.add(
        "hidden"
      );

      const media =
        document.getElementById(
          "media"
        );

      if (media) {
        const video =
          media.querySelector(
            "video"
          );

        if (video) {
          video.pause();
        }

        media.innerHTML = "";
      }

      document.body.style.overflow =
        "";

      resumeBackgroundMusic();
    }
  }
);

window.openMediaModal =
  openMediaModal;

window.closeModal =
  closeModal;

// ===============================
// ADMIN
// ===============================

async function renderAdmin() {
  const adminSection =
    document.getElementById(
      "admin"
    );

  if (!adminSection) {
    return;
  }

  const loginBox =
    document.getElementById(
      "loginBox"
    );

  const panel =
    document.getElementById(
      "panel"
    );

  const {
    data: {
      user
    }
  } = await client.auth.getUser();

  // Not logged in
  if (!user) {
    adminSection.style.display =
      "block";

    if (loginBox) {
      loginBox.style.display =
        "block";
    }

    if (panel) {
      panel.classList.add(
        "hidden"
      );
    }

    return;
  }

  const {
    data: isAdmin,
    error
  } = await client.rpc(
    "is_admin"
  );

  // Logged in but not admin
  if (
    error ||
    !isAdmin
  ) {
    adminSection.style.display =
      "none";

    return;
  }

  // Actual admin
  adminSection.style.display =
    "block";

  if (loginBox) {
    loginBox.style.display =
      "none";
  }

  if (panel) {
    panel.classList.remove(
      "hidden"
    );
  }
}

// ===============================
// LOGIN
// ===============================

async function loginUser() {
  const emailInput =
    document.getElementById(
      "email"
    ) ||
    document.getElementById(
      "loginEmail"
    );

  const passwordInput =
    document.getElementById(
      "password"
    ) ||
    document.getElementById(
      "loginPassword"
    );

  const message =
    document.getElementById(
      "loginMsg"
    ) ||
    document.getElementById(
      "loginMessage"
    ) ||
    document.getElementById(
      "authMsg"
    );

  if (
    !emailInput ||
    !passwordInput
  ) {
    return;
  }

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  // Remove anonymous user
  // before admin login
  const {
    data: {
      session
    }
  } = await client.auth.getSession();

  if (
    session?.user?.is_anonymous
  ) {
    await client.auth.signOut();
  }

  const {
    error
  } =
    await client.auth.signInWithPassword(
      {
        email,
        password
      }
    );

  if (error) {
    if (message) {
      message.textContent =
        error.message;
    }

    return;
  }

  if (message) {
    message.textContent =
      "Login successful ❤️";
  }

  await loadMemories();
  await renderAdmin();
}

window.loginUser =
  loginUser;

window.login =
  loginUser;

// ===============================
// LOGOUT
// ===============================

async function logoutUser() {
  await client.auth.signOut();

  location.reload();
}

window.logoutUser =
  logoutUser;

window.logout =
  logoutUser;

// ===============================
// UPLOAD
// ===============================

async function uploadFiles() {
  const input =
    document.getElementById(
      "files"
    );

  const message =
    document.getElementById(
      "uploadMsg"
    ) ||
    document.getElementById(
      "uploadMessage"
    );

  if (
    !input ||
    !input.files.length
  ) {
    if (message) {
      message.textContent =
        "Please select a file first.";
    }

    return;
  }

  if (message) {
    message.textContent =
      "Uploading securely...";
  }

  for (
    const file of input.files
  ) {

    const isMedia =
      file.type.startsWith(
        "image/"
      ) ||
      file.type.startsWith(
        "video/"
      );

    if (!isMedia) {
      if (message) {
        message.textContent =
          `Skipped ${file.name}: unsupported file type`;
      }

      continue;
    }

    if (
      file.size >
      50 * 1024 * 1024
    ) {
      if (message) {
        message.textContent =
          `Skipped ${file.name}: file is over 50 MB`;
      }

      continue;
    }

    const safeName =
      file.name
        .toLowerCase()
        .replace(
          /[^a-z0-9._-]/g,
          "_"
        );

    const path =
      `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const type =
      file.type.startsWith(
        "video/"
      )
        ? "video"
        : "photo";

    const upload =
      await client.storage
        .from(BUCKET)
        .upload(
          path,
          file,
          {
            upsert: false,
            contentType:
              file.type
          }
        );

    if (upload.error) {
      if (message) {
        message.textContent =
          `Upload failed: ${upload.error.message}`;
      }

      return;
    }

    const insert =
      await client
        .from("memories")
        .insert({
          path,
          type,
          title: file.name
        });

    if (insert.error) {
      await client.storage
        .from(BUCKET)
        .remove([
          path
        ]);

      if (message) {
        message.textContent =
          `Database error: ${insert.error.message}`;
      }

      return;
    }
  }

  if (message) {
    message.textContent =
      "Upload complete ❤️";
  }

  input.value = "";

  await loadMemories();
}

window.uploadFiles =
  uploadFiles;

// ===============================
// AUTH STATE
// ===============================

client.auth.onAuthStateChange(
  function () {
    setTimeout(
      function () {
        renderAdmin();
      },
      0
    );
  }
);

// ===============================
// START APP
// ===============================

window.addEventListener(
  "load",
  async function () {

    console.log(
      "URJA website loaded."
    );

    setupIntro();

    const viewerReady =
      await ensureViewerSession();

    if (!viewerReady) {
      console.error(
        "Viewer session could not be created."
      );
      return;
    }

    // Prepare music while
    // intro is being shown.
    prepareBackgroundMusic();

    await loadMemories();
  }
);
// =========================================
// BIRTHDAY PARTY POPPER
// Isolated animation — does not touch media
// =========================================

function launchBirthdayPopper() {

  if (
    document.getElementById(
      "birthdayPopper"
    )
  ) {
    return;
  }

  const popper =
    document.createElement("div");

  popper.id = "birthdayPopper";

  const symbols = [
    "🎉",
    "🎊",
    "✨",
    "❤️",
    "💖",
    "🌟",
    "🥳",
    "🎈"
  ];

  for (let i = 0; i < 30; i++) {

    const piece =
      document.createElement("span");

    piece.textContent =
      symbols[
        i % symbols.length
      ];

    piece.style.setProperty(
      "--x",
      `${(Math.random() - 0.5) * 90}vw`
    );

    piece.style.setProperty(
      "--y",
      `${50 + Math.random() * 35}vh`
    );

    piece.style.setProperty(
      "--delay",
      `${Math.random() * 0.18}s`
    );

    piece.style.setProperty(
      "--rotate",
      `${Math.random() * 720 - 360}deg`
    );

    popper.appendChild(piece);
  }

  document.body.appendChild(popper);

  requestAnimationFrame(() => {
    popper.classList.add(
      "birthday-pop"
    );
  });

  setTimeout(() => {
    popper.remove();
  }, 2600);
}

window.addEventListener(
  "load",
  function () {

    const button =
      document.getElementById(
        "enterBtn"
      );

    if (!button) return;

    // Separate listener:
    // existing intro logic stays untouched
    button.addEventListener(
      "click",
      function () {

        setTimeout(() => {
          launchBirthdayPopper();
        }, 150);

      },
      { once: true }
    );
  }
);
