// 📊 รายงานการใช้วัตถุดิบ — รายเดือน / รายปี
const TH_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const ScreenReportRawUsage = () => {
  const rawList = typeof RAW !== "undefined" ? RAW : [];

  // ---- โหลดข้อมูล ----
  // แปลง date string → ปี ค.ศ.
  const extractCEYear = (d) => {
    if (!d) return null;
    const formatted = window.fmtDateGlobal(d); // DD/MM/YYYY
    const m = String(formatted).match(/\/(\d{4})$/);
    return m ? parseInt(m[1]) : null;
  };

  const allData = React.useMemo(() => {
    // รับเข้า (purchases เก่า)
    let purchases = [];
    try { purchases = JSON.parse(localStorage.getItem("erp_purchases") || "[]"); } catch (e) {}

    // รับเข้า FM-WH-01 ใหม่ (goods_receipts_list) — ดึง QC pass เท่านั้น
    try {
      const grList = JSON.parse(localStorage.getItem("goods_receipts_list") || "[]");
      grList.forEach(gr => {
        (gr.items || []).filter(it => it.qcResult === "pass" && it.rawCode).forEach(it => {
          // ป้องกัน duplicate กับ erp_purchases ที่เราเขียนไว้แล้ว
          if (!purchases.find(p => p._grDocNo === gr.docNo && p.raw === it.rawCode)) {
            purchases.push({ date: gr.receiptDate, raw: it.rawCode, qty: parseFloat(it.qty) || 0, unit: it.unit || "", _grDocNo: gr.docNo });
          }
        });
      });
    } catch (e) {}

    // เบิกใช้
    let withdrawals = [];
    try {
      const ws = JSON.parse(localStorage.getItem("erp_withdrawals") || "[]");
      ws.forEach(w => {
        (w.items || []).forEach(it => {
          withdrawals.push({ date: w.date, raw: it.raw || it.rawCode || "", qty: parseFloat(it.qty) || 0, unit: it.unit || "", ref: w.code || w.docNo || "" });
        });
      });
    } catch (e) {}

    return { purchases, withdrawals };
  }, []);

  // ---- ตัวกรอง ----
  const years = React.useMemo(() => {
    const ys = new Set();
    [...allData.purchases, ...allData.withdrawals].forEach(r => {
      const y = extractCEYear(r.date);
      if (y) ys.add(String(y));
    });
    return [...ys].sort().reverse();
  }, [allData]);

  const curYear = new Date().getFullYear().toString();
  const [year, setYear] = React.useState(years[0] || curYear);
  const [view, setView] = React.useState("month"); // month | year | raw
  const [rawFilter, setRawFilter] = React.useState("");

  const getRawName = (code) => {
    const r = rawList.find(r => r.code === code);
    return r ? r.name : code;
  };

  // ---- aggregate ----
  const filtered = React.useMemo(() => {
    const inYear = (date) => String(extractCEYear(date)) === year;
    const purchases = allData.purchases.filter(p => inYear(p.date));
    const withdrawals = allData.withdrawals.filter(w => inYear(w.date));
    return { purchases, withdrawals };
  }, [allData, year]);

  // รายเดือน — matrix [month][rawCode] = { in, out }
  const monthlyData = React.useMemo(() => {
    const map = {}; // { "01": { rawCode: { in, out } } }
    filtered.purchases.forEach(p => {
      const m = String(p.date || "").slice(5, 7);
      if (!m) return;
      if (!map[m]) map[m] = {};
      if (!map[m][p.raw]) map[m][p.raw] = { in: 0, out: 0 };
      map[m][p.raw].in += p.qty;
    });
    filtered.withdrawals.forEach(w => {
      const m = String(w.date || "").slice(5, 7);
      if (!m) return;
      if (!map[m]) map[m] = {};
      if (!map[m][w.raw]) map[m][w.raw] = { in: 0, out: 0 };
      map[m][w.raw].out += w.qty;
    });
    return map;
  }, [filtered]);

  // รายวัตถุดิบทั้งปี
  const rawYearData = React.useMemo(() => {
    const map = {};
    filtered.purchases.forEach(p => {
      if (!map[p.raw]) map[p.raw] = { in: 0, out: 0 };
      map[p.raw].in += p.qty;
    });
    filtered.withdrawals.forEach(w => {
      if (!map[w.raw]) map[w.raw] = { in: 0, out: 0 };
      map[w.raw].out += w.qty;
    });
    return map;
  }, [filtered]);

  // รายวัตถุดิบ (filter)
  const rawRows = React.useMemo(() => {
    return Object.entries(rawYearData)
      .map(([code, v]) => ({ code, name: getRawName(code), ...v, balance: v.in - v.out }))
      .filter(r => {
        const q = rawFilter.toLowerCase();
        return !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
      })
      .sort((a, b) => b.out - a.out);
  }, [rawYearData, rawFilter]);

  const totalIn  = rawRows.reduce((s, r) => s + r.in, 0);
  const totalOut = rawRows.reduce((s, r) => s + r.out, 0);

  // รายเดือน summary
  const monthSummary = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const monthMap = monthlyData[m] || {};
    const inAmt  = Object.values(monthMap).reduce((s, v) => s + v.in,  0);
    const outAmt = Object.values(monthMap).reduce((s, v) => s + v.out, 0);
    return { m, label: TH_MONTHS[i], inAmt, outAmt, balance: inAmt - outAmt };
  });

  const maxOut = Math.max(...monthSummary.map(r => r.outAmt), 1);

  const fmt = (v) => (parseFloat(v) || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

  // ---- พิมพ์ ----
  const printReport = () => {
    const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
    const esc = v => String(v == null ? "" : v).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const now = new Date();
    const at = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;

    let bodyHtml = "";
    if (view === "month") {
      bodyHtml = `<table>
        <thead><tr><th>เดือน</th><th class="r">รับเข้า</th><th class="r">เบิกใช้</th><th class="r">คงเหลือ</th></tr></thead>
        <tbody>${monthSummary.map(r => `<tr><td>${r.label} ${year}</td><td class="r">${fmt(r.inAmt)}</td><td class="r">${fmt(r.outAmt)}</td><td class="r" style="color:${r.balance>=0?"#2D5128":"#7A1411"}">${fmt(r.balance)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td><b>รวม</b></td><td class="r"><b>${fmt(monthSummary.reduce((s,r)=>s+r.inAmt,0))}</b></td><td class="r"><b>${fmt(monthSummary.reduce((s,r)=>s+r.outAmt,0))}</b></td><td class="r"><b>${fmt(monthSummary.reduce((s,r)=>s+r.balance,0))}</b></td></tr></tfoot>
      </table>`;
    } else {
      bodyHtml = `<table>
        <thead><tr><th style="width:60px">รหัส</th><th>ชื่อวัตถุดิบ</th><th class="r">รับเข้า</th><th class="r">เบิกใช้</th><th class="r">คงเหลือ</th></tr></thead>
        <tbody>${rawRows.map((r,i) => `<tr><td class="code">${esc(r.code)}</td><td>${esc(r.name)}</td><td class="r">${fmt(r.in)}</td><td class="r">${fmt(r.out)}</td><td class="r" style="color:${r.balance>=0?"#2D5128":"#7A1411"}">${fmt(r.balance)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td colspan="2"><b>รวม</b></td><td class="r"><b>${fmt(totalIn)}</b></td><td class="r"><b>${fmt(totalOut)}</b></td><td class="r"><b>${fmt(totalIn-totalOut)}</b></td></tr></tfoot>
      </table>`;
    }

    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>รายงานการใช้วัตถุดิบ ${year}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:20px;font-size:12px;background:#e8e8e8;color:#000}
.doc{width:780px;margin:0 auto;background:#fff;padding:24px 28px;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.head{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px}
.head img{width:52px;height:52px;object-fit:contain}.cname{font-size:15px;font-weight:700}.caddr{font-size:10px;color:#444}
.rtitle{text-align:right}.rtitle .t{font-size:15px;font-weight:700}.rtitle .m{font-size:10px;color:#444;margin-top:2px}
table{border-collapse:collapse;width:100%}th{background:#f0f0f0;border:1px solid #000;padding:5px 7px;font-size:11px;font-weight:600}
td{border:1px solid #000;padding:4px 7px;font-size:11px;vertical-align:middle}.r{text-align:right}.code{font-family:monospace;color:#555}
tfoot td{font-weight:700;background:#f0f0f0}
.bar{text-align:center;margin-top:14px}.bar button{font-family:inherit;font-size:13px;font-weight:600;padding:8px 22px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;box-shadow:none;padding:10mm}.no-print{display:none!important}@page{size:A4;margin:0}}</style>
</head><body><div class="doc">
  <div class="head"><img src="${logoUrl}" alt=""><div><div class="cname">บริษัท ชูรสยายปู จำกัด</div><div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div></div>
  <div class="rtitle"><div class="t">รายงานการใช้วัตถุดิบ ปี ${year}</div><div class="m">${view === "month" ? "แยกรายเดือน" : "แยกรายวัตถุดิบ"}</div><div class="m">พิมพ์ ${at}</div></div></div>
  ${bodyHtml}
  <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
</div></body></html>`;
    const win = window.open("", "", "width=860,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่"); return; }
    win.document.write(html); win.document.close();
  };

  const tabStyle = (active) => ({
    padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
    background: active ? "var(--brand)" : "var(--surface-2)",
    color: active ? "#fff" : "var(--ink-2)",
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📊 รายงานการใช้วัตถุดิบ</h1>
          <p className="page-sub">สรุปการรับเข้าและเบิกใช้วัตถุดิบ แยกรายเดือน / รายปี</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={printReport}>🖨️ พิมพ์รายงาน</button>
        </div>
      </div>

      {/* ---- ตัวเลือก ---- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <select value={year} onChange={e => setYear(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
          {(years.length ? years : [curYear]).map(y => (
            <option key={y} value={y}>ปี {y}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={tabStyle(view === "month")} onClick={() => setView("month")}>📅 รายเดือน</button>
          <button style={tabStyle(view === "raw")}   onClick={() => setView("raw")}>🥩 รายวัตถุดิบ</button>
        </div>
        {view === "raw" && (
          <input value={rawFilter} onChange={e => setRawFilter(e.target.value)} placeholder="ค้นหาวัตถุดิบ…"
            style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, flex: 1, minWidth: 200 }} />
        )}
      </div>

      {/* ---- KPI ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "รับเข้าทั้งปี", value: fmt(totalIn), color: "var(--leaf)" },
          { label: "เบิกใช้ทั้งปี", value: fmt(totalOut), color: "var(--brand)" },
          { label: "คงเหลือ (รับ−เบิก)", value: fmt(totalIn - totalOut), color: totalIn - totalOut >= 0 ? "var(--leaf)" : "var(--brand)" },
          { label: "วัตถุดิบที่มีการเคลื่อนไหว", value: Object.keys(rawYearData).length + " รายการ", color: "var(--ink)" },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, marginTop: 4, fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ---- รายเดือน ---- */}
      {view === "month" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* กราฟแท่ง */}
          <div className="card">
            <div className="card-head"><h3 className="card-title">📈 กราฟเบิกใช้รายเดือน ปี {year}</h3></div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {monthSummary.map(r => (
                <div key={r.m} style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>{r.label}</span>
                  <div style={{ height: 16, background: "var(--surface-sunken)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (r.inAmt / maxOut * 100) + "%", background: "var(--leaf-soft)", borderRadius: 99 }}></div>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (r.outAmt / maxOut * 100) + "%", background: "var(--brand)", borderRadius: 99, opacity: 0.85 }}></div>
                  </div>
                  <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", textAlign: "right", color: r.outAmt > 0 ? "var(--ink)" : "var(--muted-2)" }}>{fmt(r.outAmt)}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 8, background: "var(--leaf-soft)", borderRadius: 99, display: "inline-block" }}></span>รับเข้า</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 8, background: "var(--brand)", borderRadius: 99, display: "inline-block", opacity: 0.85 }}></span>เบิกใช้</span>
              </div>
            </div>
          </div>

          {/* ตารางรายเดือน */}
          <div className="card" style={{ overflowX: "auto" }}>
            <div className="card-head"><h3 className="card-title">📋 ตารางรายเดือน</h3></div>
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th style={{ textAlign: "right" }}>รับเข้า</th>
                  <th style={{ textAlign: "right" }}>เบิกใช้</th>
                  <th style={{ textAlign: "right" }}>คงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {monthSummary.map(r => (
                  <tr key={r.m} style={{ opacity: r.inAmt === 0 && r.outAmt === 0 ? 0.35 : 1 }}>
                    <td style={{ fontWeight: 500 }}>{r.label} {year}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--leaf)" }}>{r.inAmt > 0 ? fmt(r.inAmt) : "—"}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: r.outAmt > 0 ? "var(--brand)" : "var(--muted-2)" }}>{r.outAmt > 0 ? fmt(r.outAmt) : "—"}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: r.balance >= 0 ? "#2D5128" : "#7A1411" }}>{fmt(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ fontWeight: 700 }}>รวมทั้งปี</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--leaf)" }}>{fmt(monthSummary.reduce((s,r)=>s+r.inAmt,0))}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--brand)" }}>{fmt(monthSummary.reduce((s,r)=>s+r.outAmt,0))}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(monthSummary.reduce((s,r)=>s+r.balance,0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ---- รายวัตถุดิบ ---- */}
      {view === "raw" && (
        <div className="card" style={{ overflowX: "auto" }}>
          <div className="card-head">
            <h3 className="card-title">🥩 รายวัตถุดิบ ปี {year}</h3>
            <span className="small muted">{rawRows.length} รายการ</span>
          </div>
          <table className="tbl" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 65 }}>รหัส</th>
                <th>ชื่อวัตถุดิบ</th>
                <th style={{ width: 110, textAlign: "right" }}>รับเข้า</th>
                <th style={{ width: 110, textAlign: "right" }}>เบิกใช้</th>
                <th style={{ width: 110, textAlign: "right" }}>คงเหลือ</th>
                <th style={{ width: 140 }}>สัดส่วนเบิกใช้</th>
              </tr>
            </thead>
            <tbody>
              {rawRows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ไม่มีข้อมูลในปีนี้</td></tr>
              ) : rawRows.map(r => {
                const pct = totalOut > 0 ? (r.out / totalOut * 100) : 0;
                return (
                  <tr key={r.code}>
                    <td className="code" style={{ color: "var(--brand)", fontWeight: 600 }}>{r.code}</td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--leaf)" }}>{r.in > 0 ? fmt(r.in) : "—"}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: r.out > 0 ? "var(--brand)" : "var(--muted-2)", fontWeight: r.out > 0 ? 600 : 400 }}>{r.out > 0 ? fmt(r.out) : "—"}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: r.balance >= 0 ? "#2D5128" : "#7A1411" }}>{fmt(r.balance)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--surface-sunken)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: pct + "%", background: "var(--brand)", borderRadius: 99 }}></div>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--muted)", width: 34, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ fontWeight: 700 }}>รวมทั้งหมด</td>
                <td style={{ textAlign: "right", fontWeight: 700, color: "var(--leaf)" }}>{fmt(totalIn)}</td>
                <td style={{ textAlign: "right", fontWeight: 700, color: "var(--brand)" }}>{fmt(totalOut)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(totalIn - totalOut)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenReportRawUsage });
