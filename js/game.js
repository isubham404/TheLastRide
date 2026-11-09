"use strict";
// ============================================================
//  THE LAST BEACON — SUBH & ROCKY  (Enhanced Build v2)
//  Canvas 640×360  |  Tile 16px  |  PC + Android
// ============================================================

const VIEW_W = 640, VIEW_H = 360, TILE = 16;
const SAVE_KEY = "lastbeacon-v2";
const GRAVITY = 900, JUMP_V = -310, MOVE_SPEED = 120, CLIMB_SPEED = 80;
const DASH_V = 260, DASH_DUR = 0.14, DASH_CD = 0.9;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// ---- Image preload ----
const IMG = {};
function loadImg(key, src) {
  const i = new Image(); i.src = src;
  IMG[key] = i; return i;
}
loadImg("campus",    "assets/concepts/ch1_suiit_campus.png");
loadImg("lab",       "assets/concepts/ch1_research_lab.png");
loadImg("ship",      "assets/concepts/ch2_spacecraft_corridor.png");
loadImg("asteroids", "assets/concepts/ch2_asteroid_field.png");
loadImg("rocky_enc", "assets/concepts/ch3_rocky_encounter.png");

// ---- Audio ----
const clips = {
  speech: new Audio("assets/audio/Rocky/rocky_speech.mp3"),
  good:   new Audio("assets/audio/Rocky/good.mp3"),
  laugh:  new Audio("assets/audio/Rocky/rocky_laugh_project_hail_mary.mp3"),
};
let audioCtx = null, droneOsc = [];
function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function tone(freq, dur, type, gain) {
  if (G.muted) return;
  try {
    const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "square"; o.frequency.value = freq;
    g.gain.value = gain || 0.04;
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch(e) {}
}
function playClip(name) {
  if (G.muted) return;
  const el = clips[name]; if (!el) return;
  try { el.currentTime = 0; el.volume = 0.8; el.play().catch(()=>{}); } catch(e) {}
}
function stopClips() { Object.values(clips).forEach(c => { try { c.pause(); } catch(e){} }); }
function setDrone(kind) {
  droneOsc.forEach(o => { try { o.stop(); } catch(e){} });
  droneOsc = [];
  if (G.muted || !kind) return;
  const ac = getAC();
  const freqs = kind === "ship" ? [46, 70, 92] : kind === "alien" ? [98, 147, 196] : [60, 90, 120];
  freqs.forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.value = [0.012, 0.007, 0.004][i];
    o.connect(g); g.connect(ac.destination); o.start();
    droneOsc.push(o);
  });
}

// ============================================================
//  INPUT — keyboard + mouse + touch virtual buttons
// ============================================================
const keysDown = new Set(), keysEdge = new Set();
const mouse = { x: 0, y: 0, just: false, down: false };
const touch = { left: false, right: false, up: false, use: false, tab: false };

function canvasPt(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (VIEW_W / r.width),
           y: (e.clientY - r.top)  * (VIEW_H / r.height) };
}

window.addEventListener("keydown", e => {
  const block = ["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab"];
  if (block.includes(e.code)) e.preventDefault();
  if (!keysDown.has(e.code)) keysEdge.add(e.code);
  keysDown.add(e.code);
  getAC();
  if (e.code === "KeyM") { G.muted = !G.muted; stopClips(); if(G.muted) setDrone(null); toast(G.muted ? "SOUND OFF" : "SOUND ON"); }
});
window.addEventListener("keyup", e => keysDown.delete(e.code));
window.addEventListener("blur", () => { keysDown.clear(); keysEdge.clear(); });

canvas.addEventListener("mousedown", e => {
  const p = canvasPt(e); mouse.x = p.x; mouse.y = p.y; mouse.just = true; mouse.down = true;
  canvas.focus(); getAC();
});
canvas.addEventListener("mousemove", e => { const p = canvasPt(e); mouse.x = p.x; mouse.y = p.y; });
window.addEventListener("mouseup", () => { mouse.down = false; });
canvas.addEventListener("contextmenu", e => e.preventDefault());

// Touch virtual buttons
function bindBtn(id, flag) {
  const el = document.getElementById(id); if (!el) return;
  el.addEventListener("touchstart", e => { e.preventDefault(); touch[flag] = true; getAC(); }, { passive: false });
  el.addEventListener("touchend",   e => { e.preventDefault(); touch[flag] = false; }, { passive: false });
  el.addEventListener("touchcancel",e => { e.preventDefault(); touch[flag] = false; }, { passive: false });
}
bindBtn("btn-left",  "left");
bindBtn("btn-right", "right");
bindBtn("btn-jump",  "up");
bindBtn("btn-use",   "use");
bindBtn("btn-tab",   "tab");
document.getElementById("btn-pause")?.addEventListener("touchstart", e => {
  e.preventDefault(); getAC();
  if (G.mode === "play") G.mode = "pause";
  else if (G.mode === "pause") G.mode = "play";
}, { passive: false });

const held    = c => keysDown.has(c);
const pressed = c => keysEdge.has(c);
const endInput = () => { keysEdge.clear(); mouse.just = false; };
const hitRect  = r => mouse.x >= r.x && mouse.x <= r.x+r.w && mouse.y >= r.y && mouse.y <= r.y+r.h;

const moveLeft  = () => held("ArrowLeft")  || held("KeyA") || touch.left;
const moveRight = () => held("ArrowRight") || held("KeyD") || touch.right;
const moveUp    = () => held("ArrowUp")    || held("KeyW");
const moveDown  = () => held("ArrowDown")  || held("KeyS");
const jumpEdge  = () => pressed("Space")   || pressed("ArrowUp") || pressed("KeyW") || touch.up;
const useEdge   = () => pressed("KeyE")    || pressed("Enter")   || touch.use;
const tabEdge   = () => pressed("Tab")     || touch.tab;
const dashEdge  = () => pressed("ShiftLeft") || pressed("ShiftRight");

// ============================================================
//  WORLD STATE
// ============================================================
const G = {
  mode: "title",          // title | howto | cutscene | play | talk | puzzle | asteroid | down | pause | journal | ending
  scene: "title",
  flags: {},
  journal: [],
  stats: { time: 0, deaths: 0 },
  hp: 5, hpMax: 5,
  o2: 100,
  objective: "",
  toast: "", toastT: 0,
  talk: null,
  cut: null,
  puzzle: null,
  cam: { x: 0, y: 0 },
  camTarget: { x: 0, y: 0 },
  map: [],
  entities: [],
  actors: [],
  active: 0,
  particles: [],
  flies: [],
  sparks: [],
  iframes: 0,
  shake: 0,
  flash: 0,
  flashColor: "255,60,40",
  titleIndex: 0,
  hover: -1,
  asteroid: null,
  down: null,
  journalSel: 0,
  pipe: null,
  molecule: null,
  melody: null,
  endingT: 0,
  playT: 0,
  muted: false,
  bannerT: 0,
  bannerText: "",
  scanBeam: 0,
  time: 0,
};

function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }
function lerp(a,b,t)  { return a + (b-a)*t; }
function rng(seed) {
  let a = seed >>> 0;
  return () => { a|=0; a=(a+0x6d2b79f5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
}

// ============================================================
//  GAME STATE HELPERS
// ============================================================
function freshFlags() {
  return {
    sawSign:false, campusLog:false, labLog:false, shipLog:false,
    scanned:false, transmissionSeen:false, o2Patched:false, powered:false,
    melody:false, dockTalk:false, subhSync:false, rockySync:false,
    clamps:false, syncedTalk:false, securityBadge:false, ventOpen:false,
    engineerLog:false, radiationSuit:false, coreAccess:false,
    asteroidChallenge:false,
  };
}
function resetRun() {
  G.flags = freshFlags(); G.journal = []; G.stats = {time:0, deaths:0};
  G.hp = G.hpMax = 5; G.o2 = 100; G.particles = []; G.sparks = [];
  G.active = 0; stopClips();
}
function journalAdd(title, body) {
  if (G.journal.some(e => e.title === title)) return;
  G.journal.push({title, body}); toast("Research log added"); tone(660,0.08,"square",0.04); saveGame();
}
function toast(msg) { G.toast = msg; G.toastT = 2.6; }
function showBanner(txt) { G.bannerText = txt; G.bannerT = 2.8; }

function refreshObjective() {
  const f = G.flags, s = G.scene;
  if      (s==="campus") G.objective = f.sawSign ? "Enter the Science Complex →" : "Find the flashing research lab. Something is alive in there.";
  else if (s==="lab") {
    if (!f.securityBadge) G.objective = "Find the security badge to unlock the scanner room.";
    else if (!f.scanned)  G.objective = "Scan the meteorite fragment and reconstruct its molecule.";
    else if (!f.transmissionSeen) G.objective = "Answer the PRIORITY transmission on the terminal.";
    else G.objective = "Get to the launch complex. The Hail Mary won't wait.";
  }
  else if (s==="ship") {
    if (!f.o2Patched)  G.objective = "Life support is bleeding. Find and patch the oxygen line.";
    else if (!f.powered) G.objective = "Climb and restore backup power — the cockpit is dead.";
    else if (!f.coreAccess) G.objective = "Bypass the radiation lock to reach the ship's core.";
    else G.objective = "Reach the cockpit and navigate through the asteroid field.";
  }
  else if (s==="dock") G.objective = f.melody ? "Use the docking clamps — Rocky needs you at the console." : "Answer Rocky's musical signal using the sonic translator.";
  else if (s==="sync") {
    if (!f.subhSync)   G.objective = "SUBH: Lock the carrier wave on the left console.";
    else if (!f.rockySync) G.objective = "ROCKY: Match the harmonic. TAB to switch characters!";
    else G.objective = "Fire the beacon — both consoles are live!";
  }
}

function saveGame() {
  if (!["campus","lab","ship","dock","sync"].includes(G.scene) || !G.actors.length) return;
  const data = { scene: G.scene, flags: G.flags, journal: G.journal, stats: G.stats,
    hp: G.hp, o2: G.o2, actors: G.actors.map(a=>({who:a.who,x:a.x,y:a.y})), active: G.active };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch(e) { return false; } }
function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY), data = JSON.parse(raw);
  resetRun();
  G.flags = Object.assign(freshFlags(), data.flags || {});
  G.journal = data.journal || []; G.stats = data.stats || {time:0,deaths:0};
  G.hp = data.hp || 5; G.o2 = data.o2 || 100;
  const lead = (data.actors && data.actors[0]) || {};
  enterLevel(data.scene, {x:lead.x||100, y:lead.y||100}, data.active||0, true);
  if (data.actors && data.actors.length === G.actors.length)
    data.actors.forEach((s,i) => { G.actors[i].x = s.x; G.actors[i].y = s.y; });
}

// ============================================================
//  WORLD MAP DEFINITIONS  (wider, open-world feel)
// ============================================================
function grid(w, h, fn) {
  const rows = [];
  for (let y=0; y<h; y++) { let s=""; for(let x=0;x<w;x++) s+=fn(x,y); rows.push(s); }
  return rows;
}

const LEVELS = {
  // ---- CHAPTER 1A: SUIIT CAMPUS (open night campus, wide exploration) ----
  campus: {
    name: "SUIIT CAMPUS  ·  CHAPTER 1", drone: "earth",
    rows: grid(80, 20, (x,y) => {
      if (y >= 18) return "#";
      // Grass ledge variation
      if (y === 14 && x >= 20 && x <= 35) return "#";  // elevated path
      if (y === 11 && x >= 48 && x <= 60) return "#";  // rooftop
      // Buildings as crate walls
      if (x >= 10 && x <= 14 && y >= 12 && y <= 17) return "#"; // dorm block
      if (x >= 42 && x <= 50 && y >= 10 && y <= 17) return "#"; // lab building outer
      if (x >= 51 && x <= 54 && y >= 15 && y <= 17) return "#"; // lab entrance pillar
      if (x >= 68 && x <= 73 && y >= 14 && y <= 17) return "#"; // observatory
      if ((x===22||x===23) && y===13) return "C"; // notebook on ledge
      return ".";
    }),
    spawn: { x: 60, y: 18*TILE-20 },
    entities: () => [
      { kind:"sign",    x:30*TILE, y:18*TILE-32, w:22, h:32, prompt:"Read the sign" },
      { kind:"log", id:"campusLog", x:22*TILE+4, y:13*TILE-20, w:16,h:16, prompt:"Pick up notebook",
        title:"SUIIT Night Log — Dr. Murugesh",
        body:"Meteor fragment 7-B fell from the roof array. It shouldn't be warm. Rock from space should not be warm. Left it in the imaging lab downstairs. Someone should check it. Something about the emission rhythm bothers me." },
      { kind:"door",    x:52*TILE, y:18*TILE-48, w:22, h:48, prompt:"Enter the Science Complex →", to:"lab" },
      { kind:"flavor",  x:6*TILE, y:18*TILE-26, w:30, h:20, prompt:"Sit at the bench",
        lines:[{who:"SUBH",text:"The quad is empty. Even the moths are only orbiting the one lit window in the complex. Something is happening in there."}] },
      { kind:"flavor",  x:68*TILE+4, y:14*TILE-28, w:28, h:28, prompt:"Check the observatory",
        lines:[{who:"SUBH",text:"The telescope is tracking something that isn't a star. The RA and Dec don't match anything in the catalog. It's moving."}] },
      { kind:"collectible", id:"securityBadge", x:49*TILE, y:10*TILE-18, w:14, h:14, prompt:"Take security badge",
        giveFlag:"securityBadge", title:"Security Badge", body:"A Level-3 faculty security badge. This will unlock the restricted scanner room in the lab." },
    ],
  },

  // ---- CHAPTER 1B: RESEARCH LABORATORY (multi-room) ----
  lab: {
    name: "RESEARCH LAB  ·  CHAPTER 1", drone: "earth",
    rows: grid(56, 18, (x,y) => {
      if (y===0||y===17||x===0||x===55) return "#";
      if (y===15) return "#"; // main floor
      // inner walls (rooms)
      if (x===18 && y>=6 && y<=14) return "#";   // partition wall
      if (x>=19 && x<=28 && y===10) return "#";  // upper shelf
      if (x===36 && y>=8 && y<=14) return "#";   // partition 2
      if ((x===8||x===9) && (y===13||y===14)) return "C";  // microscope area
      return ".";
    }),
    spawn: { x: 48, y: 15*TILE-22 },
    entities: () => [
      { kind:"door", x:2*TILE, y:15*TILE-48, w:22,h:48, prompt:"Return to Campus", to:"campus", spawn:{x:50*TILE,y:18*TILE-22} },
      { kind:"flavor", x:5*TILE, y:15*TILE-32, w:24,h:32, prompt:"Use the microscope",
        lines:[{who:"SUBH",text:"Cells in the dust are dividing. There's no culture medium. There's no reason for them to be alive. And yet."}] },
      { kind:"log", id:"labLog", x:8*TILE+2, y:13*TILE-18, w:16,h:16, prompt:"Take the spectrometer tape",
        title:"Spectrometer Tape — Lab #3",
        body:"The emission repeats every 11 seconds exactly. That interval is either a metabolic cycle or a deliberate beacon. I do not like either answer." },
      { kind:"scanner", x:28*TILE, y:15*TILE-34, w:32,h:34, prompt:"Scan the meteorite fragment",
        needFlag:"securityBadge", lockedMsg:"Security door sealed. You need a Level-3 badge." },
      { kind:"terminal", x:46*TILE, y:15*TILE-34, w:28,h:34, prompt:"Open the terminal" },
    ],
  },

  // ---- CHAPTER 2: HAIL MARY (larger ship, 3 vertical floors) ----
  ship: {
    name: "HAIL MARY  ·  CHAPTER 2", drone: "ship",
    rows: grid(60, 24, (x,y) => {
      if (y===0||y===23||x===0||x===59) return "#";
      if (y===22) return "#"; // bottom floor
      const floors = {7:true, 14:true};
      const ladder = (x===14 || x===38);
      if (floors[y] && !ladder) return "#";
      if ((x===14||x===38) && y>=1 && y<=21) return "L";
      // radiation zone barrier
      if (x>=20 && x<=28 && y===14) return "#"; // blocked mid section
      // vents
      if (x===32 && y>=15 && y<=21) return "V"; // alien vine for Rocky
      return ".";
    }),
    spawn: { x: 50*TILE, y: 22*TILE-22 },
    entities: () => [
      { kind:"flavor", x:10*TILE, y:22*TILE-28, w:22,h:28, prompt:"Check the ladder",
        lines:[{who:"SUBH",text:"The ladder still holds. Up is the only direction that isn't venting atmosphere."}] },
      { kind:"o2",    x:42*TILE, y:22*TILE-30, w:24,h:30, prompt:"Patch the oxygen line" },
      { kind:"steam", x:28*TILE, y:14*TILE-14, w:48,h:14 },
      { kind:"steam", x:16*TILE, y:14*TILE-14, w:24,h:14 },
      { kind:"log", id:"shipLog", x:46*TILE, y:14*TILE-20, w:16,h:16, prompt:"Recover the black box chip",
        title:"Hail Mary — Black Box Fragment",
        body:"Mid-course correction failed. Something outside the hull responded to our radio before we did. The reply was a recognizable tune. This is not instrument error." },
      { kind:"log", id:"engineerLog", x:6*TILE, y:14*TILE-20, w:16,h:16, prompt:"Chief Engineer's log",
        title:"Chief Engineer Log — Day 47",
        body:"The radiation seals on the core access corridor are still tripped. Manual bypass only. Someone with a rad-suit needs to cycle the breaker in the junction box, sector C." },
      { kind:"radsuit", x:24*TILE, y:7*TILE-28, w:22,h:28, prompt:"Take the radiation suit" },
      { kind:"power",   x:5*TILE,  y:7*TILE-30, w:26,h:30, prompt:"Open the power panel" },
      { kind:"radlock", x:21*TILE, y:14*TILE-32, w:16,h:32, prompt:"Radiation lock — bypass required",
        needFlag:"radiationSuit", lockedMsg:"RADIATION BARRIER ACTIVE. Suit required." },
      { kind:"breach",  x:28*TILE, y:7*TILE-56, w:14*TILE, h:56 },
      { kind:"cockpit", x:52*TILE, y:7*TILE-38, w:26,h:38, prompt:"Launch transit sequence" },
    ],
  },

  // ---- CHAPTER 3A: ALIEN DOCKING BAY ----
  dock: {
    name: "ALIEN VESSEL — DOCKING BAY  ·  CHAPTER 3", drone: "alien",
    rows: grid(44, 17, (x,y) => {
      if (y===0||y===16||x===0||x===43) return "#";
      if (y===14) return "#";
      // alien platform
      if (y===9 && x>=18 && x<=28) return "#";
      // alien vine climbable
      if (x===22 && y>=10 && y<=13) return "V";
      return ".";
    }),
    spawn: { x: 48, y: 14*TILE-22 },
    entities: () => [
      { kind:"rocky-npc", x:34*TILE, y:14*TILE-18, w:20,h:18 },
      { kind:"door", x:38*TILE, y:14*TILE-44, w:22,h:44, prompt:"Open the sync bay", to:"sync",
        need:"melody", locked:"The hatch won't move until the song is answered." },
      { kind:"flavor", x:5*TILE, y:14*TILE-28, w:28,h:28, prompt:"Examine the alien hull",
        lines:[
          {who:"SUBH", text:"The walls pulse with orange light. Like a heartbeat, but in an eleven-second pattern."},
          {who:"SUBH", text:"The same interval as the meteorite emissions back on Earth. This ship — it's related."},
        ]},
    ],
  },

  // ---- CHAPTER 3B: SYNC BAY (both characters needed) ----
  sync: {
    name: "SYNC BAY  ·  CHAPTER 3", drone: "alien",
    rows: grid(44, 18, (x,y) => {
      if (y===0||y===17||x===0||x===43) return "#";
      if (y===16) return "#";
      // upper platform for Rocky
      if (y===9 && x>=22 && x<=42 && x!==24) return "#";
      if (x===24 && y>=10 && y<=15) return "V";
      if (x===24 && y===9) return "V";
      return ".";
    }),
    spawn: { x: 56, y: 16*TILE-22 },
    rocky: { x: 112, y: 16*TILE-18 },
    entities: () => [
      { kind:"sync", who:"subh",  flag:"subhSync",  x:4*TILE,  y:16*TILE-32, w:28,h:32,
        prompt:"Lock the carrier wave",
        wrong:"The panel is calibrated for human hands.",
        deny:"",
        line:"Carrier wave locked. The alien transmitter should hear it now." },
      { kind:"sync", who:"rocky", flag:"rockySync", need:"subhSync", x:30*TILE, y:9*TILE-30, w:28,h:30,
        prompt:"Match the harmonic resonance",
        wrong:"The alien resonator needs Rocky's frequency range.",
        deny:"No carrier wave yet. The other console is dark.",
        line:"Harmonic matched. The docking clamps are activating." },
      { kind:"door", x:38*TILE, y:16*TILE-44, w:22,h:44, prompt:"Fire the beacon!", to:"ending",
        need:"clamps", locked:"Both consoles must be active first." },
    ],
  },
};

// ============================================================
//  ACTOR SYSTEM
// ============================================================
function makeActor(who, x, y) {
  return {
    who, x, y,
    w: 14, h: who==="rocky" ? 18 : 22,
    vx:0, vy:0, facing:1, onGround:false, climbing:false,
    anim:0, dashT:0, dashCD:0, dashDir:1,
    trail: [],
  };
}
function activeActor() { return G.actors[G.active] || null; }

// ============================================================
//  LEVEL LOADER
// ============================================================
function enterLevel(id, pos, activeIndex, keepToast) {
  const def = LEVELS[id];
  G.scene = id; G.mode = "play";
  G.map = def.rows.map(r => r.split(""));
  G.entities = def.entities();
  const sp = pos || def.spawn;
  G.actors = [makeActor("subh", sp.x, sp.y)];
  if (def.rocky) G.actors.push(makeActor("rocky", def.rocky.x, def.rocky.y));
  G.active = clamp(activeIndex||0, 0, G.actors.length-1);
  if (pos && G.actors[0]) { G.actors[0].x = pos.x; G.actors[0].y = pos.y; }
  G.particles = []; G.sparks = []; G.flies = [];
  // fireflies on campus
  const r = rng(id.length*77+5);
  if (id==="campus") for(let i=0;i<40;i++) G.flies.push({x:r()*80*TILE,y:60+r()*160,s:0.3+r(),p:r()*8});
  if (id==="dock"||id==="sync") for(let i=0;i<20;i++) G.sparks.push({x:r()*44*TILE,y:r()*17*TILE,vx:(-0.5+r())*15,vy:-5-r()*10,life:1,size:1+r()*2,color:`hsl(${30+r()*40},100%,70%)`});
  G.cam.x = G.actors[G.active].x - VIEW_W/2;
  G.cam.y = G.actors[G.active].y - VIEW_H/2;
  G.playT = 0; G.shake = 0;
  refreshObjective();
  if (!keepToast) showBanner(def.name);
  setDrone(def.drone);
  saveGame();
}

// ============================================================
//  PHYSICS
// ============================================================
function tileAt(x, y) {
  if (y<0) return ".";
  if (x<0||y>=G.map.length||x>=G.map[0].length) return "#";
  return G.map[y][x];
}
function isSolid(x, y) { const t=tileAt(x,y); return t==="#"||t==="C"; }
function isLadder(x, y) {
  const t = tileAt(x,y);
  return (t==="L") || (t==="V" && activeActor()?.who==="rocky");
}

function sweepRect(a, dt, controlled) {
  // Dash
  if (controlled && dashEdge() && a.dashCD<=0 && !a.climbing) {
    const dir = a.facing;
    a.dashT = DASH_DUR; a.dashCD = DASH_CD;
    a.vx = dir * DASH_V; a.vy = Math.min(a.vy, -60);
    a.dashDir = dir;
    tone(320, 0.07, "square", 0.03);
    // trail particles
    for(let i=0;i<6;i++) G.particles.push({
      x:a.x+a.w/2, y:a.y+a.h/2,
      vx: -dir*20 + (Math.random()-0.5)*30, vy:(Math.random()-0.5)*20,
      life:0.3, color: a.who==="rocky"?"#d7ff6a":"#9ad7ff", size:2
    });
  }
  a.dashT  = Math.max(0, a.dashT  - dt);
  a.dashCD = Math.max(0, a.dashCD - dt);

  const climbX = getClimbTile(a);
  const wantClimb = controlled && climbX>=0 && (moveUp()||moveDown()||a.climbing);

  if (wantClimb) {
    a.climbing = true;
    a.vy = ((moveDown()?1:0)-(moveUp()?1:0)) * CLIMB_SPEED;
    a.vx = ((moveRight()?1:0)-(moveLeft()?1:0)) * 50;
    if (!moveLeft()&&!moveRight()) a.x += (climbX*TILE+TILE/2-a.w/2 - a.x) * Math.min(1,dt*10);
    if (controlled && jumpEdge()) { a.climbing=false; a.vy=JUMP_V; tone(190,0.06,"square",0.03); }
  } else {
    a.climbing = false;
    if (a.dashT>0) {
      // dash override
    } else {
      const dir = (moveRight()&&controlled?1:0)-(moveLeft()&&controlled?1:0);
      a.vx = dir * MOVE_SPEED;
      if (dir) a.facing = dir;
    }
    a.vy = Math.min(380, a.vy + GRAVITY*dt);
    if (controlled && jumpEdge() && a.onGround) {
      a.vy = JUMP_V; a.onGround=false;
      tone(185,0.06,"square",0.03);
      G.particles.push({x:a.x+a.w/2,y:a.y+a.h,vx:(Math.random()-0.5)*30,vy:-20,life:0.2,color:"#8aa0b4",size:2});
    }
  }

  // Integrate X
  a.x += a.vx * dt;
  if (rectHits(a.x, a.y, a.w, a.h)) {
    a.x = a.vx>0
      ? Math.floor((a.x+a.w-0.001)/TILE)*TILE - a.w - 0.01
      : (Math.floor(a.x/TILE)+1)*TILE + 0.01;
    a.vx=0; if(a.dashT>0) a.dashT=0;
  }
  // Integrate Y
  a.y += a.vy * dt;
  a.onGround = false;
  if (rectHits(a.x, a.y, a.w, a.h)) {
    if (a.vy>0) { a.y=Math.floor((a.y+a.h-0.001)/TILE)*TILE-a.h-0.01; a.onGround=true; }
    else { a.y=(Math.floor(a.y/TILE)+1)*TILE+0.01; }
    a.vy=0;
  }
  // Walk animation
  if (Math.abs(a.vx)>8 && a.onGround) a.anim += dt*14;
  else a.anim += dt*4;

  // Footstep dust
  if (Math.abs(a.vx)>80 && a.onGround && Math.random()<0.3) {
    G.particles.push({x:a.x+a.w/2,y:a.y+a.h,vx:(Math.random()-0.5)*20,vy:-4-Math.random()*8,life:0.25,color:"#8aa0b4",size:1});
  }
}

function rectHits(x,y,w,h) {
  const x0=Math.floor(x/TILE), y0=Math.floor(y/TILE);
  const x1=Math.floor((x+w-0.01)/TILE), y1=Math.floor((y+h-0.01)/TILE);
  for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++) if(isSolid(tx,ty)) return true;
  return false;
}
function getClimbTile(a) {
  const x0=Math.floor(a.x/TILE), y0=Math.floor(a.y/TILE);
  const x1=Math.floor((a.x+a.w-0.01)/TILE), y1=Math.floor((a.y+a.h-0.01)/TILE);
  for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++) {
    const t=tileAt(tx,ty);
    if(t==="L") return tx;
    if(t==="V"&&G.actors[G.active]?.who==="rocky") return tx;
  }
  return -1;
}
function overlap(a,b) { return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }

// ============================================================
//  INTERACTION
// ============================================================
function nearestEntity() {
  const a = activeActor(); if(!a) return null;
  let best=null, bestD=52;
  G.entities.forEach(e => {
    if(["steam","breach","rocky-npc"].includes(e.kind)) return;
    if(e.kind==="log"&&G.flags[e.id]) return;
    if(e.kind==="collectible"&&G.flags[e.id]) return;
    const dx=(e.x+e.w/2)-(a.x+a.w/2), dy=(e.y+e.h/2)-(a.y+a.h/2);
    const d=Math.hypot(dx,dy);
    if(Math.abs(dx)<44&&Math.abs(dy)<40&&d<bestD){best=e;bestD=d;}
  });
  return best;
}

function say(lines, done) { G.talk={lines:lines.slice(),i:0,done:done||null}; G.mode="talk"; }
function closeTalk() { const d=G.talk?.done; G.talk=null; G.mode="play"; if(d) d(); }

function interact() {
  const e = nearestEntity(); if(!e) return;
  const who = activeActor().who;

  switch(e.kind) {
    case "sign":
      G.flags.sawSign=true; refreshObjective();
      say([{who:"SIGN",text:"SCIENCE COMPLEX  →    RESEARCH LAB  →  SCANNER ROOM (Level-3 required)"},{who:"SUBH",text:"East then. The fragment won't explain itself."}]);
      saveGame(); break;

    case "flavor": say(e.lines); break;

    case "log":
      if(G.flags[e.id]) return;
      G.flags[e.id]=true; journalAdd(e.title,e.body); refreshObjective(); break;

    case "collectible":
      if(G.flags[e.id]) return;
      G.flags[e.id]=true;
      if(e.giveFlag) G.flags[e.giveFlag]=true;
      journalAdd(e.title,e.body);
      toast("Picked up: "+e.title);
      tone(520,0.1,"square",0.05);
      refreshObjective(); saveGame(); break;

    case "door":
      if(e.need&&!G.flags[e.need]){say([{who:"SHIP",text:e.locked}]);return;}
      if(e.to==="ending"){startEnding();return;}
      tone(420,0.07,"square",0.04);
      enterLevel(e.to, e.spawn||null, 0); break;

    case "scanner":
      if(e.needFlag&&!G.flags[e.needFlag]){say([{who:"TERMINAL",text:e.lockedMsg}]);return;}
      if(G.flags.scanned){say([{who:"SUBH",text:"The fragment is stable. For now. I don't trust 'for now'."}]);return;}
      openMolecule(); break;

    case "terminal":
      if(!G.flags.scanned){say([{who:"TERMINAL",text:"Analysis incomplete. The spectrometer is still waiting on a molecular sequence."}]);return;}
      if(G.flags.transmissionSeen){say([{who:"SUBH",text:"The order is logged. The ship won't wait forever."}]);return;}
      say([
        {who:"TERMINAL",text:"PRIORITY TRANSMISSION — SOLAR ANOMALY CONFIRMED. ALL QUALIFIED CREW REPORT TO HAIL MARY. BRING THE FRAGMENT."},
        {who:"SUBH",text:"That's not a departmental memo. That's a launch order."},
      ], ()=>startCutscene("launch")); break;

    case "o2":
      if(G.flags.o2Patched){say([{who:"SUBH",text:"The line is holding. I can breathe and panic at the same time."}]);return;}
      G.flags.o2Patched=true; G.o2=90; toast("Oxygen line patched — leak slowed");
      tone(520,0.1,"square",0.05); refreshObjective();
      say([{who:"SUBH",text:"Patch is on. The leak slows. It doesn't stop."}]); saveGame(); break;

    case "radsuit":
      if(G.flags.radiationSuit){say([{who:"SUBH",text:"Already wearing it. It's heavy and smells like old coffee."}]);return;}
      G.flags.radiationSuit=true; toast("Radiation suit equipped");
      tone(440,0.08,"square",0.04); refreshObjective();
      say([{who:"SUBH",text:"The radiation suit locks on. The Geiger counter on my wrist drops to safe."}]); saveGame(); break;

    case "radlock":
      if(!G.flags.radiationSuit){say([{who:"TERMINAL",text:e.lockedMsg}]);return;}
      G.flags.coreAccess=true; toast("Radiation lock bypassed");
      tone(540,0.12,"square",0.05); refreshObjective();
      say([{who:"SUBH",text:"Breaker cycled. The lock opens. The corridor ahead is dark but passable."}]); saveGame(); break;

    case "power":
      if(G.flags.powered){say([{who:"SUBH",text:"Power is live. The cockpit hatch should respond."}]);return;}
      openPipes(); break;

    case "cockpit":
      if(!G.flags.powered){say([{who:"SHIP",text:"Cockpit hatch is dark. Restore backup power first — panel is above the ladder."}]);return;}
      if(!G.flags.coreAccess){say([{who:"SHIP",text:"Core access corridor is locked. Radiation warning. Find a suit and bypass the breaker."}]);return;}
      startAsteroids(); break;

    case "sync":
      if(who!==e.who){say([{who:who==="rocky"?"ROCKY":"SUBH",text:e.wrong}]);return;}
      if(e.need&&!G.flags[e.need]){say([{who:"ROCKY",text:e.deny}]);return;}
      if(G.flags[e.flag]){say([{who:who==="rocky"?"ROCKY":"SUBH",text:"This console is already locked in."}]);return;}
      G.flags[e.flag]=true; tone(who==="rocky"?340:480,0.14,"square",0.05);
      refreshObjective(); saveGame();
      say([{who:who==="rocky"?"ROCKY":"SUBH",text:e.line}], ()=>{
        if(G.flags.subhSync&&G.flags.rockySync&&!G.flags.syncedTalk){
          G.flags.syncedTalk=true; G.flags.clamps=true; refreshObjective();
          say([
            {who:"ROCKY",text:"Friend. Both skies. Same sickness."},
            {who:"SUBH",text:"Then we send the cure home. Yours and mine."},
            {who:"ROCKY",text:"Two beacons. One friendship."},
          ], ()=>playClip("laugh"));
        }
      }); break;
  }
}

function hurt(n, fromX) {
  const a = activeActor();
  if(!a||G.iframes>0||G.mode!=="play") return;
  G.hp -= n; G.iframes=1.0; G.flash=0.4; G.flashColor="255,60,40"; G.shake=6;
  a.vy=-160; a.vx = a.x<fromX?-100:100;
  tone(90,0.14,"sawtooth",0.06);
  // blood/impact particles
  for(let i=0;i<6;i++) G.particles.push({x:a.x+a.w/2,y:a.y+a.h/2,vx:(Math.random()-0.5)*60,vy:-20-Math.random()*40,life:0.5,color:"#ff4a4a",size:2});
  if(G.hp<=0){G.hp=0;goDown("SUIT BREACH");}
}

function goDown(msg) {
  G.stats.deaths++; G.down={msg,t:2.0}; G.mode="down"; G.shake=8;
  tone(80,0.2,"sawtooth",0.06);
}
function respawn() {
  const def=LEVELS[G.scene], a=G.actors[0];
  a.x=def.spawn.x; a.y=def.spawn.y; a.vx=0; a.vy=0;
  G.active=0; G.hp=G.hpMax; G.iframes=1.4;
  if(G.scene==="ship") G.o2=G.flags.o2Patched?85:70;
  G.mode="play"; toast(G.down?.msg||"Restart"); G.down=null;
}

// ============================================================
//  UPDATE LOOP
// ============================================================
function updatePlay(dt) {
  G.playT += dt; G.stats.time += dt;
  G.actors.forEach((a,i) => sweepRect(a, dt, i===G.active && G.mode==="play"));

  // TAB switch (sync scene only)
  if(G.scene==="sync" && tabEdge() && G.actors.length>1) {
    G.active = G.active===0?1:0;
    tone(300,0.06,"square",0.04);
    toast("Playing as "+ (G.actors[G.active].who==="rocky"?"ROCKY":"SUBH"));
  }

  const a = activeActor();

  // Steam damage
  G.entities.forEach(e => { if(e.kind==="steam"&&overlap(a,e)) hurt(1,e.x+e.w/2); });

  // O2 drain on ship
  if(G.scene==="ship" && G.mode==="play") {
    let rate = G.flags.o2Patched ? 0.4 : 1.6;
    G.entities.forEach(e => { if(e.kind==="breach"&&overlap(a,e)) rate+=8; });
    G.o2 -= rate*dt;
    if(G.o2<=0){G.o2=0;goDown("OXYGEN DEPLETED");}
    if(G.o2<20&&Math.random()<0.05) G.flash=0.08, G.flashColor="200,80,80";
  }

  // Dock trigger
  if(G.scene==="dock"&&!G.flags.dockTalk&&a.x>200) {
    G.flags.dockTalk=true; playClip("speech");
    say([
      {who:"SUBH",text:"That's not static. The peaks repeat. It's structured."},
      {who:"ROCKY",text:"♪  ♫  ♪  ♫"},
      {who:"SUBH",text:"If it's a language, it'll survive being played back. Let me try."},
    ], ()=>openMelody());
  }

  if(useEdge()) interact();
  G.iframes = Math.max(0, G.iframes-dt);

  // Particle update
  G.particles = G.particles.filter(p=>{
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=200*dt; p.life-=dt;
    return p.life>0;
  });
  G.flies.forEach(f=>{ f.p+=dt; f.x+=Math.sin(f.p*1.3)*10*dt; f.y+=Math.cos(f.p*0.9)*7*dt; });
  G.sparks=G.sparks.filter(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=120*dt;s.life-=dt;return s.life>0;});
  if((G.scene==="dock"||G.scene==="sync")&&Math.random()<0.06) {
    G.sparks.push({x:Math.random()*44*TILE,y:Math.random()*5*TILE,vx:(-0.5+Math.random())*12,vy:-4-Math.random()*8,life:0.8+Math.random(),size:1+Math.random()*2,color:`hsl(${30+Math.random()*40},100%,70%)`});
  }
}

function updateCamera(dt) {
  const a=activeActor(); if(!a||!G.map.length) return;
  const mapW=G.map[0].length*TILE, mapH=G.map.length*TILE;
  let tx=a.x+a.w/2-VIEW_W/2, ty=a.y+a.h/2-VIEW_H/2+10;
  tx = mapW<=VIEW_W?(mapW-VIEW_W)/2:clamp(tx,0,mapW-VIEW_W);
  ty = mapH<=VIEW_H?(mapH-VIEW_H)/2:clamp(ty,0,mapH-VIEW_H);
  G.cam.x += (tx-G.cam.x)*Math.min(1,dt*7);
  G.cam.y += (ty-G.cam.y)*Math.min(1,dt*7);
}

// ============================================================
//  CUTSCENES
// ============================================================
const CUTSCENES = {
  intro: [
    {bg:"stars",   kicker:"SOMEWHERE NEAR EARTH", body:"Sunlight should arrive on schedule. It is not. The solar constant is falling. Scientists call it the Astrophage."},
    {bg:"campus",  kicker:"SUIIT CAMPUS  ·  MIDNIGHT", body:"The campus is asleep. One lab window is burning with blue light. A researcher — SUBH — is still there."},
    {bg:"lab",     kicker:"THE SAMPLE", body:"SUBH expected a cold meteorite. The spectrometer says it has a metabolism. It is alive."},
    {bg:"stars",   kicker:"YOUR MISSION", body:"Identify what it is, what it wants, and why it chose this roof. You have until morning."},
  ],
  launch: [
    {bg:"lab",      kicker:"PRIORITY SIGNAL", body:"Solar anomaly confirmed. All crew recalled. Report to the Hail Mary. Bring the fragment. This is not a drill."},
    {bg:"asteroids",kicker:"DEPARTURE", body:"The ship leaves Earth carrying a full hold of questions and one warm stone that shouldn't be alive."},
    {bg:"ship",     kicker:"WEEKS LATER — IN THE DARK", body:"The corridor is the wrong kind of quiet. Oxygen is leaving faster than it should. Someone needs to fix this. Fast."},
  ],
  contact: [
    {bg:"asteroids",kicker:"RADAR CONTACT", body:"A shape is holding your heading. It is not a rock. It is matching your speed exactly. It is waiting."},
    {bg:"rocky_enc",kicker:"FIRST CONTACT", body:"It sings. On a frequency the radio was never built for. And somehow, impossibly — SUBH recognizes the tune."},
  ],
};

function startCutscene(id) {
  G.cut={id,slides:CUTSCENES[id],i:0,t:0}; G.mode="cutscene";
  setDrone(id==="launch"?"ship":id==="contact"?"alien":"earth");
}
function finishCutscene() {
  const id=G.cut?G.cut.id:""; G.cut=null;
  if(id==="intro") enterLevel("campus");
  else if(id==="launch"){G.flags.transmissionSeen=true;G.hp=G.hpMax;G.o2=100;enterLevel("ship");}
  else if(id==="contact") enterLevel("dock");
  else G.mode="play";
}

// ============================================================
//  PUZZLES
// ============================================================

// --- MOLECULAR RECONSTRUCTION (upgraded with hints system) ---
const MOLECULES = [
  {id:"PO4",    name:"PHOSPHATE", color:"#e2a043", hint:"Backbone start. Forms the spine of RNA."},
  {id:"RIBOSE", name:"RIBOSE",    color:"#3dce8b", hint:"5-carbon sugar. Connects the backbone."},
  {id:"ADENINE",name:"ADENINE",   color:"#3ec2e0", hint:"Nitrogenous base. Carries the signal code."},
  {id:"FE",     name:"FE-CORE",  color:"#e25b4a", hint:"Iron-sulfur cluster. The alien metabolic key."},
];
const MOLECULE_ORDER = ["PO4","RIBOSE","ADENINE","FE"];

function openMolecule() {
  G.molecule={slots:[null,null,null,null],picked:null,shake:0,marks:[0,0,0,0],slot:0,hintVisible:false,attempts:0};
  G.mode="puzzle"; G.puzzle="molecule"; G.scanBeam=0;
}
function moleculeCheck() {
  const slots=G.molecule.slots;
  if(slots.some(s=>!s)){toast("Chain still has gaps");G.molecule.shake=0.3;tone(110,0.1,"square",0.04);return;}
  let ok=true;
  slots.forEach((id,i)=>{const good=id===MOLECULE_ORDER[i];G.molecule.marks[i]=good?1:-1;if(!good)ok=false;});
  G.molecule.attempts++;
  if(!ok){G.molecule.shake=0.35;tone(100,0.14,"sawtooth",0.05);toast(G.molecule.attempts>=2?"Sequence unstable — click ? for hints":"Sequence unstable");return;}
  G.flags.scanned=true; refreshObjective(); saveGame();
  G.scanBeam=0;
  tone(620,0.14,"square",0.06);
  G.mode="play"; G.puzzle=null;
  say([
    {who:"SCANNER",text:"BIOLOGICAL SIGNATURE CONFIRMED. MATCH: ASTROPHAGE VARIANT. METABOLIZING STARLIGHT."},
    {who:"SUBH",text:"It's eating the sun. And it left a sample here on purpose. This is a message."},
  ]);
}

// --- PIPE ROTATION (harder, 6 cells) ---
function openPipes() {
  G.pipe={
    cells:[
      {x:0,y:0,type:"I",rot:1},{x:1,y:0,type:"L",rot:0},{x:2,y:0,type:"T",rot:2},
      {x:0,y:1,type:"L",rot:1},{x:1,y:1,type:"T",rot:3},{x:2,y:1,type:"I",rot:1},
    ],
    sel:0,
  };
  G.mode="puzzle"; G.puzzle="pipes";
}
function pipeMask(c) {
  if(c.type==="I") return c.rot%2===0?(2|8):(1|4);
  if(c.type==="T") return [3|4, 1|2|4, 2|8|4, 1|8|2][c.rot%4]; // T-junction
  return [3,6,12,9][c.rot%4]; // L
}
function pipeCell(x,y){ return G.pipe.cells.find(c=>c.x===x&&c.y===y)||null; }
function poweredPipes() {
  const seen=new Set(), start=pipeCell(0,0);
  if(!start||!(pipeMask(start)&8)) return seen;
  const q=[[0,0]]; seen.add("0,0");
  const dirs=[{dx:0,dy:-1,bit:1,opp:4},{dx:1,dy:0,bit:2,opp:8},{dx:0,dy:1,bit:4,opp:1},{dx:-1,dy:0,bit:8,opp:2}];
  while(q.length){
    const cur=q.shift(), cell=pipeCell(cur[0],cur[1]), m=pipeMask(cell);
    if(cur[0]===2&&cur[1]===1&&(m&2)) seen.add("core");
    dirs.forEach(d=>{
      if(!(m&d.bit)) return;
      const nx=cur[0]+d.dx, ny=cur[1]+d.dy, n=pipeCell(nx,ny);
      if(!n||!(pipeMask(n)&d.opp)) return;
      const k=nx+","+ny; if(seen.has(k)) return;
      seen.add(k); q.push([nx,ny]);
    });
  }
  return seen;
}
function rotateSelected(dir) {
  const c=G.pipe.cells[G.pipe.sel];
  c.rot=(c.rot+dir+4)%(c.type==="I"?2:4);
  tone(240+c.rot*40,0.05,"square",0.03);
  if(poweredPipes().has("core")){
    G.flags.powered=true; refreshObjective(); saveGame();
    G.mode="play"; G.puzzle=null; G.shake=4;
    tone(540,0.16,"square",0.06);
    say([{who:"SHIP",text:"Backup bus is live. Cockpit hatch has power. Oxygen alarm silenced."}]);
  }
}

// --- MELODY / SONIC TRANSLATOR (3 rounds, harder) ---
function openMelody() {
  G.melody={
    rounds:[[0,2,1],[0,2,1,3],[1,0,3,2,1],[2,3,0,1,3,2]],  // 4 rounds total now
    round:0, phase:"listen", step:0, timer:0.5, input:[], flash:-1, flashT:0,
  };
  G.mode="puzzle"; G.puzzle="melody";
}
const NOTES=[262,330,392,523];
function playNote(i){ tone(NOTES[i],0.26,"sine",0.07); if(G.melody){G.melody.flash=i;G.melody.flashT=0.22;} }
function melodyBtn(i){
  const w=84,gap=14,total=4*w+3*gap,x0=(VIEW_W-total)/2;
  return {x:x0+i*(w+gap),y:200,w,h:52};
}

// ============================================================
//  ASTEROID SEQUENCE (upgraded — 4 hull, power-ups)
// ============================================================
function startAsteroids() {
  G.asteroid={
    y:170, vy:0, t:0, hull:4, rocks:[], spawn:0.25,
    iframes:1.2, done:false, powerups:[], puSpawn:5,
    phase:1, // phase escalates difficulty
  };
  G.mode="asteroid"; setDrone("ship"); saveGame();
  showBanner("SECTOR TRANSIT — DODGE!");
}
function updateAsteroids(dt) {
  const a=G.asteroid; a.t+=dt; a.iframes-=dt;
  // Phase progression
  if(a.t>8&&a.phase<2){a.phase=2;toast("Warning: density increasing!");}
  if(a.t>14&&a.phase<3){a.phase=3;toast("CRITICAL — final stretch!");}

  const dir=(moveDown()?1:0)-(moveUp()?1:0)+(held("ArrowDown")||held("KeyS")?1:0)-(held("ArrowUp")||held("KeyW")?1:0);
  const targetVy = dir*160;
  a.vy += (targetVy-a.vy)*Math.min(1,dt*8); // smooth steering
  a.y = clamp(a.y+a.vy*dt, 50, 310);

  // Rock spawn
  a.spawn-=dt;
  const spawnRate = a.phase===3?0.22:a.phase===2?0.35:0.5;
  if(a.spawn<=0){
    const big=Math.random()<0.25;
    a.rocks.push({x:VIEW_W+24,y:50+Math.random()*270,r:big?14:5+Math.random()*8,s:60+Math.random()*70+a.phase*20,spin:Math.random()*6,rot:0});
    a.spawn=spawnRate+Math.random()*0.2;
  }

  // Power-up spawn (hull repair)
  a.puSpawn-=dt;
  if(a.puSpawn<=0&&a.hull<4){
    a.powerups.push({x:VIEW_W+10,y:60+Math.random()*240,s:55});
    a.puSpawn=8+Math.random()*6;
  }

  const ship={x:66,y:a.y-8,w:28,h:16};
  a.rocks.forEach(r=>{
    r.x-=r.s*dt; r.rot+=dt;
    if(a.iframes<=0&&r.x<ship.x+ship.w&&r.x+r.r>ship.x&&Math.abs(r.y-(ship.y+8))<r.r+8){
      a.hull--; a.iframes=0.75; G.shake=6;
      tone(80,0.14,"sawtooth",0.06); r.x=-99;
      G.flashColor="255,80,40"; G.flash=0.3;
      if(a.hull<=0){toast("Hull breached!");G.stats.deaths++;startAsteroids();return;}
    }
  });
  a.powerups.forEach(p=>{
    p.x-=p.s*dt;
    if(Math.abs(p.x-ship.x)<20&&Math.abs(p.y-ship.y)<20){
      a.hull=Math.min(4,a.hull+1); p.x=-99; toast("Hull repaired!");
      G.flashColor="80,220,180"; G.flash=0.2; tone(660,0.1,"sine",0.05);
    }
  });
  a.rocks=a.rocks.filter(r=>r.x>-50);
  a.powerups=a.powerups.filter(p=>p.x>-20);
  if(a.t>=20){G.mode="play";G.asteroid=null;startCutscene("contact");}
}

// ============================================================
//  ENDING
// ============================================================
function startEnding() {
  G.mode="ending"; G.endingT=0; G.scene="ending";
  setDrone("alien"); playClip("laugh");
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
}

// ============================================================
//  MASTER UPDATE
// ============================================================
function update(dt) {
  G.time+=dt; G.toastT=Math.max(0,G.toastT-dt); G.shake=Math.max(0,G.shake-dt*12);
  G.flash=Math.max(0,G.flash-dt); G.bannerT=Math.max(0,G.bannerT-dt);
  G.scanBeam=Math.max(0,(G.scanBeam||0)-dt*0.5);

  if(pressed("Escape")){
    if(G.mode==="pause") G.mode="play";
    else if(G.mode==="journal") G.mode="play";
    else if(G.mode==="howto") G.mode="title";
    else if(G.mode==="puzzle"){G.mode="play";G.puzzle=null;}
    else if(G.mode==="talk") closeTalk();
    else if(G.mode==="cutscene") finishCutscene();
    else if(G.mode==="play") G.mode="pause";
    else if(G.mode==="ending"){G.mode="title";setDrone(null);}
  }

  if(G.mode==="title"||G.mode==="howto") updateTitle();
  else if(G.mode==="cutscene"){
    G.cut.t+=dt;
    if(useEdge()||mouse.just||G.cut.t>7){G.cut.i++;G.cut.t=0;if(G.cut.i>=G.cut.slides.length)finishCutscene();}
  }
  else if(G.mode==="pause"){
    if(pressed("KeyJ")){G.mode="journal";G.journalSel=0;}
    else if(useEdge()||(mouse.just&&hitRect({x:220,y:140,w:200,h:30}))) G.mode="play";
  }
  else if(G.mode==="journal") updateJournal();
  else if(G.mode==="talk"){
    if(useEdge()||mouse.just){G.talk.i++;if(G.talk.i>=G.talk.lines.length)closeTalk();}
  }
  else if(G.mode==="puzzle") updatePuzzle(dt);
  else if(G.mode==="asteroid") updateAsteroids(dt);
  else if(G.mode==="down"){G.down.t-=dt;if(G.down.t<=0)respawn();}
  else if(G.mode==="play"){
    if(pressed("KeyJ")){G.mode="journal";G.journalSel=0;}
    else updatePlay(dt);
  }
  else if(G.mode==="ending"){G.endingT+=dt;if(useEdge()||mouse.just){G.mode="title";setDrone(null);}}

  if(["play","talk","puzzle","pause","journal","down"].includes(G.mode)) updateCamera(dt);
  endInput();
}

function updateTitle() {
  const items=titleItems();
  if(pressed("ArrowDown")||pressed("KeyS")) G.titleIndex=(G.titleIndex+1)%items.length;
  if(pressed("ArrowUp")||pressed("KeyW")) G.titleIndex=(G.titleIndex-1+items.length)%items.length;
  G.hover=-1; items.forEach((item,i)=>{if(hitRect(item.rect))G.hover=i;});
  if(G.hover>=0) G.titleIndex=G.hover;
  const activate=useEdge()||pressed("Space")||(mouse.just&&G.hover===G.titleIndex);
  if(!activate) return;
  const id=items[G.titleIndex].id;
  if(id==="new"){resetRun();try{localStorage.removeItem(SAVE_KEY);}catch(e){}startCutscene("intro");}
  else if(id==="continue") loadGame();
  else if(id==="how") G.mode="howto";
  else if(id==="back") G.mode="title";
}
function titleItems() {
  if(G.mode==="howto") return [{id:"back",label:"← BACK TO MENU",rect:{x:220,y:300,w:200,h:24}}];
  const items=[{id:"new",label:"▶  NEW MISSION"}];
  if(hasSave()) items.push({id:"continue",label:"◉  CONTINUE"});
  items.push({id:"how",label:"?  HOW TO PLAY"});
  items.forEach((item,i)=>{item.rect={x:210,y:196+i*32,w:220,h:26};});
  return items;
}
function updateJournal() {
  if(pressed("ArrowDown")||pressed("KeyS")) G.journalSel=Math.min(G.journal.length-1,G.journalSel+1);
  if(pressed("ArrowUp")||pressed("KeyW")) G.journalSel=Math.max(0,G.journalSel-1);
  if(!G.journal.length) G.journalSel=0;
}
function updatePuzzle(dt) {
  if(G.puzzle==="molecule"){
    const m=G.molecule; m.shake=Math.max(0,m.shake-dt);
    if(pressed("KeyA")||pressed("ArrowLeft")) m.slot=(m.slot+3)%4;
    if(pressed("KeyD")||pressed("ArrowRight")) m.slot=(m.slot+1)%4;
    if(pressed("KeyW")||pressed("ArrowUp")) cycleSlot(1);
    if(pressed("KeyS")||pressed("ArrowDown")) cycleSlot(-1);
    if(pressed("KeyH")) m.hintVisible=!m.hintVisible;
    if(mouse.just){
      MOLECULES.forEach((mol,i)=>{if(hitRect(molChipRect(i))) m.picked=m.picked===mol.id?null:mol.id;});
      for(let i=0;i<4;i++){
        if(hitRect(molSlotRect(i))){
          m.slot=i;
          if(m.picked){
            const ex=m.slots.indexOf(m.picked); if(ex>=0) m.slots[ex]=null;
            m.slots[i]=m.picked; m.picked=null; m.marks[i]=0;
          } else if(m.slots[i]){m.picked=m.slots[i];m.slots[i]=null;m.marks[i]=0;}
        }
      }
      if(hitRect({x:220,y:290,w:200,h:28})) moleculeCheck();
      if(hitRect({x:430,y:60,w:28,h:28})) m.hintVisible=!m.hintVisible;
    }
    if(pressed("Enter")) moleculeCheck();
    return;
  }
  if(G.puzzle==="pipes"){
    const p=G.pipe;
    if(pressed("ArrowRight")||pressed("KeyD")) p.sel=(p.sel+1)%p.cells.length;
    if(pressed("ArrowLeft")||pressed("KeyA")) p.sel=(p.sel-1+p.cells.length)%p.cells.length;
    if(pressed("Space")||pressed("KeyE")||pressed("ArrowUp")) rotateSelected(1);
    if(mouse.just) p.cells.forEach((c,i)=>{if(hitRect(pipeRect(c))){p.sel=i;rotateSelected(1);}});
    return;
  }
  if(G.puzzle==="melody") melodyAdvance(dt);
}
function cycleSlot(dir){
  const m=G.molecule,i=m.slot||0,used={};
  m.slots.forEach((id,idx)=>{if(idx!==i&&id)used[id]=true;});
  const opts=[null].concat(MOLECULES.map(mol=>mol.id).filter(id=>!used[id]));
  let cur=opts.indexOf(m.slots[i]); if(cur<0) cur=0;
  cur=(cur+dir+opts.length)%opts.length; m.slots[i]=opts[cur]; m.marks[i]=0;
}
function melodyAdvance(dt){
  const m=G.melody; m.flashT-=dt;
  if(m.phase==="listen"){
    m.timer-=dt; if(m.timer>0) return;
    const pattern=m.rounds[m.round];
    if(m.step<pattern.length){playNote(pattern[m.step]);m.step++;m.timer=0.45;}
    else{m.phase="play";m.input=[];m.step=0;toast("Your turn — repeat the phrase!");}
    return;
  }
  if(m.phase!=="play") return;
  let choice=-1;
  if(pressed("Digit1")||pressed("Numpad1")) choice=0;
  if(pressed("Digit2")||pressed("Numpad2")) choice=1;
  if(pressed("Digit3")||pressed("Numpad3")) choice=2;
  if(pressed("Digit4")||pressed("Numpad4")) choice=3;
  if(pressed("KeyR")){m.phase="listen";m.step=0;m.timer=0.4;m.input=[];return;}
  if(choice<0&&mouse.just) for(let i=0;i<4;i++){if(hitRect(melodyBtn(i)))choice=i;}
  if(choice<0) return;
  playNote(choice);
  const pattern=m.rounds[m.round];
  if(pattern[m.input.length]!==choice){
    m.phase="listen";m.step=0;m.timer=0.6;m.input=[];
    toast("Wrong note — R to replay the phrase");
    tone(90,0.14,"sawtooth",0.05); return;
  }
  m.input.push(choice);
  if(m.input.length===pattern.length){
    m.round++;
    if(m.round>=m.rounds.length){
      G.flags.melody=true; refreshObjective(); saveGame();
      G.mode="play"; G.puzzle=null; playClip("good");
      say([
        {who:"SHIP",text:"TRANSLATOR SEED ESTABLISHED. PARTIAL DECODE COMPLETE."},
        {who:"ROCKY",text:"You. Friend. Sky is sick. Same enemy."},
        {who:"SUBH",text:"You know what's killing the stars."},
        {who:"ROCKY",text:"Together. Fix. Or both worlds go dark."},
        {who:"SUBH",text:"Then let's fix it. Together."},
      ]);
    } else {
      m.phase="listen";m.step=0;m.timer=0.5;m.input=[];
      toast(`Phrase ${m.round+1} of ${m.rounds.length} — well done!`);
    }
  }
}

// ============================================================
//  DRAWING SYSTEM — MAX GRAPHICS
// ============================================================
function W2S(x,y){ return {x:Math.round(x-G.cam.x),y:Math.round(y-G.cam.y)}; }
function px(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }

// High-DPI text with shadow
function txt(str,x,y,color,size,align) {
  ctx.font=`${size||10}px 'Share Tech Mono', monospace`;
  ctx.textBaseline="top";
  if(align==="center") ctx.textAlign="center";
  else if(align==="right") ctx.textAlign="right";
  else ctx.textAlign="left";
  ctx.fillStyle="rgba(0,0,0,0.8)"; ctx.fillText(str,x+1,y+1);
  ctx.fillStyle=color; ctx.fillText(str,x,y);
  ctx.textAlign="left";
}
function txtC(str,x,y,color,size){ txt(str,x,y,color,size,"center"); }

function wrap(str,maxW,size){
  ctx.font=`${size||10}px 'Share Tech Mono', monospace`;
  const words=str.split(" "), lines=[]; let line="";
  words.forEach(w=>{ const t=line?line+" "+w:w; if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t; });
  if(line)lines.push(line); return lines;
}

function panel(x,y,w,h,bcolor) {
  // Glassmorphism panel
  ctx.fillStyle="rgba(4,10,20,0.92)"; ctx.fillRect(x,y,w,h);
  // inner glow top
  const gt=ctx.createLinearGradient(x,y,x,y+6);
  gt.addColorStop(0,"rgba(80,160,220,0.08)"); gt.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=gt; ctx.fillRect(x,y,w,6);
  ctx.strokeStyle=bcolor||"#2a8f96";
  ctx.lineWidth=1; ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  // inner border subtle
  ctx.strokeStyle="rgba(80,160,220,0.08)";
  ctx.strokeRect(x+2,y+2,w-4,h-4);
  ctx.lineWidth=1;
}

// ---- Stars ----
function drawStars(seed,parallax,count,yMax) {
  const r=rng(seed);
  for(let i=0;i<(count||80);i++){
    const sx=(r()*VIEW_W*3-G.cam.x*parallax+VIEW_W*2)%(VIEW_W);
    const sy=r()*(yMax||VIEW_H*0.8);
    const b=120+Math.floor(r()*120);
    const twinkle=0.6+0.4*Math.sin(G.time*2+r()*10);
    ctx.fillStyle=`rgba(${b},${b},${b+20},${twinkle})`;
    ctx.fillRect(Math.floor((sx+VIEW_W)%VIEW_W),Math.floor(sy),r()>0.85?2:1,1);
  }
}

// ---- SKY BACKGROUNDS ----
function drawSky() {
  // Deep night sky gradient
  const g=ctx.createLinearGradient(0,0,0,VIEW_H);
  g.addColorStop(0,"#030818"); g.addColorStop(0.5,"#0d1a30"); g.addColorStop(1,"#162035");
  ctx.fillStyle=g; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  drawStars(11,0.04,100,VIEW_H*0.65);
  // Moon
  ctx.fillStyle="#f0e8c8"; ctx.beginPath(); ctx.arc(100,52,13,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#0d1a30"; ctx.beginPath(); ctx.arc(105,49,10,0,Math.PI*2); ctx.fill();
  // Aurora
  ctx.globalAlpha=0.25;
  for(let i=0;i<6;i++){
    ctx.fillStyle=i%2===0?"#39d98a":"#7a5cff";
    const aw=90+Math.sin(G.time*0.5+i*1.1)*10;
    ctx.fillRect(140+i*aw*0.8,10+Math.sin(G.time*0.6+i)*8,aw,12);
  }
  ctx.globalAlpha=1;
}

function drawSpaceBg(seed) {
  const g=ctx.createLinearGradient(0,0,0,VIEW_H);
  g.addColorStop(0,"#02040e"); g.addColorStop(1,"#060c18");
  ctx.fillStyle=g; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  // Nebula cloud
  ctx.globalAlpha=0.07;
  ctx.fillStyle="#6a3cff";
  for(let i=0;i<4;i++) ctx.fillRect(60+i*120,20+Math.sin(i)*40,180,80);
  ctx.globalAlpha=1;
  drawStars(seed||42,0.02,120);
}

function drawAlienBg() {
  const g=ctx.createLinearGradient(0,0,0,VIEW_H);
  g.addColorStop(0,"#06030e"); g.addColorStop(0.5,"#0c0a1a"); g.addColorStop(1,"#0a0a14");
  ctx.fillStyle=g; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  // bioluminescent ambient
  const t=G.time;
  for(let i=0;i<8;i++){
    const bx=80+i*70, by=40+Math.sin(t*0.4+i*1.2)*20;
    ctx.globalAlpha=0.06+0.03*Math.sin(t*0.8+i);
    ctx.fillStyle=i%2?"#ff8820":"#20d8c8";
    ctx.beginPath(); ctx.arc(bx,by,30+i*4,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  drawStars(99,0,60);
}

// ---- CAMPUS SCENE ----
function drawCampusBg() {
  drawSky();
  const base=W2S(0,0);
  // Ground glow from streetlamps — wide
  [6,20,34,50,66].forEach(tx=>{
    const lp=W2S(tx*TILE,15*TILE);
    if(lp.x<-100||lp.x>VIEW_W+100) return;
    const gr=ctx.createRadialGradient(lp.x+8,lp.y-20,2,lp.x+8,lp.y,80);
    gr.addColorStop(0,"rgba(255,190,80,0.22)"); gr.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gr; ctx.fillRect(lp.x-80,lp.y-80,160,100);
  });
  // Science building (far east)
  const lab=W2S(42*TILE,10*TILE);
  ctx.fillStyle="#1e242c"; ctx.fillRect(lab.x,lab.y,140,8*TILE);
  ctx.fillStyle="#252e38"; ctx.fillRect(lab.x,lab.y,140,12);
  // Lit windows
  for(let i=0;i<6;i++){
    const flicker=(Math.floor(G.time*2+i)%6===0);
    ctx.fillStyle=flicker?"#ffd27a":"#ffe7a8";
    ctx.globalAlpha=0.9; ctx.fillRect(lab.x+10+i%3*32,lab.y+18+Math.floor(i/3)*24,14,10); ctx.globalAlpha=1;
  }
  // Flagpole
  const fp=W2S(38*TILE,15*TILE);
  ctx.fillStyle="#8a9eb4"; ctx.fillRect(fp.x+4,fp.y-50,2,50);
  ctx.fillStyle="#e63232"; ctx.fillRect(fp.x+6,fp.y-50,20,8);
  ctx.fillStyle="#ffffff"; ctx.fillRect(fp.x+6,fp.y-42,20,4);
  // Trees with lighting
  [2,8,16,26,38].forEach((tx,i)=>{
    const tp=W2S(tx*TILE,15*TILE);
    if(tp.x<-30||tp.x>VIEW_W+30) return;
    ctx.fillStyle="#1e2820"; ctx.fillRect(tp.x+5,tp.y-32,4,32);
    ctx.fillStyle=i%2?"#1e3a2a":"#243c32";
    ctx.beginPath(); ctx.arc(tp.x+7,tp.y-44,18,0,Math.PI*2); ctx.fill();
    // firefly glow on tree
    ctx.globalAlpha=0.15; ctx.fillStyle="#c8ff70";
    ctx.beginPath(); ctx.arc(tp.x+7,tp.y-44,10,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
  });
  // Observatory
  const obs=W2S(68*TILE,14*TILE);
  ctx.fillStyle="#1e222a"; ctx.fillRect(obs.x,obs.y,96,2*TILE);
  ctx.fillStyle="#26303c"; ctx.beginPath(); ctx.arc(obs.x+48,obs.y,30,Math.PI,0); ctx.fill();
  ctx.fillStyle="#2a4060"; ctx.fillRect(obs.x+36,obs.y-30,24,30);
  // Dorm block
  const dorm=W2S(10*TILE,12*TILE);
  ctx.fillStyle="#1a1e24"; ctx.fillRect(dorm.x,dorm.y,4*TILE,3*TILE);
  ctx.fillStyle="#20262e"; ctx.fillRect(dorm.x,dorm.y,4*TILE,6);
}

function drawLabBg() {
  ctx.fillStyle="#0c1620"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  // fluorescent ceiling panels
  const p=W2S(0,0);
  for(let i=0;i<8;i++){
    const lx=p.x+30+i*80;
    ctx.globalAlpha=0.12; ctx.fillStyle="#a0e8ff";
    ctx.fillRect(lx,0,60,VIEW_H); ctx.globalAlpha=1;
    ctx.fillStyle="#8adaff"; ctx.globalAlpha=0.4;
    ctx.fillRect(lx+10,p.y+2,40,4); ctx.globalAlpha=1;
  }
  // Monitor banks
  for(let i=0;i<6;i++){
    const mx=p.x+60+(i%3)*96, my=p.y+28+Math.floor(i/3)*56;
    ctx.fillStyle="#0c2028"; ctx.fillRect(mx,my,76,44);
    ctx.fillStyle="#1fd2c2"; ctx.globalAlpha=0.75;
    // Animated waveform
    ctx.beginPath(); ctx.moveTo(mx+6,my+22);
    for(let xx=0;xx<64;xx++) ctx.lineTo(mx+6+xx,my+22+Math.sin((xx*0.3+G.time*(i+1)*1.2+i*1.3))*8);
    ctx.strokeStyle="#1fd2c2"; ctx.lineWidth=1.5; ctx.stroke(); ctx.globalAlpha=1; ctx.lineWidth=1;
    // Data readout flicker
    ctx.fillStyle="#1fd2c2"; ctx.globalAlpha=0.6;
    ctx.fillRect(mx+6,my+34,20+Math.floor(G.time*7+i)%44,2); ctx.globalAlpha=1;
  }
  // Scan beam if active
  if(G.scanBeam>0){
    const sc=W2S(28*TILE,10*TILE);
    ctx.globalAlpha=G.scanBeam*0.6;
    const sb=ctx.createLinearGradient(sc.x,sc.y,sc.x,sc.y+5*TILE);
    sb.addColorStop(0,"rgba(80,210,255,0)"); sb.addColorStop(0.5,"rgba(80,210,255,1)"); sb.addColorStop(1,"rgba(80,210,255,0)");
    ctx.fillStyle=sb; ctx.fillRect(sc.x,sc.y,32,5*TILE); ctx.globalAlpha=1;
  }
}

function drawShipBg() {
  drawSpaceBg(42);
  const p=W2S(0,0);
  // Portholes
  [[8*TILE,2*TILE,7*TILE,3*TILE],[30*TILE,2*TILE,8*TILE,3*TILE],[30*TILE,8*TILE,8*TILE,3*TILE],[8*TILE,15*TILE,6*TILE,2.5*TILE]].forEach(w=>{
    const wp=W2S(w[0],w[1]);
    ctx.fillStyle="#04060e"; ctx.fillRect(wp.x,wp.y,w[2],w[3]);
    ctx.strokeStyle="#243246"; ctx.lineWidth=1.5; ctx.strokeRect(wp.x,wp.y,w[2],w[3]); ctx.lineWidth=1;
    // star shimmer through porthole
    ctx.save(); ctx.beginPath(); ctx.rect(wp.x,wp.y,w[2],w[3]); ctx.clip();
    drawStars(Math.floor(w[0]),0,20); ctx.restore();
  });
  // Emergency alarm blinkers
  const blink=Math.floor(G.time*3)%2===0;
  [[2*TILE,7*TILE],[40*TILE,13*TILE],[2*TILE,13*TILE],[50*TILE,7*TILE]].forEach(a=>{
    const ap=W2S(a[0],a[1]);
    ctx.fillStyle=blink?"#ff3b3b":"#4a1018"; ctx.fillRect(ap.x,ap.y,12,5);
    if(blink){ctx.globalAlpha=0.3;ctx.fillStyle="#ff3b3b";ctx.fillRect(ap.x-10,ap.y-10,32,25);ctx.globalAlpha=1;}
  });
  // Radiation hazard zone
  if(!G.flags.coreAccess){
    const rz=W2S(20*TILE,14*TILE);
    ctx.globalAlpha=0.15+0.05*Math.sin(G.time*4);
    ctx.fillStyle="#ffaa00"; ctx.fillRect(rz.x,rz.y-56,8*TILE,56); ctx.globalAlpha=1;
    ctx.strokeStyle="#ffaa00"; ctx.lineWidth=1;
    ctx.setLineDash([4,4]); ctx.strokeRect(rz.x,rz.y-56,8*TILE,56); ctx.setLineDash([]); ctx.lineWidth=1;
  }
}

function drawAlienShipBg() {
  drawAlienBg();
  const p=W2S(0,0);
  // Pulsing organic wall veins
  const pT=G.time*0.6;
  [[20,180],[100,80],[200,220],[350,120],[480,160],[550,80]].forEach(([vx,vy],i)=>{
    const pulse=0.08+0.04*Math.sin(pT+i);
    ctx.globalAlpha=pulse;
    ctx.strokeStyle=i%2?"#ff7a20":"#20d8b8";
    ctx.lineWidth=2+Math.sin(pT+i)*1;
    ctx.beginPath();
    ctx.moveTo(vx+p.x,vy+p.y); ctx.bezierCurveTo(vx+30+p.x,vy-30+p.y,vx+60+p.x,vy+30+p.y,vx+90+p.x,vy+p.y);
    ctx.stroke(); ctx.globalAlpha=1; ctx.lineWidth=1;
  });
  // Alien spore particles
  G.sparks.forEach(s=>{
    const sp=W2S(s.x,s.y);
    ctx.globalAlpha=s.life*0.9;
    ctx.fillStyle=s.color; ctx.beginPath(); ctx.arc(sp.x,sp.y,s.size,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  });
}

// ---- TILES ----
function drawTile(ch,x,y) {
  const p=W2S(x*TILE,y*TILE);
  if(p.x<-TILE||p.y<-TILE||p.x>VIEW_W+TILE||p.y>VIEW_H+TILE) return;
  const top=!isSolid(x,y-1);
  if(ch==="#"||ch==="C"){
    if(ch==="C"){
      ctx.fillStyle="#7a5236"; ctx.fillRect(p.x,p.y,TILE,TILE);
      ctx.fillStyle="#9a7050"; ctx.fillRect(p.x,p.y,TILE,3);
      ctx.fillStyle="rgba(0,0,0,0.3)"; ctx.fillRect(p.x+2,p.y+8,12,2);
    } else if(G.scene==="campus"){
      ctx.fillStyle=(x+y)%2?"#3a4454":"#323c4a"; ctx.fillRect(p.x,p.y,TILE,TILE);
      if(top){ctx.fillStyle="#5d7a4a";ctx.fillRect(p.x,p.y,TILE,3);}
      // subtle grass top detail
      if(top){ctx.fillStyle="#4a6838";ctx.fillRect(p.x+2,p.y,2,2);ctx.fillRect(p.x+8,p.y,2,2);ctx.fillRect(p.x+14,p.y-1,1,2);}
    } else if(G.scene==="lab"){
      ctx.fillStyle=top?"#1d4650":"#162630"; ctx.fillRect(p.x,p.y,TILE,TILE);
      if(top){ctx.fillStyle="#2a9096";ctx.fillRect(p.x,p.y,TILE,2);}
      // Grid pattern
      ctx.strokeStyle="rgba(42,144,150,0.1)"; ctx.strokeRect(p.x,p.y,TILE,TILE); 
    } else if(G.scene==="ship"){
      ctx.fillStyle=(x*3+y)%5===0?"#3a4654":"#2a3442"; ctx.fillRect(p.x,p.y,TILE,TILE);
      if(top){ctx.fillStyle="#7d8ea3";ctx.fillRect(p.x,p.y,TILE,2);}
      ctx.fillStyle="#1a120f"; if((x+y)%4===0) ctx.fillRect(p.x+4,p.y+6,3,3);
      // Metal rivet
      ctx.fillStyle="#3a4654"; ctx.fillRect(p.x+2,p.y+2,2,2); ctx.fillRect(p.x+TILE-4,p.y+2,2,2);
    } else {
      // Alien ship — organic
      const oc=(x*2+y)%3===0?"#1e1230":"#161028";
      ctx.fillStyle=oc; ctx.fillRect(p.x,p.y,TILE,TILE);
      if(top){
        ctx.fillStyle="#ff7a30"; ctx.globalAlpha=0.6; ctx.fillRect(p.x,p.y,TILE,2); ctx.globalAlpha=1;
      }
      ctx.fillStyle="rgba(255,120,30,0.08)"; ctx.fillRect(p.x,p.y,TILE,TILE);
    }
    return;
  }
  if(ch==="L"){
    ctx.fillStyle="#8898aa"; ctx.fillRect(p.x+2,p.y,2,TILE); ctx.fillRect(p.x+12,p.y,2,TILE);
    ctx.fillStyle="#aab8c8"; ctx.fillRect(p.x+2,p.y+4,12,2); ctx.fillRect(p.x+2,p.y+12,12,2);
  }
  if(ch==="V"){
    // Alien vine — orange glow
    ctx.fillStyle="#2f8f4e"; ctx.fillRect(p.x+7,p.y,2,TILE);
    ctx.fillStyle="#ff8830"; ctx.globalAlpha=0.8;
    ctx.fillRect(p.x+3,p.y+4,5,2); ctx.fillRect(p.x+9,p.y+10,5,2); ctx.globalAlpha=1;
  }
}

// ---- ENTITIES ----
function drawEntities() {
  G.entities.forEach(e=>{
    if(e.kind==="breach") return;
    if((e.kind==="log"||e.kind==="collectible")&&G.flags[e.id]) return;
    const p=W2S(e.x,e.y);
    if(p.x<-50||p.x>VIEW_W+50||p.y<-50||p.y>VIEW_H+50) return;

    if(e.kind==="sign"){
      ctx.fillStyle="#7a6038"; ctx.fillRect(p.x+8,p.y,3,e.h);
      ctx.fillStyle="#d8c88a"; ctx.fillRect(p.x-8,p.y+2,38,14);
      txt("→ LAB",p.x-5,p.y+5,"#2a2416",8);
    } else if(e.kind==="door"||e.kind==="cockpit"){
      const needMet=!e.need||G.flags[e.need];
      ctx.fillStyle=needMet?"#1a3240":"#3a1420";
      ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.strokeStyle=needMet?"#4a9abf":"#9a2040";
      ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      ctx.fillStyle=needMet?"#9ad7ff":"#ff6080";
      ctx.fillRect(p.x+e.w-6,p.y+e.h/2-2,3,4);
      // Door glow pulse
      if(needMet){ctx.globalAlpha=0.1+0.05*Math.sin(G.time*2);ctx.fillStyle="#9ad7ff";ctx.fillRect(p.x,p.y,e.w,e.h);ctx.globalAlpha=1;}
    } else if(e.kind==="log"){
      ctx.fillStyle="#ede498"; ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.fillStyle="#8a6a30"; ctx.fillRect(p.x+2,p.y+3,10,1); ctx.fillRect(p.x+2,p.y+6,7,1);
      ctx.fillStyle="#c8a860"; ctx.fillRect(p.x+2,p.y+9,9,1);
    } else if(e.kind==="collectible"){
      // Glowing badge
      ctx.globalAlpha=0.3+0.2*Math.sin(G.time*3);
      ctx.fillStyle="#ffe060"; ctx.beginPath(); ctx.arc(p.x+7,p.y+7,9,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      ctx.fillStyle="#ffe060"; ctx.fillRect(p.x+2,p.y+2,e.w-4,e.h-4);
      ctx.fillStyle="#c8a020"; txt("ID",p.x+3,p.y+5,"#1a1408",7);
    } else if(e.kind==="scanner"){
      ctx.fillStyle=G.flags.scanned?"#0e3828":"#1a2c3a"; ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.strokeStyle=G.flags.scanned?"#3dce8b":"#ffb15a"; ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      ctx.fillStyle=G.flags.scanned?"#3dce8b":"#ffb15a"; ctx.fillRect(p.x+4,p.y+4,e.w-8,6);
      txt(G.flags.scanned?"SCANNED":"SCANNER",p.x+3,p.y+14,G.flags.scanned?"#3dce8b":"#aac0cc",7);
    } else if(e.kind==="terminal"){
      ctx.fillStyle="#122030"; ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.strokeStyle="#39e0c8"; ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      // Blinking cursor
      if(Math.floor(G.time*2)%2===0){ctx.fillStyle="#39e0c8";ctx.fillRect(p.x+4,p.y+6,3,8);}
      txt("TERM",p.x+3,p.y+18,"#39e0c8",7);
    } else if(e.kind==="o2"){
      ctx.fillStyle=G.flags.o2Patched?"#0e4040":"#1c3c48"; ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.strokeStyle=G.flags.o2Patched?"#3dce8b":"#4acfef"; ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      txt("O₂",p.x+3,p.y+e.h-14,"#b7fff8",8);
    } else if(e.kind==="power"){
      ctx.fillStyle=G.flags.powered?"#122820":"#1a1c2a"; ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.strokeStyle=G.flags.powered?"#d7ff6a":"#9868e0"; ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      ctx.fillStyle=G.flags.powered?"#d7ff6a":"#9868e0"; ctx.fillRect(p.x+4,p.y+4,e.w-8,6);
      txt(G.flags.powered?"LIVE":"DEAD",p.x+3,p.y+14,G.flags.powered?"#d7ff6a":"#9868e0",7);
    } else if(e.kind==="radsuit"){
      if(G.flags.radiationSuit) return;
      ctx.fillStyle="#1a2010"; ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.strokeStyle="#ffcc00"; ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      ctx.globalAlpha=0.4+0.2*Math.sin(G.time*4); ctx.fillStyle="#ffcc00";
      ctx.fillRect(p.x,p.y,e.w,e.h); ctx.globalAlpha=1;
      txt("RAD",p.x+2,p.y+e.h-13,"#ffcc00",7);
    } else if(e.kind==="radlock"){
      ctx.fillStyle=G.flags.coreAccess?"#0a1a0a":"#200a0a"; ctx.fillRect(p.x,p.y,e.w,e.h);
      ctx.strokeStyle=G.flags.coreAccess?"#3dce8b":"#ff4a4a";
      ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      txt(G.flags.coreAccess?"OPEN":"RAD🔒",p.x+2,p.y+e.h/2-4,G.flags.coreAccess?"#3dce8b":"#ff4a4a",7);
    } else if(e.kind==="steam"){
      ctx.fillStyle="rgba(190,210,220,0.18)"; ctx.fillRect(p.x,p.y-20,e.w,32);
      ctx.fillStyle="#c0d0dc"; ctx.fillRect(p.x+4,p.y,5,6);
      // Steam puff particles every frame
      if(Math.random()<0.3) G.particles.push({x:e.x+4+Math.random()*e.w,y:e.y,vx:(Math.random()-0.5)*10,vy:-8-Math.random()*15,life:0.6,color:"rgba(200,220,230,0.5)",size:2});
    } else if(e.kind==="rocky-npc"){
      ctx.save(); ctx.translate(p.x,p.y);
      drawRocky(0,1.4);
      ctx.restore();
      // Speech bubble
      if(G.flags.dockTalk&&G.flags.melody){
        txt("♪ ♫ ♪",p.x+2,p.y-16,"#d7ff6a",10);
      } else {
        const pulse=0.5+0.5*Math.sin(G.time*2.5);
        ctx.globalAlpha=pulse; txt("?",p.x+6,p.y-18,"#d7ff6a",14); ctx.globalAlpha=1;
      }
    } else if(e.kind==="flavor"){
      // Subtle glow dot to hint interactable
      ctx.globalAlpha=0.4+0.2*Math.sin(G.time*3);
      ctx.fillStyle="#ffe7a0"; ctx.beginPath(); ctx.arc(p.x+e.w/2,p.y+e.h/2,4,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    } else if(e.kind==="sync"){
      ctx.fillStyle="#0a1820"; ctx.fillRect(p.x,p.y,e.w,e.h);
      const lit=G.flags[e.flag]; ctx.strokeStyle=lit?"#d7ff6a":"#2f8f96";
      ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,e.w,e.h); ctx.lineWidth=1;
      if(lit){ctx.globalAlpha=0.15+0.08*Math.sin(G.time*4);ctx.fillStyle="#d7ff6a";ctx.fillRect(p.x,p.y,e.w,e.h);ctx.globalAlpha=1;}
      txt(lit?"LOCKED":"CONSOLE",p.x+3,p.y+e.h-13,lit?"#d7ff6a":"#9ad7ff",7);
    }
  });
}

// ---- CHARACTERS ----
function drawSuit(step,s) {
  s=s||1;
  px(3*s, 0,     8*s,  2*s, "#dde6f0"); // helmet
  px(2*s, 2*s,  10*s,  7*s, "#c8d4e4"); // body
  px(4*s, 3*s,   6*s,  5*s, "#10161e"); // visor
  px(5*s, 4*s,   3*s,  2*s, "#ffb85a"); // visor light
  px(1*s, 9*s,   3*s,  6*s, "#e07828"); // left arm
  px(10*s,9*s,   3*s,  6*s, "#e07828"); // right arm
  px(4*s, 9*s,   6*s,  7*s, "#edf4fc"); // torso
  px(4*s, 9*s,   6*s,  3*s, "#c8d4e4"); // chest detail
  px(5*s, 12*s,  2*s,  2*s, "#3ec6ef"); // badge glow
  px(3*s, 16*s,  3*s,  6*s, "#28303e"); // left leg
  px(8*s, 16*s,  3*s,  6*s, "#28303e"); // right leg
  px(3*s,(16+step)*s, 3*s, 4*s, "#9ab0c8"); // left boot
  px(8*s,(16-step)*s, 3*s, 4*s, "#9ab0c8"); // right boot
  // spacesuit detail stripe
  px(4*s, 10*s,  1*s,  5*s, "#3ec6ef");
  px(9*s, 10*s,  1*s,  5*s, "#3ec6ef");
}

function drawCoat(step,s) {
  s=s||1;
  px(4*s, 0,     5*s,  4*s, "#7a4428"); // hair
  px(4*s, 4*s,   5*s,  4*s, "#f0c4a2"); // face
  px(4*s, 5*s,   1*s,  2*s, "#1a3858"); // eye L
  px(8*s, 5*s,   1*s,  2*s, "#1a3858"); // eye R
  px(3*s, 8*s,   8*s,  9*s, "#f0f4fc"); // lab coat
  px(6*s, 9*s,   2*s,  7*s, "#d8dce4"); // coat center
  px(3*s, 16*s,  3*s,  6*s, "#2c3240"); // pants L
  px(8*s, 16*s,  3*s,  6*s, "#2c3240"); // pants R
  px(3*s,(19+Math.max(step,0))*s, 3*s, 2*s, "#1a2030"); // shoe L
  px(8*s,(19+Math.max(-step,0))*s, 3*s, 2*s, "#1a2030"); // shoe R
}

function drawRocky(step,s) {
  s=s||1;
  const b=step?0.5:0;
  // body — rocky crystalline
  px(2*s,(2+b)*s, 12*s,  9*s, "#8a7458"); // main body
  px(1*s,(4+b)*s, 14*s,  7*s, "#756248"); // body wide
  // internal orange glow
  ctx.globalAlpha=0.4+0.1*Math.sin(G.time*3);
  px(4*s,(4+b)*s, 8*s,  5*s, "#ff8820");
  ctx.globalAlpha=1;
  // crystal eyes (green-yellow)
  px(3*s,(3+b)*s, 4*s,  4*s, "#c8e840"); // eye crystal L
  px(9*s,(3+b)*s, 4*s,  4*s, "#c8e840"); // eye crystal R
  px(4*s,(4+b)*s, 2*s,  2*s, "#1e1808"); // pupil L
  px(10*s,(4+b)*s, 2*s, 2*s, "#1e1808"); // pupil R
  // arms
  px(0,(6+b)*s,   3*s,  3*s, "#756248"); // arm L
  px(13*s,(6+b)*s,3*s,  3*s, "#756248"); // arm R
  // rocky texture details
  px(5*s,(2+b)*s, 2*s,  2*s, "#a08870"); // crystal top
  px(9*s,(2+b)*s, 2*s,  3*s, "#a08870");
  // feet / base
  px(4*s,(11+b)*s, 2*s, 4*s, "#544034");
  px(10*s,(11+b)*s,2*s, 4*s, "#534034");
  // orange inner shimmer on feet
  ctx.globalAlpha=0.2; px(4*s,(11+b)*s,2*s,4*s,"#ff8820"); ctx.globalAlpha=1;
}

function drawActor(a) {
  const p=W2S(a.x,a.y);
  if(p.x<-30||p.x>VIEW_W+30||p.y<-30||p.y>VIEW_H+30) return;
  ctx.save(); ctx.translate(p.x,p.y);
  if(a.facing<0){ctx.translate(a.w,0);ctx.scale(-1,1);}
  const frame=Math.floor(a.anim)%4;
  const step=[0,1,0,-1][frame];
  const blink=G.iframes>0&&Math.floor(G.iframes*16)%2===0;
  if(!blink){
    if(a.who==="rocky") drawRocky(step);
    else if(G.scene==="lab") drawCoat(step);
    else drawSuit(step);
  }
  // Dash trail
  if(a.dashT>0){
    ctx.globalAlpha=a.dashT/DASH_DUR*0.4;
    if(a.who==="rocky") drawRocky(0);
    else drawSuit(0);
    ctx.globalAlpha=1;
  }
  ctx.restore();
  // Active indicator
  if(G.actors.length>1&&a===activeActor()){
    ctx.fillStyle="#ffe07a"; ctx.fillRect(p.x+a.w/2-2,p.y-7,4,4);
  }
}

function drawPrompt() {
  if(G.mode!=="play") return;
  const e=nearestEntity(); if(!e) return;
  let label=e.prompt||"Interact";
  if(e.kind==="cockpit"&&(!G.flags.powered||!G.flags.coreAccess)) label="Systems offline";
  if(e.kind==="door"&&e.need&&!G.flags[e.need]) label="🔒 Locked";
  const a=activeActor(); if(!a) return;
  const p=W2S(e.x+e.w/2,e.y-14);
  ctx.fillStyle="rgba(4,10,18,0.84)"; ctx.fillRect(p.x-50,p.y-2,100,14);
  txtC("[E] "+label,p.x,p.y,"#ffe7a0",8);
}

function drawLamps() {
  if(G.scene!=="campus") return;
  [6,20,34,50,66].forEach(tx=>{
    const p=W2S(tx*TILE,15*TILE);
    if(p.x<-50||p.x>VIEW_W+50) return;
    ctx.fillStyle="#2a3038"; ctx.fillRect(p.x+6,p.y-38,3,38);
    ctx.fillStyle="#2a3038"; ctx.fillRect(p.x+2,p.y-42,11,4);
    ctx.fillStyle="#ffc56b"; ctx.fillRect(p.x+2,p.y-44,11,6);
    // Glow cone
    const gr=ctx.createRadialGradient(p.x+7,p.y-20,2,p.x+7,p.y-6,52);
    gr.addColorStop(0,"rgba(255,195,90,0.3)"); gr.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gr; ctx.fillRect(p.x-50,p.y-60,110,80);
  });
}

function drawFireflies() {
  G.flies.forEach(f=>{
    const p=W2S(f.x,f.y);
    const on=Math.sin(G.time*4+f.p)>0.3;
    ctx.globalAlpha=on?0.9:0.1;
    ctx.fillStyle="#c8ff70"; ctx.fillRect(p.x,p.y,2,2);
    if(on){ctx.globalAlpha=0.15;ctx.fillStyle="#c8ff70";ctx.fillRect(p.x-2,p.y-2,6,6);}
    ctx.globalAlpha=1;
  });
}

function drawVignette() {
  const gr=ctx.createRadialGradient(VIEW_W/2,VIEW_H/2,80,VIEW_W/2,VIEW_H/2,VIEW_W*0.75);
  gr.addColorStop(0,"rgba(0,0,0,0)"); gr.addColorStop(1,"rgba(0,0,0,0.5)");
  ctx.fillStyle=gr; ctx.fillRect(0,0,VIEW_W,VIEW_H);
}

function drawParticles() {
  G.particles.forEach(p=>{
    const sp=W2S(p.x,p.y);
    ctx.globalAlpha=Math.max(0,p.life)*0.9;
    ctx.fillStyle=p.color; ctx.fillRect(sp.x-p.size/2,sp.y-p.size/2,p.size,p.size);
    ctx.globalAlpha=1;
  });
}

// ---- HUD ----
function drawHUD() {
  const a=activeActor();
  // Character panel
  panel(6,6,160,38,"#2a8f96");
  if(a&&a.who==="rocky"){
    ctx.save(); ctx.translate(12,10); ctx.scale(0.9,0.9); drawRocky(0); ctx.restore();
    txt("ROCKY",40,8,"#d7ff6a",9);
  } else if(G.scene==="lab"){
    ctx.save(); ctx.translate(12,8); ctx.scale(0.8,0.8); drawCoat(0); ctx.restore();
    txt("SUBH",40,8,"#ffb85a",9);
  } else {
    ctx.save(); ctx.translate(10,6); ctx.scale(0.76,0.76); drawSuit(0); ctx.restore();
    txt("SUBH",40,8,"#ffb85a",9);
  }
  // HP pips
  for(let i=0;i<G.hpMax;i++){
    ctx.fillStyle=i<G.hp?"#e24b4b":"#3a2428"; ctx.fillRect(40+i*16,22,13,9);
    ctx.strokeStyle=i<G.hp?"#ff7070":"#5a3438"; ctx.lineWidth=0.5; ctx.strokeRect(40+i*16,22,13,9); ctx.lineWidth=1;
  }

  // O2 bar (ship only)
  if(G.scene==="ship"){
    panel(VIEW_W-178,6,172,38,"#2a8f96");
    txt("OXYGEN",VIEW_W-172,9,"#b7ecff",8);
    txt(Math.ceil(G.o2)+"%",VIEW_W-78,9,"#b7ecff",8);
    ctx.fillStyle="#101828"; ctx.fillRect(VIEW_W-172,24,160,9);
    const col=G.o2<25?"#e24b4b":G.o2<50?"#e2a043":"#3ec6ef";
    ctx.fillStyle=col; ctx.fillRect(VIEW_W-172,24,Math.max(0,160*(G.o2/100)),9);
    ctx.strokeStyle="#243246"; ctx.lineWidth=0.5; ctx.strokeRect(VIEW_W-172,24,160,9); ctx.lineWidth=1;
  }

  // Objective bar
  if(G.mode==="play"||G.mode==="down"){
    ctx.fillStyle="rgba(4,8,16,0.8)"; ctx.fillRect(0,VIEW_H-28,VIEW_W,28);
    txt("OBJECTIVE",8,VIEW_H-26,"#e2a043",8);
    txt(G.objective,78,VIEW_H-26,"#f4f8ff",9);
  }

  // Controls hint (first 10 seconds)
  if(G.playT<10&&(G.scene==="campus"||G.scene==="ship")){
    ctx.fillStyle="rgba(4,8,16,0.65)"; ctx.fillRect(0,VIEW_H-54,320,20);
    txt("A/D Move  ·  Space Jump  ·  E Use  ·  Shift Dash  ·  J Journal  ·  Esc Pause",8,VIEW_H-52,"#8aa0b8",7);
  }
  if(G.scene==="sync"&&G.playT<12){
    ctx.fillStyle="rgba(4,8,16,0.65)"; ctx.fillRect(0,VIEW_H-54,180,20);
    txt("TAB — Switch between SUBH & ROCKY",8,VIEW_H-52,"#d7ff6a",8);
  }

  // Toast
  if(G.toastT>0){
    ctx.font="10px 'Share Tech Mono', monospace";
    const tw=ctx.measureText(G.toast).width+22;
    ctx.fillStyle="rgba(4,10,20,0.9)"; ctx.fillRect((VIEW_W-tw)/2,52,tw,18);
    ctx.strokeStyle="#2a8f96"; ctx.lineWidth=0.5; ctx.strokeRect((VIEW_W-tw)/2,52,tw,18); ctx.lineWidth=1;
    txtC(G.toast,VIEW_W/2,55,"#ffe7a0",10);
  }

  // Banner (scene name)
  if(G.bannerT>0){
    const alpha=Math.min(1,G.bannerT)*Math.min(1,(2.8-G.bannerT)*2);
    ctx.globalAlpha=alpha;
    ctx.fillStyle="rgba(4,10,20,0.85)"; ctx.fillRect(0,VIEW_H/2-18,VIEW_W,36);
    txtC(G.bannerText,VIEW_W/2,VIEW_H/2-9,"#9ad7ff",14);
    ctx.globalAlpha=1;
  }

  // Flash overlay
  if(G.flash>0){
    ctx.fillStyle=`rgba(${G.flashColor},${G.flash*0.4})`; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  }
}

// ---- WORLD ----
function drawWorld() {
  if(G.scene==="campus") drawCampusBg();
  else if(G.scene==="lab") drawLabBg();
  else if(G.scene==="ship") drawShipBg();
  else if(G.scene==="dock"||G.scene==="sync") drawAlienShipBg();
  else { ctx.fillStyle="#04060e"; ctx.fillRect(0,0,VIEW_W,VIEW_H); }

  for(let y=0;y<G.map.length;y++) for(let x=0;x<G.map[0].length;x++) drawTile(G.map[y][x],x,y);
  drawEntities();
  drawParticles();
  G.actors.forEach(drawActor);
  drawLamps();
  drawFireflies();
  drawPrompt();
  drawVignette();
  drawHUD();
}

// ---- PANELS ----
function drawTalk() {
  const line=G.talk.lines[G.talk.i]; if(!line) return;
  panel(14,264,612,80,"#2a8f96");
  const cols={SUBH:"#ffb85a",ROCKY:"#d7ff6a",SHIP:"#7ee0ff",TERMINAL:"#7ee0ff",SCANNER:"#7ee0ff",SIGN:"#e7d7a1"};
  txt(line.who,26,272,cols[line.who]||"#d8e8f0",9);
  wrap(line.text,578,11).forEach((ln,i)=>txt(ln,26,286+i*14,"#f0f6ff",11));
  txt("[E] Continue",580,330,"#7a90a4",8);
}

// rect helpers for puzzles
function molSlotRect(i){ return {x:90+i*118,y:130,w:106,h:48}; }
function molChipRect(i){ return {x:90+i*118,y:200,w:106,h:36}; }
function pipeRect(c){ const o=pipeOrigin(); return {x:o.x+c.x*56,y:o.y+c.y*56,w:50,h:50}; }
function pipeOrigin(){ return {x:220,y:110}; }

function drawMolecule() {
  ctx.fillStyle="rgba(2,6,14,0.78)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  const shake=G.molecule.shake>0?Math.sin(G.molecule.shake*90)*4:0;
  ctx.save(); ctx.translate(shake,0);
  panel(30,30,580,308,"#2a9096");
  txt("MOLECULAR RECONSTRUCTION",46,42,"#7ee0ff",14);
  wrap("Build the alien molecule in correct order. Order hint: backbone → sugar → base → metallic core.",552,10).forEach((ln,i)=>txt(ln,46,66+i*13,"#c0d0dc",10));
  txt("[H] Toggle hints  |  Click sample then slot  |  ENTER submits",46,96,"#7a9090",8);
  // Hint button
  ctx.fillStyle=G.molecule.hintVisible?"#1d4650":"#122028"; ctx.fillRect(574,42,30,30);
  ctx.strokeStyle="#2a8f96"; ctx.lineWidth=1; ctx.strokeRect(574,42,30,30); ctx.lineWidth=1;
  txt("?",582,50,"#7ee0ff",12);
  // Slots
  for(let i=0;i<4;i++){
    const r=molSlotRect(i), mark=G.molecule.marks[i];
    ctx.fillStyle=mark===1?"#0e2820":mark===-1?"#280e0e":"#0a1620"; ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle=mark===1?"#3dce8b":mark===-1?"#e25b4a":G.molecule.slot===i?"#ffe7b0":"#2f8f96";
    ctx.lineWidth=1.5; ctx.strokeRect(r.x,r.y,r.w,r.h); ctx.lineWidth=1;
    txt(String(i+1),r.x+4,r.y+4,"#6a8080",8);
    const id=G.molecule.slots[i];
    if(id){const mol=MOLECULES.find(m=>m.id===id); txt(mol.name,r.x+6,r.y+22,mol.color,10);}
    if(mark===1){ txt("✓",r.x+r.w-14,r.y+4,"#3dce8b",10); }
    if(mark===-1){ txt("✗",r.x+r.w-14,r.y+4,"#e25b4a",10); }
    // Hint tooltip
    if(G.molecule.hintVisible){
      txt(MOLECULES[i].hint,r.x+2,r.y+r.h+2,"#7aaeaa",7);
    }
  }
  // Chips
  MOLECULES.forEach((mol,i)=>{
    const c=molChipRect(i), used=G.molecule.slots.includes(mol.id);
    ctx.globalAlpha=used&&G.molecule.picked!==mol.id?0.3:1;
    ctx.fillStyle=G.molecule.picked===mol.id?"#243a46":"#0e1e28"; ctx.fillRect(c.x,c.y,c.w,c.h);
    ctx.strokeStyle=mol.color; ctx.lineWidth=1.5; ctx.strokeRect(c.x,c.y,c.w,c.h); ctx.lineWidth=1;
    txt(mol.name,c.x+5,c.y+12,mol.color,9); ctx.globalAlpha=1;
  });
  // Submit
  const test={x:220,y:290,w:200,h:28};
  ctx.fillStyle=hitRect(test)?"#1d4650":"#143038"; ctx.fillRect(test.x,test.y,test.w,test.h);
  ctx.strokeStyle="#2a9096"; ctx.lineWidth=1; ctx.strokeRect(test.x,test.y,test.w,test.h); ctx.lineWidth=1;
  txtC("▶  TEST SEQUENCE",test.x+test.w/2,test.y+8,"#e8fff9",10);
  ctx.restore();
}

function drawPipes() {
  ctx.fillStyle="rgba(2,6,14,0.78)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  panel(50,30,540,290,"#2a9096");
  txt("BACKUP POWER — CIRCUIT RESTORE",66,44,"#7ee0ff",13);
  txt("Route power from IN to CORE. Click pipe to rotate. SPACE to rotate selected. ←→ change selection.",66,68,"#c0d0dc",9);
  const origin=pipeOrigin(), lit=poweredPipes();
  // IN connector
  ctx.fillStyle="#7ee0ff"; ctx.fillRect(origin.x-38,origin.y+20,30,8);
  txt("IN",origin.x-38,origin.y+6,"#7ee0ff",8);
  // CORE target
  const corelit=lit.has("core");
  ctx.fillStyle=corelit?"#d7ff6a":"#444"; ctx.fillRect(origin.x+2*56,origin.y+56+8,50,8);
  txt("CORE",origin.x+2*56,origin.y+56+20,corelit?"#d7ff6a":"#8aa0b4",8);
  if(corelit){
    ctx.globalAlpha=0.3+0.2*Math.sin(G.time*4); ctx.fillStyle="#d7ff6a";
    ctx.fillRect(origin.x+2*56,origin.y+56,50,50); ctx.globalAlpha=1;
  }

  G.pipe.cells.forEach((c,i)=>{
    const r=pipeRect(c), islit=lit.has(c.x+","+c.y);
    ctx.fillStyle=islit?"#0e2830":"#080e18"; ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle=i===G.pipe.sel?"#ffe7b0":"#2a3a4c"; ctx.lineWidth=i===G.pipe.sel?2:1; ctx.strokeRect(r.x,r.y,r.w,r.h); ctx.lineWidth=1;
    // Pipe segments
    const m=pipeMask(c), cx=r.x+25, cy=r.y+25;
    ctx.strokeStyle=islit?"#7ee0ff":"#5a6a7a"; ctx.lineWidth=5;
    ctx.lineCap="round"; ctx.beginPath();
    if(m&1){ctx.moveTo(cx,cy);ctx.lineTo(cx,r.y+4);}
    if(m&2){ctx.moveTo(cx,cy);ctx.lineTo(r.x+r.w-4,cy);}
    if(m&4){ctx.moveTo(cx,cy);ctx.lineTo(cx,r.y+r.h-4);}
    if(m&8){ctx.moveTo(cx,cy);ctx.lineTo(r.x+4,cy);}
    ctx.stroke(); ctx.lineWidth=1; ctx.lineCap="butt";
    txt(c.type,r.x+2,r.y+2,"#6a8090",7);
  });
}

function drawMelody() {
  ctx.fillStyle="rgba(2,6,14,0.6)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  panel(40,40,560,250,"#4a7a3a");
  const m=G.melody;
  txt("ROCKY'S SONIC TRANSLATOR  —  PHRASE "+(m.round+1)+" / "+m.rounds.length,56,54,"#d7ff6a",12);
  txt(m.phase==="listen"?"Listen carefully to the pattern…":"Repeat the pattern! Keys 1 2 3 4   ·   R to replay",56,78,"#d8e8d0",10);
  // Note buttons
  const noteNames=["DO","RE","MI","FA"], noteColors=["#3ec6ef","#e2a043","#d7ff6a","#e25b4a"];
  for(let i=0;i<4;i++){
    const r=melodyBtn(i), on=m.flash===i&&m.flashT>0;
    ctx.fillStyle=on?noteColors[i]:"#0e1e28"; ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle=noteColors[i]; ctx.lineWidth=on?2.5:1.5; ctx.strokeRect(r.x,r.y,r.w,r.h); ctx.lineWidth=1;
    // Glow when active
    if(on){ ctx.globalAlpha=0.3; ctx.fillStyle=noteColors[i]; ctx.fillRect(r.x-4,r.y-4,r.w+8,r.h+8); ctx.globalAlpha=1; }
    txtC(String(i+1),r.x+r.w/2,r.y+10,on?"#0a0e18":noteColors[i],18);
    txtC(noteNames[i],r.x+r.w/2,r.y+34,on?"#0a0e18":"#9ad8a0",9);
  }
  // Input progress dots
  const pattern=m.rounds[m.round]; let dotX=56;
  pattern.forEach((_,i)=>{
    const filled=i<m.input.length;
    ctx.fillStyle=filled?noteColors[pattern[i]]:"#243024"; ctx.beginPath(); ctx.arc(dotX+6,r2y()+14,5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#4a6a44"; ctx.lineWidth=0.5; ctx.stroke(); ctx.lineWidth=1;
    dotX+=16;
  });
  txt("[R] Replay phrase",56,284,"#8a9a84",9);
  function r2y(){ return 288; }
}

function drawAsteroids() {
  drawSpaceBg(3);
  // Background parallax asteroids
  const aR=rng(77);
  for(let i=0;i<12;i++){
    const ax=((aR()*VIEW_W*2-G.time*20+VIEW_W)%VIEW_W);
    ctx.fillStyle="rgba(80,60,40,0.3)"; ctx.beginPath(); ctx.arc(ax,aR()*VIEW_H,aR()*20+6,0,Math.PI*2); ctx.fill();
  }
  // Overlay asteroid image
  if(IMG.asteroids.complete&&IMG.asteroids.naturalWidth){
    ctx.globalAlpha=0.35; drawCover(IMG.asteroids); ctx.globalAlpha=1;
  }
  ctx.fillStyle="rgba(2,4,14,0.4)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);

  const a=G.asteroid;
  // Asteroids
  a.rocks.forEach(r=>{
    ctx.save(); ctx.translate(r.x,r.y); ctx.rotate(r.rot);
    ctx.fillStyle="#6a5244"; ctx.fillRect(-r.r,-r.r*0.7,r.r*2,r.r*1.4);
    ctx.fillStyle="#8a6a48"; ctx.fillRect(-r.r*0.4,-r.r*0.4,r.r*0.8,r.r*0.6);
    // orange glow core (alien)
    ctx.globalAlpha=0.2; ctx.fillStyle="#ff8820"; ctx.fillRect(-r.r*0.3,-r.r*0.3,r.r*0.6,r.r*0.6); ctx.globalAlpha=1;
    ctx.restore();
  });
  // Power-up (hull repair)
  a.powerups.forEach(p=>{
    ctx.globalAlpha=0.6+0.3*Math.sin(G.time*4);
    ctx.fillStyle="#3dce8b"; ctx.beginPath(); ctx.arc(p.x,p.y,10,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1; txt("+",p.x-4,p.y-6,"#fff",12);
  });
  // Ship
  const blink=a.iframes>0&&Math.floor(a.iframes*18)%2===0;
  if(!blink){
    ctx.fillStyle="#c8d8ea"; ctx.fillRect(66,a.y-5,26,10); // body
    ctx.fillStyle="#ffb85a"; ctx.fillRect(60,a.y-3,8,6);    // engine glow
    ctx.fillStyle="#8fd4ff"; ctx.fillRect(90,a.y-3,5,6);    // window
    ctx.fillStyle="#ff6060"; ctx.globalAlpha=0.8+(0.2*Math.sin(G.time*8));
    ctx.fillRect(58,a.y-1,6,2); ctx.globalAlpha=1;           // engine flare
  }
  // HUD
  txt("SECTOR TRANSIT",14,14,"#9ad7ff",9);
  // Progress bar
  ctx.fillStyle="#101828"; ctx.fillRect(14,28,200,7);
  ctx.fillStyle="#3ec6ef"; ctx.fillRect(14,28,200*clamp(a.t/20,0,1),7);
  ctx.strokeStyle="#2a4050"; ctx.lineWidth=0.5; ctx.strokeRect(14,28,200,7); ctx.lineWidth=1;
  // Hull
  txt("HULL",VIEW_W-70,14,a.hull<=1?"#e24b4b":"#f4f8ff",9);
  for(let i=0;i<4;i++){ctx.fillStyle=i<a.hull?"#e24b4b":"#3a2428";ctx.fillRect(VIEW_W-66+i*14,26,11,8);}
  // Phase warning
  if(a.phase===3){ctx.globalAlpha=0.4+0.4*Math.sin(G.time*8);txt("⚠ CRITICAL",VIEW_W/2-40,14,"#ff4a4a",10);ctx.globalAlpha=1;}
  // Controls hint
  txt("W/S or ↑↓ to dodge",14,VIEW_H-18,"#8aa0b4",8);
  drawVignette();
}

function drawCover(img) {
  if(!img||!img.complete||!img.naturalWidth) return false;
  ctx.imageSmoothingEnabled=true;
  const s=Math.max(VIEW_W/img.naturalWidth,VIEW_H/img.naturalHeight);
  const w=img.naturalWidth*s, h=img.naturalHeight*s;
  ctx.drawImage(img,(VIEW_W-w)/2,(VIEW_H-h)/2,w,h);
  ctx.imageSmoothingEnabled=false;
  return true;
}

function drawCutscene() {
  const slide=G.cut.slides[G.cut.i];
  ctx.fillStyle="#020408"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  // Background image
  const bgMap={campus:IMG.campus,lab:IMG.lab,ship:IMG.ship,asteroids:IMG.asteroids,rocky_enc:IMG.rocky_enc};
  if(slide.bg!=="stars"&&bgMap[slide.bg]&&bgMap[slide.bg].complete) {
    drawCover(bgMap[slide.bg]);
    ctx.fillStyle="rgba(2,6,14,0.55)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  } else {
    drawStars(4+G.cut.i,0,120);
  }
  // Letterbox cinematic bars
  ctx.fillStyle="rgba(0,0,0,0.9)"; ctx.fillRect(0,0,VIEW_W,56); ctx.fillRect(0,VIEW_H-56,VIEW_W,56);
  // Slide text
  txt(slide.kicker,24,12,"#e2a043",11);
  wrap(slide.body,590,13).forEach((ln,i)=>txt(ln,24,VIEW_H-50+i*17,"#f4f8ff",13));
  txt("[E] Next  [Esc] Skip",24,VIEW_H-10,"#7a90a4",8);
}

function drawTitle() {
  ctx.fillStyle="#020408"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  drawSpaceBg(1);
  if(IMG.campus.complete) {
    ctx.globalAlpha=0.35; drawCover(IMG.campus); ctx.globalAlpha=1;
  }
  ctx.fillStyle="rgba(2,6,16,0.70)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  // Title
  ctx.font="bold 36px 'Orbitron', monospace"; ctx.textBaseline="top";
  ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillText("THE LAST",26,54);
  ctx.fillStyle="#f4f8ff"; ctx.fillText("THE LAST",25,53);
  ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillText("BEACON",26,96);
  ctx.fillStyle="#9ad7ff"; ctx.fillText("BEACON",25,95);
  ctx.textAlign="left"; ctx.font="10px 'Share Tech Mono', monospace";
  txt("SUIIT  ·  A FAN CONCEPT  ·  INSPIRED BY PROJECT HAIL MARY",25,36,"#e2a043",8);
  wrap("Two worlds. One friendship. One last chance.",360,11).forEach((ln,i)=>txt(ln,25,144+i*15,"#c8d8ea",11));
  txt("SUBH & ROCKY — Chapters 1–3",25,180,"#7a90a4",8);

  if(G.mode==="howto"){
    panel(50,36,540,250,"#2a8f96");
    txt("HOW TO PLAY",68,50,"#7ee0ff",14);
    const lines=[
      "A / D  or  ← →     Move left & right",
      "Space               Jump",
      "W / ↑               Climb ladders",
      "E  or  Enter        Interact / Use / Talk",
      "Shift               Dash (cooldown 0.9s)",
      "TAB                 Switch character (Sync Bay)",
      "1 2 3 4             Answer Rocky's sonic phrases",
      "R  (in melody)      Replay current phrase",
      "J                   Open / close research journal",
      "Esc                 Pause game",
      "M                   Mute / unmute all sound",
    ];
    lines.forEach((ln,i)=>txt(ln,68,80+i*17,"#f0f6ff",10));
  }
  titleItems().forEach((item,i)=>{
    const on=i===G.titleIndex;
    ctx.fillStyle=on?"#1d4860":"rgba(6,12,22,0.75)"; ctx.fillRect(item.rect.x,item.rect.y,item.rect.w,item.rect.h);
    ctx.strokeStyle=on?"#4a9abf":"#2a3a4c"; ctx.lineWidth=1; ctx.strokeRect(item.rect.x,item.rect.y,item.rect.w,item.rect.h); ctx.lineWidth=1;
    txt((on?"▶  ":"   ")+item.label,item.rect.x+10,item.rect.y+8,on?"#e8fff9":"#b0c4d8",11);
  });
  // Version
  txt("v2.0 — PC & Android",VIEW_W-110,VIEW_H-16,"#3a4a5a",8);
}

function drawPause() {
  ctx.fillStyle="rgba(2,6,14,0.65)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  panel(220,120,200,140,"#2a8f96");
  txtC("PAUSED",VIEW_W/2,134,"#ffe7a0",14);
  txt("[E]  RESUME",246,166,"#f4f8ff",11);
  txt("[J]  JOURNAL",246,186,"#f4f8ff",11);
  txt("[Esc] CLOSE",246,206,"#8aa0b4",10);
  const t=G.stats.time, m=Math.floor(t/60), s=Math.floor(t%60);
  txtC("Time: "+m+"m "+String(s).padStart(2,"0")+"s",VIEW_W/2,232,"#6a8090",8);
}

function drawJournal() {
  ctx.fillStyle="rgba(2,6,14,0.75)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  panel(30,24,580,308,"#2a8f96");
  txt("RESEARCH JOURNAL",48,36,"#e2a043",14);
  if(!G.journal.length){
    txt("Nothing filed yet. Notebooks and data chips are waiting in the world.",48,80,"#c8d8ea",11);
  } else {
    G.journal.forEach((entry,i)=>{
      const on=i===G.journalSel;
      ctx.fillStyle=on?"rgba(26,70,80,0.6)":"transparent"; ctx.fillRect(44,66+i*18,560,17);
      txt((on?"▶  ":"   ")+entry.title,48,68+i*18,on?"#ffe7a0":"#c8d8ea",10);
    });
    const entry=G.journal[G.journalSel];
    if(entry){
      ctx.fillStyle="rgba(6,14,22,0.6)"; ctx.fillRect(44,180,556,140);
      ctx.strokeStyle="#2a5060"; ctx.lineWidth=0.5; ctx.strokeRect(44,180,556,140); ctx.lineWidth=1;
      wrap(entry.body,536,11).forEach((ln,i)=>txt(ln,52,188+i*15,"#f0f6ff",11));
    }
  }
  txt("[↑↓] Select  |  [Esc] Close",48,320,"#7a9090",8);
}

function drawDown() {
  ctx.fillStyle="rgba(2,6,14,0.75)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  panel(190,140,260,70,"#8f2a2a");
  txtC(G.down.msg,VIEW_W/2,152,"#ffb0a8",13);
  txtC("Cycling the suit…",VIEW_W/2,174,"#c8d8ea",10);
}

function drawEnding() {
  ctx.fillStyle="#020408"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  drawSpaceBg(5);
  const img=G.endingT<5?IMG.asteroids:IMG.rocky_enc;
  if(img.complete&&img.naturalWidth){ctx.globalAlpha=0.5;drawCover(img);ctx.globalAlpha=1;}
  ctx.fillStyle="rgba(2,6,16,0.65)"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  ctx.font="bold 24px 'Orbitron', monospace"; ctx.textBaseline="top"; ctx.textAlign="left";
  ctx.fillStyle="#9ad7ff"; ctx.fillText("THE LAST BEACON",25,40);
  ctx.font="10px 'Share Tech Mono', monospace";
  const lines=[
    "The clamps open. A thin song leaves the ship and aims itself at two skies.",
    "Earth still has the dark. Erid still has the dark.",
    "They also have each other now.",
    "",
    "Chapter 3 begins when the translator learns a second word for home.",
    "— To be continued —",
  ];
  let ey=84; lines.forEach(line=>{ wrap(line,580,12).forEach(ln=>{txt(ln,25,ey,"#f0f6ff",12);ey+=17;}); ey+=4; });
  const logs=["campusLog","labLog","shipLog"].filter(id=>G.flags[id]).length;
  txt("Logs recovered: "+logs+" / 3",25,230,"#e2a043",11);
  txt("Suit failures: "+G.stats.deaths,25,248,"#e2a043",11);
  const mins=Math.floor(G.stats.time/60), secs=Math.floor(G.stats.time%60);
  txt("Mission time: "+mins+"m "+String(secs).padStart(2,"0")+"s",25,266,"#e2a043",11);
  txt("[E] Return to menu",25,296,"#c8d8ea",10);
}

// ============================================================
//  MASTER DRAW
// ============================================================
function draw() {
  ctx.save();
  if(G.shake>0){ctx.translate((Math.random()-0.5)*G.shake,(Math.random()-0.5)*G.shake);}
  ctx.fillStyle="#020408"; ctx.fillRect(-8,-8,VIEW_W+16,VIEW_H+16);

  if(G.mode==="title"||G.mode==="howto") drawTitle();
  else if(G.mode==="cutscene") drawCutscene();
  else if(G.mode==="asteroid") drawAsteroids();
  else if(G.mode==="ending") drawEnding();
  else {
    drawWorld();
    if(G.mode==="talk") drawTalk();
    if(G.mode==="puzzle"&&G.puzzle==="molecule") drawMolecule();
    if(G.mode==="puzzle"&&G.puzzle==="pipes") drawPipes();
    if(G.mode==="puzzle"&&G.puzzle==="melody") drawMelody();
    if(G.mode==="pause") drawPause();
    if(G.mode==="journal") drawJournal();
    if(G.mode==="down"&&G.down) drawDown();
  }
  ctx.restore();
}

// ============================================================
//  MAIN LOOP
// ============================================================
let lastTs=0;
function frame(ts) {
  const dt=Math.min(0.033,(ts-lastTs)/1000||0);
  lastTs=ts; update(dt); draw(); requestAnimationFrame(frame);
}
canvas.focus();
requestAnimationFrame(frame);
