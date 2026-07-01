// 🥩 จัดการสต๊อกวัตถุดิบ — กู้กลับ (array format: [{raw, inHand, reorder}])
const ScreenRawStock = () => {
  const [stocks, setStocks] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [onlyLow, setOnlyLow] = React.useState(false);
  const [editRaw, setEditRaw] = React.useState(null);
  const [form, setForm] = React.useState({ inHand: 0, reorder: 0 });
  const [msg, setMsg] = React.useState("");

  const RAWLIST = typeof RAW !== "undefined" ? RAW : [];

  // อ่านสต๊อก — รองรับทั้ง array เดิม และ map (จากหน้ารายการวัตถุดิบ)
  const readStocks = () => {
    try {
      const s = localStorage.getItem("erp_raw_stock");
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p;
        if (p && typeof p === "object") return Object.entries(p).map(([raw, v]) => ({ raw, inHand: v.inHand || 0, reorder: v.reorder || 0 }));
      }
    } catch (e) {}
    return (typeof RAW_STOCK !== "undefined" && Array.isArray(RAW_STOCK)) ? RAW_STOCK : [];
  };

  React.useEffect(() => { setStocks(readStocks()); }, []);

  const persist = (next) => {
    setStocks(next);
    window.RAW_STOCK = next;
    try { localStorage.setItem("erp_raw_stock", JSON.stringify(next)); } catch (e) {}
  };

  const rows = RAWLIST.map(mat => {
    const s = stocks.find(x => x.raw === mat.code) || { raw: mat.code, inHand: 0, reorder: 0 };
    return { ...s, name: mat.name || "—", unit: mat.unit || "กรัม", cost: mat.cost || 0, supplier: mat.supplier || "—" };
  }).filter(r => {
    const q = search.trim().toLowerCase();
    const mq = !q || (r.raw||"").toLowerCase().includes(q) || (r.name||"").toLowerCase().includes(q);
    const ml = !onlyLow || (r.inHand <= r.reorder);
    return mq && ml;
  });

  const totalValue = rows.reduce((s, r) => s + (r.inHand * r.cost), 0);
  const lowCount = stocks.filter(s => {
    const mat = RAWLIST.find(r => r.code === s.raw) || {};
    return (s.inHand || 0) <= (s.reorder || 0);
  }).length;

  const fmt = n => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

  const openEdit = (r) => { setEditRaw(r.raw); setForm({ inHand: r.inHand || 0, reorder: r.reorder || 0 }); };
  const saveEdit = () => {
    persist(stocks.map(s => s.raw === editRaw ? { ...s, inHand: parseFloat(form.inHand) || 0, reorder: parseFloat(form.reorder) || 0 } : s));
    setEditRaw(null); setMsg("✅ บันทึกแล้ว"); setTimeout(() => setMsg(""), 2000);
  };
  const del = (r) => { if (!confirm(`ลบสต๊อก ${r.raw} — ${r.name}?`)) return; persist(stocks.filter(s => s.raw !== r.raw)); };
  const addNew = () => {
    const used = stocks.map(s => s.raw);
    const avail = RAWLIST.find(r => !used.includes(r.code));
    if (!avail) { setMsg("⚠️ วัตถุดิบทั้งหมดมีสต๊อกแล้ว"); setTimeout(() => setMsg(""), 2000); return; }
    persist([...stocks, { raw: avail.code, inHand: 0, reorder: 0 }]);
    setMsg("✅ เพิ่มสต๊อกใหม่"); setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🥩 จัดการสต๊อกวัตถุดิบ</h1>
          <p className="page-sub">จำนวนคงเหลือ · เกณฑ์สั่งซื้อ · มูลค่าสต๊อก</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={addNew}>➕ เพิ่มสต๊อก</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 18 }}>
        <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
          <div className="small muted">จำนวนรายการ</div><div style={{ fontSize: 22, fontWeight: 700 }}>{stocks.length}</div>
        </div></div>
        <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
          <div className="small muted">มูลค่าสต๊อก</div><div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>฿{fmt(totalValue)}</div>
        </div></div>
        <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
          <div className="small muted">ต่ำกว่าเกณฑ์</div><div style={{ fontSize: 22, fontWeight: 700, color: lowCount > 0 ? "var(--brand)" : "var(--leaf)" }}>{lowCount}</div>
        </div></div>
      </div>

      {msg && <div className="alert" style={{ background: "var(--leaf-soft)", border: "1px solid #B9D4B2", color: "#2D5128", marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="ค้นหารหัส / ชื่อวัตถุดิบ…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} /> เฉพาะที่ต่ำกว่าเกณฑ์
        </label>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 70 }}>รหัส</th>
              <th>ชื่อวัตถุดิบ</th>
              <th className="num">คงเหลือ</th>
              <th className="num">เกณฑ์สั่ง</th>
              <th>หน่วย</th>
              <th className="num">มูลค่า</th>
              <th style={{ width: 70 }}>สถานะ</th>
              <th style={{ width: 110 }}>ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ไม่พบรายการ</td></tr>
            ) : rows.map(r => {
              const low = r.inHand <= r.reorder;
              return (
                <tr key={r.raw}>
                  <td className="code">{r.raw}</td>
                  <td>{r.name}<div className="small muted">{r.supplier}</div></td>
                  <td className="num tnum" style={{ fontWeight: 600, color: low ? "var(--brand)" : "var(--ink)" }}>{fmt(r.inHand)}</td>
                  <td className="num tnum muted">{fmt(r.reorder)}</td>
                  <td className="small">{r.unit}</td>
                  <td className="num tnum">฿{fmt(r.inHand * r.cost)}</td>
                  <td><span className={`badge ${low ? "b-stop" : "b-done"}`}>{low ? "ต่ำ" : "ปกติ"}</span></td>
                  <td style={{ display: "flex", gap: 5 }}>
                    <button className="btn btn-sm" onClick={() => openEdit(r)} title="แก้ไข">✏️</button>
                    <button className="btn btn-sm" onClick={() => del(r)} title="ลบ" style={{ color: "var(--brand)" }}>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editRaw !== null && (
        <div onClick={() => setEditRaw(null)} style={{ position: "fixed", inset: 0, background: "rgba(34,26,20,.42)", display: "grid", placeItems: "center", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: 360, maxWidth: "92vw" }}>
            <div className="card-head">
              <h3 className="card-title">✏️ แก้ไขสต๊อก {editRaw}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setEditRaw(null)}>✕</button>
            </div>
            <div className="card-body" style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>คงเหลือ</label>
                <input type="number" step="0.01" value={form.inHand} onChange={e => setForm({ ...form, inHand: e.target.value })}
                  style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
              </div>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เกณฑ์สั่งซื้อ</label>
                <input type="number" step="0.01" value={form.reorder} onChange={e => setForm({ ...form, reorder: e.target.value })}
                  style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => setEditRaw(null)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={saveEdit}>💾 บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenRawStock });
