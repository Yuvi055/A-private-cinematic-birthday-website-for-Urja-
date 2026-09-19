const SUPABASE_URL = "https://euifwxbpmutuodqtgrus.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3N78RDU-j93U3oO5FG3fQg_YRx5djWm"
const BUCKET = "urja-memories";
const SIGNED_URL_SECONDS = 300;

const client =
  SUPABASE_URL.startsWith("http") &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== "PASTE_YOUR_CURRENT_PUBLISHABLE_KEY"
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

let memories = [];

/* ---------- HELPERS ---------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

/* ---------- INTRO ---------- */

function setupIntro() {
  const enterBtn = document.getElementById("enterBtn");
  const intro = document.getElementById("intro");

  if (!enterBtn || !intro) return;

  enterBtn.classList.remove("hidden");
  enterBtn.style.display = "inline-block";

  enterBtn.onclick = () => {
    const introVideo = document.getElementById("introVideo");

if (introVideo) {
  introVideo.muted = false;
  introVideo.volume = 1;
  introVideo.play().catch(() => {});
}
intro.classList.add("intro-hidden);
    const header = document.querySelector("header");
    const main = document.querySelector("main");

    if (header) {
header.style.setProperty("display", "flex", "important");    }

    if (main) {
      main.style.setProperty("display", "block", "important");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
}

/* ---------- MEDIA ---------- */

async function loadMemories() {
  if (!client) {
    console.error("Supabase client is not configured.");
    return;
  }

  const { data, error } = await client
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Memory load error:", error);
    return;
  }

  memories = data || [];

  const photos = memories.filter(item => item.type === "photo");
  const videos = memories.filter(item => item.type === "video");

  await renderMedia("photos", photos);
  await renderMedia("videos", videos);

  await renderAdmin();
  await loadIntroVideo();
} 
async function loadIntroVideo() {
  const introVideo = document.getElementById("introVideo");

  if (!introVideo || !memories.length) return;

  const introMemory = memories.find(item => item.type === "video");

  if (!introMemory) {
    console.log("No intro video found.");
    return;
  }

  const url = await signedUrl(introMemory.path);

  if (!url) {
    console.error("Could not create intro video URL.");
    return;
  }

  introVideo.src = url;
  introVideo.load();

  try {
    await introVideo.play();
  } catch (error) {
    console.log("Autoplay waiting for user interaction:", error);
  }
}

async function renderMedia(containerId, items) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML =
      '<p class="muted">Memories will appear here ❤️</p>';
    return;
  }

  for (const item of items) {
    const url = await signedUrl(item.path);

    if (!url) continue;

    const card = document.createElement("article");
    card.className = "memory-card";

    const title = escapeHtml(item.title || "Urja Memory");

    if (item.type === "video") {
      card.innerHTML = `
        <video
          class="memory-media"
          controls
          playsinline
          preload="metadata"
        >
          <source src="${url}" type="video/mp4">
        </video>
        <div class="memory-title">${title}</div>
      `;
    } else {
      card.innerHTML = `
        <img
          class="memory-media"
          src="${url}"
          alt="${title}"
          loading="lazy"
        >
        <div class="memory-title">${title}</div>
      `;
    }

    container.appendChild(card);
  }
}

/* ---------- VIEWER LOGIN ---------- */

function showViewerLogin() {
  if (document.getElementById("viewerLogin")) return;

  const overlay = document.createElement("div");

  overlay.id = "viewerLogin";
  overlay.innerHTML = `
    <div class="login-box">
      <h2>Urja's Private Story ❤️</h2>
      <p>Enter the birthday access details to view her memories.</p>

      <input
        id="viewerEmail"
        type="email"
        placeholder="Email"
        autocomplete="email"
      >

      <input
        id="viewerPassword"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
      >

      <button id="viewerLoginBtn" class="primary">
        ENTER HER STORY
      </button>

      <p id="viewerLoginMsg"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("viewerLoginBtn").onclick =
    loginViewer;
}

async function loginViewer() {
  const email =
    document.getElementById("viewerEmail")?.value.trim();

  const password =
    document.getElementById("viewerPassword")?.value;

  const msg =
    document.getElementById("viewerLoginMsg");

  if (!email || !password) {
    if (msg) msg.textContent = "Please enter email and password.";
    return;
  }

  if (!client) {
    if (msg) msg.textContent = "Website configuration error.";
    return;
  }

  if (msg) msg.textContent = "Signing in...";

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (msg) msg.textContent = error.message;
    return;
  }

  document.getElementById("viewerLogin")?.remove();

  await loadMemories();
}

/* ---------- ADMIN ---------- */

async function isAdmin() {
  if (!client) return false;

  const { data, error } =
    await client.rpc("is_admin");

  if (error) {
    console.error("Admin check error:", error);
    return false;
  }

  return data === true;
}

async function renderAdmin() {
  const adminSection =
    document.getElementById("admin");

  if (!adminSection || !client) return;

  const admin = await isAdmin();

  if (!admin) {
    adminSection.style.display = "none";
    return;
  }

  adminSection.style.display = "block";

  adminSection.innerHTML = `
    <div class="admin-panel">
      <h2>Private Admin</h2>

      <p>
        Memories are stored in a private vault.
      </p>

      <input
        id="files"
        type="file"
        accept="image/*,video/*"
        multiple
      >

      <button
        id="uploadBtn"
        class="primary"
      >
        Upload selected files
      </button>

      <button
        id="logoutBtn"
        class="secondary"
      >
        Logout
      </button>

      <p id="uploadMsg"></p>

      <div id="adminList"></div>
    </div>
  `;

  document.getElementById("uploadBtn").onclick =
    uploadFiles;

  document.getElementById("logoutBtn").onclick =
    logoutAdmin;

  renderAdminList();
}

async function renderAdminList() {
  const list =
    document.getElementById("adminList");

  if (!list) return;

  list.innerHTML = "";

  for (const item of memories) {
    const row = document.createElement("div");

    row.className = "admin-memory";

    row.innerHTML = `
      <span>${escapeHtml(item.title || item.path)}</span>
      <button
        class="delete-memory"
        data-path="${escapeHtml(item.path)}"
        data-id="${item.id}"
      >
        Delete
      </button>
    `;

    list.appendChild(row);
  }

  document
    .querySelectorAll(".delete-memory")
    .forEach(button => {
      button.addEventListener("click", () => {
        deleteMemory(
          button.dataset.id,
          button.dataset.path
        );
      });
    });
}

/* ---------- UPLOAD ---------- */

async function uploadFiles() {
  const input =
    document.getElementById("files");

  const msg =
    document.getElementById("uploadMsg");

  if (!input || !input.files.length) {
    if (msg) msg.textContent =
      "Please select a file first.";
    return;
  }

  if (!client) {
    if (msg) msg.textContent =
      "Website configuration error.";
    return;
  }

  if (!(await isAdmin())) {
    if (msg) msg.textContent =
      "Admin access required.";
    return;
  }

  const files = [...input.files];

  if (msg) msg.textContent =
    "Uploading securely...";

  for (const file of files) {
    const isMedia =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/");

    if (!isMedia) {
      if (msg) msg.textContent =
        `Skipped ${file.name}: unsupported file type`;
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      if (msg) msg.textContent =
        `Skipped ${file.name}: file is over 50 MB`;
      return;
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

    const upload =
      await client.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

    if (upload.error) {
      console.error(upload.error);

      if (msg) msg.textContent =
        `Upload failed: ${upload.error.message}`;

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
        .remove([path]);

      console.error(insert.error);

      if (msg) msg.textContent =
        `Database error: ${insert.error.message}`;

      return;
    }
  }

  if (msg) msg.textContent =
    "Upload complete ❤️";

  input.value = "";

  await loadMemories();
}

/* ---------- DELETE ---------- */

async function deleteMemory(id, path) {
  if (!client) return;

  if (!(await isAdmin())) {
    alert("Admin access required.");
    return;
  }

  const confirmed =
    confirm("Delete this memory?");

  if (!confirmed) return;

  const storageDelete =
    await client.storage
      .from(BUCKET)
      .remove([path]);

  if (storageDelete.error) {
    alert(storageDelete.error.message);
    return;
  }

  const dbDelete =
    await client
      .from("memories")
      .delete()
      .eq("id", id);

  if (dbDelete.error) {
    alert(dbDelete.error.message);
    return;
  }

  await loadMemories();
}

/* ---------- LOGOUT ---------- */

async function logoutAdmin() {
  if (!client) return;

  await client.auth.signOut();

  location.reload();
}

/* ---------- START WEBSITE ---------- */

window.addEventListener("load", async () => {
  setupIntro();

  if (!client) {
    console.error(
      "Supabase is not configured."
    );
    return;
  }

  const {
    data: { session }
  } = await client.auth.getSession();

  if (session) {
    await loadMemories();
  } else {
    showViewerLogin();
  }

  client.auth.onAuthStateChange(
    async (_event, newSession) => {
      if (newSession) {
        document
          .getElementById("viewerLogin")
          ?.remove();

        await loadMemories();
      }
    }
  );
});
