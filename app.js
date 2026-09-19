const SUPABASE_URL = "https://euifwxbpmutuodqtgrus.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3N78RDU-j93U3oO5FG3fQg_YRx5djWm";const BUCKET = "urja-memories";
const SIGNED_URL_SECONDS = 300; // 5 minutes

const client = (SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY !== "PASTE_SUPABASE_ANON_KEY_HERE")
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
let memories = [];

window.addEventListener("load", async () => {
document.getElementById("enterBtn").classList.remove("hidden");
document.getElementById("enterBtn").style.display = "inline-block";

document.getElementById("enterBtn").onclick = () => {
  document.getElementById("intro").style.display = "none";
  document.querySelector("header").style.display = "flex";
  document.querySelector("main").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

  if (!client) return;

  // The birthday viewer must authenticate before private media can be signed.
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    await loadMemories();
  } else {
    showViewerLogin();
  }

  client.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      document.getElementById("viewerLogin")?.remove();
      await loadMemories();
      setAdmin(true);
    } else {
      memories = [];
      renderMemories();
      showViewerLogin();
      setAdmin(false);
    }
  });
});

function showViewerLogin() {
  if (document.getElementById("viewerLogin")) return;

  const box = document.createElement("div");
  box.id = "viewerLogin";
  box.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,.96);z-index:900;display:grid;place-items:center;padding:25px;text-align:center";
  box.innerHTML = `
    <div style="max-width:430px;width:100%">
      <div style="color:#e50914;font-size:38px;font-weight:900;letter-spacing:4px">URJA</div>
      <h2>Private Birthday Vault 🔐</h2>
      <p style="color:#aaa;line-height:1.6">Enter the private access details to view Urja's photos and videos.</p>
      <input id="viewerEmail" type="email" placeholder="Email" style="padding:13px;margin:5px;width:90%;border-radius:5px;border:1px solid #444;background:#151515;color:#fff">
      <input id="viewerPassword" type="password" placeholder="Password" style="padding:13px;margin:5px;width:90%;border-radius:5px;border:1px solid #444;background:#151515;color:#fff">
      <button class="primary" onclick="viewerLogin()">ENTER STORY ❤️</button>
      <p id="viewerMsg" style="color:#bbb"></p>
    </div>`;
  document.body.appendChild(box);
}

async function viewerLogin() {
  if (!client) {
    document.getElementById("viewerMsg").textContent = "Add Supabase URL and anon key in app.js first.";
    return;
  }
  const email = document.getElementById("viewerEmail").value.trim();
  const password = document.getElementById("viewerPassword").value;
  const { error } = await client.auth.signInWithPassword({ email, password });
  document.getElementById("viewerMsg").textContent =
    error ? error.message : "Welcome ❤️";
}

async function loadMemories() {
  const { data, error } = await client.from("memories")
    .select("id,path,type,title,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  memories = data || [];
  renderMemories();
  renderAdmin();
}

async function signedUrl(path) {
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);

  if (error) {
    console.error(error);
    return null;
  }
  return data.signedUrl;
}

async function renderMemories() {
  const photos = document.getElementById("photos");
  const videos = document.getElementById("videos");
  photos.innerHTML = "";
  videos.innerHTML = "";

  for (const [i, m] of memories.entries()) {
    const url = await signedUrl(m.path);
    if (!url) continue;

    const div = document.createElement("div");
    div.className = "card" + (m.type === "video" ? " video" : "");
    const title = escapeHtml(m.title || `Memory ${i + 1}`);

    div.innerHTML = m.type === "video"
      ? `<video src="${url}" muted preload="metadata"></video><span>${title} 🎬</span>`
      : `<img src="${url}" loading="lazy" alt="Urja memory"><span>${title} ❤️</span>`;

    div.onclick = () => openMedia(url, m.type);
    (m.type === "video" ? videos : photos).appendChild(div);
  }
}

function openMedia(url, type) {
  document.getElementById("media").innerHTML =
    type === "video"
      ? `<video src="${url}" controls autoplay playsinline></video>`
      : `<img src="${url}" alt="Urja">`;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal(e) {
  if (e.target.id === "modal" || e.target.className === "close") {
    document.getElementById("modal").classList.add("hidden");
    document.getElementById("media").innerHTML = "";
  }
}

async function login() {
  if (!client) return alert("Add your Supabase URL and anon key in app.js first.");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const { error } = await client.auth.signInWithPassword({ email, password });
  document.getElementById("authMsg").textContent = error ? error.message : "Logged in.";
}

async function logout() {
  await client.auth.signOut();
}

function setAdmin(on) {
  document.getElementById("loginBox").classList.toggle("hidden", on);
  document.getElementById("panel").classList.toggle("hidden", !on);
  if (on) renderAdmin();
}

async function renderAdmin() {
  const box = document.getElementById("adminList");
  if (!box) return;
  box.innerHTML = "";

  for (const m of memories) {
    const d = document.createElement("div");
    d.className = "admin-item";
    d.innerHTML = `<span>${escapeHtml(m.title || m.path)}</span><button>Delete</button>`;
    d.querySelector("button").onclick = () => deleteMemory(m.id, m.path);
    box.appendChild(d);
  }
}

async function uploadFiles() {
  const files = [...document.getElementById("files").files];

  if (!files.length) {
    document.getElementById("uploadMsg").textContent = "Please select a file first.";
    return;
  }

  const msg = document.getElementById("uploadMsg");
  msg.textContent = "Uploading securely...";

  for (const file of files) {

    const isMedia =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/");

    if (!isMedia) {
      msg.textContent = `Skipped ${file.name}: unsupported file type`;
      return;
    }

    // Supabase bucket is limited to 50 MB
    if (file.size > 50 * 1024 * 1024) {
      msg.textContent = `Skipped ${file.name}: file is over 50 MB`;
      return;
    }

    const safe = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "_");

    const path = `${Date.now()}-${crypto.randomUUID()}-${safe}`;
    const type = file.type.startsWith("video/") ? "video" : "photo";

    const up = await client.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });

    if (up.error) {
      console.error("Storage upload error:", up.error);
      msg.textContent = `Upload failed: ${up.error.message}`;
      return;
    }

    const ins = await client
      .from("memories")
      .insert({
        path: path,
        type: type,
        title: file.name
      })
      .select()
      .single();

    if (ins.error) {
      await client.storage.from(BUCKET).remove([path]);
      console.error("Database error:", ins.error);
      msg.textContent = `Database error: ${ins.error.message}`;
      return;
    }
  }

  msg.textContent = "Upload complete ❤️";
  document.getElementById("files").value = "";
  await loadMemories();
}
