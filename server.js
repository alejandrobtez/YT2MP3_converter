const express = require('express');
const path = require('path');
const cors = require('cors');
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Refresh PATH to pick up newly installed tools
const refreshedPath = [
  process.env.PATH,
  path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links'),
  'C:\\Program Files\\nodejs',
].join(';');
process.env.PATH = refreshedPath;

// Helper: find yt-dlp executable
function getYtDlpPath() {
  const wingetLinks = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links', 'yt-dlp.exe');
  if (fs.existsSync(wingetLinks)) return wingetLinks;
  return 'yt-dlp'; // fallback to PATH
}

const YT_DLP = getYtDlpPath();

// Validate YouTube URL
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

// Get video info using yt-dlp
app.get('/api/info', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Se requiere una URL de YouTube' });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'URL de YouTube inválida' });
  }

  // Use yt-dlp to get JSON metadata
  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    url,
  ];

  execFile(YT_DLP, args, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error getting video info:', error.message);
      if (stderr) console.error('stderr:', stderr);
      return res.status(500).json({ error: 'No se pudo obtener la información del video. Verifica la URL.' });
    }

    try {
      const info = JSON.parse(stdout);
      res.json({
        title: info.title || 'Sin título',
        author: info.uploader || info.channel || 'Desconocido',
        thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1].url : ''),
        duration: info.duration || 0,
        viewCount: info.view_count || 0,
      });
    } catch (parseError) {
      console.error('Error parsing video info:', parseError.message);
      res.status(500).json({ error: 'Error al procesar la información del video.' });
    }
  });
});

// Download audio as MP3 using yt-dlp + ffmpeg (temp file approach)
app.get('/api/download', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Se requiere una URL de YouTube' });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'URL de YouTube inválida' });
  }

  // Create a unique temp directory for this download
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt2mp3-'));
  const outputTemplate = path.join(tmpDir, '%(title)s.%(ext)s');

  const args = [
    '--no-playlist',
    '--no-warnings',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', outputTemplate,
    url,
  ];

  // Cleanup helper
  function cleanup() {
    try {
      const files = fs.readdirSync(tmpDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tmpDir, file));
      }
      fs.rmdirSync(tmpDir);
    } catch (e) {
      // ignore cleanup errors
    }
  }

  const ytdlp = spawn(YT_DLP, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderrOutput = '';

  ytdlp.stderr.on('data', (data) => {
    stderrOutput += data.toString();
  });

  ytdlp.on('error', (err) => {
    console.error('Spawn error:', err.message);
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al iniciar la descarga.' });
    }
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.error(`yt-dlp exited with code ${code}`, stderrOutput);
      cleanup();
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Error durante la conversión del audio.' });
      }
      return;
    }

    // Find the resulting .mp3 file
    try {
      const files = fs.readdirSync(tmpDir);
      const mp3File = files.find(f => f.endsWith('.mp3'));

      if (!mp3File) {
        console.error('No MP3 file found in temp dir. Files:', files);
        cleanup();
        return res.status(500).json({ error: 'Error: no se generó el archivo MP3.' });
      }

      const mp3Path = path.join(tmpDir, mp3File);
      const stat = fs.statSync(mp3Path);
      const safeName = mp3File.replace(/[^\w\s\-.()\[\]]/g, '').trim() || 'audio.mp3';

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

      const fileStream = fs.createReadStream(mp3Path);
      fileStream.pipe(res);

      fileStream.on('end', cleanup);
      fileStream.on('error', (err) => {
        console.error('File stream error:', err.message);
        cleanup();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error al enviar el archivo.' });
        }
      });
    } catch (err) {
      console.error('Error reading temp dir:', err.message);
      cleanup();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al procesar el archivo.' });
      }
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    if (ytdlp.exitCode === null) {
      ytdlp.kill('SIGTERM');
    }
    // Delay cleanup to let process finish
    setTimeout(cleanup, 2000);
  });
});

app.listen(PORT, () => {
  console.log(`🎵 YouTube to MP3 Converter corriendo en http://localhost:${PORT}`);
  console.log(`   Usando yt-dlp: ${YT_DLP}`);
});
