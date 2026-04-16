/* ─── CATEGORY FILTER ─────────────────────────────────── */
document.querySelectorAll('.category').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

/* ─── LIKE TOGGLE ─────────────────────────────────────── */
document.querySelectorAll('.action-btn').forEach(btn => {
    if (!btn.querySelector('path[d*="M20.84"]')) return; // only heart buttons
    btn.addEventListener('click', () => {
        const isLiked = btn.classList.toggle('liked');
        const span = btn.querySelector('span');
        const count = parseInt(span.textContent, 10);
        span.textContent = isLiked ? count + 1 : count - 1;
        if (isLiked) {
            btn.querySelector('svg path') && btn.querySelector('svg').setAttribute('fill', 'currentColor');
            btn.style.color = '#e0315a';
        } else {
            btn.querySelector('svg').setAttribute('fill', 'none');
            btn.style.color = '';
        }
    });
});