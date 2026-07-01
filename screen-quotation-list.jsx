// 📝 ซื้อวัตถุดิบ v2 — รายการซื้อทั้งหมด + เพิ่ม/แก้ไข/ลบ

const ScreenPurchaseV2 = () => {
  const [rows, setRows] = React.useState([]);
  const [editIdx, setEditIdx] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [form, setForm] = React.useState({
    date: "2026-05-18", raw: "R01", qty: "", unit: "กิโลกรัม", total: "",
  });

  // Load data ครั้งแรก — localStorage ก่อน → PURCHASES จาก data.jsx
  React.useEffect(() => {
    try {
      const s = localStorage.getItem('erp_purchases');
      if (s) { setRows(JSON.parse(s)); return; }
    } catch(e) {}
    const p = (typeof PURCHASES !== 'undefined') ? PURCHASES : [];
    setRows([...p]);
  }, []);

  // บันทึกลง localStorage (ไม่เรียกตัวเอง!)
  const persist = (updated) => {
    try { localStorage.setItem('erp_purchases', JSON.stringify(updated)); } catch(e) {}
  };

  const rawList = (typeof RAW !== 'undefined') ? RAW : [];
  const fmtNum = n => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

  // แปลงวันที่เป็น DD/MM/YYYY (รองรับ "18 พ.ค." และ "2026-05-18")
  const fmtDate = (d) => window.fmtDateGlobal(d);

  // แปลง YYYY-MM-DD → "18 พ.ค."
  const toThaiDate = (iso) => {
    const monthsTh = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
      const [y, m, d] = iso.split("-");
      return `${d} ${monthsTh[parseInt(m)-1]}`;
    }
    return iso;
  };

  const onSave = () => {
    const qty = parseFloat(form.qty);
    const total = parseFloat(form.total);
    if (!form.raw || !qty || !total) return alert("กรุณากรอกข้อมูลให้ครบ");

    const unitsMap = { "kg": 1000, "กิโลกรัม": 1000, "กรัม": 1 };
    const factor = unitsMap[form.unit] || 1;
    const qtyGrams = qty * factor;
    const raw = rawList.find(r => r.code === form.raw);

    if (editIdx !== null) {
      // edit mode
      const old = rows[editIdx];
      const oldFactor = unitsMap[old.unit || "กิโลกรัม"] || 1;
      const oldQtyGrams = (old.qty || 0) * oldFactor;

      const newRows = [...rows];
      newRows[editIdx] = { ...old, date: toThaiDate(form.date), raw: form.raw, supplier: raw?.supplier || old.supplier || "—", qty, unit: form.unit, total };
      setRows(newRows);
      persist(newRows);

      const stocks = (typeof RAW_STOCK !== 'undefined') ? RAW_STOCK : [];
      stocks.forEach(s => {
        if (s.raw === old.raw) s.inHand = s.inHand - oldQtyGrams;
      });
      stocks.forEach(s => {
        if (s.raw === form.raw) s.inHand = (s.inHand || 0) + qtyGrams;
      });
      window.RAW_STOCK = stocks;
      try { localStorage.setItem('erp_raw_stock', JSON.stringify(stocks)); } catch(e) {}

      setEditIdx(null);
    } else {
      // add mode
      const dateStr = form.date.replace(/-/g, "").slice(2);
      const count = rows.filter(r => (r.code||"").startsWith(`PO-${dateStr}`)).length + 1;
      const newRow = {
        date: toThaiDate(form.date),
        code: `PO-${dateStr}-${count}`,
        supplier: raw?.supplier || "—",
        raw: form.raw,
        qty, unit: form.unit, total,
      };
      const newRows = [newRow, ...rows];
      setRows(newRows);
      persist(newRows);

      const stocks = (typeof RAW_STOCK !== 'undefined') ? RAW_STOCK : [];
      stocks.forEach(s => {
        if (s.raw === form.raw) s.inHand = (s.inHand || 0) + qtyGrams;
      });
      window.RAW_STOCK = stocks;
      try { localStorage.setItem('erp_raw_stock', JSON.stringify(stocks)); } catch(e) {}
    }

    setForm({ date: form.date, raw: "R01", qty: "", unit: "กิโลกรัม", total: "" });
  };

  const onEdit = (idx) => {
    setEditIdx(idx);
    const po = rows[idx];
    // แปลง date กลับเป็น YYYY-MM-DD ถ้าเป็นไทย
    let isoDate = po.date;
    if (!/^\d{4}-/.test(po.date)) {
      const monthsTh = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
      const parts = (po.date||"").split(" ");
      const mon = monthsTh.indexOf(parts[1]);
      if (mon !== -1) isoDate = `2026-${String(mon+1).padStart(2,'0')}-${String(parts[0]).padStart(2,'0')}`;
    }
    setForm({ date: isoDate, raw: po.raw, qty: po.qty, unit: po.unit || "กรัม", total: po.total });
  };

  const onDelete = (idx) => {
    if (!confirm(`ลบ ${rows[idx].code}?`)) return;
    const po = rows[idx];
    const factor = { "kg": 1000, "กิโลกรัม": 1000, "กรัม": 1 }[po.unit] || 1;

    const newRows = rows.filter((_, i) => i !== idx);
    setRows(newRows);
    persist(newRows);

    const stocks = (typeof RAW_STOCK !== 'undefined') ? RAW_STOCK : [];
    stocks.forEach(s => {
      if (s.raw === po.raw) s.inHand = Math.max(0, s.inHand - (po.qty || 0) * factor);
    });
    window.RAW_STOCK = stocks;
    try { localStorage.setItem('erp_raw_stock', JSON.stringify(stocks)); } catch(e) {}

    setEditIdx(null);
  };

  // กรอง
  const filtered = search.trim()
    ? rows.filter(r => {
        const raw = rawList.find(x => x.code === r.raw);
        return (r.code||"").toLowerCase().includes(search.toLowerCase())
          || (r.raw||"").toLowerCase().includes(search.toLowerCase())
          || (raw?.name||"").toLowerCase().includes(search.toLowerCase());
      })
    : rows;

  const totalAll = filtered.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">📥 รับเข้าวัตถุดิบ</h1>
        <p className="page-sub">บันทึกรับวัตถุดิบเข้าคลัง · เพิ่ม / แก้ไข / ลบ · อัปเดตสต๊อกอัตโนมัติ</p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div className="card"><div className="card-body">
          <div className="kpi-label">จำนวนรายการ</div>
          <div className="kpi-value">{fmtNum(filtered.length)}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="kpi-label">มูลค่ารวม</div>
          <div className="kpi-value" style={{ color: "var(--brand)" }}>฿{fmtNum(totalAll)}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="kpi-label">วัตถุดิบที่ซื้อ</div>
          <div className="kpi-value">{new Set(filtered.map(r => r.raw)).size}</div>
        </div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div>
          <div className="card">
            <div className="card-head" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 className="card-title" style={{ flex: 1 }}>ประวัติการซื้อ</h3>
              <input
                className="form-input"
                placeholder="ค้นหา PO / รหัส / ชื่อ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>PO</th>
                    <th>วัตถุดิบ</th>
                    <th>ผู้ขาย</th>
                    <th className="num">จำนวน</th>
                    <th className="num">ต้นทุน (บาท)</th>
                    <th style={{ width: 80 }}>ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>ไม่มีรายการ</td></tr>
                  ) : filtered.map((r, i) => {
                    const realIdx = rows.indexOf(r);
                    const raw = rawList.find(x => x.code === r.raw);
                    return (
                      <tr key={(r.code||"") + i} style={{ background: editIdx === realIdx ? "#fff7ed" : "" }}>
                        <td className="small muted">{fmtDate(r.date)}</td>
                        <td><span className="code">{r.code}</span></td>
                        <td className="small"><strong>{r.raw}</strong> · {raw?.name || "—"}</td>
                        <td className="small muted">{r.supplier || "—"}</td>
                        <td className="num tnum">{fmtNum(r.qty)} <span className="muted small">{r.unit}</span></td>
                        <td className="num tnum" style={{ fontWeight: 600 }}>฿{fmtNum(r.total)}</td>
                        <td style={{ display: "flex", gap: 5 }}>
                          <button className="btn btn-sm" onClick={() => onEdit(realIdx)} title="แก้ไข">✎</button>
                          <button className="btn btn-sm" onClick={() => onDelete(realIdx)} title="ลบ" style={{ color: "#ef4444" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ height: "fit-content", alignSelf: "flex-start" }}>
          <div className="card-head">
            <h3 className="card-title">{editIdx !== null ? "✎ แก้ไขรายการซื้อ" : "➕ เพิ่มรายการซื้อ"}</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="label small muted">วันที่</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label small muted">วัตถุดิบ</label>
              <select className="form-input" value={form.raw} onChange={e => setForm({ ...form, raw: e.target.value })}>
                {rawList.map(r => <option key={r.code} value={r.code}>{r.code} · {r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label small muted">จำนวน</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" className="form-input" style={{ flex: 1 }} value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="0" />
                <select className="form-input" style={{ flex: "0 0 90px" }} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option>กิโลกรัม</option>
                  <option>กรัม</option>
                  <option>kg</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label small muted">ต้นทุนรวม (บาท)</label>
              <input type="number" className="form-input" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} placeholder="0" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onSave}>{editIdx !== null ? "อัปเดต" : "เพิ่มรายการ"}</button>
              {editIdx !== null && (
                <button className="btn" onClick={() => { setEditIdx(null); setForm({ date: form.date, raw: "R01", qty: "", unit: "กรัม", total: "" }); }}>ยกเลิก</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export
Object.assign(window, { ScreenPurchaseV2 });
