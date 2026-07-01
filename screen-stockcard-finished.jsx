// 📦 สต๊อคการ์ดผลิตภัณฑ์สำเร็จรูป (FM-WH-08) — บัญชีเดินสะพัด รับเข้า/จ่ายออก/คงเหลือ รายสินค้า
const ScreenStockCardFGCard = () => {
  const MENU_LIST = typeof MENU !== "undefined" ? MENU : [];
  const [code, setCode] = React.useState(MENU_LIST[0]?.code || "");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all"); // all | in | out

  const item = MENU_LIST.find(m => m.code === code) || {};

  // รวบรวมความเคลื่อนไหวของสินค้านี้
  const moves = React.useMemo(() => {
    const result = [];

    // รับเข้า — จากใบสั่งผลิตที่เสร็จแล้ว
    const prods = (() => { try { const s = localStorage.getItem('erp_productions'); if (s) return JSON.parse(s); } catch (e) {} return (typeof PRODUCTIONS !== 'undefined') ? PRODUCTIONS : []; })();
    prods.forEach(prod => {
      if (prod.product !== code) return;
      if (prod.status !== "เสร็จแล้ว" && prod.status !== "done") return;
      const qty = parseInt(prod.actualQty || prod.qty || 0, 10) || 0;
      if (qty <= 0) return;
      result.push({
        date: prod.date, po: prod.code || "—", ref: "—", lot: prod.lot || "—",
        by: "", returnBy: "", note: "ผลิตเข้าสต๊อก",
        in: qty, out: 0, type: "รับเข้า"
      });
    });

    // จ่ายออก — จากใบเบิก FG (erp_fg_withdraw_*)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('erp_fg_withdraw_')) continue;
      try {
        const rec = JSON.parse(localStorage.getItem(key));
        (rec.items || []).forEach(it => {
          if (it.product !== code) return;
          const qty = parseInt(it.qty || 0, 10) || 0;
          if (qty <= 0) return;
          const isReturn = rec.mode === "คืน";
          result.push({
            date: rec.date, po: it.po || rec.reference || "—", ref: rec.docNumber || "—",
            lot: it.lot || "—",
            by: isReturn ? "" : (rec.withdrawBy || ""),
            returnBy: isReturn ? (rec.withdrawBy || "") : "",
            note: rec.type || "",
            in: isReturn ? qty : 0, out: isReturn ? 0 : qty,
            type: isReturn ? "รับคืน" : "จ่ายออก"
          });
        });
      } catch (e) {}
    }

    // จ่ายออก — จากการขาย
    const sales = (() => { try { const s = localStorage.getItem('erp_sales'); if (s) return JSON.parse(s); } catch (e) {} return (typeof SALES !== 'undefined') ? SALES : []; })();
    sales.forEach(sale => {
      (sale.items || []).forEach(it => {
        if (it.product !== code) return;
        const qty = parseInt(it.qty || 0, 10) || 0;
        if (qty <= 0) return;
        result.push({
          date: sale.date, po: "—", ref: sale.code || sale.docNumber || "ขาย",
          lot: "—", by: sale.customer || "ขาย", returnBy: "", note: "ขายออก",
          in: 0, out: qty, type: "จ่ายออก"
        });
      });
    });

    return result.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [code]);

  let balance = 0;
  const fullList = moves.map(m => {
    balance += m.in - m.out;
    return { ...m, balance };
  });

  const filtered = fullList.filter(r => {
    if (filter === 'in') return r.in > 0;
    if (filter === 'out') return r.out > 0;
    return true;
  });

  const currentStock = balance;
  const totalIn = fullList.reduce((s, r) => s + r.in, 0);
  const totalOut = fullList.reduce((s, r) => s + r.out, 0);
  const unit = "ซอง";

  const fmtNum = (n) => (n || 0).toLocaleString('en-US');
  const fmtDate = (d) => window.fmtDateGlobal(d);

  // พิมพ์ตามฟอร์ม FM-WH-08
  const buildPrintHTML = () => {
    const rows = filtered.map(r => `<tr>
      <td style="border:1px solid #333;padding:4px;height:24px;text-align:center">${fmtDate(r.date)}</td>
      <td style="border:1px solid #333;padding:4px;height:24px;text-align:center">${r.po || ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px;text-align:center">${r.ref || ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px;text-align:center">${r.lot || ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px">${r.by || ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px">${r.returnBy || ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px">${r.note || ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px;text-align:right">${r.in > 0 ? fmtNum(r.in) : ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px;text-align:right">${r.out > 0 ? fmtNum(r.out) : ''}</td>
      <td style="border:1px solid #333;padding:4px;height:24px;text-align:right;font-weight:bold">${fmtNum(r.balance)}</td>
    </tr>`).join('');

    const emptyCount = Math.max(0, 16 - filtered.length);
    const emptyRows = Array(emptyCount).fill(0).map(() => `<tr>${Array(10).fill('<td style="border:1px solid #333;padding:4px;height:24px"></td>').join('')}</tr>`).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;margin:0;padding:10mm;font-size:10px}
.page{width:297mm;min-height:200mm;padding:10mm;box-sizing:border-box;margin:0 auto;border:1px solid #ddd;page-break-after:always}
.header{display:flex;gap:10px;align-items:center;margin-bottom:6px}
.logo{width:46px;height:46px;border-radius:3px;flex-shrink:0;object-fit:cover}
.header-center{flex:1;text-align:center}
.header-center h1{margin:0;font-size:15px;font-weight:bold}
.header-center .doctitle{font-size:13px;font-weight:bold;margin-top:2px}
.info{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0;font-size:10px}
.info .fld{border:1px solid #333;padding:4px}
.info .lbl{display:block;font-size:9px;font-weight:bold;color:#555}
table{width:100%;border-collapse:collapse;font-size:9px;margin-top:6px}
th{background:#f0f0f0;border:1px solid #333;padding:4px 3px;text-align:center;font-weight:bold;line-height:1.2}
.sig-group{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:24px;text-align:center;font-size:10px}
.sig-group .role{font-size:9px;color:#555;margin-top:4px}
.footer-note{margin-top:10px;font-size:8px;color:#444}
@media print{body{margin:0;padding:0}.page{border:none;margin:0}@page{size:A4 landscape}}
    </style></head><body>
    <div class="page">
      <div class="header">
        <img src="logo.jpg" class="logo">
        <div class="header-center">
          <h1>บริษัท ชูรสยายปู จำกัด</h1>
          <div class="doctitle">บันทึกสต็อกผลิตภัณฑ์สำเร็จรูป</div>
        </div>
      </div>
      <div class="info">
        <div class="fld"><span class="lbl">ชื่อสินค้า</span>${item.name || ''}</div>
        <div class="fld"><span class="lbl">รหัส</span>${item.code || ''}</div>
        <div class="fld"><span class="lbl">หน่วย</span>${unit}</div>
        <div class="fld"><span class="lbl">ค่าต่ำสุด</span>${item.reorder != null ? item.reorder : ''}</div>
        <div class="fld"><span class="lbl">ค่าสูงสุด</span>${item.max != null ? item.max : ''}</div>
      </div>
      <table>
        <thead><tr>
          <th style="width:8%">วันที่</th>
          <th style="width:10%">เลขที่ใบสั่งผลิต</th>
          <th style="width:11%">เลขที่เอกสารอ้างอิง</th>
          <th style="width:8%">Lot No.</th>
          <th style="width:10%">ผู้เบิก</th>
          <th style="width:10%">ผู้คืน</th>
          <th style="width:13%">หมายเหตุ</th>
          <th style="width:7%">รับเข้า</th>
          <th style="width:7%">จ่ายออก</th>
          <th style="width:8%">คงเหลือ</th>
        </tr></thead>
        <tbody>${rows}${emptyRows}</tbody>
      </table>
      <div class="sig-group">
        <div>ผู้บันทึก .......................................<div class="role">พนักงานคลัง</div></div>
        <div>ผู้ตรวจสอบ .......................................<div class="role">พนักงานควบคุมคุณภาพ</div></div>
        <div>ผู้อนุมัติ .......................................<div class="role">ผู้จัดการฝ่ายผลิต</div></div>
      </div>
      <div class="footer-note">FM-WH-08 Rev.00</div>
    </div>
    </body></html>`;
  };

  const handlePrint = () => {
    const win = window.open('', '', 'width=1100,height=800');
    if (!win) { alert('⚠️ เบราว์เซอร์บล็อก popup'); return; }
    win.document.write(buildPrintHTML());
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  const handleExportExcel = () => {
    let csv = '\uFEFF';
    csv += `บันทึกสต็อกผลิตภัณฑ์สำเร็จรูป,${item.code} ${item.name || ''}\n`;
    csv += `วันที่,เลขที่ใบสั่งผลิต,เลขที่เอกสารอ้างอิง,Lot No.,ผู้เบิก,ผู้คืน,หมายเหตุ,รับเข้า,จ่ายออก,คงเหลือ\n`;
    filtered.forEach(r => {
      csv += `"${fmtDate(r.date)}","${r.po || ''}","${r.ref || ''}","${r.lot || ''}","${r.by || ''}","${r.returnBy || ''}","${r.note || ''}",${r.in > 0 ? r.in : ''},${r.out > 0 ? r.out : ''},${r.balance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `สต็อกผลิตภัณฑ์_${item.code}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const searchList = MENU_LIST.filter(m => !search || (m.code || "").toLowerCase().includes(search.toLowerCase()) || (m.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📦 บันทึกสต็อกผลิตภัณฑ์สำเร็จรูป</h1>
          <p className="page-sub">FM-WH-08 · บัญชีเดินสะพัด รับเข้า–จ่ายออก–คงเหลือ (รายสินค้า)</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: 6 }}>📊 Excel</button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>🖨️ พิมพ์</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="card-head"><h3 className="card-title">เลือกสินค้า</h3></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="form-input" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ maxHeight: 460, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {searchList.map(m => (
                  <button key={m.code} onClick={() => setCode(m.code)}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", textAlign: "left", background: m.code === code ? "var(--brand)" : "transparent", color: m.code === code ? "white" : "var(--ink)", fontSize: 12 }}>
                    <strong>{m.code}</strong> · {(m.name || "").slice(0, 18)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              <div><div className="kpi-label">รหัส</div><div className="kpi-value" style={{ fontSize: 18 }}>{item.code || "—"}</div></div>
              <div><div className="kpi-label">ชื่อสินค้า</div><div className="kpi-value" style={{ fontSize: 14 }}>{item.name || "—"}</div></div>
              <div><div className="kpi-label">หน่วย</div><div className="kpi-value" style={{ fontSize: 16 }}>{unit}</div></div>
              <div><div className="kpi-label">รับเข้า / จ่ายออก</div><div className="kpi-value" style={{ fontSize: 14 }}><span style={{ color: "var(--leaf)" }}>{fmtNum(totalIn)}</span> / <span style={{ color: "var(--brand)" }}>{fmtNum(totalOut)}</span></div></div>
              <div><div className="kpi-label">คงเหลือ</div><div className="kpi-value" style={{ fontSize: 18, color: currentStock < (item.reorder || 0) ? "var(--brand)" : "var(--leaf)" }}>{fmtNum(currentStock)} <span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span></div></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {[["all", "ทั้งหมด"], ["in", "รับเข้า"], ["out", "จ่ายออก"]].map(([v, l]) => (
              <button key={v} className={`btn ${filter === v ? "btn-primary" : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>เลขที่ใบสั่งผลิต</th>
                    <th>เลขที่เอกสารอ้างอิง</th>
                    <th>Lot No.</th>
                    <th>ผู้เบิก</th>
                    <th>ผู้คืน</th>
                    <th>หมายเหตุ</th>
                    <th className="num">รับเข้า</th>
                    <th className="num">จ่ายออก</th>
                    <th className="num">คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>ไม่มีรายการเคลื่อนไหว</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={i}>
                      <td className="small muted">{fmtDate(r.date)}</td>
                      <td><span className="code" style={{ fontSize: 11 }}>{r.po}</span></td>
                      <td><span className="code" style={{ fontSize: 11 }}>{r.ref}</span></td>
                      <td className="small">{r.lot}</td>
                      <td className="small">{r.by || "—"}</td>
                      <td className="small">{r.returnBy || "—"}</td>
                      <td className="small">{r.note || "—"}</td>
                      <td className="num tnum" style={{ color: r.in > 0 ? "var(--leaf)" : "var(--muted)" }}>{r.in > 0 ? fmtNum(r.in) : "—"}</td>
                      <td className="num tnum" style={{ color: r.out > 0 ? "var(--brand)" : "var(--muted)" }}>{r.out > 0 ? fmtNum(r.out) : "—"}</td>
                      <td className="num tnum" style={{ fontWeight: 600 }}>{fmtNum(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenStockCardFGCard });
