import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
import crypto from 'crypto';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static file serving for projects and images
const projectsDir = path.join(__dirname, 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}
app.use('/projects', express.static(projectsDir));
app.use('/images', express.static(projectsDir));

// Database configuration loader
const DB_CONFIG_FILE = path.join(__dirname, 'db_config.json');

function loadDbConfig() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'manualarch_db',
  };

  if (fs.existsSync(DB_CONFIG_FILE)) {
    try {
      const fileCfg = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf-8'));
      Object.assign(config, fileCfg);
    } catch (e) {
      console.warn(`[DB-WARN] Could not read db_config.json: ${e.message}`);
    }
  }
  return config;
}

let dbAvailable = null;
let lastDbCheckTime = 0;

async function getDbConnection() {
  const now = Date.now();
  if (dbAvailable === false && now - lastDbCheckTime < 60000) {
    return null;
  }

  const cfg = loadDbConfig();
  try {
    const conn = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      connectTimeout: 3000,
    });
    dbAvailable = true;
    return conn;
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049) {
      try {
        const connNoDb = await mysql.createConnection({
          host: cfg.host,
          port: cfg.port,
          user: cfg.user,
          password: cfg.password,
          connectTimeout: 3000,
        });
        await connNoDb.query(
          `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` DEFAULT CHARACTER SET utf8mb4;`
        );
        await connNoDb.end();
        dbAvailable = true;
        return await getDbConnection();
      } catch (createErr) {
        console.error(`[DB-ERROR] Failed auto-creating MySQL database \`${cfg.database}\`: ${createErr.message}`);
      }
    }
  }

  if (dbAvailable !== false) {
    console.warn('[DB-WARN] MySQL Connection failed. Using local filesystem fallback.');
  }
  dbAvailable = false;
  lastDbCheckTime = now;
  return null;
}

// ─── BASE64 IMAGE EXTRACTION ─────────────────────────────────────────────────
// Extracts base64 data URIs from HTML pages and saves them as image files.
// Returns the HTML with base64 replaced by file URLs.
function extractBase64Images(dataObj, projId) {
  if (!dataObj || !Array.isArray(dataObj.pages)) return dataObj;

  const imagesDir = path.join(projectsDir, projId, 'images');
  fs.mkdirSync(imagesDir, { recursive: true });

  // Match data:image/xxx;base64,... patterns
  const base64Regex = /data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)/g;
  let totalExtracted = 0;

  dataObj.pages = dataObj.pages.map(page => {
    if (!page.html) return page;

    const newHtml = page.html.replace(base64Regex, (match, ext, b64Data) => {
      try {
        // Create a deterministic filename from a hash of the base64 content
        const hash = crypto.createHash('md5').update(b64Data.substring(0, 1000)).digest('hex').substring(0, 12);
        const fileExt = ext === 'svg+xml' ? 'svg' : (ext === 'jpeg' ? 'jpg' : ext);
        const fileName = `extracted_${hash}.${fileExt}`;
        const filePath = path.join(imagesDir, fileName);

        // Only write if file doesn't already exist
        if (!fs.existsSync(filePath)) {
          const buffer = Buffer.from(b64Data, 'base64');
          fs.writeFileSync(filePath, buffer);
          totalExtracted++;
        }

        return `/projects/${projId}/images/${fileName}`;
      } catch (e) {
        // If extraction fails, keep the original base64
        return match;
      }
    });

    return { ...page, html: newHtml };
  });

  if (totalExtracted > 0) {
    console.log(`[AI-SERVER] 🖼️ Extracted ${totalExtracted} base64 images to files for project ${projId}`);
  }

  return dataObj;
}

async function initDb() {
  const conn = await getDbConnection();
  if (!conn) {
    return false;
  }

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM users;');
    if (rows && rows[0] && rows[0].cnt === 0) {
      await conn.query(`
        INSERT INTO users (id, name, email, password, role) VALUES
        ('usr_admin', 'Administrator', 'admin@manualarch.com', 'password123', 'Admin'),
        ('usr_user', 'Standard User', 'user@manualarch.com', 'user123', 'Editor');
      `);
      console.log('[DB-INIT] Seeded default MySQL admin & user accounts.');
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(128) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        folder_name VARCHAR(255),
        data_json LONGTEXT,
        user_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.end();
    console.log('[DB-INIT] ✅ MySQL Database & Tables initialized successfully!');
    return true;
  } catch (err) {
    console.error(`[DB-ERROR] Failed initializing MySQL tables: ${err.message}`);
    try { await conn.end(); } catch (e) {}
    return false;
  }
}

// ─── AUTH FALLBACK SYSTEM ───────────────────────────────────────────────────

const USERS_FALLBACK_FILE = path.join(projectsDir, 'users_fallback.json');

function loadLocalUsers() {
  if (fs.existsSync(USERS_FALLBACK_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FALLBACK_FILE, 'utf-8'));
    } catch (e) {}
  }
  const defaultUsers = [
    { id: 'usr_admin', name: 'Administrator', email: 'admin@manualarch.com', password: 'password123', role: 'Admin', created_at: new Date().toISOString() },
    { id: 'usr_user', name: 'Standard User', email: 'user@manualarch.com', password: 'user123', role: 'Editor', created_at: new Date().toISOString() },
  ];
  try {
    fs.writeFileSync(USERS_FALLBACK_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
  } catch (e) {}
  return defaultUsers;
}

function saveLocalUsers(users) {
  try {
    fs.writeFileSync(USERS_FALLBACK_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {}
}

// ─── AUTH ENDPOINTS ──────────────────────────────────────────────────────────

app.get('/api/auth/users', async (req, res) => {
  const conn = await getDbConnection();
  if (conn) {
    try {
      const [rows] = await conn.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC;');
      await conn.end();
      return res.json({ users: rows });
    } catch (e) {
      try { await conn.end(); } catch (err) {}
    }
  }
  const localUsers = loadLocalUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }));
  return res.json({ users: localUsers });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const conn = await getDbConnection();
    if (conn) {
      const [rows] = await conn.query('SELECT * FROM users WHERE LOWER(email) = ?;', [email]);
      await conn.end();

      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: 'Email tidak terdaftar.' });
      }

      const row = rows[0];
      if (row.password !== password) {
        return res.status(400).json({ error: 'Password salah.' });
      }

      return res.json({
        status: 'ok',
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
        },
      });
    }

    // Local fallback when DB is disconnected
    const localUsers = loadLocalUsers();
    const user = localUsers.find(u => u.email.toLowerCase() === email);
    if (!user) {
      return res.status(400).json({ error: 'Email tidak terdaftar.' });
    }
    if (user.password !== password) {
      return res.status(400).json({ error: 'Password salah.' });
    }
    return res.json({
      status: 'ok',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/add-user', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const role = req.body.role || 'Editor';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Semua field (Nama, Email, Password) wajib diisi.' });
    }

    const conn = await getDbConnection();
    if (conn) {
      const [existing] = await conn.query('SELECT * FROM users WHERE LOWER(email) = ?;', [email]);
      if (existing && existing.length > 0) {
        await conn.end();
        return res.status(400).json({ error: 'Email sudah terdaftar.' });
      }

      const userId = `usr_${Date.now()}`;
      await conn.query('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?);', [
        userId,
        name,
        email,
        password,
        role,
      ]);
      await conn.end();
      return res.json({ status: 'ok', message: `Pengguna ${name} (${email}) tersimpan.` });
    }

    // Local fallback
    const localUsers = loadLocalUsers();
    if (localUsers.some(u => u.email.toLowerCase() === email)) {
      return res.status(400).json({ error: 'Email sudah terdaftar.' });
    }
    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email,
      password,
      role,
      created_at: new Date().toISOString(),
    };
    localUsers.push(newUser);
    saveLocalUsers(localUsers);
    return res.json({ status: 'ok', message: `Pengguna ${name} (${email}) tersimpan.` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/delete-user', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const conn = await getDbConnection();
    if (conn) {
      await conn.query('DELETE FROM users WHERE LOWER(email) = ?;', [email]);
      await conn.end();
    }
    const localUsers = loadLocalUsers().filter(u => u.email.toLowerCase() !== email);
    saveLocalUsers(localUsers);
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── PROJECT ENDPOINTS ───────────────────────────────────────────────────────

function createLightDocument(parsedDoc, title) {
  if (!parsedDoc) return { meta: { title }, pages: [] };
  const meta = { ...(parsedDoc.meta || {}), title: (parsedDoc.meta?.title || title) };

  let coverImage = meta.coverImage;
  let coverPage = undefined;

  const pagesList = Array.isArray(parsedDoc.pages)
    ? parsedDoc.pages
    : Array.isArray(parsedDoc.generatedPages)
    ? parsedDoc.generatedPages
    : Array.isArray(parsedDoc.htmlPages)
    ? parsedDoc.htmlPages
    : [];

  coverPage = pagesList.find(p => p && (p.id === 'cover-page' || p.type === 'cover'));

  if (!coverImage && coverPage) {
    if (typeof coverPage.html === 'string') {
      const imgMatch = coverPage.html.match(/<img[\s\S]*?src=["']([\s\S]*?)["']/i);
      if (imgMatch && imgMatch[1]) {
        coverImage = imgMatch[1].replace(/[\r\n\t]/g, '').trim();
      }
    }
  }

  if (coverImage) {
    meta.coverImage = coverImage.replace(/[\r\n\t]/g, '').trim();
  }

  return {
    meta,
    pages: coverPage ? [coverPage] : [],
  };
}

app.get('/api/projects/list', async (req, res) => {
  const userEmail = (req.query.email || '').toString().trim().toLowerCase();
  const projectList = [];
  const seenIds = new Set();

  const conn = await getDbConnection();
  if (conn) {
    try {
      let rows = [];
      if (userEmail) {
        [rows] = await conn.query(
          `SELECT id, title, folder_name, data_json, user_email, updated_at 
           FROM projects 
           WHERE LOWER(user_email) = ? OR user_email IS NULL OR user_email = ''
           ORDER BY updated_at DESC;`,
          [userEmail]
        );
      } else {
        [rows] = await conn.query(
          'SELECT id, title, folder_name, data_json, user_email, updated_at FROM projects ORDER BY updated_at DESC;'
        );
      }
      await conn.end();

      for (const r of rows) {
        const updatedAt = r.updated_at ? (r.updated_at.toISOString ? r.updated_at.toISOString() : new Date(r.updated_at).toISOString()) : '';
        seenIds.add(r.id);
        const title = r.title || 'Untitled Project';

        let parsedDoc = { meta: { title }, pages: [] };
        if (r.data_json) {
          try {
            parsedDoc = typeof r.data_json === 'string' ? JSON.parse(r.data_json) : r.data_json;
          } catch (e) {}
        }
        if ((!parsedDoc.pages || parsedDoc.pages.length === 0) && r.id) {
          const localFile = path.join(projectsDir, r.id, 'data.json');
          if (fs.existsSync(localFile)) {
            try {
              parsedDoc = JSON.parse(fs.readFileSync(localFile, 'utf-8'));
            } catch (e) {}
          }
        }

        projectList.push({
          id: r.id,
          name: title,
          title: title,
          folder_name: r.folder_name,
          user_email: r.user_email || '',
          savedAt: updatedAt,
          document: createLightDocument(parsedDoc, title),
        });
      }
    } catch (e) {
      console.error(`[AI-SERVER] ⚠️ Error querying projects DB: ${e.message}`);
      try { await conn.end(); } catch (err) {}
    }
  }

  // Local filesystem fallback for any project folders missing in DB
  if (fs.existsSync(projectsDir)) {
    const folders = fs.readdirSync(projectsDir);
    for (const folder of folders) {
      if (seenIds.has(folder)) continue;
      const fullDir = path.join(projectsDir, folder);
      try {
        if (fs.statSync(fullDir).isDirectory()) {
          const dataFile = path.join(fullDir, 'data.json');
          if (fs.existsSync(dataFile)) {
            let title = folder;
            let mtime = '';
            let parsedDoc = { meta: { title }, pages: [] };
            try {
              const stat = fs.statSync(dataFile);
              mtime = stat.mtime ? stat.mtime.toISOString() : '';
              const content = fs.readFileSync(dataFile, 'utf-8');
              parsedDoc = JSON.parse(content);
              if (parsedDoc.docTitle || parsedDoc.title) {
                title = parsedDoc.docTitle || parsedDoc.title;
              }
            } catch (e) {}

            projectList.push({
              id: folder,
              name: title,
              title: title,
              folder_name: folder,
              user_email: userEmail,
              savedAt: mtime,
              document: createLightDocument(parsedDoc, title),
            });
          }
        }
      } catch (e) {}
    }
  }

  // Sort projectList newest first by savedAt / mtime
  projectList.sort((a, b) => {
    const timeA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
    const timeB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
    return timeB - timeA;
  });

  return res.json({ projects: projectList });
});

app.get('/api/projects/get', async (req, res) => {
  const projId = (req.query.id || '').toString().trim();
  const lang = (req.query.lang || '').toString().trim();
  if (!projId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  // Non-default-language variants live as sibling local files (data_<lang>.json),
  // never in MySQL — check there first if a specific language was requested.
  if (lang && lang !== 'id') {
    const translatedLocal = path.join(projectsDir, projId, `data_${lang}.json`);
    if (fs.existsSync(translatedLocal)) {
      try {
        const dataObj = JSON.parse(fs.readFileSync(translatedLocal, 'utf-8'));
        return res.json({
          id: projId,
          name: dataObj.docTitle || 'Untitled Project',
          savedAt: '',
          document: dataObj,
          rev: fs.statSync(translatedLocal).mtimeMs,
        });
      } catch (e) {}
    }
    // No translated copy saved yet — fall through and return the base-language document.
  }

  const conn = await getDbConnection();
  let dataObj = null;
  let title = 'Untitled Project';
  let userEmail = '';
  let savedAt = '';

  if (conn) {
    try {
      const [rows] = await conn.query(
        'SELECT id, title, folder_name, data_json, user_email, updated_at FROM projects WHERE id = ?;',
        [projId]
      );
      await conn.end();

      if (rows && rows.length > 0) {
        const row = rows[0];
        title = row.title;
        userEmail = row.user_email || '';
        savedAt = row.updated_at ? (row.updated_at.toISOString ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString()) : '';
        if (row.data_json) {
          try {
            dataObj = JSON.parse(row.data_json);
          } catch (e) {}
        }
      }
    } catch (e) {
      try { await conn.end(); } catch (err) {}
    }
  }

  if (!dataObj) {
    const localFile = path.join(projectsDir, projId, 'data.json');
    if (fs.existsSync(localFile)) {
      try {
        dataObj = JSON.parse(fs.readFileSync(localFile, 'utf-8'));
      } catch (e) {}
    }
  }

  if (!dataObj) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Auto-migrate: extract base64 images from existing large projects on load
  if (dataObj.pages && Array.isArray(dataObj.pages)) {
    const rawSize = JSON.stringify(dataObj).length;
    if (rawSize > 5 * 1024 * 1024) { // >5MB indicates embedded base64 images
      console.log(`[AI-SERVER] 🔄 Auto-migrating large project ${projId} (${(rawSize/1024/1024).toFixed(1)}MB) — extracting base64 images...`);
      dataObj = extractBase64Images(dataObj, projId);
      // Save the migrated version back to disk
      try {
        const migratedJson = JSON.stringify(dataObj);
        const localFile = path.join(projectsDir, projId, 'data.json');
        fs.writeFileSync(localFile, migratedJson, 'utf-8');
        console.log(`[AI-SERVER] ✅ Migration complete. New size: ${(migratedJson.length/1024/1024).toFixed(1)}MB`);
      } catch (e) {
        console.error(`[AI-SERVER] ⚠️ Failed to save migrated project: ${e.message}`);
      }
    }
  }

  // Revision stamp = mtime of the base local file; clients echo this back on
  // save so a stale tab can be detected before it overwrites newer work.
  let rev = 0;
  try {
    rev = fs.statSync(path.join(projectsDir, projId, 'data.json')).mtimeMs;
  } catch (e) {}

  return res.json({
    id: projId,
    name: title,
    user_email: userEmail,
    savedAt: savedAt,
    document: dataObj,
    rev,
  });
});

app.post('/api/projects/save', async (req, res) => {
  try {
    const reqData = req.body;
    const projId = reqData.id || `proj_${Date.now()}`;
    const title = reqData.title || 'Untitled Project';
    const folderName = reqData.folder_name || projId;
    let dataObj = reqData.data || {};
    const language = (reqData.language || 'id').toString().trim();
    const userEmail = reqData.user_email || '';

    // Extract base64 images from HTML pages to reduce data.json size
    dataObj = extractBase64Images(dataObj, projId);

    const dataJson = JSON.stringify(dataObj);

    // Non-default-language edits are saved as their own sibling file so they never
    // overwrite the original-language document (base data.json / DB row).
    const targetFilename = language === 'id' ? 'data.json' : `data_${language}.json`;
    const projDir = path.join(projectsDir, projId);
    const targetPath = path.join(projDir, targetFilename);

    // Optimistic concurrency: clients echo back the rev (file mtime) they loaded.
    // A save based on an older rev than what's on disk means another tab/user
    // wrote in between — reject instead of silently overwriting their work.
    // base_rev of 0/absent skips the check (fresh projects, legacy clients).
    const baseRev = Number(reqData.base_rev || 0);
    if (baseRev > 0 && fs.existsSync(targetPath)) {
      const curMtime = fs.statSync(targetPath).mtimeMs;
      if (curMtime > baseRev + 1) {
        console.warn(`[AI-SERVER] 🚫 Rejected stale save for '${projId}' (${targetFilename}): client rev ${baseRev} < disk rev ${curMtime}`);
        return res.status(409).json({
          error: 'conflict',
          message: 'Document was modified by another tab/user after this copy was loaded',
          current_rev: curMtime,
        });
      }
    }

    // 1. Always save locally to projects/ directory
    try {
      fs.mkdirSync(projDir, { recursive: true });

      // Rolling backup: keep the last 5 overwritten versions per language file
      // so an accidental overwrite is always recoverable.
      if (fs.existsSync(targetPath)) {
        try {
          const backupDir = path.join(projDir, 'backups');
          fs.mkdirSync(backupDir, { recursive: true });
          const stamp = new Date().toISOString().replace(/[:.]/g, '-');
          fs.copyFileSync(targetPath, path.join(backupDir, `${targetFilename}.${stamp}.bak`));
          const baks = fs.readdirSync(backupDir).filter(f => f.startsWith(`${targetFilename}.`)).sort();
          while (baks.length > 5) {
            fs.unlinkSync(path.join(backupDir, baks.shift()));
          }
        } catch (bakErr) {
          console.error(`[AI-SERVER] ⚠️ Backup rotation error: ${bakErr.message}`);
        }
      }

      fs.writeFileSync(targetPath, dataJson, 'utf-8');
      console.log(`[AI-SERVER] 💾 Saved project '${title}' (${language}) locally to projects/${projId}/${targetFilename} (${(dataJson.length/1024/1024).toFixed(1)}MB)`);
    } catch (localErr) {
      console.error(`[AI-SERVER] ⚠️ Local project save error: ${localErr.message}`);
    }

    // 2. MySQL only tracks the base/original-language document (title, listing, etc.) —
    //    translated variants are file-only so they can never clobber the original.
    if (language === 'id') {
      const conn = await getDbConnection();
      if (conn) {
        try {
          await conn.query(
            `INSERT INTO projects (id, title, folder_name, data_json, user_email)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                 title = VALUES(title),
                 folder_name = VALUES(folder_name),
                 data_json = VALUES(data_json),
                 user_email = VALUES(user_email);`,
            [projId, title, folderName, dataJson, userEmail]
          );
          await conn.end();
          console.log(`[AI-SERVER] 🗄️ Saved project '${title}' to MySQL database table 'projects'`);
        } catch (dbErr) {
          console.error(`[AI-SERVER] ⚠️ MySQL save error: ${dbErr.message}`);
          try { await conn.end(); } catch (e) {}
        }
      }
    }

    let newRev = Date.now();
    try {
      newRev = fs.statSync(targetPath).mtimeMs;
    } catch (e) {}

    return res.json({ status: 'ok', id: projId, language, rev: newRev });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── PROJECT TRANSLATION ENDPOINT (ON-DEMAND, CACHED PER LANGUAGE) ─────────

const SUPPORTED_LANGUAGES = ['id', 'en', 'zh', 'ar', 'ko', 'ja'];

// In-memory registry of running/finished translation jobs, keyed by "<projId>:<lang>".
const translationJobs = new Map();

app.post('/api/translate-project', async (req, res) => {
  try {
    const projId = (req.body.id || '').toString().trim();
    const language = (req.body.language || '').toString().trim();

    if (!projId) {
      return res.status(400).json({ error: 'Project id is required' });
    }
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    let projDir = path.join(projectsDir, projId);
    let baseDataPath = path.join(projDir, 'data.json');

    // Bootstrap data.json from the client payload ONLY if this project has no base
    // document on disk yet. Never overwrite an existing data.json here — the payload
    // may be whatever translated language is currently displayed in the editor, and
    // clobbering the canonical 'id' source would corrupt every future translation
    // (each one would chain off an already-translated document instead of the original).
    if (!fs.existsSync(baseDataPath) && req.body.document && typeof req.body.document === 'object') {
      fs.mkdirSync(projDir, { recursive: true });
      fs.writeFileSync(baseDataPath, JSON.stringify(req.body.document, null, 2), 'utf-8');
    }

    if (!fs.existsSync(baseDataPath)) {
      // Check if there's any JSON file in projDir
      if (fs.existsSync(projDir)) {
        const jsonFiles = fs.readdirSync(projDir).filter(f => f.endsWith('.json'));
        if (jsonFiles.length > 0) {
          baseDataPath = path.join(projDir, jsonFiles[0]);
        }
      }

      if (!fs.existsSync(baseDataPath)) {
        return res.status(404).json({ error: `Project '${projId}' not found` });
      }
    }

    // 'id' is always the base/original document language produced by the generation
    // pipeline today — no translation needed, just return the original content.
    if (language === 'id') {
      const dataObj = JSON.parse(fs.readFileSync(baseDataPath, 'utf-8'));
      dataObj.language = dataObj.language || 'id';
      return res.json(dataObj);
    }

    const force = Boolean(req.body.force);
    const translatedPath = path.join(projDir, `data_${language}.json`);

    // Cache hit: this project/language combination was already translated before.
    if (fs.existsSync(translatedPath) && !force) {
      console.log(`[AI-SERVER] ⚡ Using cached translation projects/${projId}/data_${language}.json`);
      const dataObj = JSON.parse(fs.readFileSync(translatedPath, 'utf-8'));
      dataObj.language = language;
      return res.json(dataObj);
    }

    // Long translations (20+ min) cannot be served in a single request-response:
    // Cloudflare cuts the origin connection after ~100s (HTTP 524). Instead, start
    // the script as a background job and return immediately; the client polls
    // /api/translate-status, then re-requests this endpoint to hit the cache path.
    const jobKey = `${projId}:${language}`;
    const existingJob = translationJobs.get(jobKey);
    if (existingJob && existingJob.status === 'processing') {
      return res.status(202).json({ status: 'processing', progress: existingJob.progress });
    }

    console.log(`[AI-SERVER] 🌐 Translating project '${projId}' to '${language}' (background job)...`);
    const translateScript = path.join(__dirname, 'pipeline', 'translate_document.py');

    const job = { status: 'processing', progress: 0, error: null, startedAt: Date.now() };
    translationJobs.set(jobKey, job);

    const child = execFile('python3', [translateScript, baseDataPath, translatedPath, language], {
      maxBuffer: 1024 * 1024 * 100,
      timeout: 60 * 60 * 1000,
    });

    const onOutput = (d) => {
      process.stdout.write(d);
      // Progress lines look like: [TRANSLATE] 📊 Progress: 1290/1548 units processed (83%)
      const m = String(d).match(/Progress:\s*(\d+)\/(\d+)/);
      if (m) {
        job.progress = Math.round((parseInt(m[1], 10) / parseInt(m[2], 10)) * 100);
      }
    };
    child.stdout?.on('data', onOutput);
    child.stderr?.on('data', onOutput);

    child.on('close', (code, signal) => {
      if (code === 0 && fs.existsSync(translatedPath)) {
        job.status = 'done';
        job.progress = 100;
        console.log(`[AI-SERVER] ✅ Translation to '${language}' saved to projects/${projId}/data_${language}.json`);
      } else {
        job.status = 'error';
        job.error = signal
          ? `Translation script killed by signal ${signal} (likely timeout or out-of-memory)`
          : code === 0
            ? 'Translation script failed to produce output JSON file'
            : `Translation script failed with exit code ${code}`;
        console.error(`[AI-SERVER] ❌ Error translating project: ${job.error}`);
      }
    });

    child.on('error', (err) => {
      job.status = 'error';
      job.error = err.message;
      console.error(`[AI-SERVER] ❌ Error translating project: ${err.stack || err.message}`);
    });

    return res.status(202).json({ status: 'processing', progress: 0 });
  } catch (e) {
    console.error(`[AI-SERVER] ❌ Error translating project: ${e.stack || e.message}`);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/translate-status', (req, res) => {
  const projId = (req.query.id || '').toString().trim();
  const language = (req.query.language || '').toString().trim();
  if (!projId || !SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ error: 'Valid id and language are required' });
  }

  const job = translationJobs.get(`${projId}:${language}`);
  if (!job) {
    // No job in memory — either never started or the server restarted. A cached
    // file on disk still counts as done.
    const translatedPath = path.join(projectsDir, projId, `data_${language}.json`);
    if (fs.existsSync(translatedPath)) {
      return res.json({ status: 'done', progress: 100 });
    }
    return res.json({ status: 'none' });
  }

  return res.json({ status: job.status, progress: job.progress, error: job.error });
});

app.post('/api/projects/delete', async (req, res) => {
  try {
    const projId = req.body.id;
    if (!projId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // 1. Delete from MySQL database if connected
    const conn = await getDbConnection();
    if (conn) {
      try {
        await conn.query('DELETE FROM projects WHERE id = ?;', [projId]);
        await conn.end();
      } catch (dbErr) {
        try { await conn.end(); } catch (e) {}
      }
    }

    // 2. Delete local project folder on disk (projects/<projId>)
    const projDir = path.join(projectsDir, projId);
    if (fs.existsSync(projDir)) {
      try {
        fs.rmSync(projDir, { recursive: true, force: true });
        console.log(`[AI-SERVER] 🗑️ Deleted local project folder 'projects/${projId}' from disk`);
      } catch (fsErr) {
        console.error(`[AI-SERVER] ⚠️ Error deleting project folder 'projects/${projId}': ${fsErr.message}`);
      }
    }

    console.log(`[AI-SERVER] 🗑️ Deleted project '${projId}' completely from MySQL and disk`);
    return res.json({ status: 'ok', message: `Project ${projId} deleted successfully` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/save-pdf', async (req, res) => {
  try {
    const folderName = req.body.folder_name;
    let pdfB64 = req.body.pdf_base64;
    const pdfFilename = req.body.filename || `${folderName}.pdf`;

    if (!folderName || !pdfB64) {
      return res.status(400).json({ error: 'Missing folder_name or pdf_base64' });
    }

    const folderPath = path.join(projectsDir, folderName);
    fs.mkdirSync(folderPath, { recursive: true });

    if (pdfB64.includes(',')) {
      pdfB64 = pdfB64.split(',')[1];
    }

    const pdfBuffer = Buffer.from(pdfB64, 'base64');
    const savePdfPath = path.join(folderPath, pdfFilename);
    fs.writeFileSync(savePdfPath, pdfBuffer);

    console.log(`[AI-SERVER] 💾 Saved exported PDF locally to projects/${folderName}/${pdfFilename} (${pdfBuffer.length} bytes)`);

    return res.json({ status: 'ok', saved_path: savePdfPath });
  } catch (e) {
    console.error(`[AI-SERVER] ❌ Error saving PDF: ${e.message}`);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/download-template', (req, res) => {
  const tPath = path.join(__dirname, 'public', 'Template_Format_ManualBook.docx');
  if (fs.existsSync(tPath)) {
    return res.download(tPath, 'Template_Format_ManualBook.docx');
  }
  return res.status(404).json({ error: 'Template file not found' });
});

app.get('/api/download-word-instruction', (req, res) => {
  const gPath = path.join(__dirname, 'public', 'Panduan_Visual_Format_ManualBook.docx');
  if (fs.existsSync(gPath)) {
    return res.download(gPath, 'Panduan_Visual_Format_ManualBook.docx');
  }
  return res.status(404).json({ error: 'Guide file not found' });
});

// ─── AI GENERATION ENDPOINT (PYTHON PIPELINE BRIDGE) ──────────────────────────

app.post('/api/ai-generate', upload.single('file'), async (req, res) => {
  const genUserEmail = (req.query.email || '').toString().trim().toLowerCase();
  const startTime = Date.now();

  try {
    console.log('[AI-SERVER] 📥 Received POST /api/ai-generate request');

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded or file empty' });
    }

    const filename = req.file.originalname || 'uploaded.docx';
    const fileBytes = req.file.buffer;

    const reqProjectId = (req.query.projectId || req.body.projectId || '').toString().trim();
    const now = new Date();
    const timestampStr = reqProjectId || now.toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
    const projectFolderDir = path.join(projectsDir, timestampStr);
    const imagesDir = path.join(projectFolderDir, 'images');

    // Ensure parent project folder exists
    fs.mkdirSync(projectFolderDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    // Clean existing images folder before re-extraction to prevent
    // stale images from previous uploads persisting in the output
    if (fs.existsSync(imagesDir)) {
      const oldFiles = fs.readdirSync(imagesDir);
      for (const oldFile of oldFiles) {
        try { fs.unlinkSync(path.join(imagesDir, oldFile)); } catch (e) {}
      }
      console.log(`[AI-SERVER] 🧹 Cleaned ${oldFiles.length} old images from ${imagesDir}`);
    }

    // Save original uploaded Word document
    const originalDocxPath = path.join(projectFolderDir, 'original.docx');
    fs.writeFileSync(originalDocxPath, fileBytes);
    console.log(`[AI-SERVER] 💾 Saved original Word document to ${originalDocxPath}`);

    if (!fs.existsSync(originalDocxPath)) {
      throw new Error(`Failed to save original.docx to ${originalDocxPath}`);
    }

    // Call Python pipeline bridge script
    const resultJsonPath = path.join(projectFolderDir, 'pipeline_result.json');
    const bridgeScript = path.join(__dirname, 'run_pipeline.py');

    console.log(`[AI-SERVER] 🚀 Executing Python AI Pipeline via bridge (${bridgeScript})...`);
    
    await execFileAsync('python3', [bridgeScript, originalDocxPath, resultJsonPath, imagesDir], {
      maxBuffer: 1024 * 1024 * 50,
    });

    if (!fs.existsSync(resultJsonPath)) {
      throw new Error('Pipeline bridge failed to generate output JSON file');
    }

    const bridgeResult = JSON.parse(fs.readFileSync(resultJsonPath, 'utf-8'));
    const parsedJson = bridgeResult.parsed_json;
    const extractedImages = bridgeResult.extracted_images || [];

    // Attach lightweight image URLs (/projects/TIMESTAMP/images/...) to image_ref blocks
    if (parsedJson.sections && Array.isArray(parsedJson.sections)) {
      let sequentialImgCounter = 0;
      for (const sec of parsedJson.sections) {
        if (sec.blocks && Array.isArray(sec.blocks)) {
          for (const blk of sec.blocks) {
            if (blk.type === 'image_ref' || blk.kind === 'image') {
              let idx = sequentialImgCounter;
              if (idx < extractedImages.length) {
                const imgPath = extractedImages[idx];
                const finalUrl = imgPath.startsWith('data:') ? imgPath : `/projects/${timestampStr}/${imgPath}`;
                blk.image_file = imgPath;
                blk.image_url = finalUrl;
                blk.src = finalUrl;
                blk.index = idx;
              }
              sequentialImgCounter++;
            }
            if (blk.type === 'table' && Array.isArray(blk.rows)) {
              blk.rows = blk.rows.map(row =>
                row.map(cell => {
                  if (typeof cell === 'string' && cell.includes('src="images/')) {
                    return cell.replace(/src="images\//g, `src="/projects/${timestampStr}/images/`);
                  }
                  return cell;
                })
              );
            }
          }
        }
      }
    }

    const saveFilename = `${timestampStr}.json`;
    const saveFilepath = path.join(projectFolderDir, saveFilename);
    const dataJsonPath = path.join(projectFolderDir, 'data.json');

    parsedJson._saved_folder = timestampStr;
    parsedJson._saved_file = saveFilename;

    fs.writeFileSync(saveFilepath, JSON.stringify(parsedJson, null, 2), 'utf-8');
    fs.writeFileSync(dataJsonPath, JSON.stringify(parsedJson, null, 2), 'utf-8');
    console.log(`[AI-SERVER] 💾 Saved generated JSON & ${extractedImages.length} images to projects/${timestampStr}/`);

    // Clean up temporary bridge result JSON file
    if (fs.existsSync(resultJsonPath)) {
      try { fs.unlinkSync(resultJsonPath); } catch (e) {}
    }

    // Save project record into MySQL database if connected
    const conn = await getDbConnection();
    if (conn) {
      try {
        await conn.query(
          `INSERT INTO projects (id, title, folder_name, data_json, user_email)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
               title = VALUES(title),
               folder_name = VALUES(folder_name),
               data_json = VALUES(data_json),
               user_email = VALUES(user_email);`,
          [
            timestampStr,
            parsedJson.docTitle || 'AI Generated Manual',
            timestampStr,
            JSON.stringify(parsedJson),
            genUserEmail,
          ]
        );
        await conn.end();
        console.log(`[AI-SERVER] 🗄️ Saved project record for user '${genUserEmail}' to MySQL database table 'projects'`);
      } catch (dbSaveErr) {
        console.error(`[AI-SERVER] ⚠️ Could not save project record to MySQL: ${dbSaveErr.message}`);
        try { await conn.end(); } catch (e) {}
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AI-SERVER] ✨ PIPELINE GENERATION COMPLETED IN ${duration}s!`);
    return res.json(parsedJson);
  } catch (e) {
    console.error(`[AI-SERVER] ❌ Error processing request: ${e.stack || e.message}`);
    return res.status(500).json({ error: e.message });
  }
});

// Global Express Error Handler (catches aborted requests when client reloads/cancels)
app.use((err, req, res, next) => {
  if (err && (err.type === 'request.aborted' || err.message === 'request aborted')) {
    return res.status(400).json({ error: 'Request aborted by client' });
  }
  console.error('[AI-SERVER] Unhandled express error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database and start HTTP server
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI-SERVER] 🚀 Node.js Backend Server active on http://0.0.0.0:${PORT}`);
  });
});
