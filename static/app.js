const API_BASE = "";

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function showScreen(id) {
  ["login-screen", "register-screen", "app-screen"].forEach((sid) => {
    const el = document.getElementById(sid);
    if (el) el.classList.toggle("hidden", sid !== id);
  });
}

// ----- Auth -----
async function login(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/jwt/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(getErrorDetail(data) || `Giriş başarısız (${res.status})`);
  }
  if (!data.access_token) throw new Error("Sunucu token döndürmedi");
  return data.access_token;
}

async function register(email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(getErrorDetail(data) || `Kayıt başarısız (${res.status})`);
  }
}

// ----- Feed -----
async function fetchFeed() {
  const token = getToken();
  if (!token) return { posts: [] };
  const res = await fetch(`${API_BASE}/feed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    setToken(null);
    return { posts: [] };
  }
  if (!res.ok) throw new Error("Feed yüklenemedi");
  return res.json();
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Az önce";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
  return d.toLocaleDateString("tr-TR");
}

function renderPost(post) {
  const card = document.createElement("div");
  card.className = "post-card";
  const isVideo = post.file_type === "video";
  const media = isVideo
    ? `<video class="post-media video" src="${post.url}" controls></video>`
    : `<img class="post-media" src="${post.url}" alt="" loading="lazy" />`;
  card.innerHTML = `
    ${media}
    <div class="post-body">
      <div class="post-meta">
        <span class="post-author">${escapeHtml(post.email)}</span>
        <span class="post-date">${formatDate(post.created_at)}</span>
      </div>
      ${post.caption ? `<p class="post-caption">${escapeHtml(post.caption)}</p>` : ""}
      ${post.is_owner ? `<div class="post-actions"><button type="button" class="btn btn-danger btn-delete" data-id="${post.id}">Sil</button></div>` : ""}
    </div>
  `;
  const delBtn = card.querySelector(".btn-delete");
  if (delBtn) {
    delBtn.addEventListener("click", () => deletePost(post.id, card));
  }
  return card;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

async function deletePost(id, cardEl) {
  if (!confirm("Bu paylaşımı silmek istediğine emin misin?")) return;
  const token = getToken();
  if (!token) return;
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    cardEl.remove();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.detail || "Silinemedi");
  }
}

async function loadFeed() {
  const feedEl = document.getElementById("feed");
  const loadingEl = document.getElementById("loading-feed");
  const emptyEl = document.getElementById("empty-feed");
  feedEl.innerHTML = "";
  show(loadingEl);
  hide(emptyEl);
  hide(feedEl);
  try {
    const data = await fetchFeed();
    hide(loadingEl);
    if (!data.posts || data.posts.length === 0) {
      show(emptyEl);
      return;
    }
    show(feedEl);
    data.posts.forEach((post) => feedEl.appendChild(renderPost(post)));
  } catch (e) {
    hide(loadingEl);
    show(emptyEl);
    emptyEl.textContent = "Feed yüklenirken hata: " + e.message;
  }
}

// ----- Upload -----
async function upload(file, caption) {
  const token = getToken();
  if (!token) throw new Error("Oturum yok");
  const form = new FormData();
  form.append("file", file);
  form.append("caption", caption);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Yükleme başarısız");
  }
  return res.json();
}

// ----- Init -----
document.getElementById("go-register").addEventListener("click", (e) => {
  e.preventDefault();
  showScreen("register-screen");
  document.getElementById("register-error").classList.add("hidden");
});

document.getElementById("go-login").addEventListener("click", (e) => {
  e.preventDefault();
  showScreen("login-screen");
  document.getElementById("login-error").classList.add("hidden");
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  errEl.classList.add("hidden");
  try {
    const token = await login(email, password);
    setToken(token);
    showScreen("app-screen");
    loadFeed();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("register-error");
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  errEl.classList.add("hidden");
  try {
    await register(email, password);
    const token = await login(email, password);
    setToken(token);
    showScreen("app-screen");
    loadFeed();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  setToken(null);
  showScreen("login-screen");
});

document.getElementById("btn-refresh").addEventListener("click", () => loadFeed());

document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById("upload-status");
  const fileInput = document.getElementById("upload-file");
  const caption = document.getElementById("upload-caption").value.trim();
  const file = fileInput.files[0];
  if (!file) return;
  statusEl.textContent = "Yükleniyor...";
  statusEl.className = "upload-status";
  try {
    await upload(file, caption);
    statusEl.textContent = "Paylaşım eklendi.";
    statusEl.className = "upload-status success";
    fileInput.value = "";
    document.getElementById("upload-caption").value = "";
    loadFeed();
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = "upload-status error";
  }
});

if (getToken()) {
  showScreen("app-screen");
  loadFeed();
} else {
  showScreen("login-screen");
}
