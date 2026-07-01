import { makeReader, write, connectWallet, activeAccount, short, fmtErr }
  from "../shared/genlayer-lite.js";

const CONTRACT = "0xA83926e5B73b8e64fF3Cbc0A464FF793001706eD";
const { read } = makeReader(CONTRACT);
const ST = {
  label: ["Awaiting the reading", "Fulfilled", "Void"],
  key: ["pending", "fulfilled", "void"],
  hex: [0x3fc6ff, 0xffd24a, 0xff5d6c],
};
const $ = (id) => document.getElementById(id);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return u; } };

let account = null, prophecies = [], stats = null;
let scene, camera, renderer, orbs = [], starfield, raf = null;
const mouse = { x: 0, y: 0 };
const camAnim = { x: 0, y: 1.5, z: 26, lx: 0, ly: 0, lz: -40 };
const SPACING = 44;
window.__aug = { ready: false, frames: 0, orbs: 0, sections: 0, camZ: () => (camera ? camera.position.z : null) };

function toast(msg, kind = "", title = "augury") {
  const el = document.createElement("div"); el.className = "toast " + kind;
  el.innerHTML = `<span class="tt">${title}</span>`; el.appendChild(document.createTextNode(msg));
  $("log").appendChild(el); setTimeout(() => el.remove(), kind === "err" ? 15000 : 5000);
}

/* ----------------- data ----------------- */
async function load() {
  stats = await read("get_stats");
  const n = Number(await read("get_prophecy_count"));
  const out = [];
  for (let i = 0; i < n; i++) out.push({ id: i, ...(await read("get_prophecy", [i])) });
  prophecies = out;
}

/* ----------------- 3D ----------------- */
function starTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"); const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(.3, "rgba(200,220,255,.8)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function buildScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060d, 0.0078);
  camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 2000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x05060d, 1);
  renderer.domElement.id = "scene";
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x4a5a88, 0.7));
  const dir = new THREE.DirectionalLight(0x9fb4ff, 0.5); dir.position.set(3, 8, 6); scene.add(dir);

  // starfield
  const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const last = -(Math.max(prophecies.length, 1) - 1) * SPACING;
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 320;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 220;
    pos[i * 3 + 2] = 60 + Math.random() * (last - 220);
    const t = Math.random();
    col[i * 3] = 0.6 + t * 0.4; col[i * 3 + 1] = 0.7 + t * 0.3; col[i * 3 + 2] = 1;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  sg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  starfield = new THREE.Points(sg, new THREE.PointsMaterial({
    size: 1.5, map: starTexture(), vertexColors: true, transparent: true,
    opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(starfield);

  // prophecy orbs
  orbs = [];
  prophecies.forEach((p, i) => {
    const color = ST.hex[p.status];
    const group = new THREE.Group();
    const x = (i % 2 === 0 ? -1 : 1) * (8 + (i % 3) * 1.6);
    const y = Math.sin(i * 1.7) * 3.4;
    const z = -i * SPACING;
    group.position.set(x, y, z);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(p.status === 2 ? 2.0 : 2.7, 48, 48),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: p.status === 2 ? 0.5 : 1.3, roughness: 0.35, metalness: 0.3 })
    );
    group.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(p.status === 2 ? 3.0 : 4.0, 32, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.07, side: THREE.BackSide })
    );
    group.add(halo);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(p.status === 2 ? 4.4 : 5.6, 0.06, 8, 90),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: p.status === 0 ? 0.7 : 0.45 })
    );
    ring.rotation.x = Math.PI / 2.4 + i * 0.3; ring.rotation.y = i * 0.5;
    group.add(ring);

    const light = new THREE.PointLight(color, p.status === 2 ? 0.6 : 1.5, 60);
    group.add(light);

    scene.add(group);
    orbs.push({ group, core, ring, status: p.status, pos: { x, y, z }, seed: Math.random() * 6.28 });
  });

  window.__aug.orbs = orbs.length;
  addEventListener("resize", onResize);
  addEventListener("mousemove", (e) => { mouse.x = (e.clientX / innerWidth - 0.5) * 2; mouse.y = (e.clientY / innerHeight - 0.5) * 2; });
}
function onResize() {
  if (!camera) return;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function renderLoop() {
  raf = requestAnimationFrame(renderLoop);
  const t = performance.now() * 0.001;
  orbs.forEach((o, i) => {
    o.core.rotation.y += 0.004; o.ring.rotation.z += 0.006 + i * 0.0005;
    const pulse = o.status === 2 ? 0.5 : 1.0 + Math.sin(t * 1.6 + o.seed) * 0.5;
    o.core.material.emissiveIntensity = pulse;
  });
  if (starfield) { starfield.rotation.y = t * 0.01; starfield.material.opacity = 0.7 + Math.sin(t * 1.2) * 0.18; }
  camera.position.set(camAnim.x + mouse.x * 1.4, camAnim.y - mouse.y * 0.9, camAnim.z);
  camera.lookAt(camAnim.lx, camAnim.ly, camAnim.lz);
  renderer.render(scene, camera);
  window.__aug.frames++;
}

/* ----------------- sections + scroll ----------------- */
function buildSections() {
  const sc = $("scrollContainer");
  const intro = `<section class="section center"><div class="intro">
    <span class="intro-eyebrow"><i class="ph-fill ph-sparkle"></i> a sky of claims</span>
    <h1>Augury</h1>
    <p>Every star below is a prophecy: a claim someone staked on the truth. A validator set read the evidence and ruled. Scroll to descend through their verdicts.</p>
  </div></section>`;

  const proph = prophecies.map((p, i) => {
    const k = ST.key[p.status];
    const side = i % 2 === 0 ? "left" : "right";
    const icon = { pending: "ph-hourglass-medium", fulfilled: "ph-check-circle", void: "ph-x-circle" }[k];
    const body = p.status === 0
      ? `<div class="p-reveal"><button class="hbtn accent" data-reveal="${p.id}"><i class="ph-bold ph-eye"></i> Read this prophecy</button></div>`
      : `<div class="p-reason">${esc(p.rationale || "The validators reached their verdict from the source.")}</div>`;
    return `<section class="section ${side}"><div class="panel" data-panel="${p.id}">
      <div class="p-idx">PROPHECY ${String(i + 1).padStart(2, "0")} / ${String(prophecies.length).padStart(2, "0")}</div>
      <div class="p-status ps-${k}"><i class="ph-bold ${icon}"></i> ${ST.label[p.status]}</div>
      <div class="p-claim">"${esc(p.claim)}"</div>
      ${body}
      <div class="p-meta"><span>seer ${short(p.seer)}</span><span>source <a href="${esc(p.source_url)}" target="_blank" rel="noopener">${esc(hostOf(p.source_url))} ↗</a></span></div>
    </div></section>`;
  }).join("");

  const outro = `<section class="section center"><div class="outro">
    <h2>Add your claim to the sky.</h2>
    <p>State something the world can verify, point to the proof, and let consensus decide its fate.</p>
    <button class="hbtn accent" id="outroCast"><i class="ph-bold ph-sparkle"></i> Cast a prophecy</button>
  </div></section>`;

  sc.innerHTML = intro + proph + outro;
  window.__aug.sections = prophecies.length + 2;

  sc.querySelectorAll("[data-reveal]").forEach((b) => b.onclick = () => doReveal(Number(b.dataset.reveal)));
  if ($("outroCast")) $("outroCast").onclick = openCast;

  gsap.registerPlugin(ScrollTrigger);
  const tl = gsap.timeline({ scrollTrigger: { trigger: sc, start: "top top", end: "bottom bottom", scrub: 1.1 } });
  orbs.forEach((o) => tl.to(camAnim, { x: o.pos.x * 0.42, y: o.pos.y * 0.5 + 2, z: o.pos.z + 17, lx: o.pos.x, ly: o.pos.y, lz: o.pos.z, duration: 1, ease: "power1.inOut" }));
  const last = orbs.length ? orbs[orbs.length - 1].pos : { x: 0, y: 0, z: 0 };
  tl.to(camAnim, { x: 0, y: 6, z: last.z - 30, lx: 0, ly: 0, lz: last.z - 90, duration: 1, ease: "power1.inOut" });

  // fade panels in
  sc.querySelectorAll(".panel, .intro, .outro").forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "power2.out",
      scrollTrigger: { trigger: el.closest(".section"), start: "top 78%", end: "top 40%", scrub: true } });
  });
  // hide scroll cue once moving
  ScrollTrigger.create({ trigger: sc, start: "top top-=60", onEnter: () => { const c = $("scrollCue"); if (c) c.style.opacity = 0; }, onLeaveBack: () => { const c = $("scrollCue"); if (c) c.style.opacity = 1; } });
}

/* ----------------- actions ----------------- */
function openCast() { $("castOverlay").hidden = false; }
function closeCast() { $("castOverlay").hidden = true; }
async function doReveal(id) {
  if (!confirm("Read this prophecy? Validators inspect the source and rule it true or false. Calls a real LLM consensus.")) return;
  toast("The validators are reading the source…", "", "reveal");
  try { await ensureWallet(); await write(CONTRACT, "reveal", [id]); toast("The sky has spoken. Re-reading…", "ok"); setTimeout(() => location.reload(), 1200); }
  catch (e) { toast(fmtErr(e), "err"); }
}
async function doCast() {
  const claim = $("cClaim").value.trim(), url = $("cUrl").value.trim();
  if (!claim) return toast("Write the claim.", "err");
  if (!url) return toast("Add a source URL.", "err");
  const btn = $("castSubmit"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> casting';
  try { await ensureWallet(); await write(CONTRACT, "cast", [claim, url]); toast("Cast into the sky. Re-reading…", "ok"); setTimeout(() => location.reload(), 1200); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Cast into the sky"; }
}

/* ----------------- wallet ----------------- */
async function refreshWallet() {
  account = await activeAccount();
  const slot = $("walletslot");
  if (account) slot.innerHTML = `<span class="hbtn" style="cursor:default"><i class="ph-fill ph-circle" style="color:var(--gold);font-size:8px"></i> ${short(account)}</span>`;
  else { slot.innerHTML = `<button class="hbtn" id="connectBtn"><i class="ph-bold ph-wallet"></i> Connect</button>`; $("connectBtn").onclick = doConnect; }
}
async function doConnect() { try { account = await connectWallet(); toast("Connected on studionet.", "ok"); await refreshWallet(); } catch (e) { toast(fmtErr(e), "err"); } }
async function ensureWallet() { if (!account) account = await connectWallet(); await refreshWallet(); }

function renderHud() {
  if (!stats) return;
  $("hudStats").innerHTML = `
    <span class="hs"><i class="ph-fill ph-star d-gold"></i> <b>${stats.total}</b> cast</span>
    <span class="hs d-gold"><b>${stats.fulfilled}</b> fulfilled</span>
    <span class="hs d-red"><b>${stats.void}</b> void</span>
    <span class="hs d-cyan"><b>${stats.pending}</b> awaiting</span>`;
}

/* ----------------- boot ----------------- */
$("castBtn").onclick = openCast;
$("castX").onclick = closeCast;
$("castSubmit").onclick = doCast;
$("castOverlay").addEventListener("click", (e) => { if (e.target === $("castOverlay")) closeCast(); });
const _cb = $("connectBtn"); if (_cb) _cb.onclick = doConnect;
if (window.ethereum) window.ethereum.on?.("accountsChanged", refreshWallet);

(async () => {
  await refreshWallet();
  try { await load(); } catch (e) { toast("Could not reach the chain. " + fmtErr(e), "err"); }
  renderHud();
  buildScene();
  buildSections();
  renderLoop();
  window.__aug.ready = true;
  setTimeout(() => { $("loader").classList.add("gone"); }, 500);
})();
