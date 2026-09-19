// ===============================
// URJA BIRTHDAY WEBSITE
// CLEAN APP.JS
// ===============================

const SUPABASE_URL = "https://euifwxbpmutuodqtgrus.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3N78RDU-j93U3oO5FG3fQg_YRx5djWm";
const BUCKET = "urja-memories";
const SIGNED_URL_SECONDS = 300;

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let memories = [];

// ===============================
// SECURITY
// ===============================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===============================
// SIGNED URL
// ===============================

async function signedUrl(path) {
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);

  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }

  return data?.signedUrl || null;
}

// ===============================
// INTRO
// ===============================

function setupIntro() {
  const enterBtn = document.getElementById("enterBtn");
  const intro = document.getElementById("intro");

  if (!enterBtn || !intro) {
    console.error("Intro elements not found.");
    return;
  }

  // Keep website locked behind intro
  const header = document.querySelector("header");
  const main = document.querySelector("main");

  if (header) {
    header.style.setProperty("display", "none", "important");
  }

  if (main) {
    main.style.setProperty("display", "none", "important");
  }

  document.body.style.overflow = "hidden";

  enterBtn.classList.remove("hidden");
  enterBtn.style.display = "inline-block";

  enterBtn.onclick = function () {

    // Hide intro immediately
    intro.style.setProperty("display", "none", "important");
    intro.style.setProperty("visibility", "hidden", "important");
    intro.style.setProperty("pointer-events", "none", "important");

    // Show website immediately
    if (header) {
      header.style.setProperty("display", "flex", "important");
      header.style.setProperty("visibility", "visible", "important");
      header.style.setProperty("opacity", "1", "important");
    }

    if (main) {
      main.style.setProperty("display", "block", "important");
      main.style.setProperty("visibility", "visible", "important");
      main.style.setProperty("opacity", "1", "important");
    }

    document.body.style.overflow = "";

    // Start intro video without waiting
    const introVideo = document.getElementById("introVideo");

    if (introVideo) {
      introVideo.muted = false;
      introVideo.volume = 1;

      introVideo.play().catch((error) => {
        console.log("Intro video play:", error);
      });
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
}

// ===============================
// LOAD MEMORIES
// ===============================

async function loadMemories() {
  const { data, error } = await client
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Memories error:", error);
    return;
  }

  memories = data || [];

  // ===============================
  // HERO PHOTO
  // ===============================

  const hero = document.querySelector(".hero");

  if (hero) {
    const heroPhoto = memories.find(
      (item) => item.type === "photo"
    );

    if (heroPhoto) {
      const heroUrl = await signedUrl(heroPhoto.path);

      if (heroUrl) {
        const heroPhotoElement =
          document.getElementById("heroPhoto");

        if (heroPhotoElement) {
          heroPhotoElement.src = heroUrl;
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

        hero.style.backgroundSize = "cover";
        hero.style.backgroundPosition = "right center";
        hero.style.backgroundRepeat = "no-repeat";
      }
    }
  }

  const photos = memories.filter(
    (item) => item.type === "photo"
  );

  const videos = memories.filter(
    (item) => item.type === "video"
  );

  await renderMedia("photos", photos);
  await renderMedia("videos", videos);

  await renderAdmin();
  await loadIntroVideo();
}

// ===============================
// INTRO VIDEO
// ===============================

async function loadIntroVideo() {
  const introVideo =
    document.getElementById("introVideo");

  if (!introVideo) return;

  const firstVideo = memories.find(
    (item) => item.type === "video"
  );

  if (!firstVideo) {
    console.log("No intro video found.");
    return;
  }

  const url = await signedUrl(firstVideo.path);

  if (!url) return;

  introVideo.src = url;
  introVideo.muted = true;
  introVideo.playsInline = true;
  introVideo.load();

  // Safe muted autoplay
  introVideo.play().catch(() => {
    console.log("Intro autoplay waiting.");
  });
}

// ===============================
// MEDIA RENDER
// ===============================

async function renderMedia(containerId, items) {
  const container =
    document.getElementById(containerId);

  if (!container) {
    console.log("Container not found:", containerId);
    return;
  }

  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML =
      '<p class="empty-state">Coming soon ❤️</p>';
    return;
  }

  for (const item of items) {
    const url = await signedUrl(item.path);

    if (!url) continue;

    const card = document.createElement("article");
    card.className = "memory-card";

    if (item.type === "video") {
      card.innerHTML = `
        <div class="media-wrapper">
          <video
            src="${escapeHtml(url)}"
            controls
            playsinline
            preload="metadata">
          </video>
        </div>

        <div class="memory-title">
          ${escapeHtml(
            item.title || "A Special Memory"
          )}
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="media-wrapper">
          <img
            src="${escapeHtml(url)}"
            alt="${escapeHtml(
              item.title || "Urja Memory"
            )}"
            loading="lazy">
        </div>

        <div class="memory-title">
          ${escapeHtml(
            item.title || "A Special Memory"
          )}
        </div>
      `;
    }

    // Full-screen viewer
    card.addEventListener("click", function (event) {
      if (
        item.type === "video" &&
        event.target.closest("video")
      ) {
        return;
      }

      openMediaModal(
        url,
        item.type,
        item.title || "A Special Memory"
      );
    });

    container.appendChild(card);
  }
}

// ===============================
// FULL SCREEN MEDIA VIEWER
// ===============================

function openMediaModal(url, type, title) {
  const modal = document.getElementById("modal");
  const media = document.getElementById("media");

  if (!modal || !media) return;

  media.innerHTML = "";

  if (type === "video") {
    const video = document.createElement("video");

    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;

    media.appendChild(video);

    video.play().catch(() => {});
  } else {
    const img = document.createElement("img");

    img.src = url;
    img.alt = title || "Urja Memory";

    media.appendChild(img);
  }

  const titleElement = document.createElement("div");
  titleElement.className = "modal-title";
  titleElement.textContent =
    title || "Urja Memory";

  media.appendChild(titleElement);

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(event) {
  const modal = document.getElementById("modal");

  if (!modal) return;

  if (
    event.target === modal ||
    event.target.classList.contains("close")
  ) {
    modal.classList.add("hidden");

    const media = document.getElementById("media");

    if (media) {
      const video = media.querySelector("video");

      if (video) {
        video.pause();
      }

      media.innerHTML = "";
    }

    document.body.style.overflow = "";
  }
}

document.addEventListener(
  "keydown",
  function (event) {
    if (event.key === "Escape") {
      const modal = document.getElementById("modal");

      if (
        modal &&
        !modal.classList.contains("hidden")
      ) {
        modal.classList.add("hidden");

        const media =
          document.getElementById("media");

        if (media) {
          const video =
            media.querySelector("video");

          if (video) {
            video.pause();
          }

          media.innerHTML = "";
        }

        document.body.style.overflow = "";
      }
    }
  }
);

window.openMediaModal = openMediaModal;
window.closeModal = closeModal;

// ===============================
// ADMIN
// ===============================

async function renderAdmin() {
  const adminSection =
    document.getElementById("admin");

  if (!adminSection) return;

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) {
    adminSection.style.display = "none";
    return;
  }

  adminSection.style.display = "block";
}

// ===============================
// LOGIN
// ===============================

async function loginUser() {
  const emailInput =
    document.getElementById("email") ||
    document.getElementById("loginEmail");

  const passwordInput =
    document.getElementById("password") ||
    document.getElementById("loginPassword");

  const message =
    document.getElementById("loginMsg") ||
    document.getElementById("loginMessage") ||
    document.getElementById("authMsg");

  if (!emailInput || !passwordInput) {
    console.error("Login fields not found.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const { error } =
    await client.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    if (message) {
      message.textContent = error.message;
    }

    console.error("Login error:", error);
    return;
  }

  if (message) {
    message.textContent = "Login successful ❤️";
  }

  await loadMemories();
}

window.loginUser = loginUser;
window.login = loginUser;

// ===============================
// LOGOUT
// ===============================

async function logoutUser() {
  await client.auth.signOut();
  location.reload();
}

window.logoutUser = logoutUser;
window.logout = logoutUser;

// ===============================
// UPLOAD
// ===============================

async function uploadFiles() {
  const input =
    document.getElementById("files");

  const message =
    document.getElementById("uploadMsg") ||
    document.getElementById("uploadMessage");

  if (!input || !input.files.length) {
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

  for (const file of input.files) {
    const isMedia =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/");

    if (!isMedia) {
      if (message) {
        message.textContent =
          `Skipped ${file.name}: unsupported file type`;
      }
      continue;
    }

    if (file.size > 50 * 1024 * 1024) {
      if (message) {
        message.textContent =
          `Skipped ${file.name}: file is over 50 MB`;
      }
      continue;
    }

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "_");

    const path =
      `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const type =
      file.type.startsWith("video/")
        ? "video"
        : "photo";

    const upload = await client.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });

    if (upload.error) {
      console.error(
        "Storage upload error:",
        upload.error
      );

      if (message) {
        message.textContent =
          `Upload failed: ${upload.error.message}`;
      }

      return;
    }

    const insert = await client
      .from("memories")
      .insert({
        path,
        type,
        title: file.name
      });

    if (insert.error) {
      await client.storage
        .from(BUCKET)
        .remove([path]);

      console.error(
        "Database error:",
        insert.error
      );

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

window.uploadFiles = uploadFiles;

// ===============================
// AUTH STATE
// ===============================

client.auth.onAuthStateChange(
  async function () {
    await renderAdmin();
  }
);

// ===============================
// START APP
// ===============================

window.addEventListener(
  "load",
  async function () {
    console.log("URJA website loaded.");

    setupIntro();

    await loadMemories();
  }
);
