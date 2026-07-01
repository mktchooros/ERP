// ⊕ ปรับปรุงสินค้าพร้อมขาย — บันทึกปรับยอดสต๊อกสินค้า (เพิ่ม/ลด) + ประวัติ
const ScreenAdjFinished = () => {
  const products = React.useMemo(() => {
    try { return typeof loadMenuLive === "function" ? loadMenuLive() : (typeof MENU !== "undefined" ? MENU : []); }
    catch (e) { return typeof MENU !== "undefined" ? MENU : []; }
  }, []);
  const pName = (code) => products.find((p) => p.code === code)?.name || code || "—";

  const load = () => {
    try { const s = localStorage.getItem("erp_adj_finished"); if (s) return JSON.parse(s); } catch (e) {}
    return (typeof ADJ_FINISHED !== "undefined") ? ADJ_FINISHED : [];
  };
  const [rows, setRows] = React.useState(load);
  const [search, setSearch] = React.useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = React.useState({ date: today, product: "", dir: "-", qty: "", reason: "", by: "" });
  const [msg, setMsg] = React.useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const persist = (next) => { setRows(next); try { localStorage.setItem("erp_adj_finished", JSON.stringify(next)); } catch (e) {} };

  const add = () => {
    if (!form.product) { setMsg("⚠️ กรุณาเลือกสินค้า"); setTimeout(() => setMsg(""), 2200); return; }
    const q = parseFloat(form.qty);
    if (!q || q <= 0) { setMsg("⚠️ กรุณากรอกจำนวน (มากกว่า 0)"); setTimeout(() => setMsg(""), 2200); return; }
    const entry = { date: form.date, product: form.product, qty: form.dir === "-" ? -Math.abs(q) : Math.abs(q), reason: form.reason.trim() || "—", by: form.by.trim() || "—" };
    persist([entry, ...rows]);
    setForm({ date: today, product: "", dir: "-", qty: "", reason: "", by: "" });
    setMsg("✅ บันทึกการปรับปรุงแล้ว"); setTimeout(() => setMsg(""), 2200);
  };
  const remove = (i) => { if (!confirm("ลบรายการปรับปรุงนี้?")) return; const next = rows.slice(); next.splice(i, 1); persist(next); };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return `${r.product} ${pName(r.product)} ${r.reason} ${r.by}`.toLowerCase().includes(q);
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
          <h1 className="page-title">⊕ ปรับปรุงสินค้าพร้อมขาย</h1>
          <p className="page-sub">บันทึกปรับยอดสต๊อกสินค้า เพิ่ม/ลด · {rows.length} รายการ</p>
        </div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 14, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KPI label="ปรับเพิ่มรวม" value={"+" + num(totalUp)} unit="ซอง" hint="นับเพิ่ม / รับคืน" />
        <KPI label="ปรับลดรวม" value={num(totalDown)} unit="ซอง" hint="เสีย / หมดอายุ / ทิ้ง" />
        <KPI label="สุทธิ" value={(net >= 0 ? "+" : "") + num(net)} unit="ซอง" hint="ผลรวมการปรับปรุง" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3 className="card-title">＋ บันทึกการปรับปรุง</h3></div>
        <div className="card-body">
          {msg && <div className="alert" style={{ background: msg.startsWith("✅") ? "var(--leaf-soft)" : "var(--warn-soft)", border: "1px solid #D8C49E", color: "var(--ink-2)", marginBottom: 12 }}>{msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 110px 110px 1fr 130px auto", gap: 10, alignItems: "end" }}>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่</label><input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} style={inp} /></div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>สินค้า</label>
              <select value={form.product} onChange={(e) => set({ product: e.target.value })} style={inp}>
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
              </select>
            </div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>ทิศทาง</label>
              <select value={form.dir} onChange={(e) => set({ dir: e.target.value })} style={inp}>
                <option value="-">ลด (−)</option><option value="+">เพิ่ม (＋)</option>
              </select>
            </div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>จำนวน</label><input type="number" min="0" value={form.qty} onChange={(e) => set({ qty: e.target.value })} style={{ ...inp, textAlign: "right" }} /></div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>เหตุผล</label><input value={form.reason} onChange={(e) => set({ reason: e.target.value })} placeholder="เช่น ซองรั่ว ทิ้ง" style={inp} /></div>
            <div><label className="small muted" style={{ display: "block", marginBottom: 4 }}>ผู้บันทึก</label><input value={form.by} onChange={(e) => set({ by: e.target.value })} style={inp} /></div>
            <button className="btn btn-primary" onClick={add} style={{ height: 38 }}>บันทึก</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ flexWrap: "wrap", gap: 10 }}>
          <h3 className="card-title">ประวัติการปรับปรุง</h3>
          <div className="search" style={{ margin: 0, minWidth: 220 }}><Icon name="search" size={14} /><input placeholder="ค้นหาสินค้า / เหตุผล / ผู้บันทึก…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <table className="tbl">
          <thead><tr><th style={{ width: "4%" }}>#</th><th>วันที่</th><th>รหัส</th><th>สินค้า</th><th className="num">จำนวน</th><th>เหตุผล</th><th>ผู้บันทึก</th><th style={{ width: 40 }}></th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ยังไม่มีรายการปรับปรุง</td></tr>
              : filtered.map((r, i) => (
                <tr key={i}>
                  <td className="muted">{i + 1}</td>
                  <td>{r.date || "—"}</td>
                  <td style={{ fontWeight: 600 }}>{r.product}</td>
                  <td>{pName(r.product)}</td>
                  <td className="num tnum" style={{ fontWeight: 600, color: r.qty < 0 ? "var(--brand)" : "#2D7D46" }}>{r.qty > 0 ? "+" : ""}{num(r.qty)}</td>
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

Object.assign(window, { ScreenAdjFinished });
