// 📦 สต๊อกสินค้าพร้อมขาย (FG) — สต๊อกการ์ดสินค้าสำเร็จรูป
const ScreenStockCardFinished = () => {
  const MENU_LIST = typeof MENU !== "undefined" ? MENU : [];
  const [stocks, setStocks] = React.useState([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    // อ่านข้อมูล PD จาก localStorage หรือ PRODUCTIONS constant
    let prods = [];
    try {
      const s = localStorage.getItem("erp_productions");
      if (s) prods = JSON.parse(s);
    } catch (e) {}
    if (prods.length === 0 && typeof PRODUCTIONS !== "undefined") {
      prods = PRODUCTIONS;
    }

    // อ่านข้อมูลขาย
    let sales = [];
    try {
      const s = localStorage.getItem("erp_sales");
      if (s) sales = JSON.parse(s);
    } catch (e) {}
    if (sales.length === 0 && typeof SALES !== "undefined") {
      sales = SALES;
    }

    // คำนวณสต็อคแบบไดนามิก
    const stockMap = {};

    // นับจำนวนที่ผลิตจริง (status = "เสร็จแล้ว" เท่านั้น)
    prods.forEach(prod => {
      if (prod.status !== "เสร็จแล้ว" && prod.status !== "done") return;
      const productCode = prod.product || "";
      if (!productCode) return;
      
      const actualQty = parseInt(prod.actualQty || prod.qty || 0, 10) || 0;
      if (!stockMap[productCode]) {
        stockMap[productCode] = { product: productCode, produced: 0, sold: 0, inHand: 0, reorder: 5 };
      }
      stockMap[productCode].produced += actualQty;
    });

    // หักจำนวนที่ขายแล้ว
    sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const productCode = item.product || "";
        if (!productCode) return;
        
        const saleQty = parseInt(item.qty || 0, 10) || 0;
        if (!stockMap[productCode]) {
          stockMap[productCode] = { product: productCode, produced: 0, sold: 0, withdrawn: 0, inHand: 0, reorder: 5 };
        }
        stockMap[productCode].sold += saleQty;
      });
    });

    // หักจำนวนที่เบิก FG (ชงชิม/ทดลอง/แจกฟรี/ย้าย/ขาย) — อ่านจาก erp_fg_withdraw_*
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("erp_fg_withdraw_")) continue;
      try {
        const rec = JSON.parse(localStorage.getItem(key));
        (rec.items || []).forEach(item => {
          const productCode = item.product || "";
          if (!productCode) return;
          const wQty = parseInt(item.qty || 0, 10) || 0;
          if (!stockMap[productCode]) {
            stockMap[productCode] = { product: productCode, produced: 0, sold: 0, withdrawn: 0, inHand: 0, reorder: 5 };
          }
          stockMap[productCode].withdrawn = (stockMap[productCode].withdrawn || 0) + wQty;
        });
      } catch (e) {}
    }

    // คำนวณคงเหลือ
    Object.keys(stockMap).forEach(code => {
      stockMap[code].inHand = Math.max(0, stockMap[code].produced - stockMap[code].sold - (stockMap[code].withdrawn || 0));
    });

    const computedStocks = Object.values(stockMap);
    setStocks(computedStocks);
  }, []);

  const fmt = n => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const rows = stocks.map(s => {
    const p = MENU_LIST.find(m => m.code === s.product) || {};
    return { ...s, name: p.name || "—", emoji: p.emoji || "📦", price: p.price || 0, cost: p.cost || 0 };
  }).filter(r => { const q = search.trim().toLowerCase(); return !q || (r.product || "").toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q); });

  const totalUnits = rows.reduce((s, r) => s + (r.inHand || 0), 0);
  const totalValue = rows.reduce((s, r) => s + (r.inHand || 0) * (r.cost || 0), 0);
  const lowCount = rows.filter(r => (r.inHand || 0) <= (r.reorder || 0)).length;

  return (
    <div className="page">
      <div className="page-head"><div>
        <h1 className="page-title">📦 สต๊อกสินค้าพร้อมขาย (FG)</h1>
        <p className="page-sub">จำนวนคงเหลือสินค้าสำเร็จรูป · มูลค่าสต๊อก</p>
      </div></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 18 }}>
        <div className="card"><div className="card-body" style={{ textAlign: "center" }}><div className="small muted">รายการสินค้า</div><div style={{ fontSize: 22, fontWeight: 700 }}>{rows.length}</div></div></div>
        <div className="card"><div className="card-body" style={{ textAlign: "center" }}><div className="small muted">รวมจำนวน (ซอง)</div><div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(totalUnits)}</div></div></div>
        <div className="card"><div className="card-body" style={{ textAlign: "center" }}><div className="small muted">มูลค่าต้นทุน</div><div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>฿{fmt(totalValue)}</div></div></div>
        <div className="card"><div className="card-body" style={{ textAlign: "center" }}><div className="small muted">ต่ำกว่าเกณฑ์</div><div style={{ fontSize: 22, fontWeight: 700, color: lowCount > 0 ? "var(--brand)" : "var(--leaf)" }}>{lowCount}</div></div></div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input placeholder="ค้นหารหัส / ชื่อสินค้า…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead><tr><th style={{ width: 70 }}>รหัส</th><th>สินค้า</th><th className="num">คงเหลือ</th><th className="num">เกณฑ์</th><th className="num">มูลค่า</th><th style={{ width: 70 }}>สถานะ</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ไม่พบรายการ</td></tr>
              : rows.map(r => { const low = (r.inHand || 0) <= (r.reorder || 0); return (
                <tr key={r.product}>
                  <td className="code">{r.product}</td>
                  <td>{r.emoji} {r.name}</td>
                  <td className="num tnum" style={{ fontWeight: 600, color: low ? "var(--brand)" : "var(--ink)" }}>{fmt(r.inHand)}</td>
                  <td className="num tnum muted">{fmt(r.reorder)}</td>
                  <td className="num tnum">฿{fmt((r.inHand || 0) * (r.cost || 0))}</td>
                  <td><span className={`badge ${low ? "b-stop" : "b-done"}`}>{low ? "ต่ำ" : "ปกติ"}</span></td>
                </tr>); })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenStockCardFinished });
