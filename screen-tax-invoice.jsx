// 🏭 รายชื่อซัพพลายเออร์
const SUPPLIER_STORAGE_KEY = "SUPPLIERS";

const loadSuppliers = () => {
  try {
    const saved = localStorage.getItem(SUPPLIER_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    // seed จากชื่อ supplier ใน RAW data
    const rawList = typeof RAW !== "undefined" ? RAW : [];
    const seen = new Set();
    const seeded = [];
    let num = 1;
    rawList.forEach(r => {
      const name = (r.supplier || "").trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        seeded.push({
          id: "S" + String(num).padStart(3, "0"),
          name,
          contact: "", phone: "", address: "", email: "",
          taxId: "", category: "วัตถุดิบ", status: "active", notes: "",
        });
        num++;
      }
    });
    if (seeded.length) localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  } catch (e) { return []; }
};

const saveSuppliers = (list) => {
  try { localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
};

const ScreenSupplier = () => {
  const [list, setList] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [msg, setMsg] = React.useState("");
  const PER = 50;

  const blank = { id: "", name: "", contact: "", phone: "", address: "", email: "", taxId: "", category: "วัตถุดิบ", status: "active", notes: "" };

  React.useEffect(() => { setList(loadSuppliers()); }, []);

  const persist = (next) => { setList(next); saveSuppliers(next); };

  const categories = React.useMemo(() => [...new Set(list.map(s => s.category).filter(Boolean))].sort(), [list]);

  const filtered = list.filter(s => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || (s.name || "").toLowerCase().includes(q) || (s.id || "").toLowerCase().includes(q) || (s.phone || "").includes(q) || (s.contact || "").toLowerCase().includes(q);
    const matchCat = !catFilter || s.category === catFilter;
    return matchQ && matchCat;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages - 1);
  const shown = filtered.slice(cur * PER, cur * PER + PER);
  React.useEffect(() => setPage(0), [search, catFilter]);

  const openAdd = () => {
    const nextNum = list.reduce((m, s) => { const n = parseInt(String(s.id).replace(/\D/g, "")) || 0; return Math.max(m, n); }, 0) + 1;
    setForm({ ...blank, id: "S" + String(nextNum).padStart(3, "0") });
    setEditId(null); setOpen(true);
  };
  const openEdit = (s) => { setForm({ ...s }); setEditId(s.id); setOpen(true); };

  const save = () => {
    if (!form.name.trim()) return alert("กรุณากรอกชื่อซัพพลายเออร์");
    let next;
    if (editId !== null) next = list.map(s => s.id === editId ? form : s);
    else {
      if (list.some(s => s.id === form.id)) return alert("รหัสซ้ำ");
      next = [form, ...list];
    }
    persist(next);
    setOpen(false);
    setMsg(editId !== null ? "✅ บันทึกการแก้ไขแล้ว" : "✅ เพิ่มซัพพลายเออร์ใหม่แล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  const del = (s) => {
    if (!confirm(`ลบซัพพลายเออร์ ${s.id} — ${s.name}?`)) return;
    persist(list.filter(x => x.id !== s.id));
    setMsg("✅ ลบแล้ว"); setTimeout(() => setMsg(""), 2200);
  };

  const printList = () => {
    const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
    const esc = v => String(v == null ? "" : v).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const now = new Date();
    const at = `${window.fmtDateGlobal(now.toISOString().slice(0,10))} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const rows = filtered.map((s, i) => `<tr>
      <td class="c">${i+1}</td>
      <td class="code">${esc(s.id)}</td>
      <td><strong>${esc(s.name)}</strong>${s.contact ? `<br><span style="font-size:10px;color:#666">${esc(s.contact)}</span>` : ""}</td>
      <td>${esc(s.phone || "—")}</td>
      <td>${esc(s.email || "—")}</td>
      <td>${esc(s.category || "—")}</td>
      <td>${esc(s.address || "—")}</td>
      <td class="c"><span style="color:${s.status==="active"?"#2D5128":"#7A1411"}">${s.status === "active" ? "ใช้งาน" : "ระงับ"}</span></td>
    </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>รายชื่อซัพพลายเออร์</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:20px;font-size:12px;background:#e8e8e8;color:#000}
.doc{width:1000px;margin:0 auto;background:#fff;padding:24px 28px;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.head{display:grid;grid-template-columns:60px 1fr auto;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px}
.head img{width:56px;height:56px;object-fit:contain}.cname{font-size:16px;font-weight:700}.caddr{font-size:10px;color:#444}
.rtitle{text-align:right}.rtitle .t{font-size:16px;font-weight:700}.rtitle .m{font-size:10px;color:#444;margin-top:2px}
table{border-collapse:collapse;width:100%}th{background:#f0f0f0;border:1px solid #000;padding:5px 6px;text-align:left;font-size:11px}
td{border:1px solid #000;padding:4px 6px;vertical-align:top;font-size:11px}.c{text-align:center}.code{font-family:monospace;font-size:10px;color:#555}
tfoot td{font-weight:700;background:#f0f0f0}
.bar{text-align:center;margin-top:14px}.bar button{font-family:inherit;font-size:13px;font-weight:600;padding:8px 22px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;box-shadow:none;padding:10mm}.no-print{display:none!important}@page{size:A4 landscape;margin:0}}</style>
</head><body><div class="doc">
  <div class="head"><img src="${logoUrl}" alt=""><div><div class="cname">บริษัท ชูรสยายปู จำกัด</div><div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div></div>
  <div class="rtitle"><div class="t">รายชื่อซัพพลายเออร์</div><div class="m">พิมพ์เมื่อ ${at}</div><div class="m">${filtered.length} ราย</div></div></div>
  <table><thead><tr><th class="c" style="width:30px">#</th><th style="width:60px">รหัส</th><th>ชื่อ / ผู้ติดต่อ</th><th style="width:110px">เบอร์โทร</th><th style="width:140px">อีเมล</th><th style="width:90px">ประเภท</th><th>ที่อยู่</th><th class="c" style="width:60px">สถานะ</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="8" class="c">ไม่มีข้อมูล</td></tr>'}</tbody>
  <tfoot><tr><td colspan="7" style="text-align:right">รวม</td><td class="c">${filtered.length} ราย</td></tr></tfoot></table>
  <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
</div></body></html>`;
    const win = window.open("", "", "width=1060,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่"); return; }
    win.document.write(html); win.document.close();
  };

  const inp = { border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, width: "100%", fontFamily: "inherit" };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🏭 รายชื่อซัพพลายเออร์</h1>
          <p className="page-sub">ฐานข้อมูลซัพพลายเออร์ {list.length.toLocaleString("th-TH")} ราย · เพิ่ม / แก้ไข / ลบ</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={printList}>🖨️ พิมพ์รายชื่อ</button>
          <button className="btn btn-primary" onClick={openAdd}>➕ เพิ่มซัพพลายเออร์</button>
        </div>
      </div>

      {msg && <div className="alert" style={{ background: "var(--leaf-soft)", border: "1px solid #B9D4B2", color: "#2D5128", marginBottom: 14 }}>{msg}</div>}

      {/* ค้นหา */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="ค้นหาชื่อ / รหัส / เบอร์โทร / ผู้ติดต่อ…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 240, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
          <option value="">ทุกประเภท</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ตาราง */}
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 70 }}>รหัส</th>
              <th>ชื่อซัพพลายเออร์</th>
              <th style={{ width: 130 }}>เบอร์โทร</th>
              <th style={{ width: 150 }}>อีเมล</th>
              <th style={{ width: 100 }}>ประเภท</th>
              <th style={{ width: 80, textAlign: "center" }}>สถานะ</th>
              <th style={{ width: 120 }}>ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ไม่พบซัพพลายเออร์</td></tr>
            ) : shown.map(s => (
              <tr key={s.id}>
                <td className="code">{s.id}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  {s.contact && <div className="small muted">{s.contact}</div>}
                  {s.address && <div className="small muted" style={{ marginTop: 1 }}>{s.address}</div>}
                </td>
                <td className="small tnum">{s.phone || "—"}</td>
                <td className="small">{s.email || "—"}</td>
                <td className="small">{s.category || "—"}</td>
                <td style={{ textAlign: "center" }}>
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                    background: s.status === "active" ? "var(--leaf-soft)" : "var(--brand-soft)",
                    color: s.status === "active" ? "#2D5128" : "var(--brand-ink)"
                  }}>{s.status === "active" ? "ใช้งาน" : "ระงับ"}</span>
                </td>
                <td style={{ display: "flex", gap: 5 }}>
                  <button className="btn btn-sm" onClick={() => openEdit(s)} title="แก้ไข">✏️</button>
                  <button className="btn btn-sm" onClick={() => del(s)} title="ลบ" style={{ color: "var(--brand)" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 14 }}>
          <button className="btn btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>‹ ก่อนหน้า</button>
          <span className="small muted">หน้า {cur+1} / {pages} · แสดง {shown.length} จาก {filtered.length} ราย</span>
          <button className="btn btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>ถัดไป ›</button>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(34,26,20,.42)", display: "grid", placeItems: "center", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: 520, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-head">
              <h3 className="card-title">{editId !== null ? "✏️ แก้ไขซัพพลายเออร์" : "➕ เพิ่มซัพพลายเออร์ใหม่"}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="card-body" style={{ display: "grid", gap: 11 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>รหัสซัพพลายเออร์</label>
                  <input value={form.id || ""} disabled={editId !== null} onChange={e => setForm({ ...form, id: e.target.value })}
                    style={{ ...inp, fontFamily: "var(--font-mono)", background: editId !== null ? "var(--surface-sunken)" : "#fff" }} />
                </div>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>สถานะ</label>
                  <select value={form.status || "active"} onChange={e => setForm({ ...form, status: e.target.value })} style={inp}>
                    <option value="active">ใช้งาน</option>
                    <option value="inactive">ระงับ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ชื่อซัพพลายเออร์ *</label>
                <input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ชื่อบริษัท / ร้านค้า" style={inp} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ผู้ติดต่อ</label>
                  <input value={form.contact || ""} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="ชื่อผู้ติดต่อ" style={inp} />
                </div>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เบอร์โทร</label>
                  <input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08x-xxx-xxxx" style={inp} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>อีเมล</label>
                  <input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" style={inp} />
                </div>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เลขประจำตัวผู้เสียภาษี</label>
                  <input value={form.taxId || ""} onChange={e => setForm({ ...form, taxId: e.target.value })} placeholder="0000000000000" style={{ ...inp, fontFamily: "var(--font-mono)" }} />
                </div>
              </div>

              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ที่อยู่</label>
                <input value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="ที่อยู่" style={inp} />
              </div>

              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ประเภทสินค้า</label>
                <input value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="วัตถุดิบ / บรรจุภัณฑ์ / อื่นๆ" style={inp} list="cat-list" />
                <datalist id="cat-list">
                  <option>วัตถุดิบ</option><option>บรรจุภัณฑ์</option><option>อุปกรณ์</option><option>อื่นๆ</option>
                </datalist>
              </div>

              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>หมายเหตุ</label>
                <textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  style={{ ...inp, resize: "vertical" }} placeholder="หมายเหตุเพิ่มเติม" />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="btn" onClick={() => setOpen(false)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={save}>💾 บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenSupplier, loadSuppliers, saveSuppliers });
