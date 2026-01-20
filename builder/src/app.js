(function() {
  'use strict';

  const articles = window.ARTICLES || [];

  let selectedTags = new Set();
  let searchQuery = '';
  let elements;

  function init() {
    elements = {
      searchInput: document.getElementById('searchInput'),
      tagCloud: document.getElementById('tagCloud'),
      articleList: document.getElementById('articleList'),
      resultCount: document.getElementById('resultCount'),
    };

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        render();
      });
    }

    if (elements.tagCloud) {
      elements.tagCloud.addEventListener('click', (e) => {
        // Find the button element even if child is clicked
        const btn = e.target.closest('.tag-btn');
        if (btn) {
          toggleTag(btn.dataset.tag);
        }
      });
    }

    render();
  }

  function toggleTag(tag) {
    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
    } else {
      selectedTags.add(tag);
    }
    updateTagButtons();
    render();
  }

  function updateTagButtons() {
    document.querySelectorAll('.tag-btn').forEach((btn) => {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function filterArticles(list) {
    if (selectedTags.size > 0) {
      list = list.filter((a) =>
        a.tags.some((tag) => selectedTags.has(tag))
      );
    }

    if (searchQuery) {
      list = list.filter((a) => {
        const title = a.title.toLowerCase();
        const description = (a.description || '').toLowerCase();
        return title.includes(searchQuery) || description.includes(searchQuery);
      });
    }

    return list;
  }

  function sortArticles(list) {
    return [...list].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');
  }

  function renderItem(article) {
    return `
      <a href="article/${article.id}.html" class="article-item">
        <div class="article-date">${formatDate(article.updatedAt)}</div>
        <h2 class="article-title">${article.title}</h2>
        ${article.description ? `<p class="text-[var(--fg-light)] mt-2 line-clamp-2">${article.description}</p>` : ''}
      </a>
    `;
  }

  function render() {
    let list = filterArticles(articles);
    list = sortArticles(list);

    const container = elements.articleList;
    if (list.length === 0) {
      container.innerHTML = '<div class="py-12 text-center text-[var(--fg-light)]">No articles found</div>';
      if (elements.resultCount) elements.resultCount.textContent = '0 Total';
      return;
    }

    container.innerHTML = list
      .map((article) => renderItem(article))
      .join('');
      
    if (elements.resultCount) {
      elements.resultCount.textContent = `${list.length} Total`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
