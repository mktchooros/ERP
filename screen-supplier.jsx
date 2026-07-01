// 📊 สต๊อคการ์ดวัตถุดิบ v2 — ความเคลื่อนไหวรับเข้า/จ่ายออก + ยอดคงเหลือสะสม

const ScreenStockCardV2 = () => {
  const rawList = (typeof RAW !== 'undefined') ? RAW : [];
  const [code, setCode] = React.useState(rawList[0]?.code || "R01");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all"); // all | in | out
  const dataVersion = (typeof useStoreVersion === "function") ? useStoreVersion() : 0;

  // หาข้อมูลวัตถุดิบปัจจุบัน
  const item = rawList.find(r => r.code === code) || {};

  // แปลงจำนวนที่รับเข้าให้เป็น "หน่วยสต๊อก" ของวัตถุดิบนั้น ๆ
  // (วัตถุดิบส่วนใหญ่สต๊อกเป็นกรัม แต่บางตัว เช่น R01 สต๊อกเป็นกิโลกรัม)
  const toGrams = (qty, fromUnit) => {
    const stockUnit = item.unit || "กรัม";
    const f = fromUnit || stockUnit;
    const isKg = (u) => u === "kg" || u === "กิโลกรัม";
    if (f === stockUnit) return qty;            // หน่วยตรงกัน ไม่ต้องแปลง
    if (isKg(f) && stockUnit === "กรัม") return qty * 1000;  // กก. → กรัม
    if (f === "กรัม" && isKg(stockUnit)) return qty / 1000;  // กรัม → กก.
    if (isKg(f) && isKg(stockUnit)) return qty;             // กก. ↔ กก.
    return qty;
  };

  // รวบรวม movements ทั้งหมดของรายการนี้
  const moves = React.useMemo(() => {
    const result = [];

    // รับเข้า — นับเฉพาะรายการที่มาจาก "ใบรับเข้าวัตถุดิบ" (FM-WH-01) เท่านั้น
    // ใบสั่งซื้อ (PO) จะไม่เข้าสต๊อคการ์ด จนกว่าจะกรอกใบรับเข้า
    const purchases = (() => { try { const s=localStorage.getItem('erp_purchases'); if(s) return JSON.parse(s); } catch(e){} return (typeof PURCHASES!=='undefined')?PURCHASES:[]; })();
    purchases.forEach(p => {
      if (p.raw !== code) return;
      if (!p._grDocNo) return;   // ⬅️ เฉพาะรายการที่ผูกกับใบรับเข้า (มี _grDocNo)
      const qtyG = toGrams(p.qty || 0, p.unit || item.unit || "กรัม");
      result.push({ date: p.date, ref: p.code, type: "รับเข้า", in: qtyG, out: 0, lot: p.lotNo || p.lot || "" });
    });

    // ใช้ผลิต (จ่ายออก) — อ่านจาก localStorage ก่อนเสมอ
    const prods = (() => { try { const s=localStorage.getItem('erp_productions'); if(s) return JSON.parse(s); } catch(e){} return (typeof PRODUCTIONS!=='undefined')?PRODUCTIONS:[]; })();
    const recipes = (() => { try { const s=localStorage.getItem('erp_recipes'); if(s) return JSON.parse(s); } catch(e){} return (typeof RECIPES!=='undefined')?RECIPES:[]; })();
    prods.forEach(prod => {
      // ค้นหาสูตรด้วย prod.recipe (รหัสสูตร) หรือ prod.product (รหัสสินค้า)
      const recipe = recipes.find(r => r.code === prod.recipe) || recipes.find(r => r.product === prod.product);
      if (!recipe) return;
      const ri = recipe.items.find(i => i.raw === code);
      if (!ri) return;
      // makesNum = จำนวนซองที่สูตรนี้ผลิตได้ (เช่น "350 ซอง" → 350)
      const makesNum = parseInt(String(recipe.makes || '1').replace(/[^\d]/g, ''), 10) || 1;
      const rawItem = (typeof RAW !== 'undefined' ? RAW : []).find(r => r.code === ri.raw || r.code === code);
      const isGram = (rawItem?.unit || 'กรัม') === 'กรัม';
      const perUnit = isGram ? ri.qty / makesNum : ri.qty; // หน่วยกรัมหาร makesNum, อื่นไม่หาร
      const qty = perUnit * (prod.actualQty || prod.qty || 0);
      result.push({ date: prod.date, ref: prod.lot || prod.code || "—", type: "ใช้ผลิต", in: 0, out: qty });
    });

    // ปรับปรุง
    const adjRaw = (typeof ADJ_RAW !== 'undefined') ? ADJ_RAW : [];
    const adjFin = (typeof ADJ_FINISHED !== 'undefined') ? ADJ_FINISHED : [];
    [...adjRaw, ...adjFin].forEach(a => {
      if (a.raw !== code) return;
      const diff = (a.newQty || 0) - (a.oldQty || 0);
      if (diff > 0) {
        result.push({ date: a.date, ref: a.code || "ADJ", type: "ปรับปรุง", in: diff, out: 0 });
      } else if (diff < 0) {
        result.push({ date: a.date, ref: a.code || "ADJ", type: "ปรับปรุง", in: 0, out: -diff });
      }
    });

    // เบิก (withdraw) — อ่านจาก erp_withdrawals + withdrawal_* keys
    const withdraws = (() => { try { const s=localStorage.getItem('erp_withdrawals'); if(s) return JSON.parse(s); } catch(e){} return []; })();
    // อ่านจาก withdrawal_* keys ที่บันทึกจากฟอร์มเบิก
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('withdrawal_')) continue;
      try {
        const w = JSON.parse(localStorage.getItem(key));
        if (w && w.date && !withdraws.find(x => x.docNumber && x.docNumber === w.docNumber)) {
          withdraws.push(w);
        }
      } catch(e) {}
    }
    withdraws.forEach(w => {
      (w.items || []).forEach(it => {
        const rawCode = it.raw || it.code || "";
        if (rawCode !== code) return;
        result.push({ date: w.date, ref: w.code || w.docNumber || "—", type: "เบิก", in: 0, out: it.qty || it.withdraw || 0, lot: it.lot || "" });
      });
    });

    return result.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [code, dataVersion]);

  // ยอดยกมา + เกณฑ์สั่งซื้อ — ดึงจาก erp_raw_stock (แหล่งเดียวกับหน้า "จัดการสต๊อกวัตถุดิบ")
  const rawStockInfo = React.useMemo(() => {
    try {
      const s = JSON.parse(localStorage.getItem("erp_raw_stock") || "[]");
      const arr = Array.isArray(s)
        ? s
        : Object.entries(s).map(([raw, v]) => ({ raw, inHand: v.inHand || 0, reorder: v.reorder || 0 }));
      return arr.find(x => x.raw === code) || null;
    } catch (e) { return null; }
  }, [code, dataVersion]);

  // หาช่วงเวลา (ยอดยกมา, filter, รวม)
  const opening = rawStockInfo ? (rawStockInfo.inHand || 0) : (item.openingBalance || 0);
  const reorderLevel = rawStockInfo ? (rawStockInfo.reorder || 0) : (item.reorder || 0);
  const unit = item.unit || 'กรัม';
  let balance = opening;
  const fullList = moves.map(m => {
    balance += m.in - m.out;
    return { ...m, balance };
  });

  const filtered = fullList.filter(r => {
    if (filter === 'in') return r.in > 0;
    if (filter === 'out') return r.out > 0;
    return true;
  }).filter(r => !search || r.ref.includes(search) || r.type.includes(search));

  const currentStock = balance;
  const totalIn = fullList.reduce((s, r) => s + r.in, 0);
  const totalOut = fullList.reduce((s, r) => s + r.out, 0);

  // Utility
  const fmtNum = (n) => (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => window.fmtDateGlobal(d);

  // Build print HTML — Warehouse Bin Card format
  const buildPrintHTML = () => {
    const rows = filtered.map(r => {
      // PD = ใบสั่งผลิต → ใส่ในช่อง "เลขที่ใบสั่งผลิต"; อื่นๆ (PO/WH) → ช่อง "เลขที่เอกสารอ้างอิง"
      const ref = r.ref || '';
      const isProd = /ผลิต/.test(r.type || '') || /^PD/i.test(ref);
      const refDoc = isProd ? '' : ref;
      const prodDoc = isProd ? ref : '';
      return `<tr>
      <td style="border:1px solid #333;padding:6px;height:30px">${fmtDate(r.date)}</td>
      <td style="border:1px solid #333;padding:6px;height:30px;font-size:10px">${refDoc||'—'}</td>
      <td style="border:1px solid #333;padding:6px;height:30px;text-align:right">${r.in>0?fmtNum(r.in):'—'}</td>
      <td style="border:1px solid #333;padding:6px;height:30px;text-align:right">${r.out>0?fmtNum(r.out):'—'}</td>
      <td style="border:1px solid #333;padding:6px;height:30px;text-align:right;font-weight:bold">${fmtNum(r.balance)}</td>
      <td style="border:1px solid #333;padding:6px;height:30px;font-size:10px;font-family:monospace">${r.lot||''}</td>
      <td style="border:1px solid #333;padding:6px;height:30px;font-size:10px">${prodDoc}</td>
      <td style="border:1px solid #333;padding:6px;height:30px"></td>
      <td style="border:1px solid #333;padding:6px;height:30px"></td>
      <td style="border:1px solid #333;padding:6px;height:30px"></td>
      <td style="border:1px solid #333;padding:6px;height:30px"></td>
    </tr>`;
    }).join('');

    const emptyCount = Math.max(0, 18 - filtered.length);
    const emptyRows = Array(emptyCount).fill(0).map(() => `<tr>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
      <td style="border:1px solid #ccc;padding:6px;height:30px"></td>
    </tr>`).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;margin:0;padding:15mm;font-size:11px}
.page{width:210mm;height:297mm;padding:12mm;box-sizing:border-box;margin:0 auto;border:1px solid #ddd;page-break-after:always}
.header{display:flex;gap:10px;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #333}
.logo{width:55px;height:55px;border-radius:3px;flex-shrink:0;object-fit:cover}
.logo-spacer{width:55px;flex-shrink:0}
.header-text{flex:1;text-align:center}
.header-text h1{margin:0;font-size:15px;color:#1F1B18;font-weight:bold}
.header-text p.doc-title{margin:4px 0 0;font-size:18px;color:#1F1B18;font-weight:bold}
.info-row{display:flex;align-items:flex-end;gap:6px;font-size:12px;font-weight:bold;padding:6px 2px}
.info-row.boxed{border-top:1px solid #888;border-bottom:1px solid #888;margin-top:2px}
.info-row .info-lbl{white-space:nowrap}
.info-row .info-fill{flex:1;border-bottom:1px dotted #555;min-height:15px;padding:0 4px;font-weight:600}
.info-row .info-fill.grow{flex:2}
table{width:100%;border-collapse:collapse;font-size:10px;margin-top:8px}
th{background:#FBE3CF;border:1px solid #333;padding:4px;text-align:center;font-weight:bold;line-height:1.3}
td{border:1px solid #333;padding:3px}
.footer{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:15px;text-align:center;font-size:10px}
.footer-sig{margin-top:30px;border-top:1px solid #333;padding-top:3px}
@media print{body{margin:0;padding:0}.page{border:none;margin:0}}
    </style></head><body>
    <div class="page">
      <div class="header">
        <img src="logo.jpg" class="logo">
        <div class="header-text">
          <h1>บริษัท ชูรสยายปู จำกัด</h1>
          <p class="doc-title">บันทึกสต๊อกวัตถุดิบและวัสดุบรรจุ</p>
        </div>
        <div class="logo-spacer"></div>
      </div>
      <div class="info-row">
        <span class="info-lbl">รหัส:</span><span class="info-fill">${item.code||''}</span>
        <span class="info-lbl" style="margin-left:24px">ชื่อ:</span><span class="info-fill grow">${item.name||''}</span>
      </div>
      <div class="info-row boxed">
        <span class="info-lbl">สต็อกขั้นต่ำ:</span><span class="info-fill">${reorderLevel ? fmtNum(reorderLevel) + ' ' + unit : ''}</span>
        <span class="info-lbl" style="margin-left:24px">ปริมาณการสั่งซื้อแต่ละครั้ง:</span><span class="info-fill"></span>
        <span class="info-lbl" style="margin-left:24px">หน่วยนับ:</span><span class="info-fill">${unit}</span>
      </div>
      <table>
        <thead><tr>
          <th style="width:8%">วันที่</th>
          <th style="width:13%">เลขที่เอกสารอ้างอิง<br/><span style="font-size:8px;font-weight:400;color:#7A5C3E">(FM-WH-01 / FM-WH-04)</span></th>
          <th style="width:7%;text-align:right">รับ</th>
          <th style="width:7%;text-align:right">จ่าย</th>
          <th style="width:8%;text-align:right">คงเหลือ</th>
          <th style="width:9%">Lot.รับเข้า</th>
          <th style="width:11%">เลขที่ใบสั่งผลิต</th>
          <th style="width:8%">ผู้เบิก</th>
          <th style="width:8%">ผู้บันทึก</th>
          <th style="width:8%">ผู้ตรวจสอบ</th>
          <th style="width:auto">หมายเหตุ</th>
        </tr></thead>
        <tbody>${rows}${emptyRows}</tbody>
      </table>
      <div class="footer">
        <div><p style="margin:0">ผู้บันทึก</p><div class="footer-sig">..............................</div></div>
        <div><p style="margin:0">ผู้ตรวจสอบ</p><div class="footer-sig">..............................</div></div>
        <div><p style="margin:0">หัวหน้าคลัง</p><div class="footer-sig">..............................</div></div>
      </div>
    </div>
    </body></html>`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=900,height=1200');
    if (!printWindow) {
      alert('⚠️ เบราว์เซอร์บล็อก popup — อนุญาต popup แล้วลองใหม่');
      return;
    }
    printWindow.document.write(buildPrintHTML());
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleExportExcel = () => {
    let csv = '\uFEFF'; // BOM สำหรับ Excel อ่านไทย
    csv += `สต๊อคการ์ดวัตถุดิบ,${item.code} ${item.name||''}\n`;
    csv += `วันที่,เลขที่,รับ (${unit}),จ่าย (${unit}),คงเหลือ (${unit})\n`;
    filtered.forEach(r => {
      csv += `"${fmtDate(r.date)}","${r.ref||''}",${r.in>0?r.in:''},${r.out>0?r.out:''},${r.balance}\n`;
    });
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `สต๊อคการ์ด_${item.code}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const searchList = rawList.filter(r => !search || r.code.includes(search) || r.name.includes(search));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🗂️ สต๊อคการ์ดวัตถุดิบ</h1>
          <p className="page-sub">บันทึกความเคลื่อนไหวของวัตถุดิบ (รับ–จ่าย–คงเหลือ)</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: 6 }}>📊 Excel</button>
          <button className="btn" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>📄 PDF</button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>🖨️ พิมพ์</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>

        {/* แผงเลือกรายการ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="card-head"><h3 className="card-title">เลือกวัตถุดิบ</h3></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                className="form-input"
                placeholder="ค้นหา..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {searchList.map(r => (
                  <button
                    key={r.code}
                    onClick={() => setCode(r.code)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      background: r.code === code ? "var(--brand)" : "transparent",
                      color: r.code === code ? "white" : "var(--fg)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                    }}
                  >
                    <span><strong>{r.code}</strong> · {r.name.slice(0, 18)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* การ์ดหลัก */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* header */}
          <div className="card">
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div className="kpi-label">รหัส</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>{item.code}</div>
              </div>
              <div>
                <div className="kpi-label">ชื่อวัตถุดิบ</div>
                <div className="kpi-value" style={{ fontSize: 14 }}>{item.name}</div>
              </div>
              <div>
                <div className="kpi-label">ยอดยกมา</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>{fmtNum(opening)} <span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span></div>
              </div>
              <div>
                <div className="kpi-label">คงเหลือปัจจุบัน</div>
                <div className="kpi-value" style={{ fontSize: 18, color: currentStock < reorderLevel ? "#ef4444" : "var(--green)" }}>
                  {fmtNum(currentStock)} <span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* กรอง */}
          <div style={{ display: "flex", gap: 8 }}>
            {[["all","ทั้งหมด"],["in","รับเข้า"],["out","จ่ายออก"]].map(([v, l]) => (
              <button
                key={v}
                className={`btn ${filter === v ? "btn-primary" : ""}`}
                onClick={() => setFilter(v)}
              >{l}</button>
            ))}
            <div style={{ flex: 1 }}></div>
            <div style={{ color: "var(--muted)", fontSize: 13, alignSelf: "center" }}>
              รับเข้า: <strong style={{ color: "var(--green)" }}>{fmtNum(totalIn)}</strong> · 
              จ่ายออก: <strong style={{ color: "#ef4444" }}>{fmtNum(totalOut)}</strong> {unit}
            </div>
          </div>

          {/* ตาราง */}
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>เลขที่</th>
                    <th>ประเภท</th>
                    <th>Lot</th>
                    <th className="num">รับเข้า ({unit})</th>
                    <th className="num">จ่ายออก ({unit})</th>
                    <th className="num">คงเหลือ ({unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ยอดยกมา */}
                  <tr style={{ background: "var(--surface-2, #f5f5f5)", fontWeight: 600 }}>
                    <td colSpan={5} style={{ color: "var(--muted)", fontSize: 12 }}>ยอดยกมา</td>
                    <td className="num">—</td>
                    <td className="num tnum">{fmtNum(opening)}</td>
                  </tr>

                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                        ไม่มีรายการ
                      </td>
                    </tr>
                  ) : filtered.map((r, i) => (
                    <tr key={i}>
                      <td className="small muted">{fmtDate(r.date)}</td>
                      <td><span className="code" style={{ fontSize: 11 }}>{r.ref}</span></td>
                      <td className="small">{r.type || "—"}</td>
                      <td className="small" style={{ color: r.lot ? "var(--ink-2)" : "var(--muted-2)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.lot || "—"}</td>
                      <td className="num tnum" style={{ color: r.in > 0 ? "var(--green)" : "var(--muted)" }}>
                        {r.in > 0 ? fmtNum(r.in) : "—"}
                      </td>
                      <td className="num tnum" style={{ color: r.out > 0 ? "#ef4444" : "var(--muted)" }}>
                        {r.out > 0 ? fmtNum(r.out) : "—"}
                      </td>
                      <td className="num tnum" style={{ fontWeight: 600 }}>
                        {fmtNum(r.balance)}
                      </td>
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

Object.assign(window, { ScreenStockCardV2 });
