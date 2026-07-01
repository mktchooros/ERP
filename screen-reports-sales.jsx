// 📈 รายงานขายรายปี — สรุปยอดขายแยกตามปี (พ.ศ.)
const ScreenReportYear = () => {
  const SA = window.salesAnalytics || {};
  const sales = React.useMemo(() => (SA.gatherAllSales ? SA.gatherAllSales() : []), []);
  const MONTH_TH = SA.MONTH_TH || ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  // bucket by BE year, keep per-month sub-breakdown
  const years = {};
  let unknown = 0;
  sales.forEach((s) => {
    const d = SA.parseSaleDate ? SA.parseSaleDate(s.date) : null;
    if (!d) { unknown += s.total; return; }
    if (!years[d.beYear]) years[d.beYear] = { beYear: d.beYear, count: 0, total: 0, months: {} };
    years[d.beYear].count += 1; years[d.beYear].total += s.total;
    years[d.beYear].months[d.month] = (years[d.beYear].months[d.month] || 0) + s.total;
  });
  const rows = Object.values(years).sort((a, b) => b.beYear - a.beYear);
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandCount = rows.reduce((s, r) => s + r.count, 0);
  const best = rows.reduce((b, r) => (r.total > (b?.total || 0) ? r : b), null);

  const exportCSV = () => {
    const header = ["ปี (พ.ศ.)", "จำนวนบิล", "ยอดขาย (บาท)", "เฉลี่ย/บิล"];
    const lines = [header.join(",")];
    rows.forEach((r) => lines.push([r.beYear, r.count, Math.round(r.total), r.count ? Math.round(r.total / r.count) : 0].join(",")));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `รายงานขายรายปี_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const peakMonth = (r) => {
    let mm = null, mv = -1;
    Object.entries(r.months).forEach(([m, v]) => { if (v > mv) { mv = v; mm = +m; } });
    return mm ? MONTH_TH[mm] : "—";
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📈 รายงานขายรายปี</h1>
          <p className="page-sub">สรุปยอดขายแยกตามปี · {rows.length} ปี</p>
        </div>
        <div className="page-actions"><button className="btn" onClick={exportCSV}><Icon name="download" size={14} /> ส่งออก CSV</button></div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 14, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KPI label="ยอดขายสะสม" value={baht0(grandTotal)} hint={`${grandCount} บิล`} />
        <KPI label="เฉลี่ย/ปี" value={baht0(rows.length ? grandTotal / rows.length : 0)} hint="ค่าเฉลี่ยทุกปี" />
        <KPI label="ปีที่ขายดีสุด" value={best ? baht0(best.total) : "—"} hint={best ? `พ.ศ. ${best.beYear}` : ""} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3 className="card-title">กราฟยอดขายรายปี</h3></div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.length === 0 ? <div className="muted">ยังไม่มีข้อมูลการขาย</div> :
            rows.slice().reverse().map((r) => (
              <div key={r.beYear} style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px", alignItems: "center", gap: 10 }}>
                <div className="small" style={{ fontWeight: 600 }}>{r.beYear}</div>
                <div style={{ background: "var(--leaf-soft, #f1eadf)", borderRadius: 6, height: 26, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(2, r.total / maxTotal * 100)}%`, height: "100%", background: "linear-gradient(90deg, var(--gold, #E0A33E), var(--brand, #C75F12))", borderRadius: 6 }}></div>
                </div>
                <div className="num tnum small" style={{ textAlign: "right", fontWeight: 600 }}>{baht0(r.total)}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3 className="card-title">ตารางสรุปรายปี</h3></div>
        <table className="tbl">
          <thead><tr><th>ปี (พ.ศ.)</th><th className="num">จำนวนบิล</th><th className="num">ยอดขาย</th><th className="num">เฉลี่ย/บิล</th><th>เดือนขายดี</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ยังไม่มีข้อมูลการขาย</td></tr>
              : rows.map((r) => (
                <tr key={r.beYear}>
                  <td style={{ fontWeight: 600 }}>{r.beYear}</td>
                  <td className="num tnum">{r.count}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{baht0(r.total)}</td>
                  <td className="num tnum muted">{baht0(r.count ? r.total / r.count : 0)}</td>
                  <td className="small muted">{peakMonth(r)}</td>
                </tr>
              ))}
            {unknown > 0 && <tr><td className="small muted">ไม่ระบุปี</td><td></td><td className="num tnum muted">{baht0(unknown)}</td><td colSpan={2}></td></tr>}
          </tbody>
          <tfoot><tr><td style={{ fontWeight: 700 }}>รวมทั้งสิ้น</td><td className="num tnum" style={{ fontWeight: 700 }}>{grandCount}</td><td className="num tnum" style={{ fontWeight: 700, color: "var(--brand)" }}>{baht0(grandTotal)}</td><td colSpan={2}></td></tr></tfoot>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenReportYear });
