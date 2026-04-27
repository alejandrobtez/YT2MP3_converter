# 🎵 YT2MP3 — YouTube to MP3 Converter

### Fast, clean audio extraction from any YouTube video — no ads, no tracking, no nonsense

---

## 📖 About the Project

**YT2MP3** is a minimal, self-hosted web application that converts any YouTube video into a high-quality MP3 file in just a few clicks.

The project addresses a simple frustration: most online converters are riddled with pop-up ads, impose file size limits, or outright fail on longer videos. This tool runs entirely on your own machine using **yt-dlp** and **ffmpeg** under the hood, giving you the best audio quality available while keeping full control of your data.

---

## 🖥️ The Interface

A single, focused page: paste a YouTube link, preview the video details, and download.

![Home Screen](img/home.png)
> **Fig 1.** *Home Screen: Dark glassmorphism UI with animated background. Supports youtube.com, youtu.be, Shorts, and mobile links.*

---

## 🔍 Video Preview

Before downloading, the app fetches the video's metadata and displays a preview card so you always know what you're converting.

![Video Preview](img/preview.png)
> **Fig 2.** *Preview Card: Thumbnail, title, channel name, duration badge, and view count — all pulled live from YouTube before any download starts.*

---

## ⬇️ Download Flow

Once you confirm the video, the server extracts the audio stream, converts it to MP3 at the best available quality, and streams it directly to your browser — no file is left on the server after the transfer completes.

![Downloading State](img/download.png)
> **Fig 3.** *Download in progress: The button updates its state while the conversion runs server-side. The temp file is cleaned up automatically after delivery.*

---

## 📱 Responsive Design

The interface adapts seamlessly to any screen size, making it just as usable on mobile as on desktop.

![Mobile View](img/mobile.png)
> **Fig 4.** *Mobile layout: The input group and feature cards stack vertically. The clipboard auto-paste feature works on mobile browsers too.*

---

## ⚙️ How It Works

```
User pastes URL
      │
      ▼
 [Frontend] validates URL format (regex patterns)
      │
      ▼
 GET /api/info?url=...
      │
      ▼
 [Server] runs yt-dlp --dump-json
      │
      ▼
 Returns: title, author, thumbnail, duration, views
      │
      ▼
 User clicks "Descargar MP3"
      │
      ▼
 GET /api/download?url=...
      │
      ▼
 [Server] runs yt-dlp --extract-audio --audio-format mp3 --audio-quality 0
      │
      ▼
 MP3 streamed to browser → temp dir cleaned up
```

### Key behaviours
- **Auto-paste from clipboard:** On input focus, if the clipboard contains a valid YouTube URL it is pasted automatically.
- **Client disconnect handling:** If the user closes the tab mid-download, the server kills the yt-dlp process and cleans up the temp file immediately.
- **URL support:** `youtube.com/watch`, `youtube.com/shorts`, `youtu.be`, `youtube.com/embed`, `m.youtube.com`.

---

## 🛠️ Technologies Used

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla HTML5, CSS3 (custom properties, glassmorphism, CSS animations), Vanilla JavaScript (ES2022) |
| **Backend** | Node.js, Express 4 |
| **Audio extraction** | [yt-dlp](https://github.com/yt-dlp/yt-dlp) + ffmpeg |
| **Design** | Inter font, animated radial-gradient blobs, `backdrop-filter: blur` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **yt-dlp** — install via winget: `winget install yt-dlp`
- **ffmpeg** — install via winget: `winget install ffmpeg`

### Installation

```bash
git clone https://github.com/alejandrobtez/converter.git
cd converter
npm install
```

### Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
converter/
├── server.js          # Express server, /api/info and /api/download endpoints
├── package.json
└── public/
    ├── index.html     # Single-page app markup
    ├── style.css      # All styles — variables, layout, animations
    └── app.js         # Client-side logic — fetch, preview, download trigger
```

---

## ⚠️ Disclaimer

This tool is intended for **personal and educational use only**. Only download content you own or have permission to download. Respect YouTube's [Terms of Service](https://www.youtube.com/t/terms) and copyright law.

---

## 👨‍💻 Hecho por alejandrobtez

<div align="center">

<img src="https://github.com/alejandrobtez.png" width="100" style="border-radius:50%" alt="alejandrobtez"/>

### Alejandro Benítez

[![GitHub](https://img.shields.io/badge/GitHub-alejandrobtez-181717?style=for-the-badge&logo=github)](https://github.com/alejandrobtez)
[![Email](https://img.shields.io/badge/Email-alejandrobenitez91203%40gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:alejandrobenitez91203@gmail.com)

</div>

---

<div align="center">

| | |
|:---|:---|
| 🎓 **Formación** | Máster en Inteligencia Artificial & Big Data |
| 💻 **Rol** | Full Stack Developer |
| 🔧 **Especialidad** | Web tooling, automatización y proyectos con IA |
| 🌍 **Ubicación** | España |
| 🚀 **Actualmente** | Construyendo herramientas prácticas que resuelven problemas reales |

</div>

---

**Stack habitual:**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)

<div align="center">

[![GitHub Stats](https://github-readme-stats.vercel.app/api?username=alejandrobtez&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0a0a0f&title_color=8b5cf6&icon_color=8b5cf6&text_color=f0f0f5)](https://github.com/alejandrobtez)

</div>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
