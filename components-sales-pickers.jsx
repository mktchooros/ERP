// ============================================================
//  Cloud Sync v4 — ซิงค์ข้อมูลทั้งระบบขึ้น Supabase อย่างปลอดภัย
//  ------------------------------------------------------------
//  หลักการที่ทำให้ "ข้อมูลไม่หาย" แม้ใช้หลายเครื่อง:
//   1. รวมข้อมูล (merge) แบบ union — ไม่มีเครื่องไหนลบข้อมูลของอีกเครื่องได้
//   2. การลบจริงถูกจดไว้เป็น "tombstone" → ลบข้ามเครื่องได้อย่างถูกต้อง
//   3. งานที่ยังไม่ได้อัปโหลด (pending) จะถือเป็นของจริงเสมอ ไม่ถูกทับ
//   4. ตอนเปิดแอป ไม่รีโหลดหน้าเองอีกต่อไป — อัปเดตข้อมูลในที่
//  ถ้ายังไม่ตั้งค่า SUPABASE_CONFIG → ทำงานออฟไลน์ตามเดิม (ไม่พัง)
// ============================================================
(function () {
  "use strict";

  var cfg = window.SUPABASE_CONFIG || {};
  var ROW_ID = cfg.storeId || "main";
  var TABLE = "erp_store";
  var enabled = !!(cfg.url && cfg.anonKey);

  // key ภายใน (ไม่ซิงค์)
  var PENDING_KEY = "__pendingPush";
  var TOMB_KEY = "__tombstones";
  var TOMB_TTL = 7 * 24 * 3600 * 1000; // เก็บ tombstone 7 วัน

  // ---- ฟังก์ชันดั้งเดิม (ไม่ trigger การซิงค์) ----
  var _set = window.localStorage.setItem.bind(window.localStorage);
  var _rem = window.localStorage.removeItem.bind(window.localStorage);
  var _get = window.localStorage.getItem.bind(window.localStorage);

  // ---- ป้ายสถานะมุมจอ ----
  var pill, pillText, pillBtn;
  function buildPill() {
    if (pill || !document.body) return;
    pill = document.createElement("div");
    pill.id = "cloud-sync-pill";
    pill.style.cssText = [
      "position:fixed", "right:14px", "bottom:14px", "z-index:9000",
      "display:flex", "align-items:center", "gap:8px",
      "background:#fff", "border:1px solid #e2ddd4", "border-radius:999px",
      "padding:7px 12px", "font-family:'Sarabun',sans-serif", "font-size:12px",
      "box-shadow:0 4px 14px rgba(0,0,0,.12)", "color:#3a3128", "user-select:none"
    ].join(";");
    var dot = document.createElement("span");
    dot.id = "cloud-sync-dot";
    dot.style.cssText = "width:9px;height:9px;border-radius:50%;background:#bbb;flex-shrink:0";
    pillText = document.createElement("span");
    pillText.textContent = "…";
    pillBtn = document.createElement("button");
    pillBtn.textContent = "↻ ดึงข้อมูลล่าสุด";
    pillBtn.title = "ดึงข้อมูลล่าสุดจากคลาวด์ (กดก่อนเริ่มทำงานเมื่อสลับเครื่อง)";
    pillBtn.style.cssText = "border:none;background:#eef3e6;color:#46602a;font-family:inherit;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;cursor:pointer;white-space:nowrap";
    pillBtn.onclick = function () { manualPull(); };
    pill.appendChild(dot);
    pill.appendChild(pillText);
    pill.appendChild(pillBtn);
    document.body.appendChild(pill);
  }
  function setStatus(text, color, showPull) {
    buildPill();
    if (!pill) return;
    pillText.textContent = text;
    var d = document.getElementById("cloud-sync-dot");
    if (d) d.style.background = color || "#bbb";
    // ปุ่ม "ดึงข้อมูลล่าสุด" แสดงตลอด (ซ่อนเฉพาะตอนกำลังดึงอยู่)
    if (pillBtn) pillBtn.style.display = "inline-block";
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setStatus(initialMsg(), initialColor()); });
  } else {
    setTimeout(function () { setStatus(initialMsg(), initialColor()); }, 0);
  }
  function initialMsg() { return enabled ? "กำลังเชื่อมคลาวด์…" : "โหมดออฟไลน์ (เก็บในเครื่องนี้)"; }
  function initialColor() { return enabled ? "#E0A33E" : "#9aa0a6"; }

  // ---- ไม่เปิดใช้คลาวด์ → จบแค่นี้ (ออฟไลน์ตามเดิม) ----
  if (!enabled) return;

  // ---- tombstone (บันทึกรายการที่ถูกลบ) ----
  function loadTombs() { try { return JSON.parse(_get(TOMB_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function saveTombs(t) { try { _set(TOMB_KEY, JSON.stringify(t)); } catch (e) {} }
  function pruneTombs() {
    var t = loadTombs(), now = Date.now(), changed = false;
    Object.keys(t).forEach(function (k) { if (now - t[k] > TOMB_TTL) { delete t[k]; changed = true; } });
    if (changed) saveTombs(t);
    return t;
  }

  // ---- snapshot ของ localStorage (ข้าม key ภายใน __) ----
  function snapshot() {
    var store = {};
    for (var i = 0; i < window.localStorage.length; i++) {
      var k = window.localStorage.key(i);
      if (k && k.indexOf("__") === 0) continue;
      store[k] = _get(k);
    }
    return store;
  }

  // ---- รวมข้อมูล: เริ่มจาก base แล้วให้ override ทับ key ที่ซ้ำ; เคารพ tombstone ----
  function mergeStores(base, override, tombs) {
    var m = {};
    Object.keys(base || {}).forEach(function (k) { m[k] = base[k]; });
    Object.keys(override || {}).forEach(function (k) { m[k] = override[k]; });
    if (tombs) Object.keys(tombs).forEach(function (k) { delete m[k]; });
    return m;
  }

  // ---- เขียนสถานะเครื่องให้ตรงกับ store (เพิ่มของใหม่ + ลบของที่ไม่มีแล้ว) ----
  function applyStore(store) {
    var localKeys = [];
    for (var i = 0; i < window.localStorage.length; i++) {
      var k = window.localStorage.key(i);
      if (k && k.indexOf("__") !== 0) localKeys.push(k);
    }
    // ลบเฉพาะ key ที่ไม่มีใน store (store คือ union อยู่แล้ว จึงลบแค่รายการที่ถูก tombstone)
    localKeys.forEach(function (k) { if (!(k in store)) _rem(k); });
    Object.keys(store).forEach(function (k) { _set(k, store[k]); });
  }

  var client = null, ready = false, pushTimer = null, pollTimer = null, lastJSON = "";
  var dirty = false, writeSeq = 0;
  function markDirty() { dirty = true; writeSeq++; try { _set(PENDING_KEY, "1"); } catch (e) {} }
  function isPending() { return _get(PENDING_KEY) === "1"; }
  function clearDirtyIfSettled(seqAtStart) {
    if (writeSeq === seqAtStart) { dirty = false; try { _rem(PENDING_KEY); } catch (e) {} }
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (window.supabase && window.supabase.createClient) { res(); return; }
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error("โหลด " + src + " ไม่สำเร็จ")); };
      document.head.appendChild(s);
    });
  }

  function pullRaw() {
    return client.from(TABLE).select("data,updated_at").eq("id", ROW_ID).maybeSingle();
  }

  // ---- PUSH: อ่านคลาวด์ล่าสุด → รวมกับของเครื่อง (ของเครื่องชนะ) → เขียนกลับ ----
  //  ทำแบบ read-merge-write เพื่อ "ไม่ลบ" ข้อมูลของเครื่องอื่นที่เพิ่งเพิ่มเข้ามา
  function push() {
    if (!ready || !client) return Promise.resolve();
    var seqAtStart = writeSeq;
    setStatus("กำลังบันทึกขึ้นคลาวด์…", "#E0A33E");
    return pullRaw().then(function (r) {
      if (r.error) throw r.error;
      var remote = (r.data && r.data.data) ? r.data.data : {};
      var tombs = pruneTombs();
      var merged = mergeStores(remote, snapshot(), tombs); // ของเครื่องชนะ (ผู้ใช้เพิ่งแก้)
      var json = JSON.stringify(merged);
      applyStore(merged);      // ให้เครื่องตรงกับที่จะอัปโหลด
      lastJSON = json;
      if (JSON.stringify(remote) === json) { clearDirtyIfSettled(seqAtStart); return { skip: true }; }
      return client.from(TABLE).upsert({ id: ROW_ID, data: merged, updated_at: new Date().toISOString() });
    }).then(function (r) {
      if (r && r.error) throw r.error;
      clearDirtyIfSettled(seqAtStart);
      _set("__lastSyncedAt", new Date().toISOString());
      setStatus("ซิงค์แล้ว ✓ " + timeNow(), "#2D7D46");
      window.dispatchEvent(new CustomEvent("erp:store-change"));
    }).catch(function (e) {
      console.error("[cloud-sync] push error", e);
      setStatus("บันทึกคลาวด์ไม่สำเร็จ — จะลองใหม่", "#C0392B");
      clearTimeout(pushTimer);
      pushTimer = setTimeout(function () { push(); }, 8000);
    });
  }
  function schedulePush() {
    if (!ready) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { push(); }, 2000);
  }
  function timeNow() {
    var d = new Date();
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  // ---- POLL: ดึงคลาวด์มาดูเป็นระยะ ถ้ามีเครื่องอื่นแก้ → รวมเข้ากับของเรา ----
  function startPolling() {
    if (!ready) return;
    clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      if (!ready) return;
      if (dirty || isPending()) return; // มีงานค้างในเครื่อง → รอ push ก่อน (push จะ merge ให้เอง)
      pullRaw().then(function (r) {
        if (r.error || !r.data || !r.data.data) return;
        var remote = r.data.data;
        var remoteJSON = JSON.stringify(remote);
        if (remoteJSON === lastJSON) return;
        var merged = mergeStores(snapshot(), remote, pruneTombs()); // คลาวด์ชนะ (ของเครื่องอื่นใหม่กว่า) แต่เก็บของเราที่ยังไม่ได้ push
        applyStore(merged);
        lastJSON = JSON.stringify(merged);
        setStatus("อัปเดตจากคลาวด์ ✓ " + timeNow(), "#2D7D46");
        window.dispatchEvent(new CustomEvent("erp:store-change"));
        if (JSON.stringify(merged) !== remoteJSON) schedulePush(); // เรามีของเพิ่ม → ดันกลับ
      }).catch(function (e) { console.error("[cloud-sync] poll error", e); });
    }, 10000);
  }

  // ---- ดึงข้อมูลล่าสุดด้วยมือ ----
  function manualPull() {
    if (!ready) return;
    if (pillBtn) { pillBtn.disabled = true; pillBtn.style.opacity = "0.5"; }
    setStatus("กำลังดึงข้อมูล…", "#E0A33E");
    var reenable = function () { if (pillBtn) { pillBtn.disabled = false; pillBtn.style.opacity = "1"; } };
    pullRaw().then(function (r) {
      if (r.error) throw r.error;
      if (r.data && r.data.data) {
        var merged = mergeStores(snapshot(), r.data.data, pruneTombs());
        applyStore(merged);
        lastJSON = JSON.stringify(merged);
        dirty = false; try { _rem(PENDING_KEY); } catch (e) {}
        setStatus("อัปเดตจากคลาวด์ ✓ " + timeNow(), "#2D7D46");
        window.dispatchEvent(new CustomEvent("erp:store-change"));
      } else {
        setStatus("ไม่มีข้อมูลในคลาวด์", "#9aa0a6", true);
      }
      reenable();
    }).catch(function (e) {
      console.error(e);
      setStatus("ดึงข้อมูลไม่สำเร็จ", "#C0392B", true);
      reenable();
    });
  }

  // ---- ดักจับการเขียน localStorage → ซิงค์อัตโนมัติ ----
  window.localStorage.setItem = function (k, v) {
    _set(k, v);
    if (typeof k === "string" && k.indexOf("__") !== 0) {
      var t = loadTombs(); if (t[k]) { delete t[k]; saveTombs(t); } // สร้างใหม่ → ยกเลิก tombstone
      markDirty(); schedulePush();
    }
  };
  window.localStorage.removeItem = function (k) {
    _rem(k);
    if (typeof k === "string" && k.indexOf("__") !== 0) {
      var t = loadTombs(); t[k] = Date.now(); saveTombs(t); // จดว่าลบแล้ว
      markDirty(); schedulePush();
    }
  };
  var _clear = window.localStorage.clear.bind(window.localStorage);
  window.localStorage.clear = function () {
    // จด tombstone ของทุก key ก่อนล้าง เพื่อให้การล้างสะท้อนขึ้นคลาวด์
    var t = loadTombs(), now = Date.now();
    for (var i = 0; i < window.localStorage.length; i++) {
      var k = window.localStorage.key(i);
      if (k && k.indexOf("__") !== 0) t[k] = now;
    }
    _clear();
    saveTombs(t);
    markDirty(); schedulePush();
  };

  // ---- เริ่มทำงาน ----
  (function boot() {
    setStatus("กำลังเชื่อมคลาวด์…", "#E0A33E");
    loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js")
      .then(function () {
        client = window._yaipuSupabase || window.supabase.createClient(cfg.url, cfg.anonKey);
        if (!window._yaipuSupabase) window._yaipuSupabase = client;
        return pullRaw();
      })
      .then(function (r) {
        if (r.error) throw r.error;
        var remote = (r.data && r.data.data) ? r.data.data : null;
        var tombs = pruneTombs();
        ready = true;

        if (remote) {
          var pending = isPending();
          // pending = มีงานในเครื่องที่ยังไม่ได้อัปโหลด → ของเครื่องต้องชนะ
          // ปกติ = เครื่องนี้อาจเก่ากว่าคลาวด์ → คลาวด์ชนะ แต่เก็บของเครื่องที่คลาวด์ไม่มี
          var merged = pending
            ? mergeStores(remote, snapshot(), tombs)
            : mergeStores(snapshot(), remote, tombs);
          applyStore(merged);
          lastJSON = JSON.stringify(merged);
          startPolling();
          window.dispatchEvent(new CustomEvent("erp:store-change"));
          if (pending || JSON.stringify(merged) !== JSON.stringify(remote)) {
            setStatus("กำลังซิงค์…", "#E0A33E");
            schedulePush();
          } else {
            setStatus("ซิงค์แล้ว ✓ " + timeNow(), "#2D7D46");
          }
        } else {
          // คลาวด์ยังว่าง → อัปโหลดของเครื่องนี้เป็นชุดเริ่มต้น
          lastJSON = "";
          startPolling();
          push().then(function () { setStatus("เริ่มใช้คลาวด์แล้ว ✓", "#2D7D46"); });
        }
      })
      .catch(function (e) {
        console.error("[cloud-sync] boot error", e);
        ready = false;
        setStatus("เชื่อมคลาวด์ไม่ได้ — ทำงานออฟไลน์ชั่วคราว", "#C0392B", true);
      });
  })();

  // เผื่อผู้ใช้ปิดแท็บ — พยายามดันครั้งสุดท้าย
  window.addEventListener("beforeunload", function () {
    if (ready && (dirty || isPending())) { clearTimeout(pushTimer); push(); }
  });

  window.cloudSync = {
    push: push,
    pull: manualPull,
    status: function () { return { enabled: enabled, ready: ready, dirty: dirty, pending: isPending() }; }
  };
})();
