// 📈 รายงานขายรายเดือน — สรุปยอดขายแยกตามเดือน
const ScreenReportMonth = () => {
  const SA = window.salesAnalytics || {};
  const sales = React.useMemo(() => (SA.gatherAllSales ? SA.gatherAllSales() : []), []);
  const MONTH_TH = SA.MONTH_TH || ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  // bucket: key "BE-MM"
  const buckets = {};
  let unknown = 0;
  sales.forEach((s) => {
    const d = SA.parseSaleDate ? SA.parseSaleDate(s.date) : null;
    if (!d) { unknown += s.total; return; }
    const key = `${d.beYear}-${String(d.month).padStart(2, "0")}`;
    if (!buckets[key]) buckets[key] = { beYear: d.beYear, month: d.month, count: 0, total: 0 };
    buckets[key].count += 1; buckets[key].total += s.total;
  });
  const rows = Object.values(buckets).sort((a, b) => (b.beYear - a.beYear) || (b.month - a.month));
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandCount = rows.reduce((s, r) => s + r.count, 0);
  const best = rows.reduce((b, r) => (r.total > (b?.total || 0) ? r : b), null);

  const exportCSV = () => {
    const header = ["ปี (พ.ศ.)", "เดือน", "จำนวนบิล", "ยอดขาย (บาท)", "เฉลี่ย/บิล"];
    const lines = [header.join(",")];
    rows.forEach((r) => lines.push([r.beYear, MONTH_TH[r.month], r.count, Math.round(r.total), r.count ? Math.round(r.total / r.count) : 0].join(",")));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `รายงานขายรายเดือน_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📈 รายงานขายรายเดือน</h1>
          <p className="page-sub">สรุปยอดขายแยกตามเดือน · {rows.length} เดือน</p>
        </div>
        <div className="page-actions"><button className="btn" onClick={exportCSV}><Icon name="download" size={14} /> ส่งออก CSV</button></div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 14, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KPI label="ยอดขายรวม" value={baht0(grandTotal)} hint={`${grandCount} บิล`} />
        <KPI label="เฉลี่ย/เดือน" value={baht0(rows.length ? grandTotal / rows.length : 0)} hint="ค่าเฉลี่ยทุกเดือน" />
        <KPI label="เดือนที่ขายดีสุด" value={best ? baht0(best.total) : "—"} hint={best ? `${MONTH_TH[best.month]} ${best.beYear}` : ""} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3 className="card-title">กราฟยอดขายรายเดือน</h3></div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.length === 0 ? <div className="muted">ยังไม่มีข้อมูลการขาย</div> :
            rows.slice().reverse().map((r) => (
              <div key={`${r.beYear}-${r.month}`} style={{ display: "grid", gridTemplateColumns: "90px 1fr 120px", alignItems: "center", gap: 10 }}>
                <div className="small" style={{ fontWeight: 600 }}>{MONTH_TH[r.month]} {String(r.beYear).slice(2)}</div>
                <div style={{ background: "var(--leaf-soft, #f1eadf)", borderRadius: 6, height: 22, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(2, r.total / maxTotal * 100)}%`, height: "100%", background: "linear-gradient(90deg, var(--gold, #E0A33E), var(--brand, #C75F12))", borderRadius: 6 }}></div>
                </div>
                <div className="num tnum small" style={{ textAlign: "right", fontWeight: 600 }}>{baht0(r.total)}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3 className="card-title">ตารางสรุปรายเดือน</h3></div>
        <table className="tbl">
          <thead><tr><th>เดือน</th><th>ปี (พ.ศ.)</th><th className="num">จำนวนบิล</th><th className="num">ยอดขาย</th><th className="num">เฉลี่ย/บิล</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ยังไม่มีข้อมูลการขาย</td></tr>
              : rows.map((r) => (
                <tr key={`${r.beYear}-${r.month}`}>
                  <td style={{ fontWeight: 600 }}>{MONTH_TH[r.month]}</td>
                  <td>{r.beYear}</td>
                  <td className="num tnum">{r.count}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{baht0(r.total)}</td>
                  <td className="num tnum muted">{baht0(r.count ? r.total / r.count : 0)}</td>
                </tr>
              ))}
            {unknown > 0 && <tr><td colSpan={3} className="small muted">ไม่ระบุวันที่</td><td className="num tnum muted">{baht0(unknown)}</td><td></td></tr>}
          </tbody>
          <tfoot><tr><td colSpan={2} style={{ fontWeight: 700 }}>รวมทั้งสิ้น</td><td className="num tnum" style={{ fontWeight: 700 }}>{grandCount}</td><td className="num tnum" style={{ fontWeight: 700, color: "var(--brand)" }}>{baht0(grandTotal)}</td><td></td></tr></tfoot>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenReportMonth });
