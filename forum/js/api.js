const API = 'http://localhost:8080/api';

/* ── Session ───────────────────────────────────────── */
const Session = {
    get()        { try { return JSON.parse(localStorage.getItem('yo_user')) || null; } catch { return null; } },
    set(user)    { localStorage.setItem('yo_user', JSON.stringify(user)); },
    clear()      { localStorage.removeItem('yo_user'); },
    id()         { return Session.get()?.id   || null; },
    username()   { return Session.get()?.username || null; },
    role()       { return Session.get()?.role || null; },
    isAdmin()    { return Session.role() === 'admin'; },
    isLoggedIn() { return !!Session.get(); },
};

/* ── HTTP helpers ──────────────────────────────────── */
async function http(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(API + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.message || 'Erreur'), { status: res.status, data });
    return data;
}
const get    = (p)    => http('GET',    p);
const post   = (p, b) => http('POST',   p, b);
const patch  = (p, b) => http('PATCH',  p, b);
const del    = (p)    => http('DELETE', p);

/* ── Toast ─────────────────────────────────────────── */
function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `yo-toast yo-toast--${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}

/* ── Guard: redirect to login if not logged in ─────── */
function requireAuth() {
    if (!Session.isLoggedIn()) {
        window.location.href = '/pages/login.html';
        return false;
    }
    return true;
}

/* ── Guard: redirect if admin page but not admin ────── */
function requireAdmin() {
    if (!Session.isLoggedIn() || !Session.isAdmin()) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

/* ── Sidebar: show/hide admin icon based on role ────── */
function initSidebar() {
    const adminLi = document.querySelector('[title="Admin"]');
    if (adminLi) adminLi.style.display = Session.isAdmin() ? '' : 'none';

    const logoutBtn = document.querySelector('.sidebar__login .login-btn, .sidebar__login a');
    if (logoutBtn) {
        if (Session.isLoggedIn()) {
            logoutBtn.textContent = 'Log out';
            logoutBtn.href        = '#';
            logoutBtn.onclick     = (e) => { e.preventDefault(); Session.clear(); window.location.href = '/pages/login.html'; };
        } else {
            logoutBtn.textContent = 'Log in';
            logoutBtn.href        = '/pages/login.html';
        }
    }

    if (Session.isLoggedIn()) loadNotifDot();
}

/* ── Notification dot ───────────────────────────────── */
async function loadNotifDot() {
    try {
        const data = await get(`/notifications/${Session.id()}`);
        document.querySelectorAll('.notif-dot').forEach(dot => {
            dot.style.display = data.unread > 0 ? '' : 'none';
        });
    } catch {}
}

/* ── Relative time ──────────────────────────────────── */
function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)   return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400)return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800)return `il y a ${Math.floor(diff / 86400)}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
}

/* ── Status badge HTML ──────────────────────────────── */
function statusBadge(state) {
    const map = {
        open:     ['open',     'OUVERT'],
        closed:   ['closed',   'FERMÉ'],
        archived: ['archived', 'ARCHIVÉ'],
    };
    const [cls, label] = map[state] || ['open', 'OUVERT'];
    return `<span class="topic-status topic-status--${cls}"><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></svg>${label}</span>`;
}

/* ── Avatar ─────────────────────────────────────────── */
function avatar(url, username, size = 36) {
    if (url) return `<img src="${url}" alt="${username}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover">`;
    const initials = (username || '?')[0].toUpperCase();
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:${size * 0.38}px;color:var(--secondary)">${initials}</div>`;
}
