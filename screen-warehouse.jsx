// 📄 ใบกำกับภาษี — บันทึกใบกำกับภาษี (Tax Invoice)
const ScreenTaxInvoice = () => {
  const [invoices, setInvoices] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState("report");
  const [form, setForm] = React.useState({
    invoiceNo: "", date: new Date().toISOString().split("T")[0],
    customerName: "", customerTax: "", address: "", items: [], discount: 0, vat: 7, notes: "",
  });
  const [formItems, setFormItems] = React.useState([]);
  const [nextItemId, setNextItemId] = React.useState(0);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    try {
      const s = localStorage.getItem('erp_tax_invoices');
      if (s) setInvoices(JSON.parse(s));
    } catch(e) {}
  }, []);

  // รับข้อมูลที่ส่งมาจากใบสั่งขาย → เติมฟอร์มออกใบกำกับภาษีอัตโนมัติ
  React.useEffect(() => {
    let pre = window.__taxInvoicePrefill;
    if (!pre) {
      try { const s = sessionStorage.getItem("tax_invoice_prefill"); if (s) pre = JSON.parse(s); } catch(e) {}
    }
    if (!pre) return;
    window.__taxInvoicePrefill = null;
    try { sessionStorage.removeItem("tax_invoice_prefill"); } catch(e) {}

    // เลขที่ใบกำกับภาษีอัตโนมัติ INV + YYMM + ลำดับ
    const d = (pre.date || new Date().toISOString().split("T")[0]).replace(/-/g, "");
    const ym = d.slice(2, 6);
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem("erp_tax_invoices") || "[]"); } catch(e) {}
    const re = new RegExp(`^INV${ym}(\\d{4})$`);
    let max = 0;
    existing.forEach(iv => { const m = (iv.invoiceNo || "").match(re); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    const invoiceNo = `INV${ym}${String(max + 1).padStart(4, "0")}`;

    const items = (pre.items || []).map((it, i) => ({ id: i, description: it.description || "", qty: it.qty != null ? it.qty : 1, unit: it.unit || "", price: it.price != null ? it.price : 0, total: it.total != null ? it.total : ((parseFloat(it.qty)||0)*(parseFloat(it.price)||0)).toFixed(2) }));
    setForm({
      invoiceNo,
      date: pre.date || new Date().toISOString().split("T")[0],
      customerName: pre.customerName || "",
      customerTax: pre.customerTax || "",
      address: pre.address || "",
      items: [],
      discount: pre.discount || 0,
      vat: pre.vat != null ? pre.vat : 7,
      notes: pre.notes || "",
    });
    setFormItems(items);
    setNextItemId(items.length);
    setTab("new");
    setMsg("✅ ดึงข้อมูลจากใบสั่งขายแล้ว — ตรวจสอบและกดบันทึก");
    setTimeout(() => setMsg(""), 3500);
  }, []);

  const saveInvoices = (next) => {
    setInvoices(next);
    try { localStorage.setItem('erp_tax_invoices', JSON.stringify(next)); } catch(e) {}
  };

  const filtered = search.trim()
    ? invoices.filter(i => 
        (i.invoiceNo || "").toLowerCase().includes(search.toLowerCase())
        || (i.customerName || "").toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

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

  const onSaveInvoice = () => {
    if (!form.date || !form.customerName || !form.invoiceNo || !formItems.some(i => i.description)) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    const totals = calcFormTotals();
    const newInvoice = {
      invoiceNo: form.invoiceNo,
      date: form.date,
      customerName: form.customerName,
      customerTax: form.customerTax,
      address: form.address,
      items: formItems,
      subtotal: totals.subtotal,
      discount: form.discount,
      vat: form.vat,
      total: totals.grandTotal,
      notes: form.notes,
    };
    saveInvoices([newInvoice, ...invoices]);
    setTab("report");
    setMsg("✅ บันทึกใบกำกับภาษีแล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  const totals = calcFormTotals();

  // ปริ้นใบเสร็จรับเงิน/ใบกำกับภาษี — ใช้ฟอร์มเดียวกับใบสั่งขาย (PROSOFT A4)
  const printInvoice = (inv) => {
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const baht = (v) => (parseFloat(v) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d) => window.fmtDateGlobal(d);
    const logoUrl = (() => { try { return new URL('logo-yaipu.png', window.location.href).href; } catch (e) { return 'logo-yaipu.png'; } })();

    const items = Array.isArray(inv.items) ? inv.items : [];
    const subtotal = inv.subtotal != null ? inv.subtotal : items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    const discPct = inv.discount || 0;
    const discAmt = subtotal * discPct / 100;
    const afterDisc = subtotal - discAmt;
    const taxPct = inv.vat != null ? inv.vat : 0;
    const taxAmt = afterDisc * taxPct / 100;
    const grand = inv.total != null ? inv.total : afterDisc + taxAmt;

    const bahtText = (num) => {
      num = parseFloat(num) || 0;
      const tn = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
      const tp = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
      const readBlock = (n) => { let s2 = ''; const dg = String(n).split(''); const len = dg.length; for (let i = 0; i < len; i++) { const d = parseInt(dg[i]); const pos = len - i - 1; if (d === 0) continue; if (pos === 0 && d === 1 && len > 1) s2 += 'เอ็ด'; else if (pos === 1 && d === 2) s2 += 'ยี่' + tp[pos]; else if (pos === 1 && d === 1) s2 += tp[pos]; else s2 += tn[d] + tp[pos]; } return s2; };
      const readNumber = (n) => { if (n === 0) return 'ศูนย์'; if (String(n).length > 6) { const m = Math.floor(n / 1000000); const r = n % 1000000; return readNumber(m) + 'ล้าน' + (r > 0 ? readBlock(r) : ''); } return readBlock(n); };
      const b = Math.floor(num); const st = Math.round((num - b) * 100);
      let txt = readNumber(b) + 'บาท'; txt += st > 0 ? readBlock(st) + 'สตางค์' : 'ถ้วน'; return txt;
    };
    const blankRows = Math.max(0, 8 - items.length);

    const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8"><title>ใบเสร็จรับเงิน/ใบกำกับภาษี ${esc(inv.invoiceNo)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 24px; color: #000; font-size: 12px; line-height: 1.45; background: #e8e8e8; }
  .doc { width: 800px; min-height: 1080px; margin: 0 auto; background: #fff; padding: 30px 34px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.2); }
  .wm { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; }
  .wm img { width: 440px; opacity: .06; }
  .layer { position: relative; z-index: 1; }
  .pageno { text-align: right; font-size: 11px; margin-bottom: 4px; }
  .chead { display: grid; grid-template-columns: 90px 1fr; gap: 12px; margin-bottom: 14px; }
  .chead .logo { display: flex; align-items: flex-start; justify-content: center; }
  .chead .logo img { width: 84px; height: 84px; object-fit: contain; }
  .chead .ctr { text-align: center; }
  .cname { font-size: 22px; font-weight: 700; }
  .caddr { font-size: 12px; margin-top: 4px; }
  .titlerow { display: grid; grid-template-columns: 1fr 260px; gap: 12px; align-items: center; margin-bottom: 8px; }
  .titlerow .t { text-align: center; font-size: 18px; font-weight: 700; }
  .titlerow .t .en { font-size: 11px; color: #555; font-weight: 400; margin-top: 2px; }
  table { border-collapse: collapse; }
  .nbox { width: 100%; font-size: 12px; }
  .nbox td { border: 1px solid #000; padding: 4px 8px; }
  .nbox td.k { background: #f0f0f0; width: 70px; }
  .cust { width: 100%; font-size: 12px; border: 1px solid #000; margin-bottom: 10px; }
  .cust td { padding: 3px 6px; vertical-align: top; }
  .cust td.sep { border-left: 1px solid #000; }
  .items { width: 100%; font-size: 12px; }
  .items th { background: #f0f0f0; border: 1px solid #000; padding: 5px 6px; }
  .items td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
  .items td.r, .items th.r { text-align: right; }
  .items td.c, .items th.c { text-align: center; }
  .sum { width: 100%; font-size: 12px; margin-top: -1px; }
  .sum td { border: 1px solid #000; padding: 4px 8px; }
  .sum td.k { width: 130px; }
  .sum td.r { text-align: right; }
  .sum tr.grand td { font-weight: 700; background: #f0f0f0; }
  .bahtline { border: 1px solid #000; border-top: none; padding: 5px 8px; text-align: center; font-size: 12px; }
  .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 50px; }
  .sign div { text-align: center; }
  .sign .line { border-bottom: 1px dotted #000; height: 50px; margin-bottom: 4px; }
  .sign .role { font-size: 11px; }
  .sign .date { font-size: 11px; margin-top: 6px; }
  .bar { text-align: center; margin: 22px 0 0; }
  .bar button { font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 26px; border-radius: 8px; border: none; cursor: pointer; background: #B6241F; color: #fff; }
  .doc + .doc { margin-top: 24px; }
  @media print {
    body { background: #fff; padding: 0; }
    .doc { width: 100%; min-height: auto; box-shadow: none; padding: 14mm 12mm; page-break-after: always; }
    .doc:last-of-type { page-break-after: auto; }
    .doc + .doc { margin-top: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }
</style></head><body>
${["ต้นฉบับ (Original)", "สำเนา (Copy)"].map((copyLabel) => `<div class="doc">
  <div class="wm"><img src="${logoUrl}" alt=""></div>
  <div class="layer">
    <div class="pageno">${copyLabel} · หน้า 1 / 1</div>
    <div class="chead">
      <div class="logo"><img src="${logoUrl}" alt="ชูรสยายปู"></div>
      <div class="ctr">
        <div class="cname">บริษัท ชูรสยายปู จำกัด</div>
        <div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div>
        <div class="caddr">เลขประจำตัวผู้เสียภาษี 0495567000363</div>
      </div>
    </div>

    <div class="titlerow">
      <div class="t">ใบเสร็จรับเงิน / ใบกำกับภาษี<div class="en">Receipt / Tax Invoice (${copyLabel})</div></div>
      <table class="nbox"><tbody>
        <tr><td class="k">เลขที่</td><td>${esc(inv.invoiceNo)}</td></tr>
        <tr><td class="k">วันที่</td><td>${fmtDate(inv.date)}</td></tr>
      </tbody></table>
    </div>

    <table class="cust"><tbody>
      <tr>
        <td style="width:70px">ชื่อลูกค้า</td><td style="font-weight:600" colspan="3">${esc(inv.customerName) || '—'}</td>
        <td style="width:60px">VAT</td><td>${taxPct}%</td>
      </tr>
      <tr>
        <td>ที่อยู่</td><td colspan="5">${esc(inv.address) || '—'}</td>
      </tr>
      <tr>
        <td>เลขผู้เสียภาษี</td><td colspan="5">${esc(inv.customerTax) || '—'}</td>
      </tr>
    </tbody></table>

    <table class="items">
      <thead><tr>
        <th class="c" style="width:40px">ลำดับ</th>
        <th>รายการ</th>
        <th class="r" style="width:70px">จำนวน</th>
        <th class="c" style="width:55px">หน่วย</th>
        <th class="r" style="width:90px">ราคา/หน่วย</th>
        <th class="r" style="width:100px">จำนวนเงิน</th>
      </tr></thead>
      <tbody>
        ${items.map((it, i) => `<tr>
          <td class="c">${i + 1}</td>
          <td>${esc(it.description || it.name)}</td>
          <td class="r">${baht(it.qty)}</td>
          <td class="c">${esc(it.unit) || '—'}</td>
          <td class="r">${baht(it.price)}</td>
          <td class="r">${baht(it.total != null ? it.total : (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0))}</td>
        </tr>`).join('')}
        ${Array.from({ length: blankRows }).map(() => `<tr style="height:26px"><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
      </tbody>
    </table>

    <table class="sum"><tbody>
      <tr>
        <td rowspan="4" style="width:55%;vertical-align:top"><strong>หมายเหตุ</strong><div>${esc(inv.notes) || ''}</div></td>
        <td class="k">รวมเงิน</td><td class="r">${baht(subtotal)}</td>
      </tr>
      <tr><td class="k">ส่วนลดการค้า ${discPct}%</td><td class="r">${baht(discAmt)}</td></tr>
      <tr><td class="k">ภาษีมูลค่าเพิ่ม ${taxPct}%</td><td class="r">${baht(taxAmt)}</td></tr>
      <tr class="grand"><td class="k">จำนวนเงินทั้งสิ้น</td><td class="r">${baht(grand)}</td></tr>
    </tbody></table>
    <div class="bahtline">( ${bahtText(grand)} )</div>

    <div class="sign">
      <div><div class="line"></div><div class="role">ผู้รับเงิน</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">ผู้รับสินค้า</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">ผู้มีอำนาจลงนาม</div><div class="date">วันที่ ______/______/______</div></div>
    </div>
  </div>
</div>`).join('')}
<div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ (ต้นฉบับ + สำเนา)</button></div>
</body></html>`;

    const win = window.open('', '', 'width=900,height=900');
    if (!win) { setMsg("⚠️ เบราว์เซอร์บล็อกป๊อปอัพ — โปรดอนุญาตเพื่อพิมพ์"); setTimeout(() => setMsg(""), 3000); return; }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📄 ใบกำกับภาษี</h1>
          <p className="page-sub">บันทึกใบกำกับภาษีอากร (Tax Invoice)</p>
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
                  <th>เลขที่ใบกำกับภาษี</th>
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
                ) : filtered.map((inv, idx) => (
                  <tr key={idx}>
                    <td><span className="code">{inv.invoiceNo}</span></td>
                    <td>{inv.date}</td>
                    <td>{inv.customerName}</td>
                    <td className="num">{inv.items?.length || 0}</td>
                    <td className="num tnum">{fmtCurrency(inv.total)}</td>
                    <td style={{ display: "flex", gap: 5 }}>
                      <button className="btn btn-sm" style={{ color: "var(--brand)" }} onClick={() => printInvoice(inv)} title="พิมพ์ใบกำกับภาษี">🖨️</button>
                      <button className="btn btn-sm" onClick={() => alert("สำเนา: " + inv.invoiceNo)} title="สำเนา">📋</button>
                      <button className="btn btn-sm" style={{ color: "var(--brand)" }} onClick={() => { setInvoices(invoices.filter((_, i) => i !== idx)); }} title="ลบ">🗑️</button>
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
            <h3 className="card-title">➕ เพิ่มใบกำกับภาษี</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div><label className="small muted">วันที่</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="small muted">เลขที่ใบกำกับภาษี</label><input type="text" placeholder="INV000001" value={form.invoiceNo} onChange={e => setForm({ ...form, invoiceNo: e.target.value })} /></div>
              <div><label className="small muted">ชื่อลูกค้า</label><input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              <div><label className="small muted">เลขประจำตัวผู้เสียภาษี</label><input type="text" value={form.customerTax} onChange={e => setForm({ ...form, customerTax: e.target.value })} /></div>
              <div><label className="small muted">ที่อยู่</label><input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
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
              <button className="btn btn-primary" onClick={onSaveInvoice} style={{ flex: 1 }}>💾 บันทึก</button>
              <button className="btn" onClick={() => setTab("report")}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenTaxInvoice });
