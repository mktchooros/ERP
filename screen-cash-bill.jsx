// ⊕ ปรับปรุงวัตถุดิบ — บันทึกปรับยอดสต๊อกวัตถุดิบ (เพิ่ม/ลด) + ประวัติ
const ScreenAdjRaw = () => {
  const raws = React.useMemo(() => (typeof RAW !== "undefined" ? RAW : []), []);
  const rInfo = (code) => raws.find((r) => r.code === code);
  const rName = (code) => rInfo(code)?.name || code || "—";
  const rUnit = (code) => rInfo(code)?.unit || "";

  const load = () => {
    try { const s = localStorage.getItem("erp_adj_raw"); if (s) return JSON.parse(s); } catch (e) {}
    return (typeof ADJ_RAW !== "undefined") ? ADJ_RAW : [];
  };
  const [rows, setRows] = React.useState(load);
  const [search, setSearch] = React.useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = React.useState({ date: today, raw: "", dir: "-", qty: "", reason: "", by: "" });
  const [msg, setMsg] = React.useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const persist = (next) => { setRows(next); try { localStorage.setItem("erp_adj_raw", JSON.stringify(next)); } catch (e) {} };

  const add = () => {
    if (!form.raw) { setMsg("⚠️ กรุณาเลือกวัตถุดิบ"); setTimeout(() => setMsg(""), 2200); return; }
    const q = parseFloat(form.qty);
    if (!q || q <= 0) { setMsg("⚠️ กรุณากรอกจำนวน (มากกว่า 0)"); setTimeout(() => setMsg(""), 2200); return; }
    const entry = { date: form.date, raw: form.raw, qty: form.dir === "-" ? -Math.abs(q) : Math.abs(q), reason: form.reason.trim() || "—", by: form.by.trim() || "—" };
    persist([entry, ...rows]);
    setForm({ date: today, raw: "", dir: "-", qty: "", reason: "", by: "" });
    setMsg("✅ บันทึกการปรับปรุงแล้ว"); setTimeout(() => setMsg(""), 2200);
  };
  const remove = (i) => { if (!confirm("ลบรายการปรับปรุงนี้?")) return; const next = rows.slice(); next.splice(i, 1); persist(next); };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return `${r.raw} ${rName(r.raw)} ${r.reason} ${r.by}`.toLowerCase().includes(q);
  });
  const num = (n) => Number(n || 0).toLocaleString();
  const totalUp = rows.filter((r) => r.qty > 0).reduce((s, r) => s + r.qty, 0);
  const totalDown = rows.filter((r) => r.qty < 0).reduce((s, r) => s + r.qty, 0);
  const net = totalUp + totalDown;

  const inp = { padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, width: "100%" };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">⊕ ปรับปรุงวัตถุดิบ</h1>
          <p className="page-sub">บันทึกปรับยอดสต๊อกวัตถุดิบ เพิ่ม/ลด · {rows.length} รายการ</p>
        </div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 14, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KPI label="ปรับเพิ่มรวม" value={"+" + num(totalUp)} hint="นับเพิ่ม / รับคืน" />
        <KPI label="ปรับลดรวม" value={num(totalDown)} hint="หก / เสีย / ทิ้ง" />
        <KPI label="สุทธิ" value={(net >= 0 ? "+" : "") + num(net)} hint="ผลรวมการปรับปรุง" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3 className="card-title">＋ บันทึกการปรับปรุง</h3></div>
        <div className="card-body">
          {msg && <div className="alert" style={{ background: msg.startsWith("✅") ? "var(--leaf-soft)" : "var(--warn-soft)", border: "1px solid #D8C49E", color: "var(--ink-2)", marginBottom: 12 }}>{msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 110px 110px 1fr 130px auto", gap: 10, alignItems: "end" }}>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่</label><input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} style={inp} /></div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>วัตถุดิบ</label>
              <select value={form.raw} onChange={(e) => set({ raw: e.target.value })} style={inp}>
                <option value="">-- เลือกวัตถุดิบ --</option>
                {raws.map((r) => <option key={r.code} value={r.code}>{r.code} · {r.name}</option>)}
              </select>
            </div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>ทิศทาง</label>
              <select value={form.dir} onChange={(e) => set({ dir: e.target.value })} style={inp}>
                <option value="-">ลด (−)</option><option value="+">เพิ่ม (＋)</option>
              </select>
            </div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>จำนวน{form.raw ? ` (${rUnit(form.raw)})` : ""}</label><input type="number" min="0" value={form.qty} onChange={(e) => set({ qty: e.target.value })} style={{ ...inp, textAlign: "right" }} /></div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>เหตุผล</label><input value={form.reason} onChange={(e) => set({ reason: e.target.value })} placeholder="เช่น หกระหว่างชั่ง" style={inp} /></div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>ผู้บันทึก</label><input value={form.by} onChange={(e) => set({ by: e.target.value })} style={inp} /></div>
            <button className="btn btn-primary" onClick={add} style={{ height: 38 }}>บันทึก</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ flexWrap: "wrap", gap: 10 }}>
          <h3 className="card-title">ประวัติการปรับปรุง</h3>
          <div className="search" style={{ margin: 0, minWidth: 220 }}><Icon name="search" size={14} /><input placeholder="ค้นหาวัตถุดิบ / เหตุผล / ผู้บันทึก…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <table className="tbl">
          <thead><tr><th style={{ width: "4%" }}>#</th><th>วันที่</th><th>รหัส</th><th>วัตถุดิบ</th><th className="num">จำนวน</th><th>หน่วย</th><th>เหตุผล</th><th>ผู้บันทึก</th><th style={{ width: 40 }}></th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ยังไม่มีรายการปรับปรุง</td></tr>
              : filtered.map((r, i) => (
                <tr key={i}>
                  <td className="muted">{i + 1}</td>
                  <td>{r.date || "—"}</td>
                  <td style={{ fontWeight: 600 }}>{r.raw}</td>
                  <td>{rName(r.raw)}</td>
                  <td className="num tnum" style={{ fontWeight: 600, color: r.qty < 0 ? "var(--brand)" : "#2D7D46" }}>{r.qty > 0 ? "+" : ""}{num(r.qty)}</td>
                  <td className="small muted">{rUnit(r.raw)}</td>
                  <td className="small">{r.reason}</td>
                  <td className="small muted">{r.by}</td>
                  <td><button className="btn btn-sm" onClick={() => remove(rows.indexOf(r))} style={{ color: "var(--brand)" }}>🗑️</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenAdjRaw });
