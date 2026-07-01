// 📋 รายการขายทั้งหมด

const ScreenSalesList = ({ setCurrent }) => {
  const [sales, setSales] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "เงินสด",
      transfer: "โอนธนาคาร",
      check: "เช็ค",
      consign: "ฝากขาย",
      credit_card: "บัตรเครดิต",
      credit_3: "เครดิต 3 วัน",
      credit_5: "เครดิต 5 วัน",
      credit_7: "เครดิต 7 วัน",
      credit_10: "เครดิต 10 วัน",
      credit_15: "เครดิต 15 วัน",
      credit_30: "เครดิต 30 วัน",
      credit_45: "เครดิต 45 วัน",
      credit_60: "เครดิต 60 วัน",
      credit_90: "เครดิต 90 วัน",
      line_pay: "Line Pay",
      promptpay: "PromptPay"
    };
    return labels[method] || method;
  };

  React.useEffect(() => {
    loadSalesData();
  }, []);

  const filtered = sales.filter(s =>
    (s.date || "").includes(search) ||
    (s.id || "").includes(search) ||
    (s.customerName || "").includes(search)
  );

  const handleDelete = (id) => {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const target = sales.find(s => s.id === id);
    const updated = sales.filter(s => s.id !== id);
    setSales(updated);
    if (target && target.isOrder) {
      // ใบสั่งขาย — ลบ key ของมันเอง
      localStorage.removeItem(target.storageKey);
      return;
    }
    // บันทึกลง 'sales' (ใช้ key เดียวกับการ import) — เฉพาะรายการขายเดิม
    localStorage.setItem('sales', JSON.stringify(updated.filter(s => !s.isOrder)));
    window.dataCache?.invalidate('sales_list');
    window.dataCache?.invalidate('sales_report');
  };

  const handleDeleteAll = () => {
    if (!confirm("ต้องการลบรายการขายทั้งหมด? (ไม่สามารถย้อนกลับได้)")) return;
    setSales([]);
    localStorage.setItem('sales', JSON.stringify([]));
    window.dataCache?.invalidate('sales_list');
    window.dataCache?.invalidate('sales_report');
  };

  const loadSalesData = () => {
    try {
      let data = JSON.parse(localStorage.getItem('sales') || localStorage.getItem('erp_sales') || '[]');
      const orders = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sales_order_')) {
          try {
            const o = JSON.parse(localStorage.getItem(key));
            orders.push({
              id: o.orderNumber,
              storageKey: key,
              isOrder: true,
              date: o.orderDate,
              invoiceNumber: o.orderNumber,
              customerName: o.customerName,
              total: o.totalAmount || 0,
              salesPerson: o.salesPerson || '',
              paymentStatus: o.paymentStatus || 'unpaid',
              shippingStatus: o.shippingStatus || 'order',
              dueDate: o.dueDate || (o.paymentMethod === 'credit' && (o.deliveryDate || o.orderDate) && o.creditDays ? (() => { const d = new Date(o.deliveryDate || o.orderDate); d.setDate(d.getDate() + (parseInt(o.creditDays) || 0)); return d.toISOString().split('T')[0]; })() : ''),
            });
          } catch (e) {}
        }
      }
      orders.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
      setSales([...orders, ...data]);
    } catch(e) {}
  };

  const shipLabels = { order: 'รับออร์เดอร์', producing: 'กำลังผลิต', packing: 'กำลังแพ็ค', shipping: 'กำลังส่ง', delivered: 'ส่งสำเร็จ' };
  const shipColors = {
    order:     { bg: '#EAEAEA', fg: '#444' },
    producing: { bg: '#FBE8CF', fg: '#7A5414' },
    packing:   { bg: '#FBF1C8', fg: '#7A6414' },
    shipping:  { bg: '#D7E6F7', fg: '#1A4A7A' },
    delivered: { bg: '#E2EDDC', fg: '#2D5128' },
  };

  const printReport = () => {
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const baht = (v) => (parseFloat(v) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d) => window.fmtDateGlobal(d);
    const payStatusLabel = (st) => st === 'paid' ? 'ชำระแล้ว' : st === 'partial' ? 'ชำระบางส่วน' : 'ค้างชำระ';
    const totalSum = filtered.reduce((t, s) => t + (parseFloat(s.total) || 0), 0);
    const now = new Date();
    const printedAt = `${window.fmtDateGlobal(now.toISOString().slice(0,10))} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const logoUrl = new URL('logo-yaipu.png', window.location.href).href;
    const rows = filtered.map((s, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td>${esc(s.id || s.invoiceNumber)}</td>
      <td class="c">${fmtDate(s.date)}</td>
      <td>${esc(s.customerName) || '—'}</td>
      <td>${esc(s.salesPerson) || '—'}</td>
      <td class="c">${s.dueDate ? fmtDate(s.dueDate) : '—'}</td>
      <td class="c">${esc(shipLabels[s.shippingStatus] || shipLabels.order)}</td>
      <td class="c">${payStatusLabel(s.paymentStatus)}</td>
      <td class="r">${baht(s.total)}</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>รายงานขาย</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{font-family:'Sarabun',sans-serif;margin:0;padding:24px;color:#000;font-size:12px;background:#e8e8e8}
  .doc{width:1120px;margin:0 auto;background:#fff;padding:30px 34px;box-shadow:0 4px 20px rgba(0,0,0,.2)}
  body.portrait .doc{width:800px}
  .head{display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:14px}
  .head img{width:64px;height:64px;object-fit:contain}
  .cname{font-size:18px;font-weight:700}
  .caddr{font-size:11px;color:#444;margin-top:2px}
  .rtitle{text-align:right}
  .rtitle .t{font-size:18px;font-weight:700}
  .rtitle .m{font-size:11px;color:#444;margin-top:2px}
  table{border-collapse:collapse;width:100%;font-size:12px}
  th{background:#f0f0f0;border:1px solid #000;padding:6px 6px;text-align:left}
  td{border:1px solid #000;padding:5px 6px;vertical-align:top}
  th.c,td.c{text-align:center}
  th.r,td.r{text-align:right}
  tfoot td{font-weight:700;background:#f0f0f0}
  .bar{text-align:center;margin-top:22px;display:flex;gap:16px;justify-content:center;align-items:center;flex-wrap:wrap}
  .bar button{font-family:inherit;font-size:14px;font-weight:600;padding:10px 26px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
  .orient{display:inline-flex;border:1px solid #B6241F;border-radius:8px;overflow:hidden}
  .orient button{background:#fff;color:#B6241F;border:none;padding:10px 20px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}
  .orient button.active{background:#B6241F;color:#fff}
  @media print{body{background:#fff;padding:0}.doc{width:100%!important;box-shadow:none;padding:12mm}.no-print{display:none!important}body.portrait .doc{width:100%!important}}
</style></head><body>
<div class="doc">
  <div class="head">
    <img src="${logoUrl}" alt="">
    <div>
      <div class="cname">บริษัท ชูรสยายปู จำกัด</div>
      <div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div>
    </div>
    <div class="rtitle">
      <div class="t">รายงานขาย</div>
      <div class="m">พิมพ์เมื่อ ${printedAt}</div>
      <div class="m">จำนวน ${filtered.length} รายการ</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th class="c" style="width:36px">#</th>
      <th style="width:110px">เลขที่</th>
      <th class="c" style="width:90px">วันที่</th>
      <th>ลูกค้า</th>
      <th style="width:120px">พนักงานขาย</th>
      <th class="c" style="width:90px">ครบกำหนดชำระ</th>
      <th class="c" style="width:90px">สถานะจัดส่ง</th>
      <th class="c" style="width:90px">การชำระ</th>
      <th class="r" style="width:100px">รวม (บาท)</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="9" class="c">ไม่มีข้อมูล</td></tr>'}</tbody>
    <tfoot><tr><td colspan="8" class="r">รวมทั้งสิ้น</td><td class="r">${baht(totalSum)}</td></tr></tfoot>
  </table>
  <div class="bar no-print">
    <span style="font-size:14px;font-weight:600">แนวกระดาษ:</span>
    <span class="orient">
      <button id="btn-land" class="active" onclick="setOrient('landscape')">▭ แนวนอน</button>
      <button id="btn-port" onclick="setOrient('portrait')">▯ แนวตั้ง</button>
    </span>
    <button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
  </div>
</div>
<style id="orientStyle">@media print{@page{size:A4 landscape;margin:0}}</style>
<script>
  function setOrient(o){
    document.getElementById('orientStyle').textContent =
      '@media print{@page{size:A4 ' + o + ';margin:0}}';
    document.body.classList.toggle('portrait', o === 'portrait');
    document.getElementById('btn-land').classList.toggle('active', o === 'landscape');
    document.getElementById('btn-port').classList.toggle('active', o === 'portrait');
  }
</script>
</body></html>`;
    const win = window.open('', '', 'width=900,height=900');
    if (!win) { alert('กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์'); return; }
    win.document.write(html);
    win.document.close();
  };

  const handleEditSave = () => {
    loadSalesData();
    setEditingId(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">📋 รายการขาย</h1>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setCurrent('sales-new')}
          >
            ➕ เพิ่มรายการขาย
          </button>
          <button
            className="btn"
            onClick={printReport}
            title="พิมพ์รายงานขาย"
          >
            🖨️ พิมพ์รายงาน
          </button>
          <button 
            className="btn" 
            onClick={handleDeleteAll}
            style={{background: '#FBE8E5', color: '#7A1411', border: '1px solid #E9B6B1'}}
            title="ลบรายการขายทั้งหมด"
          >
            🗑️ ลบทั้งหมด
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="ค้นหาวันที่หรือ ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>เลขที่ใบสั่งขาย</th>
            <th>วันที่</th>
            <th>ลูกค้า</th>
            <th>ครบกำหนดชำระ</th>
            <th>สถานะจัดส่ง</th>
            <th>สถานะ</th>
            <th>รวม</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>ไม่มีข้อมูล</td></tr>
          ) : (
            filtered.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600, color: "var(--brand)" }}>{s.id || s.invoiceNumber}</td>
                <td>{window.fmtDateGlobal(s.date)}</td>
                <td>{s.customerName}</td>
                <td style={{ whiteSpace: "nowrap", color: s.dueDate ? "inherit" : "var(--muted)" }}>{s.dueDate ? window.fmtDateGlobal(s.dueDate) : "—"}</td>
                <td>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    background: (shipColors[s.shippingStatus] || shipColors.order).bg,
                    color: (shipColors[s.shippingStatus] || shipColors.order).fg,
                    whiteSpace: "nowrap"
                  }}>
                    {shipLabels[s.shippingStatus] || shipLabels.order}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    background: s.paymentStatus === 'paid' ? '#E2EDDC' : s.paymentStatus === 'partial' ? '#F7EAC8' : '#FBE8E5',
                    color: s.paymentStatus === 'paid' ? '#2D5128' : s.paymentStatus === 'partial' ? '#7A5414' : '#7A1411'
                  }}>
                    {s.paymentStatus === 'paid' ? 'ชำระแล้ว' : s.paymentStatus === 'partial' ? 'ชำระบางส่วน' : 'ค้างชำระ'}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>{(s.total || 0).toLocaleString("th-TH")}</td>
                <td style={{ display: "flex", gap: "6px" }}>
                  {s.isOrder && (
                    <>
                      <button
                        className="btn-icon"
                        title="ออกใบกำกับภาษี (ใช้ข้อมูลใบนี้)"
                        onClick={() => {
                          let data;
                          try { data = JSON.parse(localStorage.getItem('sales_order_' + s.id)); } catch(e) {}
                          if (!data) { alert('ไม่สามารถโหลดข้อมูลใบสั่งขาย'); return; }
                          const items = Array.isArray(data.items) ? data.items : [];
                          const prefill = {
                            date: data.orderDate || new Date().toISOString().split('T')[0],
                            customerName: data.customerName || '',
                            customerTax: data.customerTax || data.taxId || '',
                            address: data.customerAddress || '',
                            discount: data.discount || 0,
                            vat: data.taxRate != null ? data.taxRate : 7,
                            notes: data.notes || '',
                            sourceOrder: s.id,
                            items: items.map((it, i) => ({
                              id: i,
                              description: it.name || it.code || '',
                              qty: parseFloat(it.qty) || 0,
                              unit: it.unit || 'ซอง',
                              price: parseFloat(it.price) || 0,
                              total: (it.total != null ? it.total : (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)).toFixed(2),
                            })),
                          };
                          window.__taxInvoicePrefill = prefill;
                          try { sessionStorage.setItem('tax_invoice_prefill', JSON.stringify(prefill)); } catch(e) {}
                          if (typeof setCurrent === 'function') setCurrent('tax-invoice');
                        }}
                      >
                        🧾
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          let data;
                          try {
                            data = JSON.parse(localStorage.getItem('sales_order_' + s.id));
                          } catch(e) {}
                          if (!data) { alert('ไม่สามารถโหลดข้อมูลใบสั่งขาย'); return; }

                          const esc = (v) => String(v == null ? '' : v).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
                          const baht = (v) => (parseFloat(v) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const payLabel = (window.paymentMethodLabel ? window.paymentMethodLabel(data) :
                            ({cash:'เงินสด',transfer:'เงินโอน',credit:'เครดิต',cod:'เก็บเงินปลายทาง (COD)',consignment:'ฝากขาย'}[data.paymentMethod] || data.paymentMethod || '—')
                            + (data.paymentMethod === 'credit' && data.creditDays ? ' ' + data.creditDays + ' วัน' : ''));
                          const dueDateVal = data.dueDate || (data.paymentMethod === 'credit' && (data.deliveryDate || data.orderDate) && data.creditDays ? (() => { const d = new Date(data.deliveryDate || data.orderDate); d.setDate(d.getDate() + (parseInt(data.creditDays) || 0)); return d.toISOString().split('T')[0]; })() : '');
                          const items = Array.isArray(data.items) ? data.items : [];
                          const totalQty = items.reduce((t, it) => t + (parseFloat(it.qty) || 0), 0);
                          const grand = data.totalAmount != null ? data.totalAmount : items.reduce((t, it) => t + (it.subtotal || 0), 0);

                          const infoRow = (label, value) => value
                            ? `<tr><td class="lbl">${label}</td><td class="val">${esc(value)}</td></tr>` : '';

                          const fmtDate = (d) => window.fmtDateGlobal(d);
                          const logoUrl = new URL('logo-yaipu.png', window.location.href).href;
                          const subtotal = data.subtotal != null ? data.subtotal : items.reduce((t, it) => t + (it.total || it.subtotal || 0), 0);
                          const discPct = data.discount || 0;
                          const discAmt = data.discountAmount != null ? data.discountAmount : subtotal * discPct / 100;
                          const afterDisc = subtotal - discAmt;
                          const taxPct = data.taxRate != null ? data.taxRate : 0;
                          const vatInc = data.vatType === 'inclusive';
                          const taxAmt = data.taxAmount != null ? data.taxAmount : (vatInc ? afterDisc * (taxPct/100) / (1 + taxPct/100) : afterDisc * taxPct / 100);
                          const preVat = vatInc ? afterDisc - taxAmt : afterDisc;
                          const bahtText = (num) => {
                            num = parseFloat(num) || 0;
                            const tn = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
                            const tp = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
                            const readBlock = (n) => { let s2 = ''; const dg = String(n).split(''); const len = dg.length; for (let i = 0; i < len; i++) { const d = parseInt(dg[i]); const pos = len - i - 1; if (d === 0) continue; if (pos === 0 && d === 1 && len > 1) s2 += 'เอ็ด'; else if (pos === 1 && d === 2) s2 += 'ยี่' + tp[pos]; else if (pos === 1 && d === 1) s2 += tp[pos]; else s2 += tn[d] + tp[pos]; } return s2; };
                            const readNumber = (n) => { if (n === 0) return 'ศูนย์'; if (String(n).length > 6) { const m = Math.floor(n / 1000000); const r = n % 1000000; return readNumber(m) + 'ล้าน' + (r > 0 ? readBlock(r) : ''); } return readBlock(n); };
                            const b = Math.floor(num); const st = Math.round((num - b) * 100);
                            let txt = readNumber(b) + 'บาท'; txt += st > 0 ? readBlock(st) + 'สตางค์' : 'ถ้วน'; return txt;
                          };
                          const blankRows = Math.max(0, 8 - items.length);

                          const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8"><title>ใบสั่งขาย ${esc(s.id)}</title>
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
  @media print {
    body { background: #fff; padding: 0; }
    .doc { width: 100%; min-height: auto; box-shadow: none; padding: 14mm 12mm; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }
</style></head><body>
<div class="doc">
  <div class="wm"><img src="${logoUrl}" alt=""></div>
  <div class="layer">
    <div class="pageno">หน้า 1 / 1</div>
    <div class="chead">
      <div class="logo"><img src="${logoUrl}" alt="ชูรสยายปู"></div>
      <div class="ctr">
        <div class="cname">บริษัท ชูรสยายปู จำกัด</div>
        <div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div>
        <div class="caddr">เลขประจำตัวผู้เสียภาษี 0495567000363</div>
      </div>
    </div>

    <div class="titlerow">
      <div class="t">Sale Order / ใบสั่งขาย</div>
      <table class="nbox"><tbody>
        <tr><td class="k">เลขที่</td><td>${esc(s.id)}</td></tr>
        <tr><td class="k">วันที่</td><td>${fmtDate(data.orderDate)}</td></tr>
      </tbody></table>
    </div>

    <table class="cust"><tbody>
      <tr>
        <td style="width:70px">รหัสลูกค้า</td><td>${esc(data.customerId) || '—'}</td>
        <td class="sep" style="width:90px">ใบสั่งจอง</td><td>${esc(data.poNumber) || '—'}</td>
        <td style="width:70px">ลงวันที่</td><td>${fmtDate(data.poDate)}</td>
      </tr>
      <tr>
        <td>ชื่อลูกค้า</td><td style="font-weight:600">${esc(data.customerName) || '—'}</td>
        <td class="sep">การชำระ</td><td>${esc(payLabel)}</td>
        <td>VAT</td><td>${vatInc ? 'ใน' : 'นอก'} ${taxPct}%</td>
      </tr>
      <tr>
        <td>ที่อยู่</td><td>${esc(data.customerAddress) || '—'}</td>
        <td class="sep">วันกำหนดส่ง</td><td>${fmtDate(data.deliveryDate) || '—'}</td>
        <td>ครบกำหนดชำระ</td><td>${dueDateVal ? fmtDate(dueDateVal) : '—'}</td>
      </tr>
      <tr>
        <td>โทร.</td><td>${esc(data.customerPhone) || '—'}</td>
        <td class="sep">วิธีขนส่ง</td><td>${{ "": "—", "cell": "เซลล์หน่วยรถ", "jnt": "J&T", "flash": "Flash", "thailand-post": "ไปรษณีย์ไทย" }[data.shippingMethod || ""]}</td>
        <td>Tracking</td><td>${esc(data.trackingNumber) || '—'}</td>
      </tr>
      <tr>
        <td style="width:70px">พนักงานขาย</td><td style="font-weight:600">${esc(data.salesPerson) || '—'}</td>
        <td class="sep">สถานะส่ง</td><td colspan="3">${{ "order": "รับออร์เดอร์", "producing": "กำลังผลิต", "packing": "กำลังแพ็ค", "shipping": "กำลังส่ง", "delivered": "ส่งสำเร็จ" }[data.shippingStatus || "order"]}</td>
      </tr>
    </tbody></table>

    <table class="items">
      <thead><tr>
        <th style="width:80px">รหัสสินค้า</th>
        <th>รายการ</th>
        <th class="r" style="width:70px">จำนวน</th>
        <th class="c" style="width:55px">หน่วย</th>
        <th class="r" style="width:80px">ราคา/หน่วย</th>
        <th class="r" style="width:60px">ส่วนลด</th>
        <th class="r" style="width:90px">จำนวนเงิน</th>
      </tr></thead>
      <tbody>
        ${items.map((it) => `<tr>
          <td>${esc(it.code || it.productCode)}</td>
          <td>${esc(it.name || it.productName)}</td>
          <td class="r">${(parseFloat(it.qty) || 0).toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
          <td class="c">${esc(it.unit) || '—'}</td>
          <td class="r">${baht(it.price)}</td>
          <td class="r"></td>
          <td class="r">${baht(it.total != null ? it.total : it.subtotal)}</td>
        </tr>`).join('')}
        ${Array.from({length: blankRows}).map(() => `<tr style="height:26px"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
      </tbody>
    </table>

    <table class="sum"><tbody>
      <tr>
        <td rowspan="5" style="width:55%;vertical-align:top"><strong>หมายเหตุ</strong><div>${esc(data.notes) || ''}</div></td>
        <td class="k">รวมเงิน</td><td class="r">${baht(subtotal)}</td>
      </tr>
      <tr><td class="k">ส่วนลดการค้า ${discPct}%</td><td class="r">${baht(discAmt)}</td></tr>
      <tr><td class="k">เงินหลังหักส่วนลด</td><td class="r">${baht(afterDisc)}</td></tr>
      ${vatInc ? `<tr><td class="k">มูลค่าก่อน VAT</td><td class="r">${baht(preVat)}</td></tr>` : ''}
      <tr><td class="k">ภาษีมูลค่าเพิ่ม ${taxPct}% (${vatInc ? 'VAT ใน' : 'VAT นอก'})</td><td class="r">${baht(taxAmt)}</td></tr>
      <tr class="grand"><td class="k">จำนวนเงินทั้งสิ้น</td><td class="r">${baht(grand)}</td></tr>
    </tbody></table>
    <div class="bahtline">( ${bahtText(grand)} )</div>

    <div class="sign">
      <div><div class="line" style="display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;font-size:12px">${esc(data.salesPerson) || ''}</div><div class="role">พนักงานขาย</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">ผู้จัดการฝ่ายขาย</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">พนักงานบัญชี</div><div class="date">วันที่ ______/______/______</div></div>
    </div>

    <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
  </div>
</div>
</body></html>`;

                          const win = window.open('', '', 'width=900,height=900');
                          if (!win) { alert('กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์'); return; }
                          win.document.write(html);
                          win.document.close();
                        }}
                        title="พิมพ์"
                      >
                        🖨️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          const order = sales.find(s => s.id === order_id);
                          if (!order) return;
                          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;margin:0;padding:12mm}
.page{width:210mm;height:297mm;padding:10mm;box-sizing:border-box;margin:0 auto;border:1px solid #ddd;page-break-after:always;font-size:10px}
.header{display:flex;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #333}
.logo{width:40px;height:40px;border-radius:3px;flex-shrink:0}
.header h1{margin:0;font-size:14px;color:#B6241F;font-weight:bold}
.header p{margin:2px 0;font-size:9px;color:#666}
.title{text-align:center;font-size:13px;font-weight:bold;margin:8px 0}
.info{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;font-size:10px}
.info-field{border:1px solid #333;padding:3px;min-height:20px}
.info-label{display:block;font-size:9px;font-weight:bold;margin-bottom:1px}
table{width:100%;border-collapse:collapse;font-size:9px;margin-top:6px}
th{background:#f5f5f5;border:1px solid #333;padding:3px;text-align:left;font-weight:bold}
td{border:1px solid #ddd;padding:3px;height:22px}
.summary{margin-top:12px;text-align:right;font-size:10px;font-weight:bold}
.sig-group{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:15px;text-align:center;font-size:9px}
.sig-line{margin-top:25px;border-top:1px solid #333;padding-top:2px}
@media print{body{margin:0;padding:0}.page{border:none;margin:0}}
                          </style></head><body>
                          <div class="page">
                            <div class="header">
                              <img src="logo.jpg" style="width:40px;height:40px;border-radius:3px">
                              <div>
                                <h1>บริษัท ชูรสยายปู จำกัด</h1>
                                <p>เลขประจำตัวผู้เสียภาษี 0495567000363</p>
                              </div>
                            </div>
                            <div class="title">ใบสั่งขาย</div>
                            
                            <div class="info">
                              <div class="info-field"><span class="info-label">เลขที่</span>${order.soNumber || '—'}</div>
                              <div class="info-field"><span class="info-label">วันที่</span>${order.date || '—'}</div>
                              <div class="info-field"><span class="info-label">กำหนดส่ง</span>${order.deliveryDate || '—'}</div>
                            </div>

                            <div class="info">
                              <div class="info-field"><span class="info-label">ลูกค้า</span>${order.customerName || '—'}</div>
                              <div class="info-field"><span class="info-label">ที่อยู่</span>${order.customerAddress || '—'}</div>
                              <div class="info-field"><span class="info-label">โทร</span>${order.customerPhone || '—'}</div>
                            </div>

                            <table>
                              <thead><tr><th>รหัส</th><th>รายการ</th><th style="text-align:right">จำนวน</th><th>หน่วย</th><th style="text-align:right">ราคา/หน่วย</th><th style="text-align:right">จำนวนเงิน</th></tr></thead>
                              <tbody>
                                ${(order.items || []).map(it => '<tr><td>' + it.code + '</td><td>' + it.name + '</td><td style="text-align:right">' + it.qty + '</td><td>' + it.unit + '</td><td style="text-align:right">' + it.price + '</td><td style="text-align:right">' + (it.qty * it.price).toFixed(2) + '</td></tr>').join('')}
                              </tbody>
                            </table>

                            <div class="summary">
                              <div>รวม: ${((order.items || []).reduce((s, it) => s + it.qty * it.price, 0)).toFixed(2)} บาท</div>
                              <div>${order.vatType || 'VAT นอก'} ${order.vat || 0}%: ${(((order.items || []).reduce((s, it) => s + it.qty * it.price, 0)) * ((order.vat || 0) / 100)).toFixed(2)} บาท</div>
                              <div style="margin-top:4px;border-top:1px solid #333;padding-top:4px">รวมทั้งสิ้น: ${order.total || '—'} บาท</div>
                            </div>

                            <div style="margin-top:12px;font-size:9px">
                              <strong>วิธีชำระเงิน:</strong> ${order.paymentMethod === 'credit' ? 'เครดิต ' + (order.creditDays || '—') + ' วัน' : 'เงินสด'}
                            </div>

                            <div class="sig-group" style="margin-top:20px">
                              <div><p style="margin:0">ผู้ขาย ........................</p><p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p></div>
                              <div><p style="margin:0">ผู้รับของ ........................</p><p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p></div>
                              <div><p style="margin:0">ผู้อนุมัติ ........................</p><p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p></div>
                            </div>
                          </div>
                          </body></html>`;
                          const win = window.open('', '_blank');
                          if (!win) { alert('⚠️ เบราว์เซอร์บล็อก popup'); return; }
                          win.document.write(html);
                          win.document.close();
                          win.focus();
                        }}
                        title="ส่งออก PDF"
                      >
                        📄
                      </button>
                    </>
                  )}
                  <button
                    className="btn-icon"
                    onClick={() => setEditingId(s.id)}
                    title="แก้ไข"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(s.id)}
                    title="ลบ"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editingId && (
        (() => {
          const target = sales.find(s => s.id === editingId);
          return target?.isOrder ? (
            <ScreenSalesOrderEdit
              orderNumber={editingId}
              onClose={() => setEditingId(null)}
              onSave={handleEditSave}
            />
          ) : (
            <ScreenSalesEdit
              saleId={editingId}
              onClose={() => setEditingId(null)}
              onSave={handleEditSave}
            />
          );
        })()
      )}

      <style>{`
        .filter-bar {
          margin-bottom: 16px;
        }
        .filter-bar input {
          width: 100%;
          max-width: 400px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          transition: opacity 0.2s;
        }
        .btn-icon:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

Object.assign(window, { ScreenSalesList });
