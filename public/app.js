// ========================================
// DOM Elements
// ========================================
const urlInput = document.getElementById('youtube-url');
const convertBtn = document.getElementById('convert-btn');
const clearBtn = document.getElementById('clear-btn');
const errorMsg = document.getElementById('error-msg');
const loading = document.getElementById('loading');
const videoPreview = document.getElementById('video-preview');
const videoThumbnail = document.getElementById('video-thumbnail');
const videoTitle = document.getElementById('video-title');
const videoAuthor = document.getElementById('video-author');
const videoDuration = document.getElementById('video-duration');
const videoViews = document.getElementById('video-views');
const downloadBtn = document.getElementById('download-btn');

let currentUrl = '';

// ========================================
// Utility Functions
// ========================================
function formatDuration(seconds) {
  const s = parseInt(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatViews(count) {
  const n = parseInt(count);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B vistas`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M vistas`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K vistas`;
  return `${n} vistas`;
}

function showError(message) {
  errorMsg.textContent = `⚠️ ${message}`;
  errorMsg.style.display = 'flex';
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}

function hideError() {
  errorMsg.style.display = 'none';
}

function setLoading(isLoading) {
  loading.style.display = isLoading ? 'flex' : 'none';
  convertBtn.disabled = isLoading;

  if (isLoading) {
    videoPreview.style.display = 'none';
    hideError();
  }
}

function isValidYouTubeUrl(url) {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^(https?:\/\/)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^(https?:\/\/)?m\.youtube\.com\/watch\?v=[\w-]+/,
  ];
  return patterns.some(p => p.test(url.trim()));
}

// ========================================
// Core Functions
// ========================================
async function fetchVideoInfo(url) {
  setLoading(true);

  try {
    const response = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener información');
    }

    currentUrl = url;

    // Populate preview
    videoThumbnail.src = data.thumbnail;
    videoTitle.textContent = data.title;
    videoAuthor.textContent = data.author;
    videoDuration.textContent = formatDuration(data.duration);
    videoViews.querySelector('span').textContent = formatViews(data.viewCount);

    videoPreview.style.display = 'flex';
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

function downloadMP3() {
  if (!currentUrl) return;

  downloadBtn.classList.add('downloading');
  downloadBtn.querySelector('span').textContent = 'Descargando...';

  // Use a hidden link to trigger download
  const downloadUrl = `/api/download?url=${encodeURIComponent(currentUrl)}`;
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Reset button after a delay
  setTimeout(() => {
    downloadBtn.classList.remove('downloading');
    downloadBtn.querySelector('span').textContent = 'Descargar MP3';
  }, 3000);
}

// ========================================
// Event Listeners
// ========================================

// Convert button
convertBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) {
    showError('Por favor, pega un enlace de YouTube');
    urlInput.focus();
    return;
  }
  if (!isValidYouTubeUrl(url)) {
    showError('El enlace no parece ser una URL de YouTube válida');
    return;
  }
  fetchVideoInfo(url);
});

// Enter key
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    convertBtn.click();
  }
});

// Clear button visibility
urlInput.addEventListener('input', () => {
  clearBtn.style.display = urlInput.value.length > 0 ? 'flex' : 'none';
});

// Clear button
clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  clearBtn.style.display = 'none';
  videoPreview.style.display = 'none';
  hideError();
  currentUrl = '';
  urlInput.focus();
});

// Download button
downloadBtn.addEventListener('click', downloadMP3);

// Auto-paste from clipboard on focus (nice UX touch)
urlInput.addEventListener('focus', async () => {
  if (urlInput.value.length === 0) {
    try {
      const text = await navigator.clipboard.readText();
      if (isValidYouTubeUrl(text)) {
        urlInput.value = text;
        clearBtn.style.display = 'flex';
        urlInput.select();
      }
    } catch {
      // Clipboard access denied — that's fine
    }
  }
});
