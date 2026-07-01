// 👥 รายชื่อลูกค้า — กู้กลับ (อ่าน/บันทึกผ่าน loadCustomers/saveCustomers)
const ScreenCustomer = () => {
  const [list, setList] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [zone, setZone] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [form, setForm] = React.useState({});
  const PER = 50;

  const blank = { id: "", name: "", contact: "", phone: "", address: "", business: "", salesZone: "", grade: "", status: "active" };

  React.useEffect(() => {
    try { setList(typeof loadCustomers === "function" ? loadCustomers() : (typeof SAMPLE_CUSTOMERS !== "undefined" ? SAMPLE_CUSTOMERS : [])); } catch(e) {}
  }, []);

  const persist = (next) => {
    setList(next);
    try { if (typeof saveCustomers === "function") saveCustomers(next); } catch(e) {}
  };

  const zones = React.useMemo(() => [...new Set(list.map(c => c.salesZone).filter(Boolean))].sort(), [list]);

  const filtered = list.filter(c => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || (c.name||"").toLowerCase().includes(q) || (c.phone||"").includes(q) || (c.id||"").toLowerCase().includes(q) || (c.business||"").toLowerCase().includes(q);
    const matchZone = !zone || c.salesZone === zone;
    return matchQ && matchZone;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages - 1);
  const shown = filtered.slice(cur * PER, cur * PER + PER);

  React.useEffect(() => { setPage(0); }, [search, zone]);

  const openAdd = () => {
    const fresh = (typeof loadCustomers === "function" ? loadCustomers() : list);
    const used = new Set(fresh.map(c => String(c.id)));
    let n = fresh.reduce((m, c) => { const x = parseInt(String(c.id).replace(/\D/g, "")) || 0; return Math.max(m, x); }, 0) + 1;
    let id = "C" + String(n).padStart(3, "0");
    while (used.has(id)) { n++; id = "C" + String(n).padStart(3, "0"); }
    setForm({ ...blank, id });
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (c) => { setForm({ ...c }); setEditId(c.id); setOpen(true); };

  const save = () => {
    if (!form.name.trim()) return alert("กรุณากรอกชื่อลูกค้า");
    // อ่านข้อมูลล่าสุดก่อนบันทึก — กัน state เก่าทับทำข้อมูลหาย
    const fresh = (typeof loadCustomers === "function" ? loadCustomers() : list);
    let next;
    if (editId !== null) {
      next = fresh.map(c => c.id === editId ? { ...form } : c);
    } else {
      const cust = { ...form };
      const used = new Set(fresh.map(c => String(c.id)));
      // ถ้ารหัสซ้ำ — ออกเลขใหม่อัตโนมัติแทนที่จะบล็อกการบันทึก
      if (used.has(String(cust.id))) {
        let n = fresh.reduce((m, c) => { const x = parseInt(String(c.id).replace(/\D/g, "")) || 0; return Math.max(m, x); }, 0) + 1;
        let id = "C" + String(n).padStart(3, "0");
        while (used.has(id)) { n++; id = "C" + String(n).padStart(3, "0"); }
        cust.id = id;
      }
      next = [cust, ...fresh];
    }
    persist(next);
    setOpen(false);
    setMsg(editId !== null ? "✅ บันทึกการแก้ไขแล้ว" : "✅ เพิ่มลูกค้าใหม่แล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  const dup = (c) => {
    const fresh = (typeof loadCustomers === "function" ? loadCustomers() : list);
    const used = new Set(fresh.map(x => String(x.id)));
    let n = fresh.reduce((m, x) => { const v = parseInt(String(x.id).replace(/\D/g, "")) || 0; return Math.max(m, v); }, 0) + 1;
    let id = "C" + String(n).padStart(3, "0");
    while (used.has(id)) { n++; id = "C" + String(n).padStart(3, "0"); }
    persist([{ ...c, id, name: c.name + " (สำเนา)" }, ...fresh]);
    setMsg("✅ สำเนาลูกค้าแล้ว"); setTimeout(() => setMsg(""), 2200);
  };

  const del = (c) => {
    if (!confirm(`ลบลูกค้า ${c.id} — ${c.name}?`)) return;
    const fresh = (typeof loadCustomers === "function" ? loadCustomers() : list);
    persist(fresh.filter(x => x.id !== c.id));
    setMsg("✅ ลบแล้ว"); setTimeout(() => setMsg(""), 2200);
  };

  const gradeBadge = (g) => {
    const map = { A: "b-done", B: "b-info", C: "b-warn", D: "b-stop" };
    return map[g] || "b-neutral";
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">👥 รายชื่อลูกค้า</h1>
          <p className="page-sub">ฐานข้อมูลลูกค้า {list.length.toLocaleString("th-TH")} ราย · เพิ่ม / แก้ไข / สำเนา / ลบ</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>➕ เพิ่มลูกค้า</button>
        </div>
      </div>

      {msg && <div className="alert" style={{ background: "var(--leaf-soft)", border: "1px solid #B9D4B2", color: "#2D5128", marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input className="form-input" placeholder="ค้นหาชื่อ / เบอร์โทร / รหัส / ประเภทกิจการ…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 240, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
        <select value={zone} onChange={e => setZone(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
          <option value="">ทุกเขตขาย</option>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 70 }}>รหัส</th>
              <th>ชื่อลูกค้า</th>
              <th style={{ width: 130 }}>เบอร์โทร</th>
              <th style={{ width: 120 }}>เขตขาย</th>
              <th style={{ width: 70 }}>เกรด</th>
              <th style={{ width: 150 }}>ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ไม่พบลูกค้า</td></tr>
            ) : shown.map(c => (
              <tr key={c.id}>
                <td className="code">{c.id}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{c.name}</div>
                  {c.business && <div className="small muted">{c.business}</div>}
                </td>
                <td className="small tnum">{c.phone || "—"}</td>
                <td className="small">{c.salesZone || "—"}</td>
                <td>{c.grade ? <span className={`badge ${gradeBadge(c.grade)}`}>{c.grade}</span> : <span className="muted small">—</span>}</td>
                <td style={{ display: "flex", gap: 5 }}>
                  <button className="btn btn-sm" onClick={() => openEdit(c)} title="แก้ไข">✏️</button>
                  <button className="btn btn-sm" onClick={() => dup(c)} title="สำเนา">📋</button>
                  <button className="btn btn-sm" onClick={() => del(c)} title="ลบ" style={{ color: "var(--brand)" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 }}>
          <button className="btn btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>‹ ก่อนหน้า</button>
          <span className="small muted">หน้า {cur + 1} / {pages} · แสดง {shown.length} จาก {filtered.length.toLocaleString("th-TH")} ราย</span>
          <button className="btn btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>ถัดไป ›</button>
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(34,26,20,.42)", display: "grid", placeItems: "center", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: 480, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
            <div className="card-head">
              <h3 className="card-title">{editId !== null ? "✏️ แก้ไขลูกค้า" : "➕ เพิ่มลูกค้าใหม่"}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="card-body" style={{ display: "grid", gap: 12 }}>
              {[
                ["id", "รหัสลูกค้า", "text"],
                ["name", "ชื่อลูกค้า *", "text"],
                ["phone", "เบอร์โทร", "text"],
                ["business", "ประเภทกิจการ", "text"],
                ["address", "ที่อยู่", "text"],
              ].map(([k, label, type]) => (
                <div key={k}>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>{label}</label>
                  <input type={type} value={form[k] || ""} disabled={k === "id" && editId !== null}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, background: (k==="id"&&editId!==null) ? "var(--surface-sunken)" : "white" }} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เขตขาย</label>
                  <input value={form.salesZone || ""} onChange={e => setForm({ ...form, salesZone: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เกรด</label>
                  <select value={form.grade || ""} onChange={e => setForm({ ...form, grade: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}>
                    <option value="">—</option><option>A</option><option>B</option><option>C</option><option>D</option>
                  </select>
                </div>
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

Object.assign(window, { ScreenCustomer });
