// 📋 ใบสั่งซื้อ — รายงาน + บันทึก + พิมพ์ + เลือกสินค้าแบบ Dropdown
// ดึงจาก CSV ที่อัปโหลด และให้สามารถเพิ่ม/แก้ไข/ลบรายการได้

const ScreenPO = () => {
  const MENU_LIST = (typeof loadMenuLive === "function") ? loadMenuLive() : (typeof MENU !== "undefined" ? MENU : []);
  const [poData, setPoData] = React.useState([]);
  const [editIdx, setEditIdx] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState("report"); // "report" | "new"
  const [form, setForm] = React.useState({
    docNumber: "",
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    supplierTax: "",
    items: [],
    discount: 0,
    vat: 7,
    notes: "",
  });
  const [formItems, setFormItems] = React.useState([]);
  const [nextItemId, setNextItemId] = React.useState(0);
  const [openProductSearch, setOpenProductSearch] = React.useState(null); // id ของ item ที่กำลังค้นหาสินค้า
  const [productSearch, setProductSearch] = React.useState("");

  // Load PO from localStorage
  React.useEffect(() => {
    try {
      const s = localStorage.getItem('erp_po_list');
      if (s) { setPoData(JSON.parse(s)); return; }
    } catch(e) {}
    // Seed data from CSV (truncated for demo)
    const seed = [
      { seq: 1, docNumber: "PO202605310002", date: "31/05/2026", supplier: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด(มหาชน) แม็คโครมุกดาหาร", supplierTax: "0107567000414", value: 2789.72, vat: 195.28, total: 2985.00, status: "อนุมัติ" },
      { seq: 2, docNumber: "PO202605310001", date: "31/05/2026", supplier: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด(มหาชน) แม็คโครมุกดาหาร", supplierTax: "0107567000414", value: 4864.49, vat: 340.51, total: 5205.00, status: "อนุมัติ" },
      { seq: 3, docNumber: "PO202605300002", date: "30/05/2026", supplier: "บริษัท เอ็นพี กรุ๊ป 2023 จำกัด", supplierTax: "049556000131", value: 6465.42, vat: 452.58, total: 6918.00, status: "อนุมัติ" },
      { seq: 4, docNumber: "PO202605300001", date: "30/05/2026", supplier: "บริษัท สยามโกลบอลเฮ้าส์ จำกัด (มหาชน)", supplierTax: "0107551000029", value: 1822.43, vat: 127.57, total: 1950.00, status: "อนุมัติ" },
      { seq: 5, docNumber: "PO202605280003", date: "28/05/2026", supplier: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด(มหาชน) แม็คโครมุกดาหาร", supplierTax: "0107567000414", value: 9256.07, vat: 647.93, total: 9904.00, status: "อนุมัติ" },
    ];
    setPoData(seed);
  }, []);

  const fmtNum = n => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const fmtCurrency = n => `฿${fmtNum(n)}`;

  const filtered = search.trim()
    ? poData.filter(p => 
        (p.docNumber || "").toLowerCase().includes(search.toLowerCase())
        || (p.supplier || "").toLowerCase().includes(search.toLowerCase())
      )
    : poData;

  const totalValue = filtered.reduce((s, p) => s + (p.value || 0), 0);
  const totalTax = filtered.reduce((s, p) => s + (p.vat || 0), 0);
  const totalGrand = filtered.reduce((s, p) => s + (p.total || 0), 0);

  const statusColor = (status) => {
    if (status === "อนุมัติ") return "b-done";
    if (status === "รออนุมัติ") return "b-wait";
    if (status === "ดำเนินการแล้ว") return "b-prod";
    return "b-neutral";
  };

  // ค้นหาสินค้า
  const productMatches = React.useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.trim().toLowerCase();
    return MENU_LIST.filter((m) => 
      (m.code || "").toLowerCase().includes(q) || 
      (m.name || "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [productSearch]);

  const pickProduct = (itemId, product) => {
    onUpdateItem(itemId, "code", product.code);
    onUpdateItem(itemId, "name", product.name);
    onUpdateItem(itemId, "unit", product.unit || "ซอง");
    onUpdateItem(itemId, "cost", product.price || 0);
    setOpenProductSearch(null);
    setProductSearch("");
  };

  const onAddItem = () => {
    setFormItems([...formItems, { id: nextItemId, code: "", name: "", qty: 1, unit: "", cost: "", total: "" }]);
    setNextItemId(nextItemId + 1);
  };

  const onRemoveItem = (id) => {
    setFormItems(formItems.filter(i => i.id !== id));
  };

  const onUpdateItem = (id, field, value) => {
    const updated = formItems.map(i => {
      if (i.id !== id) return i;
      const newItem = { ...i, [field]: value };
      if (field === "qty" || field === "cost") {
        const qty = parseFloat(newItem.qty) || 0;
        const cost = parseFloat(newItem.cost) || 0;
        newItem.total = (qty * cost).toFixed(2);
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

  const onSavePO = () => {
    if (!form.date || !form.supplier || !form.docNumber || !formItems.some(i => i.code)) {
      alert("กรุณากรอก วันที่, หมายเลข PO, ผู้ขาย, และเพิ่มรายการ");
      return;
    }
    const totals = calcFormTotals();
    const newPO = {
      seq: poData.length + 1,
      docNumber: form.docNumber,
      date: form.date,
      supplier: form.supplier,
      supplierTax: form.supplierTax,
      value: totals.afterDiscount,
      vat: totals.vatAmt,
      total: totals.grandTotal,
      items: formItems,
      discount: form.discount,
      notes: form.notes,
      status: "รออนุมัติ",
    };
    const updated = editIdx !== null 
      ? [...poData.slice(0, editIdx), newPO, ...poData.slice(editIdx + 1)]
      : [newPO, ...poData];
    setPoData(updated);
    try { localStorage.setItem('erp_po_list', JSON.stringify(updated)); } catch(e) {}
    setTab("report");
    resetForm();
  };

  const resetForm = () => {
    setForm({ docNumber: "", date: new Date().toISOString().split("T")[0], supplier: "", supplierTax: "", items: [], discount: 0, vat: 7, notes: "" });
    setFormItems([]);
    setEditIdx(null);
    setNextItemId(0);
    setOpenProductSearch(null);
    setProductSearch("");
  };

  const onEdit = (idx) => {
    const po = poData[idx];
    setForm({
      docNumber: po.docNumber,
      date: po.date,
      supplier: po.supplier,
      supplierTax: po.supplierTax,
      discount: po.discount || 0,
      vat: po.vat || 7,
      notes: po.notes || "",
    });
    setFormItems(po.items || []);
    setEditIdx(idx);
    setTab("new");
  };

  const onDelete = (idx) => {
    if (!confirm(`ลบ ${poData[idx].docNumber}?`)) return;
    const updated = poData.filter((_, i) => i !== idx);
    setPoData(updated);
    try { localStorage.setItem('erp_po_list', JSON.stringify(updated)); } catch(e) {}
  };

  const importPOFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const lines = text.split('\n').filter(l => l.trim());
        
        // Parse CSV: docNumber,date,supplier,supplierTax,value,vat,total,status
        const imported = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));
          if (parts.length >= 5) {
            imported.push({
              seq: poData.length + i,
              docNumber: parts[0],
              date: parts[1],
              supplier: parts[2],
              supplierTax: parts[3],
              value: parseFloat(parts[4]) || 0,
              vat: parseFloat(parts[5]) || 0,
              total: parseFloat(parts[6]) || 0,
              status: parts[7] || 'รออนุมัติ',
              items: [],
              discount: 0,
              notes: '',
            });
          }
        }
        
        const updated = [...imported, ...poData];
        setPoData(updated);
        try { localStorage.setItem('erp_po_list', JSON.stringify(updated)); } catch(e) {}
        setMsg(`✅ นำเข้า ${imported.length} รายการแล้ว`);
        setTimeout(() => setMsg(""), 2200);
      } catch(err) {
        setMsg('❌ ไฟล์ไม่ถูกต้อง');
        setTimeout(() => setMsg(""), 2200);
      }
    };
    reader.readAsText(file);
  };

  const totals = calcFormTotals();

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">📋 ใบสั่งซื้อ</h1>
        <p className="page-sub">รายงาน · บันทึกใหม่ · พิมพ์และส่งออก</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>
          รายงาน <span className="count">{filtered.length}</span>
        </button>
        <button className={`tab ${tab === "new" ? "active" : ""}`} onClick={() => { setTab("new"); resetForm(); }}>
          {editIdx !== null ? "แก้ไข" : "เพิ่มใหม่"}
        </button>
      </div>

      {/* Report tab */}
      {tab === "report" && (
        <>
          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
            <div className="card"><div className="card-body">
              <div className="kpi-label">จำนวน PO</div>
              <div className="kpi-value">{filtered.length}</div>
            </div></div>
            <div className="card"><div className="card-body">
              <div className="kpi-label">มูลค่า</div>
              <div className="kpi-value" style={{ color: "var(--brand)", fontSize: 20 }}>{fmtCurrency(totalValue)}</div>
            </div></div>
            <div className="card"><div className="card-body">
              <div className="kpi-label">ภาษี VAT</div>
              <div className="kpi-value" style={{ color: "var(--gold)", fontSize: 20 }}>{fmtCurrency(totalTax)}</div>
            </div></div>
            <div className="card" style={{ border: "2px solid var(--brand)" }}><div className="card-body">
              <div className="kpi-label" style={{ color: "var(--brand)", fontWeight: 600 }}>รวมสุทธิ</div>
              <div className="kpi-value" style={{ color: "var(--brand)", fontSize: 20 }}>{fmtCurrency(totalGrand)}</div>
            </div></div>
          </div>

          {/* Search + Table */}
          <div className="card">
            <div className="card-head" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h3 className="card-title" style={{ flex: 1 }}>ทั้งหมด</h3>
              <input
                className="form-input"
                placeholder="ค้นหา PO หรือผู้ขาย..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
              <label className="btn" style={{ cursor: 'pointer', marginBottom: 0 }}>
                📥 นำเข้า CSV
                <input type="file" accept=".csv,.xlsx" onChange={importPOFromFile} style={{ display: 'none' }} />
              </label>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>ลำดับ</th>
                    <th>เลขที่ PO</th>
                    <th>วันที่</th>
                    <th>ผู้ขาย</th>
                    <th className="num">มูลค่า</th>
                    <th className="num">ภาษี</th>
                    <th className="num">รวม</th>
                    <th style={{ width: 100 }}>สถานะ</th>
                    <th style={{ width: 100 }}>ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>ไม่มีรายการ</td></tr>
                  ) : filtered.map((po, i) => {
                    const realIdx = poData.indexOf(po);
                    return (
                      <tr key={po.docNumber} style={{ background: editIdx === realIdx ? "#fff7ed" : "" }}>
                        <td className="small muted">{po.seq || i + 1}</td>
                        <td><span className="code">{po.docNumber}</span></td>
                        <td className="small">{po.date}</td>
                        <td className="small" style={{ maxWidth: 280 }}>{po.supplier}</td>
                        <td className="num tnum">{fmtCurrency(po.value)}</td>
                        <td className="num tnum">{fmtCurrency(po.vat)}</td>
                        <td className="num tnum" style={{ fontWeight: 600 }}>{fmtCurrency(po.total)}</td>
                        <td><span className={`badge ${statusColor(po.status)}`}>{po.status}</span></td>
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
        </>
      )}

      {/* New/Edit tab */}
      {tab === "new" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{editIdx !== null ? "✎ แก้ไขใบสั่งซื้อ" : "➕ เพิ่มใบสั่งซื้อ"}</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Header Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div>
                <label className="label small muted">วันที่</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label small muted">เลขที่ PO</label>
                <input className="form-input" placeholder="PO202605310002" value={form.docNumber} onChange={e => setForm({ ...form, docNumber: e.target.value })} />
              </div>
              <div>
                <label className="label small muted">ผู้ขาย</label>
                <input className="form-input" placeholder="ชื่อบริษัท" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div>
                <label className="label small muted">เลขผู้เสียภาษี</label>
                <input className="form-input" placeholder="0107567000414" value={form.supplierTax} onChange={e => setForm({ ...form, supplierTax: e.target.value })} />
              </div>
              <div>
                <label className="label small muted">ส่วนลด (%)</label>
                <input type="number" className="form-input" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="label small muted">VAT (%)</label>
                <input type="number" className="form-input" value={form.vat} onChange={e => setForm({ ...form, vat: parseFloat(e.target.value) || 7 })} />
              </div>
            </div>

            {/* Items Table */}
            <div style={{ overflowX: "auto", marginTop: 8, position: "relative" }}>
              <table className="tbl" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>ลำดับ</th>
                    <th style={{ width: 70 }}>รหัส</th>
                    <th style={{ width: 150 }}>ชื่อรายการ</th>
                    <th style={{ width: 70 }}>จำนวน</th>
                    <th style={{ width: 60 }}>หน่วย</th>
                    <th style={{ width: 90 }}>ราคา/หน่วย</th>
                    <th style={{ width: 80 }}>รวม</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formItems.map((item, idx) => (
                    <tr key={item.id} style={{ position: "relative" }}>
                      <td style={{ textAlign: "center", fontSize: 11 }}>{idx + 1}</td>
                      <td style={{ position: "relative" }}>
                        <input type="text" placeholder="รหัส" value={item.code} onChange={e => onUpdateItem(item.id, "code", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }} />
                      </td>
                      <td style={{ position: "relative" }}>
                        <input type="text" placeholder="ค้นหา/เลือก" value={item.name} onFocus={() => { setOpenProductSearch(item.id); setProductSearch(""); }} onChange={e => { setProductSearch(e.target.value); onUpdateItem(item.id, "name", e.target.value); }} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }} />
                        {openProductSearch === item.id && (
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: 4, zIndex: 100, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                            {productMatches.length === 0 && productSearch ? (
                              <div style={{ padding: 8, fontSize: 11, color: "var(--muted)" }}>ไม่พบสินค้า</div>
                            ) : !productSearch ? (
                              MENU_LIST.slice(0, 8).map(p => (
                                <div key={p.code} onClick={() => pickProduct(item.id, p)} style={{ padding: 8, fontSize: 11, borderBottom: "1px solid #f0f0f0", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                                  <span><strong>{p.code}</strong> — {p.name}</span>
                                  <span style={{ color: "var(--muted)", fontSize: 10 }}>฿{p.price}</span>
                                </div>
                              ))
                            ) : (
                              productMatches.map(p => (
                                <div key={p.code} onClick={() => pickProduct(item.id, p)} style={{ padding: 8, fontSize: 11, borderBottom: "1px solid #f0f0f0", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                                  <span><strong>{p.code}</strong> — {p.name}</span>
                                  <span style={{ color: "var(--muted)", fontSize: 10 }}>฿{p.price}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                      <td><input type="number" step="0.01" value={item.qty} onChange={e => onUpdateItem(item.id, "qty", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, textAlign: "right" }} /></td>
                      <td><input type="text" placeholder="กิโลกรัม" value={item.unit} onChange={e => onUpdateItem(item.id, "unit", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }} /></td>
                      <td><input type="number" step="0.01" value={item.cost} onChange={e => onUpdateItem(item.id, "cost", e.target.value)} style={{ width: "100%", padding: 4, border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, textAlign: "right" }} /></td>
                      <td style={{ textAlign: "right", fontWeight: 600, fontSize: 11, padding: "4px 8px" }}>฿{fmtNum(item.total)}</td>
                      <td><button className="btn btn-sm" onClick={() => onRemoveItem(item.id)} style={{ color: "var(--brand)" }}>ลบ</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={onAddItem} className="btn" style={{ alignSelf: "flex-start" }}>+ เพิ่มรายการ</button>

            {/* Totals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 8 }}>
              <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
                <div className="small muted">รวมรวม</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>฿{fmtNum(totals.subtotal)}</div>
              </div></div>
              {form.discount > 0 && <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
                <div className="small muted">ส่วนลด {form.discount}%</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>-฿{fmtNum(totals.discountAmt)}</div>
              </div></div>}
              <div className="card"><div className="card-body" style={{ textAlign: "center" }}>
                <div className="small muted">VAT {form.vat}%</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>฿{fmtNum(totals.vatAmt)}</div>
              </div></div>
              <div className="card" style={{ border: "2px solid var(--brand)" }}><div className="card-body" style={{ textAlign: "center" }}>
                <div className="small" style={{ color: "var(--brand)", fontWeight: 600 }}>รวมสุทธิ</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>฿{fmtNum(totals.grandTotal)}</div>
              </div></div>
            </div>

            {/* Notes */}
            <div>
              <label className="label small muted">หมายเหตุ</label>
              <textarea className="form-input" placeholder="บันทึกเพิ่มเติม" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 60, fontFamily: "inherit" }} />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={onSavePO} style={{ flex: 1 }}>{editIdx !== null ? "อัปเดต" : "บันทึก"}</button>
              <button className="btn" onClick={() => { setTab("report"); resetForm(); }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenPO });
