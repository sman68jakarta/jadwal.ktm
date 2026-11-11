import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

/**
 * Server-side proxy for Google Sheets
 * Completely eliminates Browser CORS and iFrame restrictions!
 */
app.get('/api/sync-sheets', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ 
      success: false, 
      error: 'Parameter "url" wajib diisi.' 
    });
  }

  try {
    let fetchUrl = targetUrl.trim();

    if (fetchUrl.includes('/spreadsheets/d/e/')) {
      fetchUrl = fetchUrl
        .replace(/\/pubhtml.*$/, '/pub?output=csv')
        .replace(/\/pub\?.*$/, '/pub?output=csv');
      if (!fetchUrl.includes('output=csv')) {
        fetchUrl += '/pub?output=csv';
      }
    } else {
      const idMatch = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        const spreadsheetId = idMatch[1];
        let gid = '0';
        const gidMatch = fetchUrl.match(/[#&?]gid=([0-9]+)/);
        if (gidMatch && gidMatch[1]) {
          gid = gidMatch[1];
        }
        fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
      }
    }

    // Fetch from Node.js runtime (no CORS, no iframe restrictions)
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv, text/plain, */*'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      // Try alternate export URL
      const altUrl = fetchUrl.includes('gviz/tq')
        ? fetchUrl.replace('gviz/tq?tqx=out:csv', 'export?format=csv')
        : fetchUrl;

      const altRes = await fetch(altUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/csv, text/plain, */*'
        },
        redirect: 'follow'
      });

      if (!altRes.ok) {
        return res.status(400).json({
          success: false,
          error: `Google Sheets mengembalikan kode respon ${response.status} (${response.statusText}). Pastikan opsi 'Akses umum' di Google Drive sudah dipilih: 'Siapa saja yang memiliki link' -> 'Pelihat (Viewer)'.`
        });
      }

      const altText = await altRes.text();
      return res.json({ success: true, csv: altText });
    }

    const csvData = await response.text();
    return res.json({ success: true, csv: csvData });
  } catch (error: any) {
    console.error('Server Sheets Proxy Error:', error);
    return res.status(500).json({
      success: false,
      error: `Gagal membaca Google Spreadsheet: ${error.message}`
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
