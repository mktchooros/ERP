// 📷 บาร์โค้ดวัตถุดิบ — สแกน / แก้ไข / ลบ / พิมพ์
const RAW_OVR_KEY = "raw_material_overrides"; // { [code]: { ...patch } }
const RAW_DEL_KEY = "raw_material_deleted";   // [code, ...]

const loadRawList = () => {
  // อ่านจาก erp_raw_list ก่อน (เหมือน ScreenRawMaterialsList)
  let base = [];
  try {
    const saved = localStorage.getItem('erp_raw_list');
    if (saved) { const p = JSON.parse(saved); if (Array.isArray(p) && p.length) base = p; }
  } catch (e) {}
  if (!base.length) base = typeof RAW !== "undefined" ? RAW : [];

  let ovr = {}; try { ovr = JSON.parse(localStorage.getItem(RAW_OVR_KEY) || "{}"); } catch (e) {}
  let del = []; try { del = JSON.parse(localStorage.getItem(RAW_DEL_KEY) || "[]"); } catch (e) {}
  const delSet = new Set(del);
  return base.filter(r => !delSet.has(r.code)).map(r => ({ ...r, ...(ovr[r.code] || {}) }));
};

const saveOverride = (code, patch) => {
  let ovr = {}; try { ovr = JSON.parse(localStorage.getItem(RAW_OVR_KEY) || "{}"); } catch (e) {}
  ovr[code] = { ...(ovr[code] || {}), ...patch };
  localStorage.setItem(RAW_OVR_KEY, JSON.stringify(ovr));
};

const saveDeleted = (code) => {
  let del = []; try { del = JSON.parse(localStorage.getItem(RAW_DEL_KEY) || "[]"); } catch (e) {}
  if (!del.includes(code)) del.push(code);
  localStorage.setItem(RAW_DEL_KEY, JSON.stringify(del));
};

const ScreenRawMaterialBarcode = () => {
  const [list, setList] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [barcodeInput, setBarcodeInput] = React.useState("");
  const [highlightCode, setHighlightCode] = React.useState(null);
  const [editItem, setEditItem] = React.useState(null); // item being edited
  const [editForm, setEditForm] = React.useState({});
  const [msg, setMsg] = React.useState("");
  const highlightRef = React.useRef(null);

  React.useEffect(() => { setList(loadRawList()); }, []);

  // เลื่อนไปยังแถวที่ highlight
  React.useEffect(() => {
    if (highlightCode && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [highlightCode]);

  const reload = () => setList(loadRawList());

  const filtered = list.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (r.name || "").toLowerCase().includes(q) || (r.code || "").toLowerCase().includes(q) || (r.barcode || "").includes(q) || (r.supplier || "").toLowerCase().includes(q);
  });

  // ---- สแกน ----
  const handleScan = (val) => {
    const v = val.trim();
    if (!v) return;
    const found = list.find(r => r.barcode === v || r.code === v);
    if (found) {
      setHighlightCode(found.code);
      setSearch("");
      setBarcodeInput("");
      setMsg(`✅ พบ: ${found.code} — ${found.name}`);
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg(`❌ ไม่พบวัตถุดิบ: ${v}`);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  // ---- แก้ไข ----
  const openEdit = (r) => { setEditItem(r); setEditForm({ ...r }); };
  const closeEdit = () => { setEditItem(null); setEditForm({}); };

  const saveEdit = () => {
    const patch = {
      name: editForm.name,
      barcode: editForm.barcode,
      unit: editForm.unit,
      buyUnit: editForm.buyUnit,
      cost: parseFloat(editForm.cost) || 0,
      supplier: editForm.supplier,
    };
    saveOverride(editItem.code, patch);
    reload();
    closeEdit();
    setMsg("✅ บันทึกการแก้ไขแล้ว"); setTimeout(() => setMsg(""), 2200);
  };

  // ---- ลบ ----
  const handleDelete = (r) => {
    if (!confirm(`ลบวัตถุดิบ ${r.code} — ${r.name}?`)) return;
    saveDeleted(r.code);
    if (highlightCode === r.code) setHighlightCode(null);
    reload();
    setMsg("✅ ลบแล้ว"); setTimeout(() => setMsg(""), 2200);
  };

  // ---- พิมพ์ ----
  const printList = () => {
    const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
    const esc = v => String(v == null ? "" : v).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const now = new Date();
    const at = `${window.fmtDateGlobal(now.toISOString().slice(0,10))} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const rows = filtered.map((r, i) => `<tr>
      <td class="c">${i+1}</td>
      <td class="code">${esc(r.code)}</td>
      <td>${esc(r.name)}</td>
      <td class="code bc">${esc(r.barcode || "—")}</td>
      <td class="c">${esc(r.unit)}</td>
      <td>${esc(r.buyUnit)}</td>
      <td class="r">฿${(parseFloat(r.cost)||0).toFixed(3)}</td>
      <td>${esc(r.supplier || "—")}</td>
    </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>บาร์โค้ดวัตถุดิบ</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:20px;font-size:11px;background:#e8e8e8;color:#000}
.doc{width:1050px;margin:0 auto;background:#fff;padding:22px 26px;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.head{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px}
.head img{width:52px;height:52px;object-fit:contain}.cname{font-size:15px;font-weight:700}.caddr{font-size:10px;color:#444}
.rtitle{text-align:right}.rtitle .t{font-size:15px;font-weight:700}.rtitle .m{font-size:10px;color:#444;margin-top:2px}
table{border-collapse:collapse;width:100%}
th{background:#f0f0f0;border:1px solid #000;padding:5px 6px;font-size:10px;font-weight:600;text-align:left}
td{border:1px solid #000;padding:4px 6px;font-size:10px;vertical-align:middle}
.c{text-align:center}.r{text-align:right}.code{font-family:monospace;color:#444}.bc{color:#1F6A3D;font-weight:600}
tfoot td{font-weight:700;background:#f0f0f0}
.bar{text-align:center;margin-top:14px}.bar button{font-family:inherit;font-size:13px;font-weight:600;padding:8px 22px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;box-shadow:none;padding:8mm}.no-print{display:none!important}@page{size:A4 landscape;margin:0}}</style>
</head><body><div class="doc">
  <div class="head"><img src="${logoUrl}" alt=""><div><div class="cname">บริษัท ชูรสยายปู จำกัด</div><div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div></div>
  <div class="rtitle"><div class="t">รายการบาร์โค้ดวัตถุดิบ</div><div class="m">พิมพ์เมื่อ ${at}</div><div class="m">${filtered.length} รายการ</div></div></div>
  <table>
    <thead><tr><th class="c" style="width:28px">#</th><th style="width:55px">รหัส</th><th>ชื่อวัตถุดิบ</th><th style="width:130px">บาร์โค้ด</th><th class="c" style="width:60px">หน่วย</th><th style="width:110px">หน่วยซื้อ</th><th class="r" style="width:70px">ต้นทุน</th><th style="width:110px">ผู้ขาย</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8" class="c">ไม่มีข้อมูล</td></tr>'}</tbody>
    <tfoot><tr><td colspan="7" style="text-align:right">รวม</td><td>${filtered.length} รายการ</td></tr></tfoot>
  </table>
  <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
</div></body></html>`;
    const win = window.open("", "", "width=1100,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่"); return; }
    win.document.write(html); win.document.close();
  };

  const inp = { border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", fontFamily: "inherit" };
  const withBc = list.filter(r => r.barcode).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📷 บาร์โค้ดวัตถุดิบ</h1>
          <p className="page-sub">สแกน · แก้ไข · ลบ · พิมพ์ — วัตถุดิบ {list.length} รายการ · มีบาร์โค้ด {withBc} รายการ</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={printList}>🖨️ พิมพ์รายการ</button>
        </div>
      </div>

      {msg && (
        <div className={`alert${msg.includes("✅") ? "" : " danger"}`} style={{ marginBottom: 14,
          background: msg.includes("✅") ? "var(--leaf-soft)" : "var(--brand-soft)",
          border: msg.includes("✅") ? "1px solid #B9D4B2" : "1px solid #E9B6B1",
          color: msg.includes("✅") ? "#2D5128" : "var(--brand-ink)" }}>
          {msg}
        </div>
      )}

      {/* ---- สแกน + ค้นหา ---- */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>📱 สแกนบาร์โค้ด</label>
            <input
              autoFocus
              type="text"
              placeholder="สแกนหรือพิมพ์บาร์โค้ด / รหัสวัตถุดิบ แล้วกด Enter"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleScan(barcodeInput); }}
              style={{ ...inp, fontSize: 15, borderWidth: 2, borderColor: "var(--border-strong)" }}
            />
            {highlightCode && (
              <button className="btn btn-sm btn-ghost" style={{ marginTop: 6 }} onClick={() => { setHighlightCode(null); setBarcodeInput(""); }}>
                ✕ ล้าง Highlight
              </button>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>🔍 ค้นหาในรายการ</label>
            <input
              type="text"
              placeholder="ค้นหาชื่อ / รหัส / บาร์โค้ด / ผู้ขาย…"
              value={search}
              onChange={e => { setSearch(e.target.value); setHighlightCode(null); }}
              style={inp}
            />
          </div>
        </div>
      </div>

      {/* ---- KPI ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        {[
          { label: "วัตถุดิบทั้งหมด", value: list.length, color: "var(--ink)" },
          { label: "มีบาร์โค้ด", value: withBc, color: "var(--leaf)" },
          { label: "ไม่มีบาร์โค้ด", value: list.length - withBc, color: "var(--warn)" },
          { label: "แสดง (filter)", value: filtered.length, color: "var(--ink-2)" },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, marginTop: 4, fontFamily: "var(--font-display)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ---- ตาราง ---- */}
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: "center" }}>#</th>
              <th style={{ width: 65 }}>รหัส</th>
              <th>ชื่อวัตถุดิบ</th>
              <th style={{ width: 145 }}>บาร์โค้ด</th>
              <th style={{ width: 70, textAlign: "center" }}>หน่วย</th>
              <th style={{ width: 130 }}>หน่วยซื้อ</th>
              <th style={{ width: 75, textAlign: "right" }}>ต้นทุน</th>
              <th style={{ width: 120 }}>ผู้ขาย</th>
              <th style={{ width: 100 }}>ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ไม่พบรายการ</td></tr>
            ) : filtered.map((r, idx) => {
              const isHL = highlightCode === r.code;
              return (
                <tr key={r.code}
                  ref={isHL ? highlightRef : null}
                  style={{ background: isHL ? "#FFFBEA" : "transparent", boxShadow: isHL ? "inset 3px 0 0 var(--gold)" : "none", transition: "background 0.3s" }}
                >
                  <td style={{ textAlign: "center", color: "var(--muted)", fontSize: 11 }}>{idx + 1}</td>
                  <td className="code" style={{ fontWeight: 600, color: "var(--brand)" }}>{r.code}</td>
                  <td style={{ fontWeight: isHL ? 600 : 400 }}>{r.name}</td>
                  <td>
                    {r.barcode
                      ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--leaf)", fontWeight: 600 }}>{r.barcode}</span>
                      : <span style={{ color: "var(--muted-2)", fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ textAlign: "center" }}>{r.unit}</td>
                  <td style={{ fontSize: 11, color: "var(--ink-2)" }}>{r.buyUnit}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>฿{(parseFloat(r.cost)||0).toFixed(3)}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>{r.supplier || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-sm" onClick={() => openEdit(r)} title="แก้ไข">✏️</button>
                      <button className="btn btn-sm" onClick={() => handleDelete(r)} title="ลบ" style={{ color: "var(--brand)" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---- Modal แก้ไข ---- */}
      {editItem && (
        <div onClick={closeEdit} style={{ position: "fixed", inset: 0, background: "rgba(34,26,20,.42)", display: "grid", placeItems: "center", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: 500, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-head">
              <h3 className="card-title">✏️ แก้ไขวัตถุดิบ — {editItem.code}</h3>
              <button className="btn btn-sm btn-ghost" onClick={closeEdit}>✕</button>
            </div>
            <div className="card-body" style={{ display: "grid", gap: 11 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>รหัส (ไม่สามารถแก้ไขได้)</label>
                <input value={editForm.code || ""} disabled style={{ ...inp, background: "var(--surface-sunken)", fontFamily: "var(--font-mono)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>ชื่อวัตถุดิบ</label>
                <input value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>บาร์โค้ด</label>
                <input value={editForm.barcode || ""} onChange={e => setEditForm({ ...editForm, barcode: e.target.value })} placeholder="สแกนหรือพิมพ์บาร์โค้ด" style={{ ...inp, fontFamily: "var(--font-mono)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>หน่วย</label>
                  <input value={editForm.unit || ""} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>ต้นทุน (บาท/หน่วย)</label>
                  <input type="number" step="0.001" value={editForm.cost || ""} onChange={e => setEditForm({ ...editForm, cost: e.target.value })} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>หน่วยซื้อ</label>
                <input value={editForm.buyUnit || ""} onChange={e => setEditForm({ ...editForm, buyUnit: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>ผู้ขาย / ซัพพลายเออร์</label>
                <input value={editForm.supplier || ""} onChange={e => setEditForm({ ...editForm, supplier: e.target.value })} style={inp} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="btn" onClick={closeEdit}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={saveEdit}>💾 บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenRawMaterialBarcode });
