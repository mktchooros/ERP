// 📦 ใบส่งของ — บันทึกใบส่งของ (Delivery Note)
const ScreenDeliveryNote = () => {
  const [notes, setNotes] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState("report");
  const [form, setForm] = React.useState({
    noteNo: "", date: new Date().toISOString().split("T")[0],
    customerName: "", customerAddress: "", items: [], notes: "",
  });
  const [formItems, setFormItems] = React.useState([]);
  const [nextItemId, setNextItemId] = React.useState(0);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    try {
      const s = localStorage.getItem('erp_delivery_notes');
      if (s) setNotes(JSON.parse(s));
    } catch(e) {}
  }, []);

  const saveNotes = (next) => {
    setNotes(next);
    try { localStorage.setItem('erp_delivery_notes', JSON.stringify(next)); } catch(e) {}
  };

  const filtered = search.trim()
    ? notes.filter(n => 
        (n.noteNo || "").toLowerCase().includes(search.toLowerCase())
        || (n.customerName || "").toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const onAddItem = () => {
    setFormItems([...formItems, { id: nextItemId, description: "", qty: 1, unit: "" }]);
    setNextItemId(nextItemId + 1);
  };

  const onRemoveItem = (id) => {
    setFormItems(formItems.filter(i => i.id !== id));
  };

  const onUpdateItem = (id, field, value) => {
    const updated = formItems.map(i => (i.id !== id) ? i : { ...i, [field]: value });
    setFormItems(updated);
  };

  const onSaveNote = () => {
    if (!form.date || !form.customerName || !form.noteNo || !formItems.some(i => i.description)) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    const newNote = {
      noteNo: form.noteNo,
      date: form.date,
      customerName: form.customerName,
      customerAddress: form.customerAddress,
      items: formItems,
      notes: form.notes,
    };
    saveNotes([newNote, ...notes]);
    setTab("report");
    setMsg("✅ บันทึกใบส่งของแล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📦 ใบส่งของ</h1>
          <p className="page-sub">บันทึกใบส่งของ (Delivery Note)</p>
        </div>
        <div className="page-actions">
          <button className={`btn${tab === "report" ? " btn-primary" : ""}`} onClick={() => setTab("report")}>
            รายงาน <span className="count">{filtered.length}</span>
          </button>
          <button className={`btn${tab === "new" ? " btn-primary" : ""}`} onClick={() => setTab("new")}>
            ➕ เพิ่มใหม่
          </button>
        </div>
      </div>

      {msg && <div className={`alert ${msg.includes("✅") ? "success" : ""}`}>{msg}</div>}

      {tab === "report" && (
        <div className="card">
          <div className="card-head" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 className="card-title" style={{ flex: 1 }}>ทั้งหมด</h3>
            <input type="text" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่ใบส่ง</th>
                  <th>วันที่</th>
                  <th>ลูกค้า</th>
                  <th className="num">จำนวนรายการ</th>
                  <th style={{ width: 100 }}>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>ไม่มีรายการ</td></tr>
                ) : filtered.map((note, idx) => (
                  <tr key={idx}>
                    <td><span className="code">{note.noteNo}</span></td>
                    <td>{note.date}</td>
                    <td>{note.customerName}</td>
                    <td className="num">{note.items?.length || 0}</td>
                    <td style={{ display: "flex", gap: 5 }}>
                      <button className="btn btn-sm" onClick={() => alert("ปริ้น: " + note.noteNo)} title="ปริ้น">🖨️</button>
                      <button className="btn btn-sm" style={{ color: "var(--brand)" }} onClick={() => { setNotes(notes.filter((_, i) => i !== idx)); }} title="ลบ">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "new" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">➕ เพิ่มใบส่งของ</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div><label className="small muted">วันที่</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="small muted">เลขที่ใบส่ง</label><input type="text" placeholder="DN000001" value={form.noteNo} onChange={e => setForm({ ...form, noteNo: e.target.value })} /></div>
              <div><label className="small muted">ชื่อลูกค้า</label><input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
            </div>

            <div><label className="small muted">ที่อยู่ส่งของ</label><textarea value={form.customerAddress} onChange={e => setForm({ ...form, customerAddress: e.target.value })} style={{ minHeight: 60 }} /></div>

            <div style={{ overflowX: "auto" }}>
              <table className="tbl" style={{ fontSize: 12 }}>
                <thead><tr><th style={{ width: 40 }}>ลำดับ</th><th>รายการ</th><th style={{ width: 60 }}>จำนวน</th><th style={{ width: 80 }}>หน่วย</th><th style={{ width: 40 }}></th></tr></thead>
                <tbody>
                  {formItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td><input type="text" placeholder="รายการ" value={item.description} onChange={e => onUpdateItem(item.id, "description", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }} /></td>
                      <td><input type="number" step="0.01" value={item.qty} onChange={e => onUpdateItem(item.id, "qty", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, textAlign: "right" }} /></td>
                      <td><input type="text" placeholder="ชิ้น" value={item.unit} onChange={e => onUpdateItem(item.id, "unit", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }} /></td>
                      <td><button className="btn btn-sm" onClick={() => onRemoveItem(item.id)} style={{ color: "var(--brand)" }}>ลบ</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={onAddItem} className="btn" style={{ alignSelf: "flex-start" }}>+ เพิ่มรายการ</button>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={onSaveNote} style={{ flex: 1 }}>💾 บันทึก</button>
              <button className="btn" onClick={() => setTab("report")}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenDeliveryNote });
