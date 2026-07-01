// 📊 รายงานฝ่ายขาย — วิเคราะห์การขาย: สินค้าขายดี ลูกค้าหลัก สถานะชำระ/จัดส่ง
const ScreenReportsSales = () => {
  const SA = window.salesAnalytics || {};
  const sales = React.useMemo(() => (SA.gatherAllSales ? SA.gatherAllSales() : []), []);
  const products = (typeof MENU !== "undefined") ? MENU : [];
  const pName = (code) => products.find((p) => p.code === code)?.name || code || "—";

  const grandTotal = sales.reduce((s, x) => s + x.total, 0);
  const billCount = sales.length;
  const avgBill = billCount ? grandTotal / billCount : 0;

  // สินค้าขายดี (จาก items)
  const prodMap = {};
  sales.forEach((s) => (s.items || []).forEach((it) => {
    const code = it.code || it.name || "—";
    const qty = parseFloat(it.qty) || 0;
    const rev = qty * (parseFloat(it.price) || 0);
    if (!prodMap[code]) prodMap[code] = { code, name: it.name || pName(code), qty: 0, rev: 0 };
    prodMap[code].qty += qty; prodMap[code].rev += rev;
  }));
  const topProducts = Object.values(prodMap).sort((a, b) => b.rev - a.rev).slice(0, 10);
  const maxProdRev = Math.max(1, ...topProducts.map((p) => p.rev));

  // ลูกค้าหลัก
  const custMap = {};
  sales.forEach((s) => {
    const c = s.customerName || "—";
    if (!custMap[c]) custMap[c] = { name: c, count: 0, total: 0 };
    custMap[c].count += 1; custMap[c].total += s.total;
  });
  const topCustomers = Object.values(custMap).sort((a, b) => b.total - a.total).slice(0, 10);

  // สถานะ
  const payLabel = { paid: "ชำระแล้ว", partial: "ชำระบางส่วน", unpaid: "ค้างชำระ" };
  const shipLabel = { order: "รับออร์เดอร์", producing: "กำลังผลิต", packing: "กำลังแพ็ค", shipping: "กำลังส่ง", delivered: "ส่งสำเร็จ" };
  const payAgg = {}; const shipAgg = {};
  sales.forEach((s) => {
    payAgg[s.paymentStatus] = payAgg[s.paymentStatus] || { count: 0, total: 0 };
    payAgg[s.paymentStatus].count += 1; payAgg[s.paymentStatus].total += s.total;
    shipAgg[s.shippingStatus] = shipAgg[s.shippingStatus] || { count: 0, total: 0 };
    shipAgg[s.shippingStatus].count += 1; shipAgg[s.shippingStatus].total += s.total;
  });
  const paidTotal = (payAgg.paid?.total) || 0;
  const num = (n) => Number(n || 0).toLocaleString();

  const StatusCard = ({ title, agg, labels, colors }) => (
    <div className="card">
      <div className="card-head"><h3 className="card-title">{title}</h3></div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.keys(labels).filter((k) => agg[k]).length === 0 ? <div className="muted small">ไม่มีข้อมูล</div> :
          Object.keys(labels).filter((k) => agg[k]).map((k) => {
            const pct = grandTotal ? Math.round((agg[k].total) / grandTotal * 100) : 0;
            return (
              <div key={k}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: colors[k] || "#bbb", marginRight: 6 }}></span>{labels[k]} <span className="muted small">({agg[k].count})</span></span>
                  <span className="tnum" style={{ fontWeight: 600 }}>{baht0(agg[k].total)}</span>
                </div>
                <div style={{ background: "var(--leaf-soft, #f1eadf)", borderRadius: 5, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: colors[k] || "#bbb" }}></div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📊 รายงานฝ่ายขาย</h1>
          <p className="page-sub">วิเคราะห์การขายภาพรวม · {billCount} บิล</p>
        </div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KPI label="ยอดขายรวม" value={baht0(grandTotal)} hint={`${billCount} บิล`} />
        <KPI label="เฉลี่ย/บิล" value={baht0(avgBill)} hint="มูลค่าต่อบิล" />
        <KPI label="เก็บเงินแล้ว" value={baht0(paidTotal)} hint={`${grandTotal ? Math.round(paidTotal / grandTotal * 100) : 0}% ของยอดขาย`} />
        <KPI label="ลูกค้า" value={String(Object.keys(custMap).length)} unit="ราย" hint="ที่มีการสั่งซื้อ" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <StatusCard title="สัดส่วนตามสถานะชำระเงิน" agg={payAgg} labels={payLabel} colors={{ paid: "#2D7D46", partial: "#E0A33E", unpaid: "#C75F12" }} />
        <StatusCard title="สัดส่วนตามสถานะจัดส่ง" agg={shipAgg} labels={shipLabel} colors={{ order: "#9aa0a6", producing: "#E0A33E", packing: "#C9A227", shipping: "#3B7DD8", delivered: "#2D7D46" }} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3 className="card-title">สินค้าขายดี (Top 10)</h3></div>
        <table className="tbl">
          <thead><tr><th style={{ width: "4%" }}>#</th><th>รหัส</th><th>สินค้า</th><th className="num">จำนวนขาย</th><th className="num">ยอดขาย</th><th style={{ width: "26%" }}>สัดส่วน</th></tr></thead>
          <tbody>
            {topProducts.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ยังไม่มีข้อมูลรายการสินค้า</td></tr>
              : topProducts.map((p, i) => (
                <tr key={p.code}>
                  <td className="muted">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.code}</td>
                  <td>{p.name}</td>
                  <td className="num tnum">{num(p.qty)}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{baht0(p.rev)}</td>
                  <td><div style={{ background: "var(--leaf-soft, #f1eadf)", borderRadius: 5, height: 10 }}><div style={{ width: `${Math.max(2, p.rev / maxProdRev * 100)}%`, height: "100%", background: "linear-gradient(90deg, var(--gold, #E0A33E), var(--brand, #C75F12))", borderRadius: 5 }}></div></div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-head"><h3 className="card-title">ลูกค้าหลัก (Top 10)</h3></div>
        <table className="tbl">
          <thead><tr><th style={{ width: "4%" }}>#</th><th>ลูกค้า</th><th className="num">จำนวนบิล</th><th className="num">ยอดซื้อรวม</th><th className="num">เฉลี่ย/บิล</th></tr></thead>
          <tbody>
            {topCustomers.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ยังไม่มีข้อมูลลูกค้า</td></tr>
              : topCustomers.map((c, i) => (
                <tr key={c.name + i}>
                  <td className="muted">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="num tnum">{c.count}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{baht0(c.total)}</td>
                  <td className="num tnum muted">{baht0(c.count ? c.total / c.count : 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenReportsSales });
