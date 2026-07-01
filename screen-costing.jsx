// 💵 บิลเงินสด — บันทึกเพิ่มการจ่ายเงินสด
const ScreenCashBill = () => {
  const [bills, setBills] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState("report");
  const [form, setForm] = React.useState({
    docNumber: "", date: new Date().toISOString().split("T")[0],
    customerName: "", customerTax: "", items: [], discount: 0, vat: 7, notes: "",
  });
  const [formItems, setFormItems] = React.useState([]);
  const [nextItemId, setNextItemId] = React.useState(0);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    try {
      const s = localStorage.getItem('erp_cash_bills');
      if (s) setBills(JSON.parse(s));
    } catch(e) {}
  }, []);

  const saveBills = (next) => {
    setBills(next);
    try { localStorage.setItem('erp_cash_bills', JSON.stringify(next)); } catch(e) {}
  };

  const filtered = search.trim()
    ? bills.filter(b => 
        (b.docNumber || "").toLowerCase().includes(search.toLowerCase())
        || (b.customerName || "").toLowerCase().includes(search.toLowerCase())
      )
    : bills;

  const fmtNum = n => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const fmtCurrency = n => `฿${fmtNum(n)}`;

  const onAddItem = () => {
    setFormItems([...formItems, { id: nextItemId, description: "", qty: 1, unit: "", price: 0, total: 0 }]);
    setNextItemId(nextItemId + 1);
  };

  const onRemoveItem = (id) => {
    setFormItems(formItems.filter(i => i.id !== id));
  };

  const onUpdateItem = (id, field, value) => {
    const updated = formItems.map(i => {
      if (i.id !== id) return i;
      const newItem = { ...i, [field]: value };
      if (field === "qty" || field === "price") {
        const qty = parseFloat(newItem.qty) || 0;
        const price = parseFloat(newItem.price) || 0;
        newItem.total = (qty * price).toFixed(2);
      }
      return newItem;
    });
    setFormItems(updated);
  };

  const calcFormTotals = () => {
    const subtotal = formItems.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    const discountAmt = subtotal * (form.discount / 100);
    const afterDiscount = subtotal - discountAmt;
    const vatAmt = afterDiscount * (form.vat / 100);
    const grandTotal = afterDiscount + vatAmt;
    return { subtotal, discountAmt, afterDiscount, vatAmt, grandTotal };
  };

  const onSaveBill = () => {
    if (!form.date || !form.customerName || !form.docNumber || !formItems.some(i => i.description)) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    const totals = calcFormTotals();
    const newBill = {
      docNumber: form.docNumber,
      date: form.date,
      customerName: form.customerName,
      customerTax: form.customerTax,
      items: formItems,
      subtotal: totals.subtotal,
      discount: form.discount,
      vat: form.vat,
      total: totals.grandTotal,
      notes: form.notes,
    };
    saveBills([newBill, ...bills]);
    setTab("report");
    setMsg("✅ บันทึกบิลแล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  const totals = calcFormTotals();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">💵 บิลเงินสด</h1>
          <p className="page-sub">บันทึกการจ่ายเงินสดทั่วไป</p>
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
                  <th>เลขที่บิล</th>
                  <th>วันที่</th>
                  <th>ลูกค้า</th>
                  <th className="num">จำนวนรายการ</th>
                  <th className="num">รวมสุทธิ</th>
                  <th style={{ width: 100 }}>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>ไม่มีรายการ</td></tr>
                ) : filtered.map((bill, idx) => (
                  <tr key={idx}>
                    <td><span className="code">{bill.docNumber}</span></td>
                    <td>{bill.date}</td>
                    <td>{bill.customerName}</td>
                    <td className="num">{bill.items?.length || 0}</td>
                    <td className="num tnum">{fmtCurrency(bill.total)}</td>
                    <td style={{ display: "flex", gap: 5 }}>
                      <button className="btn btn-sm" onClick={() => alert("คัดลอก: " + bill.docNumber)} title="สำเนา">📋</button>
                      <button className="btn btn-sm" style={{ color: "var(--brand)" }} onClick={() => { setBills(bills.filter((_, i) => i !== idx)); }} title="ลบ">🗑️</button>
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
            <h3 className="card-title">➕ เพิ่มบิลเงินสด</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div><label className="small muted">วันที่</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="small muted">เลขที่บิล</label><input type="text" placeholder="CB000001" value={form.docNumber} onChange={e => setForm({ ...form, docNumber: e.target.value })} /></div>
              <div><label className="small muted">ชื่อลูกค้า</label><input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="tbl" style={{ fontSize: 12 }}>
                <thead><tr><th style={{ width: 40 }}>ลำดับ</th><th>รายการ</th><th style={{ width: 60 }}>จำนวน</th><th style={{ width: 60 }}>หน่วย</th><th style={{ width: 80 }}>ราคา</th><th style={{ width: 80 }}>รวม</th><th style={{ width: 40 }}></th></tr></thead>
                <tbody>
                  {formItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td><input type="text" placeholder="รายการ" value={item.description} onChange={e => onUpdateItem(item.id, "description", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }} /></td>
                      <td><input type="number" step="0.01" value={item.qty} onChange={e => onUpdateItem(item.id, "qty", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, textAlign: "right" }} /></td>
                      <td><input type="text" placeholder="ชิ้น" value={item.unit} onChange={e => onUpdateItem(item.id, "unit", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }} /></td>
                      <td><input type="number" step="0.01" value={item.price} onChange={e => onUpdateItem(item.id, "price", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, textAlign: "right" }} /></td>
                      <td style={{ textAlign: "right", fontWeight: 600, fontSize: 11, padding: "4px 8px" }}>฿{fmtNum(item.total)}</td>
                      <td><button className="btn btn-sm" onClick={() => onRemoveItem(item.id)} style={{ color: "var(--brand)" }}>ลบ</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={onAddItem} className="btn" style={{ alignSelf: "flex-start" }}>+ เพิ่มรายการ</button>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
                <div className="small muted">รวมรวม</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>฿{fmtNum(totals.subtotal)}</div>
              </div></div>
              <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
                <div className="small muted">VAT {form.vat}%</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>฿{fmtNum(totals.vatAmt)}</div>
              </div></div>
              <div className="card" style={{ border: "2px solid var(--brand)" }}><div className="card-body" style={{ textAlign: "center" }}>
                <div className="small" style={{ color: "var(--brand)", fontWeight: 600 }}>รวมสุทธิ</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>฿{fmtNum(totals.grandTotal)}</div>
              </div></div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={onSaveBill} style={{ flex: 1 }}>💾 บันทึก</button>
              <button className="btn" onClick={() => setTab("report")}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenCashBill });
