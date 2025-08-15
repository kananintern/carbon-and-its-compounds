# 🧬 Carbon and its Compounds - Molecular Explorer

A web-based molecular visualization tool for exploring carbon compounds and their 3D structures. Built with vanilla JavaScript and 3Dmol.js for interactive molecular visualization.

---

## 🚀 Features

* **Interactive 3D Molecular Visualization**: Rotate, zoom, and explore molecules in 3D space
* **Smart Search with Autocomplete**: Type-ahead suggestions with fuzzy matching and synonyms
* **Multiple Visualization Styles**: Ball & stick, stick, space-filling, and wireframe representations
* **PubChem Integration**: Real-time fetching of molecular data from PubChem database
* **Responsive Design**: Works on desktop, tablet, and mobile devices
* **Download Support**: Export molecular structures as SDF files
* **Fullscreen Mode**: Immersive viewing experience
* **Keyboard Shortcuts**: Quick access to common functions

---

## 📁 Project Structure

```
molecular-explorer/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styles and animations
├── app.js              # JavaScript application logic
└── README.md           # This documentation file
```

---

## 🛠️ Setup and Installation

### Option 1: Simple Local Server

1. **Download the files**: Save all three files (`index.html`, `styles.css`, `app.js`) in the same directory

2. **Start a local server** (required for API calls):

   **Python 3:**

   ```bash
   python -m http.server 8000
   ```

   **Python 2:**

   ```bash
   python -m SimpleHTTPServer 8000
   ```

   **Node.js (if you have it installed):**

   ```bash
   npx http-server
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

### Option 2: Web Server Deployment

Upload all files to any web server (Apache, Nginx, etc.) and access via your domain.

### Option 3: Development with Live Reload

If you want live reload during development:

1. Install a tool like `live-server`:

   ```bash
   npm install -g live-server
   ```
2. Run in your project directory:

   ```bash
   live-server
   ```

---

## 🎯 Usage

### Basic Search

* Type compound names like `caffeine`, `aspirin`, `glucose`.
* Use common names like `sugar` (sucrose), `vinegar` (acetic acid), etc.
* Suggestions appear automatically as you type.

### Viewer Controls

* **Mouse**: Click and drag to rotate molecules
* **Scroll**: Zoom in and out
* **Style Dropdown**: Change visualization style
* **Reset Button**: Return to original view
* **Download**: Save molecule as SDF file
* **Fullscreen**: Toggle immersive view

### Keyboard Shortcuts

* `Ctrl+/` or `Cmd+/`: Focus search box
* `Ctrl+R` or `Cmd+R`: Reset view
* `Arrow Keys`: Navigate suggestions
* `Escape`: Hide suggestions
* `Enter`: Search or select suggestion

---

## 🧪 Supported Compounds

The application can search for thousands of compounds from the PubChem database, including:

* **Common Drugs**: aspirin, caffeine, acetaminophen, ibuprofen
* **Biological Molecules**: glucose, fructose, cholesterol, testosterone
* **Organic Compounds**: benzene, toluene, ethanol, methane
* **And many more…**

---

## 🎨 Visualization Styles

1. **Ball & Stick**: Atoms as spheres and bonds as sticks (good for understanding connectivity)
2. **Stick**: Bonds only, clean and minimal
3. **Space-filling**: Van der Waals spheres (shows molecular volume)
4. **Wireframe**: Thin line bonds (very light-weight)

---

## 🔧 Technical Details

### Dependencies

* **3Dmol.js**: For 3D molecular visualization (loaded via CDN)
* **PubChem REST API**: For molecular data and structure files
* **Modern Web Browser**: Supports ES6+, Fetch API, and WebGL

### Minimal HTML Includes

Make sure you import 3Dmol.js before `app.js` in your `index.html`:

```html
<!-- 3Dmol.js CDN -->
<script src="https://3dmol.org/build/3Dmol-min.js"></script>
<!-- Your app code -->
<script src="app.js" defer></script>
```

### API Endpoints Used

* **Compound Search (CIDs by name)**: `/rest/pug/compound/name/{name}/cids/JSON`
* **Molecular Properties**: `/rest/pug/compound/cid/{cid}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`
* **3D Structure (SDF)**: `/rest/pug/compound/cid/{cid}/record/SDF/?record_type=3d`
* **Synonyms**: `/rest/pug/compound/cid/{cid}/synonyms/JSON`

> Tip: Some compounds may not have a 3D record; the app falls back gracefully or will prompt you.

---

## 🔐 CORS & Security Notes

This application makes requests to the PubChem API, which **supports CORS**. However:

* **Run from a server** (localhost or hosted). Opening `index.html` via `file://` can block requests.
* **HTTPS recommended**: If your site is served over HTTPS, PubChem endpoints should be requested over HTTPS.
* **No API key needed**: PubChem PUG REST is public; there are soft rate limits.
* **Rate limiting/backoff**: If you make many queries quickly, you might see 4xx/5xx responses. The app implements a simple retry/backoff; avoid hammering the API.
* **Content Security Policy (CSP)**: If you add a CSP, allow `https://pubchem.ncbi.nlm.nih.gov` and `https://3dmol.org` (or the CDN you use) for scripts/requests.
* **Sanitize input**: User queries are sent as path params. We URL-encode queries and trim whitespace.

---

## ⚙️ Configuration & Customization

### Editing the Search Bar Size

In `styles.css`, you can control the search width and avoid icon overlap:

```css
/* prevent the input from stretching across the whole row */
.search-input-container { flex: none; width: 320px; }

/* give the text room so it doesn’t overlap the icon */
.search-input { padding: var(--padding-sm) var(--padding-sm) var(--padding-sm) 2.5rem; }

/* keep the magnifier clickable area out of the way */
.search-icon { left: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; }
```

**Responsive only on desktop** (keep full width on mobile):

```css
@media (min-width: 768px) {
  .search-input-container { width: 320px; }
}
```

### Changing Default Style

Update the default visualization style in `app.js` where the viewer is initialized. For example:

```js
// viewer.setStyle({}, {stick:{}});
// viewer.setStyle({}, {sphere:{scale:0.25}});
```

### Color Theme

You can customize CSS variables in `:root` to change accent colors, radii, and shadows.

---

## 🧯 Troubleshooting

* **Blank viewer / black canvas**

  * Ensure your browser supports WebGL (chrome://gpu in Chrome).
  * Confirm 3Dmol.js is loaded **before** `app.js`.
  * Check console for errors about SDF parsing.

* **CORS or network errors**

  * Serve via `http://localhost:8000` (not `file://`).
  * Verify you’re online and endpoints load directly in the browser.

* **No 3D structure found**

  * Some CIDs lack 3D records; try another compound or different synonym.

* **Autocomplete not showing**

  * Make sure the input isn’t overlapped by the icon (see CSS above).
  * Check that the suggestions container isn’t `overflow:hidden` by a parent.

* **Mobile performance is laggy**

  * Use `stick` or `wireframe` style for heavy molecules.
  * Reduce sphere scales or bond thickness.

---

## ⚡ Performance Tips

* Debounce search input (already implemented) to reduce API calls.
* Cache recent results in memory (the app keeps a small LRU cache).
* Prefer `stick` on load; allow user to switch to heavier styles.
* Avoid re-creating the viewer—update styles on the existing model when possible.

---

## ♿ Accessibility

* Input and buttons are keyboard-focusable with visible focus rings.
* Suggestions support arrow navigation and `Enter` to select.
* Semantic labels and ARIA attributes are added for screen readers.

---

## 🧩 Implementation Notes (app.js)

* **Class**: `MolecularExplorer`
* **Core methods**:

  * `search(query)` → resolves CID, fetches properties and synonyms
  * `loadStructure(cid)` → downloads SDF (3D) and renders in viewer
  * `render(style)` → applies chosen 3Dmol.js style
  * `downloadSDF()` → triggers a client-side download of the current SDF
  * `bindEvents()` → wires input, buttons, keyboard shortcuts
* **Error handling**: user-friendly toasts with actionable messages
* **Caching**: recent CIDs and synonyms cached for quick back/forward

---

## 🧱 Known Limitations

* Not every compound in PubChem has a **3D** conformer; some queries return only 2D records.
* Very large biomolecules may render slowly in mobile browsers.
* The synonyms list from PubChem can be very long—app truncates to the most relevant.

---
