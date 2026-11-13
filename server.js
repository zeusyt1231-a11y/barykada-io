'use strict';
/* Barykada.io — serwer gry (bez zależności: czysty Node.js >= 18)
 * - serwuje pliki z ./public
 * - WebSocket na /ws (RFC 6455, zaimplementowany ręcznie)
 * - pokoje po maks. 12 graczy, boty uzupełniają skład
 * - symulacja 30 Hz, migawki 15 Hz, czat z limitem
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const createGame = require('./game.js');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MAX_HUMANS = 12;
const TICK = 1000 / 30;

/* ---------------- static files ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok ' + rooms.size + ' rooms, ' + clients.size + ' players'); return; }
  if (process.env.DEBUG && url === '/debug/skip') { for (const r of rooms.values()) r.game._debug.setPhaseT(0.01); res.end('skipped'); return; }
  if (url === '/') url = '/index.html';
  const file = path.normalize(path.join(PUBLIC, url));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Nie znaleziono'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

/* ---------------- minimal WebSocket ---------------- */
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
function wsSend(sock, str) {
  if (sock.destroyed || !sock.writable) return;
  const payload = Buffer.from(str, 'utf8'); const len = payload.length; let head;
  if (len < 126) { head = Buffer.alloc(2); head[1] = len; }
  else if (len < 65536) { head = Buffer.alloc(4); head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  head[0] = 0x81; sock.write(Buffer.concat([head, payload]));
}
function wsControl(sock, op, data = Buffer.alloc(0)) { if (sock.destroyed) return; const h = Buffer.from([0x80 | op, data.length]); sock.write(Buffer.concat([h, data])); }

server.on('upgrade', (req, sock) => {
  if ((req.url || '').split('?')[0] !== '/ws' || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { sock.destroy(); return; }
  const key = req.headers['sec-websocket-key']; if (!key) { sock.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  sock.setNoDelay(true);
  const client = { id: 0, sock, buf: Buffer.alloc(0), room: null, alive: true, lastChat: 0, chatTokens: 4, msgCount: 0, msgWindow: Date.now(), frag: null };
  onOpen(client);
  sock.on('data', d => {
    client.buf = Buffer.concat([client.buf, d]);
    if (client.buf.length > 1 << 20) { sock.destroy(); return; }
    while (client.buf.length >= 2) {
      const b0 = client.buf[0], b1 = client.buf[1], fin = b0 & 0x80, op = b0 & 0x0f, masked = b1 & 0x80; let len = b1 & 0x7f, off = 2;
      if (len === 126) { if (client.buf.length < 4) return; len = client.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (client.buf.length < 10) return; len = Number(client.buf.readBigUInt64BE(2)); off = 10; }
      if (len > 64 * 1024) { sock.destroy(); return; }
      const need = off + (masked ? 4 : 0) + len; if (client.buf.length < need) return;
      let payload = client.buf.slice(off + (masked ? 4 : 0), need);
      if (masked) { const m = client.buf.slice(off, off + 4); payload = Buffer.from(payload); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
      client.buf = client.buf.slice(need);
      if (op === 0x8) { wsControl(sock, 0x8); sock.end(); return; }
      if (op === 0x9) { wsControl(sock, 0xA, payload.slice(0, 125)); continue; }
      if (op === 0xA) { client.alive = true; continue; }
      if (op === 0x1 || op === 0x0) {
        client.frag = client.frag ? Buffer.concat([client.frag, payload]) : payload;
        if (!fin) continue;
        const text = client.frag.toString('utf8'); client.frag = null; client.alive = true;
        try { onMessage(client, JSON.parse(text)); } catch (e) { /* ignore bad message */ }
      }
    }
  });
  const bye = () => onClose(client);
  sock.on('close', bye); sock.on('end', bye); sock.on('error', bye);
});

/* ---------------- rooms ---------------- */
const rooms = new Map(); let roomSeq = 1, clientSeq = 100000;
const clients = new Map();
function makeRoom() {
  const room = { id: roomSeq++, clients: new Set(), events: [], tick: 0, emptySince: 0, rosterSig: '' };
  room.game = createGame(e => room.events.push(e));
  room.game.step(0); // generates first map
  rooms.set(room.id, room);
  return room;
}
function pickRoom() {
  let best = null;
  for (const r of rooms.values()) if (r.clients.size < MAX_HUMANS && (!best || r.clients.size > best.clients.size)) best = r;
  return best || makeRoom();
}
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').trim().slice(0, n);
const COLORS = ['#4a90d9', '#d9534f', '#f0ad4e', '#5cb85c', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];

function onOpen(client) { client.id = ++clientSeq; clients.set(client.id, client); wsSend(client.sock, JSON.stringify({ t: 'hello', id: client.id })); }
function onClose(client) {
  if (!clients.has(client.id)) return; clients.delete(client.id);
  const room = client.room; if (!room) return;
  room.clients.delete(client);
  const h = room.game.humans.get(client.id); const name = h ? h.name : '';
  room.game.removeHuman(client.id);
  if (name && h.announced) broadcast(room, JSON.stringify({ t: 'chat', sys: 1, m: name + ' opuścił grę' }));
  if (!room.clients.size) room.emptySince = Date.now();
}
function broadcast(room, str) { for (const c of room.clients) wsSend(c.sock, str); }

function onMessage(client, msg) {
  // basic flood protection
  const now = Date.now(); if (now - client.msgWindow > 1000) { client.msgWindow = now; client.msgCount = 0; }
  if (++client.msgCount > 90) return;
  if (!msg || typeof msg !== 'object') return;
  const room = client.room;
  switch (msg.t) {
    case 'join': {
      if (room) return;
      const r = pickRoom(); client.room = r; r.clients.add(client); r.emptySince = 0;
      const name = clean(msg.name, 14) || 'Gracz';
      const color = COLORS.includes(msg.color) ? msg.color : COLORS[0];
      r.game.addHuman({ id: client.id, name, color, prof: msg.prof || {}, ready: false, inp: {}, edges: { grab: 0, shove: 0, e: 0 } });
      client.cnt = { g: 0, s: 0, e: 0 };
      wsSend(client.sock, JSON.stringify({ t: 'joined', room: r.id, id: client.id }));
      wsSend(client.sock, JSON.stringify(r.game.mapMsg()));
      wsSend(client.sock, JSON.stringify({ t: 'r', list: r.game.roster() }));
      break;
    }
    case 'ready': {
      if (!room) return; const h = room.game.humans.get(client.id); if (!h) return;
      if (msg.prof) h.prof = msg.prof;
      const nm = clean(msg.name, 14); if (nm) h.name = nm;
      if (COLORS.includes(msg.color)) h.color = msg.color;
      room.game.spawnHuman(client.id);
      if (!h.announced) { h.announced = true; broadcast(room, JSON.stringify({ t: 'chat', sys: 1, m: h.name + ' dołączył do gry' })); }
      break;
    }
    case 'spectate': {
      if (!room) return; const h = room.game.humans.get(client.id); if (!h) return;
      room.game.removeHuman(client.id); h.ready = false; room.game.addHuman(h);
      break;
    }
    case 'i': {
      if (!room) return; const h = room.game.humans.get(client.id); if (!h) return;
      const inp = h.inp, num = v => (typeof v === 'number' && isFinite(v) ? v : 0);
      inp.mx = Math.max(-1, Math.min(1, num(msg.mx))); inp.my = Math.max(-1, Math.min(1, num(msg.my))); inp.ang = num(msg.a);
      inp.spr = !!msg.s; inp.act = !!msg.c; inp.rem = !!msg.r; inp.sel = Number.isInteger(msg.sel) ? msg.sel : -1;
      inp.bmode = Number.isInteger(msg.bm) ? msg.bm : 0; inp.btx = Number.isInteger(msg.bx) ? msg.bx : null; inp.bty = Number.isInteger(msg.by) ? msg.by : null;
      // edge counters (cumulative)
      const c = client.cnt;
      for (const [k, ek] of [['g', 'grab'], ['h', 'shove'], ['e', 'e']]) { const v = num(msg[k]) | 0; if (v > c[k] || v < c[k] - 1000) { if (v > c[k]) h.edges[ek]++; c[k] = v; } }
      break;
    }
    case 'chat': {
      if (!room) return; const h = room.game.humans.get(client.id); if (!h) return;
      // token bucket: 4 burst, refill 1 per 1.5 s
      client.chatTokens = Math.min(4, client.chatTokens + (now - client.lastChat) / 1500); client.lastChat = now;
      if (client.chatTokens < 1) { wsSend(client.sock, JSON.stringify({ t: 'chat', sys: 1, m: 'Zwolnij trochę z wiadomościami.' })); return; }
      client.chatTokens -= 1;
      const m = clean(msg.m, 140); if (!m) return;
      const p = room.game.players.find(q => q.id === client.id);
      broadcast(room, JSON.stringify({ t: 'chat', id: client.id, n: h.name, c: h.color, z: p && p.role === 'z' ? 1 : 0, m }));
      break;
    }
    case 'prof': { if (!room) return; const h = room.game.humans.get(client.id); if (h && msg.prof) h.prof = msg.prof; break; }
    case 'ping': wsSend(client.sock, JSON.stringify({ t: 'pong', ts: msg.ts })); break;
  }
}

/* ---------------- game loop ---------------- */
let last = Date.now();
setInterval(() => {
  const now = Date.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now;
  for (const room of rooms.values()) {
    if (!room.clients.size) {
      if (room.emptySince && now - room.emptySince > 60000) rooms.delete(room.id);
      continue;
    }
    let roundStarted = false;
    const before = room.events.length;
    room.game.step(dt);
    for (let i = before; i < room.events.length; i++) if (room.events[i].k === 'newround') roundStarted = true;
    room.tick++;
    if (roundStarted) {
      room.events = room.events.filter(e => e.k !== 'newround' && e.to !== undefined); // drop stale global fx, keep targeted banners
      broadcast(room, JSON.stringify(room.game.mapMsg()));
    }
    const sig = JSON.stringify(room.game.roster());
    if (sig !== room.rosterSig) { room.rosterSig = sig; broadcast(room, '{"t":"r","list":' + sig + '}'); }
    if (room.tick % 2 === 0 || roundStarted) {
      const common = JSON.stringify(room.game.snapshotCommon());
      const evs = room.events; room.events = [];
      const globalEv = evs.filter(e => e.to === undefined);
      for (const c of room.clients) {
        const mine = evs.filter(e => e.to === c.id);
        const ev = mine.length ? globalEv.concat(mine) : globalEv;
        const me = room.game.snapshotMe(c.id);
        wsSend(c.sock, '{"t":"s","c":' + common + ',"me":' + JSON.stringify(me) + ',"ev":' + JSON.stringify(ev) + '}');
      }
    }
  }
}, TICK);

// keep-alive pings (also detects dead sockets)
setInterval(() => {
  for (const c of clients.values()) {
    if (!c.alive) { c.sock.destroy(); onClose(c); continue; }
    c.alive = false; wsControl(c.sock, 0x9);
  }
}, 25000);

server.listen(PORT, () => console.log('Barykada.io działa na porcie ' + PORT));
