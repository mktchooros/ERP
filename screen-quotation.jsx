// 📋 รายการใบเสนอราคาทั้งหมด

const ScreenQuotationList = ({ setCurrent }) => {
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
    if (!confirm("ต้องการลบใบเสนอราคาทั้งหมด? (ไม่สามารถย้อนกลับได้)")) return;
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
        if (key && key.startsWith('quotation_')) {
          try {
            const o = JSON.parse(localStorage.getItem(key));
            orders.push({
              id: o.quoteNumber,
              storageKey: key,
              isOrder: true,
              date: o.orderDate,
              invoiceNumber: o.quoteNumber,
              customerName: o.customerName,
              total: o.totalAmount || 0,
              paymentStatus: o.paymentStatus || 'unpaid',
            });
          } catch (e) {}
        }
      }
      orders.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
      setSales(orders);
    } catch(e) {}
  };

  const handleEditSave = () => {
    loadSalesData();
    setEditingId(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">📄 รายการใบเสนอราคา</h1>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setCurrent('quotation-new')}
          >
            ➕ เพิ่มใบเสนอราคา
          </button>
          <button 
            className="btn" 
            onClick={handleDeleteAll}
            style={{background: '#FBE8E5', color: '#7A1411', border: '1px solid #E9B6B1'}}
            title="ลบใบเสนอราคาทั้งหมด"
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
            <th>เลขที่ใบเสนอราคา</th>
            <th>วันที่</th>
            <th>ลูกค้า</th>
            <th>สถานะ</th>
            <th>รวม</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>ไม่มีข้อมูล</td></tr>
          ) : (
            filtered.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600, color: "var(--brand)" }}>{s.id || s.invoiceNumber}</td>
                <td>{s.date}</td>
                <td>{s.customerName}</td>
                <td>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    background: s.paymentStatus === 'paid' ? '#E2EDDC' : s.paymentStatus === 'partial' ? '#F7EAC8' : '#FBE8E5',
                    color: s.paymentStatus === 'paid' ? '#2D5128' : s.paymentStatus === 'partial' ? '#7A5414' : '#7A1411'
                  }}>
                    {s.paymentStatus === 'paid' ? 'อนุมัติแล้ว' : s.paymentStatus === 'partial' ? 'รอทบทวน' : 'รออนุมัติ'}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>{(s.total || 0).toLocaleString("th-TH")}</td>
                <td style={{ display: "flex", gap: "6px" }}>
                  {s.isOrder && (
                    <>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          let data;
                          try {
                            data = JSON.parse(localStorage.getItem('quotation_' + s.id));
                          } catch(e) {}
                          if (!data) { alert('ไม่สามารถโหลดข้อมูลใบเสนอราคา'); return; }

                          const esc = (v) => String(v == null ? '' : v).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
                          const baht = (v) => (parseFloat(v) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const payLabel = (window.paymentMethodLabel ? window.paymentMethodLabel(data) :
                            ({cash:'เงินสด',transfer:'เงินโอน',credit:'เครดิต',cod:'เก็บเงินปลายทาง (COD)',consignment:'ฝากขาย'}[data.paymentMethod] || data.paymentMethod || '—')
                            + (data.paymentMethod === 'credit' && data.creditDays ? ' ' + data.creditDays + ' วัน' : ''));
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
<html lang="th"><head><meta charset="utf-8"><title>ใบเสนอราคา ${esc(s.id)}</title>
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
      <div class="t">ใบเสนอราคา / Quotation</div>
      <table class="nbox"><tbody>
        <tr><td class="k">เลขที่</td><td>${esc(s.id)}</td></tr>
        <tr><td class="k">วันที่</td><td>${fmtDate(data.orderDate)}</td></tr>
      </tbody></table>
    </div>

    <table class="cust"><tbody>
      <tr>
        <td style="width:90px">ชื่อผู้ติดต่อ</td><td>${esc(data.contactName) || '—'}</td>
        <td class="sep" style="width:110px">วันที่กำหนดส่ง</td><td colspan="3">${fmtDate(data.deliveryDate)}</td>
      </tr>
      <tr>
        <td>ชื่อบริษัท</td><td style="font-weight:600">${esc(data.customerName) || '—'}</td>
        <td class="sep">ยืนราคาภายใน</td><td>${data.validDays != null ? data.validDays + ' วัน' : '—'}</td>
        <td style="width:90px;font-weight:600">Expire Date</td><td>${fmtDate(data.expireDate)}</td>
      </tr>
      <tr>
        <td>โทร.</td><td>${esc(data.customerPhone) || '—'}</td>
        <td class="sep">จำนวนวันเครดิต</td><td>${data.paymentMethod === 'credit' ? (data.creditDays || 0) + ' วัน' : '—'}</td>
        <td>VAT</td><td>${vatInc ? 'ใน' : 'นอก'} ${taxPct}%</td>
      </tr>
      <tr>
        <td>โทรสาร</td><td>${esc(data.fax) || '—'}</td>
        <td class="sep">การชำระ</td><td>${esc(payLabel)}</td>
        <td>ที่อยู่</td><td>${esc(data.customerAddress) || '—'}</td>
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
      <div><div class="line"></div><div class="role">ผู้เสนอราคา</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">ผู้มีอำนาจลงนาม</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">ผู้รับใบเสนอราคา</div><div class="date">วันที่ ______/______/______</div></div>
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
                        onClick={() => alert('ฟีเจอร์ส่งออก PDF กำลังพัฒนา')}
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
            <ScreenQuotationEdit
              quoteNumber={editingId}
              onClose={() => setEditingId(null)}
              onSave={handleEditSave}
            />
          ) : (
            <ScreenQuotationEdit
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

Object.assign(window, { ScreenQuotationList });
