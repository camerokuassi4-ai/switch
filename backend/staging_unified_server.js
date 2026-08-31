/**
 * SERVEUR UNIFIÉ DE STAGING / PRÉPRODUCTION SWITCH FINTECH BÉNIN
 * Fichier : backend/staging_unified_server.js
 * 
 * Combine :
 * - Service des assets et écrans HTML/CSS/JS frontend (137 écrans)
 * - Routes d'API RESTful (/api/v1/*)
 * - Protection stricte des répertoires et fichiers de configuration internes
 * - Persistance hybride JSON / PostgreSQL Staging
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { PreprodApiApp } = require('./preprod_api_server.js');

const ROOT_DIR = path.join(__dirname, '..');
const apiHandler = new PreprodApiApp();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const FORBIDDEN_PATHS = [
  '/scratch',
  '/backups',
  '/scripts',
  '/.git',
  '/.env',
  '/node_modules',
  '/package.json',
  '/package-lock.json',
  '/server.js',
  '/server.py',
  '/vercel.json',
  '/supabase'
];

const unifiedServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. PROTECTION STRICTE DES FICHIERS ET DOSSIERS INTERNES
  if (FORBIDDEN_PATHS.some(p => pathname.startsWith(p) || pathname === p) || pathname.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: "FORBIDDEN_INTERNAL_RESOURCE", message: "Accès public interdit aux fichiers de configuration et répertoires d'audit internes." }));
  }

  // 2. ROUTAGE API REST
  if (pathname.startsWith('/api/v1/')) {
    return apiHandler.handleRequest(req, res);
  }

  // 3. ROUTAGE FRONTEND PWA
  let targetPath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(ROOT_DIR, targetPath);

  function serveFile(file) {
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Erreur 500');
      }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) return serveFile(filePath);
    if (!err && stats.isDirectory()) {
      const indexCandidate = path.join(filePath, 'code.html');
      if (fs.existsSync(indexCandidate)) return serveFile(indexCandidate);
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 — Écran ou Ressource Introuvable</h1>');
  });
});

module.exports = { unifiedServer };
