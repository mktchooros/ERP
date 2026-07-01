// 📥 รายการใบรับเข้า — ดู/ปริ้น · แก้ไข · ลบ (รายแถว)
const GR_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const grFmtDate = (d) => window.fmtDateGlobal(d);
const grSubtotal = (r) => {
  // FM-WH-01 format
  if (r.totalAmount != null) return parseFloat(r.totalAmount) || 0;
  // legacy format
  return (r.items || []).reduce((s, it) => s + ((+it.qty||0) * (+it.price||0)), 0);
};
const grDocNo  = (r) => r.docNo  || r.receiptNo  || "—";
const grSupplier = (r) => r.supplier || r.supplierName || "—";

const ScreenGoodsReceiptList = ({ setCurrent }) => {
  const [receipts, setReceipts] = React.useState([]);
  const [editing, setEditing] = React.useState(null); // {idx, data}

  React.useEffect(() => {
    try { setReceipts(JSON.parse(localStorage.getItem("goods_receipts_list") || "[]")); } catch (e) { setReceipts([]); }
  }, []);

  const persist = (list) => { try { localStorage.setItem("goods_receipts_list", JSON.stringify(list)); } catch (e) {} setReceipts(list); };

  const handleDelete = (idx) => {
    const r = receipts[idx];
    if (!confirm(`ลบใบรับเข้า ${r?.docNo || r?.receiptNo || ""}?`)) return;
    // ลบจาก erp_purchases ด้วย (สต็อคการ์ดอ่านจากตรงนี้)
    const docNo = r?.docNo || r?.receiptNo;
    if (docNo) {
      try {
        let purchases = JSON.parse(localStorage.getItem("erp_purchases") || "[]");
        purchases = purchases.filter(p => p._grDocNo !== docNo);
        localStorage.setItem("erp_purchases", JSON.stringify(purchases));
        window.dataCache?.invalidate?.("stockcard");
      } catch (e) {}
    }
    persist(receipts.filter((_, i) => i !== idx));
  };

  const handlePrint = (r) => {
    if (typeof printFMWH01 === "function") { printFMWH01(r); return; }
    const rowsHtml = (r.items || []).map((it, i) => `<tr>
      <td style="text-align:center">${i+1}</td>
      <td>${it.code ? `<b>${it.code}</b> · ` : ""}${it.name || ""}</td>
      <td style="text-align:right">${(+it.qty||0).toLocaleString()}</td>
      <td>${it.unit || ""}</td>
      <td style="text-align:right">${(+it.price||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
      <td style="text-align:right">${((+it.qty||0)*(+it.price||0)).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
      <td style="text-align:center">${it.expireDate ? grFmtDate(it.expireDate) : "—"}</td>
    </tr>`).join("");
    const total = grSubtotal(r);
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ใบรับเข้า ${r.receiptNo||""}</title>
    <style>
      *{box-sizing:border-box;} body{font-family:"IBM Plex Sans Thai","Sarabun",sans-serif;color:#221A14;padding:32px;max-width:780px;margin:0 auto;}
      h1{font-size:22px;margin:0 0 2px;} .sub{color:#7A6D5E;font-size:13px;margin-bottom:18px;}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:13px;margin-bottom:18px;padding:14px 16px;background:#FBF7EE;border:1px solid #E4DBC8;border-radius:10px;}
      .meta b{color:#4A3E33;} table{width:100%;border-collapse:collapse;font-size:13px;}
      th{background:#B6241F;color:#fff;padding:8px;text-align:left;font-weight:600;} td{padding:7px 8px;border-bottom:1px solid #EFE8DA;}
      tfoot td{font-weight:700;border-top:2px solid #CFC2A8;background:#FBF7EE;}
      .bar{margin-top:24px;text-align:center;} .bar button{padding:9px 26px;background:#B6241F;color:#fff;border:none;border-radius:7px;font-size:14px;cursor:pointer;font-family:inherit;}
      @media print{.no-print{display:none;}}
    </style></head><body>
      <h1>ใบรับเข้าสินค้า / วัตถุดิบ</h1>
      <div class="sub">Goods Receipt · ${r.receiptNo || "—"}</div>
      <div class="meta">
        <div><b>เลขที่:</b> ${r.receiptNo || "—"}</div><div><b>วันที่รับ:</b> ${grFmtDate(r.receiptDate)}</div>
        <div><b>ผู้ขาย:</b> ${r.supplierName || "—"}</div><div><b>โทร:</b> ${r.supplierPhone || "—"}</div>
        <div><b>เลขที่ PO:</b> ${r.poNumber || "—"}</div><div><b>Invoice:</b> ${r.invoiceNo || "—"}</div>
        ${r.supplierAddress ? `<div style="grid-column:1/3"><b>ที่อยู่:</b> ${r.supplierAddress}</div>` : ""}
      </div>
      <table>
        <thead><tr><th style="width:6%">#</th><th>รายการ</th><th style="text-align:right;width:10%">จำนวน</th><th style="width:9%">หน่วย</th><th style="text-align:right;width:13%">ราคา/หน่วย</th><th style="text-align:right;width:14%">รวม</th><th style="text-align:center;width:13%">หมดอายุ</th></tr></thead>
        <tbody>${rowsHtml || `<tr><td colspan="7" style="text-align:center;color:#7A6D5E;padding:18px">ไม่มีรายการ</td></tr>`}</tbody>
        <tfoot><tr><td colspan="5" style="text-align:right">รวมทั้งสิ้น</td><td style="text-align:right">฿${total.toLocaleString(undefined,{minimumFractionDigits:2})}</td><td></td></tr></tfoot>
      </table>
      ${r.notes ? `<p style="font-size:12.5px;color:#7A6D5E;margin-top:14px"><b>หมายเหตุ:</b> ${r.notes}</p>` : ""}
      <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
    </body></html>`;
    const win = window.open("", "", "width=860,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์"); return; }
    win.document.write(html); win.document.close();
  };

  const openEdit = (idx) => setEditing({ idx, data: JSON.parse(JSON.stringify(receipts[idx])) });
  const setField = (k, v) => setEditing(e => ({ ...e, data: { ...e.data, [k]: v } }));
  const setItm = (i, k, v) => setEditing(e => { const items = (e.data.items||[]).map((it, j) => j === i ? { ...it, [k]: v } : it); return { ...e, data: { ...e.data, items } }; });
  const removeItm = (i) => setEditing(e => ({ ...e, data: { ...e.data, items: (e.data.items||[]).filter((_, j) => j !== i) } }));
  const saveEdit = () => { const list = [...receipts]; list[editing.idx] = editing.data; persist(list); setEditing(null); };

  const inp = { border: "1px solid var(--border)", padding: "6px 8px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", width: "100%" };
  const sorted = receipts.map((r, i) => ({ r, i })).reverse();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📥 รายการใบรับเข้า</h1>
          <p className="page-sub">บันทึกการรับเข้าสินค้า · ดู/ปริ้น · แก้ไข · ลบ ได้ทุกใบ</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCurrent("goods-receipt")}>+ ใบรับเข้าใหม่</button>
      </div>

      {receipts.length === 0 ? (
        <div className="alert" style={{ marginBottom: 16 }}>ยังไม่มีใบรับเข้า</div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่ใบรับเข้า</th><th>วันที่</th><th>ซัพพลายเยอร์</th><th>Invoice</th>
                <th style={{ textAlign: "right" }}>รวม</th><th style={{ textAlign: "right", width: 140 }}>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ r, i }) => (
                <tr key={i}>
                  <td><strong>{grDocNo(r)}</strong></td>
                  <td className="small muted">{grFmtDate(r.receiptDate)}</td>
                  <td>{grSupplier(r)}</td>
                  <td className="small muted">{r.invoiceNo || r.poNumber || "—"}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{grSubtotal(r).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-sm" title="ปริ้น / ดู" onClick={() => handlePrint(r)} style={{ marginRight: 4 }}>🖨</button>
                    <button className="btn btn-sm" title="แก้ไข" onClick={() => openEdit(i)} style={{ marginRight: 4 }}>✎</button>
                    <button className="btn btn-sm" title="ลบ" onClick={() => handleDelete(i)} style={{ color: "#ef4444" }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(34,26,20,.45)", display: "grid", placeItems: "center", zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: "min(720px, 96vw)", maxHeight: "90vh", overflow: "auto", background: "var(--surface)" }}>
            <div className="card-head" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 className="card-title" style={{ flex: 1 }}>✎ แก้ไขใบรับเข้า {grDocNo(editing.data)}</h3>
              <button className="btn btn-sm" onClick={() => setEditing(null)}>✕ ปิด</button>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label className="label small muted">เลขที่ใบรับเข้า</label><input style={inp} value={grDocNo(editing.data)} onChange={e => setField(editing.data.docNo != null ? "docNo" : "receiptNo", e.target.value)} /></div>
                <div><label className="label small muted">วันที่รับ</label><input type="date" style={inp} value={editing.data.receiptDate || ""} onChange={e => setField("receiptDate", e.target.value)} /></div>
                <div><label className="label small muted">ผู้ส่งมอบ</label><input style={inp} value={grSupplier(editing.data)} onChange={e => setField(editing.data.supplier != null ? "supplier" : "supplierName", e.target.value)} /></div>
                <div><label className="label small muted">Invoice / PO</label><input style={inp} value={editing.data.invoiceNo || editing.data.poNumber || ""} onChange={e => setField("invoiceNo", e.target.value)} /></div>
              </div>
              <div>
                <label className="label small muted" style={{ marginBottom: 6, display: "block" }}>รายการสินค้า</label>
                <table className="tbl" style={{ fontSize: 12.5 }}>
                  <thead><tr><th>รายการ</th><th style={{ width: 70 }}>จำนวน</th><th style={{ width: 70 }}>หน่วย</th><th style={{ width: 90 }}>ราคา</th><th style={{ width: 130 }}>หมดอายุ</th><th style={{ width: 30 }}></th></tr></thead>
                  <tbody>
                    {(editing.data.items || []).map((it, i) => (
                      <tr key={i}>
                        <td><input style={{ ...inp, fontSize: 12.5 }} value={it.rawName || it.name || ""} onChange={e => setItm(i, it.rawName != null ? "rawName" : "name", e.target.value)} /></td>
                        <td><input type="number" style={{ ...inp, fontSize: 12.5 }} value={it.qty || 0} onChange={e => setItm(i, "qty", parseFloat(e.target.value) || 0)} /></td>
                        <td><input style={{ ...inp, fontSize: 12.5 }} value={it.unit || ""} onChange={e => setItm(i, "unit", e.target.value)} /></td>
                        <td><input type="number" style={{ ...inp, fontSize: 12.5 }} value={it.price || it.cost || 0} onChange={e => setItm(i, "price", parseFloat(e.target.value) || 0)} /></td>
                        <td><input type="date" style={{ ...inp, fontSize: 12.5 }} value={it.expDate || it.expireDate || ""} onChange={e => setItm(i, it.expDate != null ? "expDate" : "expireDate", e.target.value)} /></td>
                        <td style={{ textAlign: "center" }}><button className="btn btn-sm" title="ลบรายการ" onClick={() => removeItm(i)} style={{ color: "#ef4444" }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="btn" onClick={() => setEditing(null)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={saveEdit}>บันทึกการแก้ไข</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenGoodsReceiptList });
