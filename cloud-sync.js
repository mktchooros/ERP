// ============================================================
//  Auth Gate — ระบบล็อกอิน Supabase Auth
//  แสดง overlay ก่อนโหลดแอป ถ้า session หมดต้องล็อกอินใหม่
//  ถ้า SUPABASE_CONFIG ไม่ได้ตั้งค่า → ข้ามไปเลย (offline mode)
// ============================================================
(function () {
  "use strict";

  var cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey) return;
  if (window.AUTH_GATE_DISABLED) return;   // ปิด login ชั่วคราว → ใช้แบบเดิม

  // ---- สร้าง overlay ทันที (ก่อน React mount) ----
  var overlay = document.createElement("div");
  overlay.id = "auth-overlay";
  overlay.style.cssText = [
    "position:fixed","inset:0","z-index:99999",
    "display:flex","align-items:center","justify-content:center",
    "background:var(--bg,#EFE9DF)",
    "font-family:'Sarabun',sans-serif",
    "transition:opacity .4s ease"
  ].join(";");

  overlay.innerHTML = [
    "<style>",
    "#auth-overlay{color:var(--ink,#2a241d)}",
    "#auth-card{background:#fff;border:1px solid #e4ddd2;border-radius:20px;",
    "  padding:44px 48px;width:100%;max-width:400px;box-shadow:0 24px 60px rgba(0,0,0,.14);",
    "  display:flex;flex-direction:column;align-items:center;gap:0}",
    "#auth-logo{width:80px;height:80px;object-fit:contain;margin-bottom:14px}",
    "#auth-company{font-size:20px;font-weight:700;margin:0 0 2px;text-align:center}",
    "#auth-sub{font-size:13px;color:#7a7060;margin:0 0 32px;text-align:center}",
    "#auth-form{width:100%;display:flex;flex-direction:column;gap:14px}",
    "#auth-form label{font-size:13px;font-weight:600;color:#5a5043;margin-bottom:3px;display:block}",
    "#auth-form input{width:100%;padding:11px 14px;border:1px solid #d9d0c4;border-radius:10px;",
    "  font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;transition:border .2s}",
    "#auth-form input:focus{border-color:var(--brand,#B6241F);box-shadow:0 0 0 3px rgba(182,36,31,.10)}",
    "#auth-submit{width:100%;padding:13px;border:none;border-radius:10px;background:var(--brand,#B6241F);",
    "  color:#fff;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer;",
    "  margin-top:6px;transition:background .2s,transform .1s}",
    "#auth-submit:hover{background:#9a1916}",
    "#auth-submit:active{transform:scale(.98)}",
    "#auth-submit:disabled{background:#c9b9b0;cursor:default}",
    "#auth-toggle{font-size:13px;color:#7a7060;text-align:center;margin-top:16px}",
    "#auth-toggle a{color:var(--brand,#B6241F);font-weight:700;cursor:pointer;text-decoration:none}",
    "#auth-toggle a:hover{text-decoration:underline}",
    "#auth-ok{font-size:13px;color:#2D5128;background:#e8f3e4;border:1px solid #b9d4b2;",
    "  border-radius:8px;padding:10px 14px;text-align:center;display:none}",
    "#auth-error{font-size:13px;color:#c0392b;background:#fbe8e5;border:1px solid #f2c0ba;",
    "  border-radius:8px;padding:10px 14px;text-align:center;display:none}",
    "#auth-loading{font-size:14px;color:#7a7060;text-align:center;padding:10px 0}",
    "#auth-spinner{width:36px;height:36px;border:3px solid #e4ddd2;border-top-color:var(--brand,#B6241F);",
    "  border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 10px}",
    "@keyframes spin{to{transform:rotate(360deg)}}",
    "</style>",
    '<div id="auth-card">',
    '  <img id="auth-logo" src="logo-yaipu.png" alt="">',
    '  <p id="auth-company">บริษัท ชูรสยายปู จำกัด</p>',
    '  <p id="auth-sub">ระบบบริหารการผลิต · ERP</p>',
    '  <div id="auth-loading"><div id="auth-spinner"></div>กำลังตรวจสอบ…</div>',
    '  <form id="auth-form" style="display:none" onsubmit="return false">',
    '    <div>',
    '      <label for="auth-email">อีเมล</label>',
    '      <input id="auth-email" type="email" placeholder="yourname@company.com" autocomplete="username" required>',
    '    </div>',
    '    <div>',
    '      <label for="auth-pass">รหัสผ่าน</label>',
    '      <input id="auth-pass" type="password" placeholder="••••••••" autocomplete="current-password" required>',
    '    </div>',
    '    <div id="auth-error"></div>',
    '    <div id="auth-ok"></div>',
    '    <button id="auth-submit" type="submit">เข้าสู่ระบบ</button>',
    '    <div id="auth-toggle">ยังไม่มีบัญชี? <a id="auth-switch">สมัครสมาชิก</a></div>',
    '  </form>',
    "</div>"
  ].join("");

  document.body.appendChild(overlay);

  function showLoading(msg) {
    var ld = document.getElementById("auth-loading");
    if (ld) { ld.style.display = ""; ld.innerHTML = '<div id="auth-spinner"></div>' + (msg || "กำลังตรวจสอบ…"); }
    var form = document.getElementById("auth-form");
    if (form) form.style.display = "none";
  }
  function showForm(errMsg) {
    var ld = document.getElementById("auth-loading");
    if (ld) ld.style.display = "none";
    var form = document.getElementById("auth-form");
    if (form) form.style.display = "flex";
    if (errMsg) {
      var el = document.getElementById("auth-error");
      if (el) { el.textContent = errMsg; el.style.display = ""; }
    }
  }
  function hideOverlay(user) {
    overlay.style.opacity = "0";
    setTimeout(function () {
      overlay.style.display = "none";
      injectUserBadge(user);
    }, 400);
  }

  // ---- ป้ายผู้ใช้ + ปุ่ม logout ใน topbar ----
  function injectUserBadge(user) {
    var email = (user && user.email) || "ผู้ใช้";
    var shortName = email.split("@")[0];

    function tryInject() {
      var topbar = document.querySelector(".topbar");
      if (!topbar) { setTimeout(tryInject, 300); return; }
      if (document.getElementById("auth-user-badge")) return;
      var badge = document.createElement("div");
      badge.id = "auth-user-badge";
      badge.style.cssText = "display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0";
      badge.innerHTML = [
        '<span style="font-size:13px;color:var(--ink-2,#5a5043);font-weight:500;white-space:nowrap">',
        "👤 " + shortName,
        "</span>",
        '<button id="auth-logout-btn" title="ออกจากระบบ" style="',
        "  font-family:inherit;font-size:12px;font-weight:600;padding:5px 12px;",
        "  border:1px solid var(--border,#e4ddd2);border-radius:999px;background:transparent;",
        "  color:var(--ink-2,#5a5043);cursor:pointer;white-space:nowrap;",
        '">ออกจากระบบ</button>'
      ].join("");
      topbar.appendChild(badge);
      document.getElementById("auth-logout-btn").addEventListener("click", function () {
        if (!confirm("ต้องการออกจากระบบหรือไม่?")) return;
        if (window._yaipuSupabase) {
          window._yaipuSupabase.auth.signOut().then(function () { location.reload(); });
        } else {
          location.reload();
        }
      });
    }
    setTimeout(tryInject, 800); // รอ React mount topbar ก่อน
  }

  // ---- โหลด supabase-js แล้วตรวจ session ----
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (window.supabase && window.supabase.createClient) { res(); return; }
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error("โหลด supabase-js ล้มเหลว")); };
      document.head.appendChild(s);
    });
  }

  loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js")
    .then(function () {
      var client = window.supabase.createClient(cfg.url, cfg.anonKey);
      window._yaipuSupabase = client;
      return client.auth.getSession();
    })
    .then(function (result) {
      var session = result.data && result.data.session;
      if (session && session.user) {
        hideOverlay(session.user);
        setupFormHandler();
      } else {
        showForm();
        setupFormHandler();
      }
    })
    .catch(function (err) {
      console.error("[auth-gate] ไม่สามารถเชื่อมต่อ Supabase:", err);
      // ถ้าเชื่อมไม่ได้ → ปล่อยให้ใช้แบบออฟไลน์ (ไม่บล็อก)
      hideOverlay(null);
    });

  function setupFormHandler() {
    var form = document.getElementById("auth-form");
    if (!form) return;
    var mode = "login"; // login | signup
    var switchEl = document.getElementById("auth-switch");
    var toggleEl = document.getElementById("auth-toggle");
    var submitBtn = document.getElementById("auth-submit");
    var passInput = document.getElementById("auth-pass");
    var okEl = document.getElementById("auth-ok");
    var errEl0 = document.getElementById("auth-error");

    function applyMode() {
      if (mode === "login") {
        submitBtn.textContent = "เข้าสู่ระบบ";
        toggleEl.innerHTML = 'ยังไม่มีบัญชี? <a id="auth-switch">สมัครสมาชิก</a>';
        passInput.setAttribute("autocomplete", "current-password");
      } else {
        submitBtn.textContent = "สมัครสมาชิก";
        toggleEl.innerHTML = 'มีบัญชีอยู่แล้ว? <a id="auth-switch">เข้าสู่ระบบ</a>';
        passInput.setAttribute("autocomplete", "new-password");
      }
      if (errEl0) errEl0.style.display = "none";
      if (okEl) okEl.style.display = "none";
      // re-bind switch (innerHTML replaced the node)
      document.getElementById("auth-switch").addEventListener("click", function () {
        mode = mode === "login" ? "signup" : "login";
        applyMode();
      });
    }
    if (switchEl) switchEl.addEventListener("click", function () {
      mode = "signup"; applyMode();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("auth-email").value.trim();
      var pass  = document.getElementById("auth-pass").value;
      var btn   = document.getElementById("auth-submit");
      var errEl = document.getElementById("auth-error");
      var okEl2 = document.getElementById("auth-ok");
      if (!email || !pass) return;
      if (mode === "signup" && pass.length < 6) {
        showFormError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }
      btn.disabled = true; btn.textContent = mode === "signup" ? "กำลังสมัคร…" : "กำลังตรวจสอบ…";
      if (errEl) errEl.style.display = "none";
      if (okEl2) okEl2.style.display = "none";
      var client = window._yaipuSupabase;
      if (!client) return;

      if (mode === "signup") {
        client.auth.signUp({ email: email, password: pass })
          .then(function (r) {
            if (r.error) throw r.error;
            // ถ้า session มาเลย (email confirmation ปิด) → เข้าระบบทันที
            if (r.data && r.data.session) {
              hideOverlay(r.data.user);
            } else {
              // ต้องยืนยันอีเมลก่อน
              if (okEl2) { okEl2.textContent = "✅ สมัครสำเร็จ! กรุณาตรวจอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบ"; okEl2.style.display = "block"; }
              mode = "login";
              btn.disabled = false; btn.textContent = "เข้าสู่ระบบ";
              document.getElementById("auth-toggle").innerHTML = 'ยังไม่มีบัญชี? <a id="auth-switch">สมัครสมาชิก</a>';
              document.getElementById("auth-switch").addEventListener("click", function () {
                mode = "signup"; document.getElementById("auth-submit").textContent = "สมัครสมาชิก";
                document.getElementById("auth-toggle").innerHTML = 'มีบัญชีอยู่แล้ว? <a id="auth-switch">เข้าสู่ระบบ</a>';
              });
            }
          })
          .catch(function (err) {
            var msg = "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง";
            var m = (err && err.message || "").toLowerCase();
            if (m.includes("already") || m.includes("registered")) msg = "อีเมลนี้มีบัญชีอยู่แล้ว — กรุณาเข้าสู่ระบบ";
            else if (m.includes("password")) msg = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
            else if (m.includes("email")) msg = "กรุณากรอกอีเมลให้ถูกต้อง";
            showFormError(msg);
            btn.disabled = false; btn.textContent = "สมัครสมาชิก";
          });
        return;
      }

      client.auth.signInWithPassword({ email: email, password: pass })
        .then(function (r) {
          if (r.error) throw r.error;
          hideOverlay(r.data.user);
        })
        .catch(function (err) {
          var msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
          var m = (err && err.message || "").toLowerCase();
          if (m.includes("not confirmed") || m.includes("confirm")) msg = "บัญชีนี้ยังไม่ยืนยันอีเมล — กรุณาเปิด Gmail แล้วกดลิงก์ยืนยัน";
          else if (m.includes("invalid")) msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง — ถ้ายังไม่มีบัญชี กด \"สมัครสมาชิก\" ด้านล่าง";
          else if (m.includes("email")) msg = "กรุณากรอกอีเมลให้ถูกต้อง";
          showFormError(msg);
          btn.disabled = false; btn.textContent = "เข้าสู่ระบบ";
        });
    });
  }

  function showFormError(msg) {
    var errEl = document.getElementById("auth-error");
    if (errEl) { errEl.textContent = msg; errEl.style.display = "block"; }
  }
})();
