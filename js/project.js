/* ===========================================================
   Renders a single project detail page from ?id=<slug>,
   reading data from window.PROJECTS (projects-data.js).
   =========================================================== */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  const detail = document.getElementById('detail');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const data = (window.PROJECTS || {})[id];

  if (!data) {
    detail.innerHTML =
      '<a class="detail__back" href="index.html#projects">← Back to projects</a>' +
      '<h1 class="detail__title">Project not found</h1>' +
      '<p class="detail__tagline">We couldn\'t find that project. Head back and pick one from the list.</p>';
    document.title = 'Project not found · Kavindu Dilshan';
    return;
  }

  document.title = data.title + ' · Kavindu Dilshan';

  const stack = (data.stack || [])
    .map((s) => '<li>' + esc(s) + '</li>')
    .join('');
  const highlights = (data.highlights || [])
    .map((h) => '<li>' + esc(h) + '</li>')
    .join('');
  const githubBtn = data.github
    ? '<a class="btn btn--primary" href="' + esc(data.github) + '" target="_blank" rel="noopener">⌥ View on GitHub</a>'
    : '';

  detail.innerHTML =
    '<a class="detail__back" href="index.html#projects">← Back to projects</a>' +
    '<span class="card__badge">' + esc(data.badge || 'Project') + '</span>' +
    '<h1 class="detail__title">' + esc(data.title) + '</h1>' +
    (data.period ? '<p class="detail__period">' + esc(data.period) + '</p>' : '') +
    '<p class="detail__tagline">' + esc(data.tagline || '') + '</p>' +
    '<h2 class="detail__h">Tech Stack</h2>' +
    '<ul class="chips">' + stack + '</ul>' +
    '<h2 class="detail__h">What I Built</h2>' +
    '<ul class="detail__list">' + highlights + '</ul>' +
    '<div class="detail__actions">' + githubBtn +
    '<a class="btn btn--ghost" href="index.html#contact">Get in touch →</a></div>';
})();
