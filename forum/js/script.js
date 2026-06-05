/* index.html — topics list */

const SIDEBAR_HTML_NOTIF = `
    <li title="Notifications" style="position:relative">
        <a href="./pages/notifications.html">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span class="notif-dot" style="position:absolute;top:8px;right:8px;width:7px;height:7px;background:#e0315a;border-radius:50%;border:2px solid var(--neutral);display:none"></span>
        </a>
    </li>`;

let currentPage   = 1;
let currentLimit  = 10;
let currentTag    = null;
let currentSearch = '';
let totalTopics   = 0;

async function loadTopics() {
    const list = document.getElementById('topicList');
    list.innerHTML = '<div class="yo-spinner"></div>';

    const params = new URLSearchParams({ page: currentPage, limit: currentLimit });
    if (currentTag)    params.set('tag',    currentTag);
    if (currentSearch) params.set('search', currentSearch);
    if (Session.id())  params.set('userId', Session.id());

    try {
        const data = await get('/topics?' + params);
        totalTopics = data.total;
        renderTopics(data.topics);
        renderPagination(data.total, data.page, data.limit);
    } catch (err) {
        list.innerHTML = `<div class="yo-empty">Impossible de charger les topics.</div>`;
    }
}

function renderTopics(topics) {
    const list = document.getElementById('topicList');
    if (!topics.length) {
        list.innerHTML = '<div class="yo-empty">Aucune conversation pour le moment.</div>';
        return;
    }
    list.innerHTML = topics.map(t => `
        <article class="topic__msg" data-id="${t.id}">
            <div class="info">
                <div class="author" onclick="window.location.href='./pages/user.html?id=${t.user_id}'">
                    <div class="avatar-wrap">${avatar(t.avatar_url, t.author, 36)}</div>
                    <div class="author__meta">
                        <span class="author__name">${t.author}</span>
                        <span class="author__tag">${(t.tags[0] || 'GÉNÉRAL').toUpperCase()}</span>
                    </div>
                </div>
                <div class="date">${timeAgo(t.created_at).toUpperCase()}</div>
            </div>
            ${statusBadge(t.state)}
            <div class="message" onclick="window.location.href='./pages/post.html?id=${t.id}'" style="cursor:pointer">
                <h2>${escHtml(t.title)}</h2>
                <p>${escHtml((t.body || '').substring(0, 180))}${(t.body || '').length > 180 ? '…' : ''}</p>
            </div>
            <div class="actions">
                <button class="action-btn" onclick="window.location.href='./pages/post.html?id=${t.id}'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </button>
                <button class="action-btn action-btn--share" onclick="navigator.clipboard.writeText(location.origin+'/pages/post.html?id=${t.id}');toast('Lien copié !','success')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                ${t.user_id === Session.id() ? `
                <button class="action-btn action-btn--share" onclick="deleteTopic(${t.id}, this)" title="Supprimer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>` : ''}
            </div>
        </article>
    `).join('');
}

async function deleteTopic(id, btn) {
    if (!confirm('Supprimer ce topic ?')) return;
    try {
        await del('/topics/' + id);
        btn.closest('.topic__msg').remove();
        toast('Topic supprimé', 'success');
    } catch (err) { toast(err.message, 'error'); }
}

function renderPagination(total, page, limit) {
    const info    = document.getElementById('paginationInfo');
    const numBtns = document.getElementById('pageNumbers');
    if (!info || !numBtns) return;

    const realLimit = limit >= 10000 ? total : limit;
    const from = total === 0 ? 0 : (page - 1) * realLimit + 1;
    const to   = Math.min(page * realLimit, total);
    info.textContent = `Affichage ${from}–${to} sur ${total}`;

    const pages = Math.ceil(total / realLimit) || 1;
    numBtns.innerHTML = '';
    for (let i = 1; i <= Math.min(pages, 7); i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === page ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; loadTopics(); };
        numBtns.appendChild(btn);
    }
}

function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();

    /* category filter */
    document.querySelectorAll('.category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTag  = btn.dataset.cat === 'all' ? null : btn.dataset.cat;
            currentPage = 1;
            loadTopics();
        });
    });

    /* search */
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentSearch = searchInput.value.trim();
                currentPage   = 1;
                loadTopics();
            }, 350);
        });
    }

    /* per-page select */
    const perPage = document.getElementById('perPageSelect');
    if (perPage) {
        perPage.addEventListener('change', () => {
            currentLimit = perPage.value === 'all' ? 10000 : parseInt(perPage.value);
            currentPage  = 1;
            loadTopics();
        });
    }

    loadTopics();
});
