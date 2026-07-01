// 📦 ประวัติการสั่งซื้อลูกค้า
const ScreenCustomerHistory = ({ setCurrent }) => {
  const [customers, setCustomers] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(null); // customer object
  const [orders, setOrders] = React.useState([]); // all orders (from localStorage)
  const [expandedId, setExpandedId] = React.useState(null);

  const fmtDate = (d) => window.fmtDateGlobal(d);

  const baht = (v) =>
    (parseFloat(v) || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // โหลดลูกค้า
  React.useEffect(() => {
    try {
      const list =
        typeof loadCustomers === "function"
          ? loadCustomers()
          : typeof SAMPLE_CUSTOMERS !== "undefined"
          ? SAMPLE_CUSTOMERS
          : [];
      setCustomers(list);
    } catch (e) {}
  }, []);

  // โหลดออร์เดอร์ทั้งหมดจาก localStorage
  React.useEffect(() => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("sales_order_")) continue;
      try {
        const o = JSON.parse(localStorage.getItem(key));
        if (!o) continue;
        out.push({ ...o, _key: key });
      } catch (e) {}
    }
    // เพิ่มจาก 'sales' key (รายการขายเก่า)
    try {
      const oldSales = JSON.parse(localStorage.getItem("sales") || "[]");
      if (Array.isArray(oldSales)) {
        oldSales.forEach((s, i) => {
          out.push({
            _key: "sales_" + i,
            _isLegacy: true,
            orderNumber: s.id || s.invoiceNumber || ("SALE-" + i),
            customerName: s.customerName || "",
            customerId: s.customerId || "",
            orderDate: s.date || "",
            totalAmount: s.total || 0,
            paymentStatus: s.paymentStatus || "unpaid",
            items: s.items || [],
          });
        });
      }
    } catch (e) {}
    out.sort((a, b) => String(b.orderDate).localeCompare(String(a.orderDate)));
    setOrders(out);
  }, []);

  // กรองลูกค้า
  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.id || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
  });

  // หาออร์เดอร์ของลูกค้าที่เลือก
  const customerOrders = React.useMemo(() => {
    if (!selected) return [];
    return orders.filter((o) => {
      if (selected.id && o.customerId && o.customerId === selected.id) return true;
      if (
        (o.customerName || "").trim().toLowerCase() ===
        (selected.name || "").trim().toLowerCase()
      )
        return true;
      return false;
    });
  }, [selected, orders]);

  // สรุปสถิติ
  const stats = React.useMemo(() => {
    const totalAmount = customerOrders.reduce(
      (s, o) => s + (parseFloat(o.totalAmount) || 0),
      0
    );
    const paid = customerOrders.filter(
      (o) => o.paymentStatus === "paid"
    ).length;
    const unpaid = customerOrders.filter(
      (o) => o.paymentStatus !== "paid"
    ).length;
    const unpaidAmount = customerOrders
      .filter((o) => o.paymentStatus !== "paid")
      .reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);

    // รวมสินค้า
    const productMap = {};
    customerOrders.forEach((o) => {
      if (!Array.isArray(o.items)) return;
      o.items.forEach((it) => {
        const key = it.code || it.productCode || it.name || it.description || "?";
        const name = it.name || it.productName || it.description || key;
        const qty = parseFloat(it.qty) || 0;
        const amt =
          it.total != null
            ? parseFloat(it.total)
            : it.subtotal != null
            ? parseFloat(it.subtotal)
            : qty * (parseFloat(it.price) || 0);
        if (!productMap[key]) productMap[key] = { name, code: it.code || it.productCode || "", qty: 0, amount: 0 };
        productMap[key].qty += qty;
        productMap[key].amount += amt;
      });
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.amount - a.amount);

    return { totalAmount, paid, unpaid, unpaidAmount, topProducts, count: customerOrders.length };
  }, [customerOrders]);

  const payBadge = (status) => {
    if (status === "paid") return { label: "ชำระแล้ว", bg: "var(--leaf-soft)", color: "#2D5128" };
    if (status === "partial") return { label: "ชำระบางส่วน", bg: "var(--gold-soft)", color: "#7A5414" };
    return { label: "ค้างชำระ", bg: "var(--brand-soft)", color: "var(--brand-ink)" };
  };

  const printHistory = () => {
    if (!selected) return;
    const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
    const now = new Date();
    const printedAt = `${window.fmtDateGlobal(now.toISOString().slice(0,10))} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

    const rows = customerOrders.map((o, i) => {
      const pb = payBadge(o.paymentStatus);
      const itemSummary = Array.isArray(o.items)
        ? o.items.map((it) => `${it.name || it.description || it.code || "?"} ×${it.qty}`).join(", ")
        : "—";
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(o.orderNumber)}</td>
        <td class="c">${fmtDate(o.orderDate)}</td>
        <td>${esc(itemSummary)}</td>
        <td class="c">${esc(pb.label)}</td>
        <td class="r">${baht(o.totalAmount)}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ประวัติสั่งซื้อ — ${esc(selected.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:24px;font-size:12px;background:#e8e8e8;color:#000}
.doc{width:900px;margin:0 auto;background:#fff;padding:28px 30px;box-shadow:0 4px 20px rgba(0,0,0,.18)}
.head{display:grid;grid-template-columns:60px 1fr auto;gap:12px;align-items:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:12px}
.head img{width:60px;height:60px;object-fit:contain}.cname{font-size:17px;font-weight:700}.caddr{font-size:11px;color:#444;margin-top:2px}
.rtitle{text-align:right}.rtitle .t{font-size:17px;font-weight:700}.rtitle .m{font-size:11px;color:#444;margin-top:2px}
.cust-box{background:#f9f9f9;border:1px solid #ccc;border-radius:6px;padding:10px 14px;margin-bottom:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:12px}
.cust-box .lbl{font-size:10px;color:#666;margin-bottom:2px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.stat{border:1px solid #ccc;border-radius:6px;padding:8px 10px;text-align:center}
.stat .sv{font-size:18px;font-weight:700}.stat .sl{font-size:10px;color:#666;margin-top:2px}
table{border-collapse:collapse;width:100%;font-size:12px}
th{background:#f0f0f0;border:1px solid #000;padding:5px 6px;text-align:left}
td{border:1px solid #000;padding:4px 6px;vertical-align:top}
.c{text-align:center}.r{text-align:right}
tfoot td{font-weight:700;background:#f0f0f0}
.bar{text-align:center;margin-top:18px}
.bar button{font-family:inherit;font-size:14px;font-weight:600;padding:10px 26px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;box-shadow:none;padding:12mm}.no-print{display:none!important}@page{size:A4;margin:0}}
</style></head><body>
<div class="doc">
  <div class="head">
    <img src="${logoUrl}" alt="">
    <div><div class="cname">บริษัท ชูรสยายปู จำกัด</div><div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div></div>
    <div class="rtitle"><div class="t">ประวัติการสั่งซื้อลูกค้า</div><div class="m">พิมพ์เมื่อ ${printedAt}</div></div>
  </div>
  <div class="cust-box">
    <div><div class="lbl">รหัสลูกค้า</div><strong>${esc(selected.id || "—")}</strong></div>
    <div><div class="lbl">ชื่อลูกค้า</div><strong>${esc(selected.name)}</strong></div>
    <div><div class="lbl">เบอร์โทร</div>${esc(selected.phone || "—")}</div>
    <div><div class="lbl">ประเภทกิจการ</div>${esc(selected.business || "—")}</div>
    <div><div class="lbl">เขตขาย</div>${esc(selected.salesZone || "—")}</div>
    <div><div class="lbl">เกรด</div>${esc(selected.grade || "—")}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="sv">${stats.count}</div><div class="sl">รายการทั้งหมด</div></div>
    <div class="stat"><div class="sv">${baht(stats.totalAmount)}</div><div class="sl">ยอดรวม (บาท)</div></div>
    <div class="stat"><div class="sv">${stats.paid}</div><div class="sl">ชำระแล้ว</div></div>
    <div class="stat"><div class="sv">${baht(stats.unpaidAmount)}</div><div class="sl">ค้างชำระ (บาท)</div></div>
  </div>
  <table>
    <thead><tr><th class="c" style="width:32px">#</th><th style="width:110px">เลขที่</th><th class="c" style="width:85px">วันที่</th><th>รายการสินค้า</th><th class="c" style="width:80px">การชำระ</th><th class="r" style="width:95px">รวม (บาท)</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="c">ไม่มีข้อมูล</td></tr>'}</tbody>
    <tfoot><tr><td colspan="5" class="r">รวมทั้งสิ้น</td><td class="r">${baht(stats.totalAmount)}</td></tr></tfoot>
  </table>
  <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
</div></body></html>`;

    const win = window.open("", "", "width=960,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์"); return; }
    win.document.write(html);
    win.document.close();
  };

  const printAllCustomers = () => {
    const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const now = new Date();
    const printedAt = `${window.fmtDateGlobal(now.toISOString().slice(0,10))} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

    // รวมยอดต่อลูกค้า
    const custRows = filteredCustomers.map((c) => {
      const cOrders = orders.filter((o) => {
        if (c.id && o.customerId && o.customerId === c.id) return true;
        return (o.customerName || "").trim().toLowerCase() === (c.name || "").trim().toLowerCase();
      });
      const total = cOrders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
      const paid = cOrders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
      const unpaid = total - paid;
      return { c, count: cOrders.length, total, paid, unpaid };
    }).filter(r => r.count > 0 || true); // แสดงทุกคน

    const grandTotal = custRows.reduce((s, r) => s + r.total, 0);
    const grandUnpaid = custRows.reduce((s, r) => s + r.unpaid, 0);

    const rows = custRows.map((r, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="code">${esc(r.c.id || "—")}</td>
      <td>${esc(r.c.name)}</td>
      <td>${esc(r.c.phone || "—")}</td>
      <td>${esc(r.c.salesZone || "—")}</td>
      <td class="c">${r.count}</td>
      <td class="r">${baht(r.total)}</td>
      <td class="r" style="color:${r.unpaid > 0 ? "#7A1411" : "#2D5128"}">${baht(r.unpaid)}</td>
    </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>รายการลูกค้าทั้งหมด</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:24px;font-size:12px;background:#e8e8e8;color:#000}
.doc{width:1000px;margin:0 auto;background:#fff;padding:28px 30px;box-shadow:0 4px 20px rgba(0,0,0,.18)}
.head{display:grid;grid-template-columns:60px 1fr auto;gap:12px;align-items:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px}
.head img{width:56px;height:56px;object-fit:contain}
.cname{font-size:17px;font-weight:700}.caddr{font-size:11px;color:#444;margin-top:2px}
.rtitle{text-align:right}.rtitle .t{font-size:17px;font-weight:700}.rtitle .m{font-size:11px;color:#444;margin-top:2px}
table{border-collapse:collapse;width:100%;font-size:12px}
th{background:#f0f0f0;border:1px solid #000;padding:5px 7px;text-align:left}
td{border:1px solid #000;padding:4px 7px;vertical-align:middle}
.c{text-align:center}.r{text-align:right}
.code{font-family:monospace;font-size:11px;color:#555}
tfoot td{font-weight:700;background:#f0f0f0}
.bar{text-align:center;margin-top:18px}
.bar button{font-family:inherit;font-size:14px;font-weight:600;padding:10px 26px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;box-shadow:none;padding:10mm}.no-print{display:none!important}@page{size:A4 landscape;margin:0}}
</style></head><body>
<div class="doc">
  <div class="head">
    <img src="${logoUrl}" alt="">
    <div><div class="cname">บริษัท ชูรสยายปู จำกัด</div><div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div></div>
    <div class="rtitle">
      <div class="t">ประวัติการสั่งซื้อลูกค้าทั้งหมด</div>
      <div class="m">พิมพ์เมื่อ ${printedAt}</div>
      <div class="m">จำนวน ${custRows.length} ราย</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th class="c" style="width:32px">#</th>
      <th style="width:65px">รหัส</th>
      <th>ชื่อลูกค้า</th>
      <th style="width:110px">เบอร์โทร</th>
      <th style="width:100px">เขตขาย</th>
      <th class="c" style="width:65px">รายการ</th>
      <th class="r" style="width:110px">ยอดรวม (บาท)</th>
      <th class="r" style="width:110px">ค้างชำระ (บาท)</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="8" class="c">ไม่มีข้อมูล</td></tr>'}</tbody>
    <tfoot><tr>
      <td colspan="6" class="r">รวมทั้งสิ้น</td>
      <td class="r">${baht(grandTotal)}</td>
      <td class="r">${baht(grandUnpaid)}</td>
    </tr></tfoot>
  </table>
  <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
</div></body></html>`;

    const win = window.open("", "", "width=1060,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์"); return; }
    win.document.write(html);
    win.document.close();
  };

  const printOrder = (o) => {
    const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const items = Array.isArray(o.items) ? o.items : [];
    const subtotal = o.subtotal != null ? o.subtotal : items.reduce((t, it) => t + (parseFloat(it.total != null ? it.total : it.subtotal != null ? it.subtotal : (parseFloat(it.qty)||0)*(parseFloat(it.price)||0)) || 0), 0);
    const discPct = o.discount || 0;
    const discAmt = o.discountAmount != null ? o.discountAmount : subtotal * discPct / 100;
    const afterDisc = subtotal - discAmt;
    const taxPct = o.taxRate != null ? o.taxRate : 0;
    const vatInc = o.vatType === "inclusive";
    const taxAmt = o.taxAmount != null ? o.taxAmount : (vatInc ? afterDisc * (taxPct/100) / (1 + taxPct/100) : afterDisc * taxPct / 100);
    const grand = o.totalAmount != null ? o.totalAmount : (vatInc ? afterDisc : afterDisc + taxAmt);
    const blankRows = Math.max(0, 8 - items.length);
    const payLabel = ({ cash:"เงินสด", transfer:"เงินโอน", credit:"เครดิต", cod:"COD", consignment:"ฝากขาย" }[o.paymentMethod] || o.paymentMethod || "—") + (o.paymentMethod === "credit" && o.creditDays ? " " + o.creditDays + " วัน" : "");
    const dueDateVal = o.dueDate || "";
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ใบสั่งขาย ${esc(o.orderNumber)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:24px;color:#000;font-size:12px;background:#e8e8e8}
.doc{width:800px;min-height:1080px;margin:0 auto;background:#fff;padding:30px 34px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.2)}
.wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0}
.wm img{width:440px;opacity:.06}.layer{position:relative;z-index:1}
.chead{display:grid;grid-template-columns:90px 1fr;gap:12px;margin-bottom:14px}
.chead .logo{display:flex;align-items:flex-start;justify-content:center}
.chead .logo img{width:84px;height:84px;object-fit:contain}
.chead .ctr{text-align:center}.cname{font-size:22px;font-weight:700}.caddr{font-size:12px;margin-top:4px}
.titlerow{display:grid;grid-template-columns:1fr 260px;gap:12px;align-items:center;margin-bottom:8px}
.titlerow .t{text-align:center;font-size:18px;font-weight:700}
table{border-collapse:collapse}
.nbox{width:100%;font-size:12px}.nbox td{border:1px solid #000;padding:4px 8px}.nbox td.k{background:#f0f0f0;width:70px}
.cust{width:100%;font-size:12px;border:1px solid #000;margin-bottom:10px}.cust td{padding:3px 6px;vertical-align:top}.cust td.sep{border-left:1px solid #000}
.items{width:100%;font-size:12px}.items th{background:#f0f0f0;border:1px solid #000;padding:5px 6px}.items td{border:1px solid #000;padding:4px 6px;vertical-align:top}
.items td.r,.items th.r{text-align:right}.items td.c,.items th.c{text-align:center}
.sum{width:100%;font-size:12px;margin-top:-1px}.sum td{border:1px solid #000;padding:4px 8px}.sum td.k{width:130px}.sum td.r{text-align:right}
.sum tr.grand td{font-weight:700;background:#f0f0f0}
.bahtline{border:1px solid #000;border-top:none;padding:5px 8px;text-align:center;font-size:12px}
.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:50px}
.sign div{text-align:center}.sign .line{border-bottom:1px dotted #000;height:50px;margin-bottom:4px}.sign .role{font-size:11px}.sign .date{font-size:11px;margin-top:6px}
.bar{text-align:center;margin:22px 0 0}
.bar button{font-family:inherit;font-size:14px;font-weight:600;padding:10px 26px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;min-height:auto;box-shadow:none;padding:14mm 12mm}.no-print{display:none!important}@page{size:A4;margin:0}}
</style></head><body>
<div class="doc">
  <div class="wm"><img src="${logoUrl}" alt=""></div>
  <div class="layer">
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
        <tr><td class="k">เลขที่</td><td>${esc(o.orderNumber)}</td></tr>
        <tr><td class="k">วันที่</td><td>${fmtDate(o.orderDate)}</td></tr>
      </tbody></table>
    </div>
    <table class="cust"><tbody>
      <tr>
        <td style="width:70px">รหัสลูกค้า</td><td>${esc(o.customerId)||"—"}</td>
        <td class="sep" style="width:90px">ใบสั่งจอง</td><td>${esc(o.poNumber)||"—"}</td>
        <td style="width:70px">ลงวันที่</td><td>${fmtDate(o.poDate)}</td>
      </tr>
      <tr>
        <td>ชื่อลูกค้า</td><td style="font-weight:600">${esc(o.customerName)||"—"}</td>
        <td class="sep">การชำระ</td><td>${esc(payLabel)}</td>
        <td>VAT</td><td>${vatInc?"ใน":"นอก"} ${taxPct}%</td>
      </tr>
      <tr>
        <td>ที่อยู่</td><td>${esc(o.customerAddress)||"—"}</td>
        <td class="sep">วันกำหนดส่ง</td><td>${fmtDate(o.deliveryDate)||"—"}</td>
        <td>ครบกำหนดชำระ</td><td>${dueDateVal?fmtDate(dueDateVal):"—"}</td>
      </tr>
      <tr>
        <td>โทร.</td><td>${esc(o.customerPhone)||"—"}</td>
        <td class="sep">พนักงานขาย</td><td colspan="3" style="font-weight:600">${esc(o.salesPerson)||"—"}</td>
      </tr>
    </tbody></table>
    <table class="items">
      <thead><tr>
        <th style="width:80px">รหัสสินค้า</th><th>รายการ</th>
        <th class="r" style="width:70px">จำนวน</th><th class="c" style="width:55px">หน่วย</th>
        <th class="r" style="width:80px">ราคา/หน่วย</th><th class="r" style="width:90px">จำนวนเงิน</th>
      </tr></thead>
      <tbody>
        ${items.map(it => {
          const lineTotal = it.total != null ? it.total : it.subtotal != null ? it.subtotal : (parseFloat(it.qty)||0)*(parseFloat(it.price)||0);
          return `<tr>
            <td>${esc(it.code||it.productCode||"—")}</td>
            <td>${esc(it.name||it.description||it.productName||"—")}</td>
            <td class="r">${(parseFloat(it.qty)||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td class="c">${esc(it.unit)||"—"}</td>
            <td class="r">${baht(it.price)}</td>
            <td class="r">${baht(lineTotal)}</td>
          </tr>`;
        }).join("")}
        ${Array.from({length:blankRows}).map(()=>`<tr style="height:26px"><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("")}
      </tbody>
    </table>
    <table class="sum"><tbody>
      <tr>
        <td rowspan="4" style="width:55%;vertical-align:top"><strong>หมายเหตุ</strong><div>${esc(o.notes)||""}</div></td>
        <td class="k">รวมเงิน</td><td class="r">${baht(subtotal)}</td>
      </tr>
      <tr><td class="k">ส่วนลด ${discPct}%</td><td class="r">${baht(discAmt)}</td></tr>
      <tr><td class="k">ภาษีมูลค่าเพิ่ม ${taxPct}% (${vatInc?"VAT ใน":"VAT นอก"})</td><td class="r">${baht(taxAmt)}</td></tr>
      <tr class="grand"><td class="k">จำนวนเงินทั้งสิ้น</td><td class="r">${baht(grand)}</td></tr>
    </tbody></table>
    <div class="sign">
      <div><div class="line" style="display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;font-size:12px">${esc(o.salesPerson)||""}</div><div class="role">พนักงานขาย</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">ผู้จัดการฝ่ายขาย</div><div class="date">วันที่ ______/______/______</div></div>
      <div><div class="line"></div><div class="role">พนักงานบัญชี</div><div class="date">วันที่ ______/______/______</div></div>
    </div>
    <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
  </div>
</div></body></html>`;
    const win = window.open("", "", "width=900,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์"); return; }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="page" style={{ padding: "24px 28px 80px" }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">📦 ประวัติการสั่งซื้อลูกค้า</h1>
          <p className="page-sub">เลือกลูกค้าเพื่อดูประวัติการสั่งซื้อและยอดรวม</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={printAllCustomers}>🖨️ พิมพ์รายการทั้งหมด</button>
          {selected && <>
            <button className="btn" onClick={printHistory}>🖨️ พิมพ์รายงานลูกค้านี้</button>
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>✕ ปิด</button>
          </>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
        {/* ====== รายชื่อลูกค้า ====== */}
        <div className="card" style={{ position: "sticky", top: 72, maxHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <input
              className="form-input"
              placeholder="ค้นหาชื่อ / รหัส / เบอร์…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 7, fontSize: 13 }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredCustomers.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>ไม่พบลูกค้า</div>
            ) : filteredCustomers.map((c) => {
              const cOrders = orders.filter((o) => {
                if (c.id && o.customerId && o.customerId === c.id) return true;
                return (o.customerName || "").trim().toLowerCase() === (c.name || "").trim().toLowerCase();
              });
              const totalAmt = cOrders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
              const isSelected = selected && selected.id === c.id && selected.name === c.name;
              return (
                <button
                  key={c.id || c.name}
                  onClick={() => { setSelected(c); setExpandedId(null); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: isSelected ? "var(--brand-soft)" : "transparent",
                    cursor: "pointer",
                    transition: "background 80ms",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: isSelected ? "var(--brand)" : "var(--surface-sunken)",
                      display: "grid", placeItems: "center",
                      fontWeight: 700, fontSize: 12,
                      color: isSelected ? "#fff" : "var(--ink-2)",
                    }}>
                      {(c.name || "?").slice(0, 1)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, color: isSelected ? "var(--brand-ink)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.id || ""}  {c.phone ? `· ${c.phone}` : ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "var(--brand-ink)" : "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
                        {cOrders.length > 0 ? cOrders.length + " รายการ" : <span style={{ color: "var(--muted-2)" }}>—</span>}
                      </div>
                      {totalAmt > 0 && (
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          ฿{totalAmt.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
            {filteredCustomers.length.toLocaleString("th-TH")} ราย
          </div>
        </div>

        {/* ====== ฝั่งขวา: รายละเอียด ====== */}
        {!selected ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, color: "var(--muted)", gap: 12 }}>
            <div style={{ fontSize: 48 }}>👈</div>
            <div style={{ fontSize: 15 }}>เลือกลูกค้าจากรายชื่อทางซ้าย</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* ข้อมูลลูกค้า */}
            <div className="card">
              <div className="card-body" style={{ padding: "14px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "var(--brand-soft)", display: "grid", placeItems: "center",
                    fontWeight: 700, fontSize: 22, color: "var(--brand-ink)",
                  }}>
                    {(selected.name || "?").slice(0, 1)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {selected.id && <span>รหัส: <strong style={{ color: "var(--ink-2)" }}>{selected.id}</strong></span>}
                      {selected.phone && <span>📞 {selected.phone}</span>}
                      {selected.business && <span>🏢 {selected.business}</span>}
                      {selected.salesZone && <span>📍 {selected.salesZone}</span>}
                      {selected.grade && <span>⭐ เกรด {selected.grade}</span>}
                    </div>
                  </div>
                  {selected.address && (
                    <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 200, textAlign: "right" }}>
                      {selected.address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "รายการทั้งหมด", value: stats.count + " รายการ", icon: "📋", color: "var(--ink)" },
                { label: "ยอดรวมทั้งหมด", value: "฿" + stats.totalAmount.toLocaleString("th-TH", { maximumFractionDigits: 0 }), icon: "💰", color: "var(--leaf)" },
                { label: "ชำระแล้ว", value: stats.paid + " รายการ", icon: "✅", color: "#2D5128" },
                { label: "ค้างชำระ", value: stats.unpaid > 0 ? "฿" + stats.unpaidAmount.toLocaleString("th-TH", { maximumFractionDigits: 0 }) : "—", icon: stats.unpaid > 0 ? "⚠️" : "✓", color: stats.unpaid > 0 ? "var(--brand)" : "var(--muted)" },
              ].map((k) => (
                <div key={k.label} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{k.icon} {k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-display)" }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* สินค้าที่ซื้อบ่อย */}
            {stats.topProducts.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <h3 className="card-title">📦 สินค้าที่เคยสั่งซื้อ</h3>
                  <span className="small muted">{stats.topProducts.length} รายการ</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>รหัส</th>
                        <th>ชื่อสินค้า</th>
                        <th style={{ width: 100, textAlign: "right" }}>จำนวนรวม</th>
                        <th style={{ width: 120, textAlign: "right" }}>ยอดรวม (บาท)</th>
                        <th style={{ width: 140 }}>สัดส่วน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topProducts.map((p, i) => {
                        const pct = stats.totalAmount > 0 ? (p.amount / stats.totalAmount) * 100 : 0;
                        return (
                          <tr key={i}>
                            <td className="code">{p.code || "—"}</td>
                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.qty.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{baht(p.amount)}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: "var(--surface-sunken)", borderRadius: 99, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: pct + "%", background: "var(--brand)", borderRadius: 99 }}></div>
                                </div>
                                <span style={{ fontSize: 11, color: "var(--muted)", width: 36, textAlign: "right" }}>{pct.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* รายการออร์เดอร์ */}
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">🧾 รายการใบสั่งซื้อ</h3>
                <span className="small muted">{customerOrders.length} รายการ</span>
              </div>
              {customerOrders.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                  ยังไม่มีประวัติการสั่งซื้อ
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: 110 }}>เลขที่</th>
                        <th style={{ width: 95 }}>วันที่</th>
                        <th>รายการสินค้า</th>
                        <th style={{ width: 95, textAlign: "center" }}>การชำระ</th>
                        <th style={{ width: 110, textAlign: "right" }}>รวม (บาท)</th>
                        <th style={{ width: 80 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((o) => {
                        const pb = payBadge(o.paymentStatus);
                        const isExp = expandedId === o._key;
                        const items = Array.isArray(o.items) ? o.items : [];
                        return (
                          <React.Fragment key={o._key}>
                            <tr
                              style={{ cursor: items.length > 0 ? "pointer" : "default" }}
                              onClick={() => items.length > 0 && setExpandedId(isExp ? null : o._key)}
                            >
                              <td style={{ fontWeight: 600, color: "var(--brand)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{o.orderNumber}</td>
                              <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{fmtDate(o.orderDate)}</td>
                              <td>
                                {items.length > 0 ? (
                                  <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                                    {items.slice(0, 2).map((it, i) => `${it.name || it.description || it.code || "?"}`).join(", ")}
                                    {items.length > 2 && <span style={{ color: "var(--muted)" }}> +{items.length - 2} รายการ</span>}
                                  </span>
                                ) : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: pb.bg, color: pb.color }}>
                                  {pb.label}
                                </span>
                              </td>
                              <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13 }}>
                                {baht(o.totalAmount)}
                              </td>
                              <td style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                  <button
                                    title="พิมพ์ใบสั่งขาย"
                                    onClick={(e) => { e.stopPropagation(); printOrder(o); }}
                                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 7px", cursor: "pointer", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4 }}
                                  >🖨️</button>
                                  {items.length > 0 && (
                                    <span style={{ color: "var(--muted)", fontSize: 12, userSelect: "none", padding: "2px 4px" }}>{isExp ? "▲" : "▼"}</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExp && items.length > 0 && (
                              <tr>
                                <td colSpan={6} style={{ padding: 0, background: "var(--surface-2)" }}>
                                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                                    <thead>
                                      <tr style={{ background: "var(--surface-sunken)" }}>
                                        <th style={{ padding: "6px 14px 6px 40px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11 }}>รหัส</th>
                                        <th style={{ padding: "6px 14px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11 }}>สินค้า</th>
                                        <th style={{ padding: "6px 14px", textAlign: "right", fontWeight: 600, color: "var(--muted)", fontSize: 11 }}>จำนวน</th>
                                        <th style={{ padding: "6px 14px", textAlign: "right", fontWeight: 600, color: "var(--muted)", fontSize: 11 }}>ราคา/หน่วย</th>
                                        <th style={{ padding: "6px 14px", textAlign: "right", fontWeight: 600, color: "var(--muted)", fontSize: 11 }}>รวม</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((it, idx) => {
                                        const lineTotal = it.total != null ? it.total : it.subtotal != null ? it.subtotal : (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
                                        return (
                                          <tr key={idx} style={{ borderTop: "1px solid var(--border)" }}>
                                            <td style={{ padding: "7px 14px 7px 40px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{it.code || it.productCode || "—"}</td>
                                            <td style={{ padding: "7px 14px" }}>{it.name || it.description || it.productName || "—"}</td>
                                            <td style={{ padding: "7px 14px", textAlign: "right" }}>{(parseFloat(it.qty) || 0).toLocaleString("th-TH")} {it.unit || ""}</td>
                                            <td style={{ padding: "7px 14px", textAlign: "right" }}>฿{baht(it.price)}</td>
                                            <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600 }}>฿{baht(lineTotal)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, fontSize: 13, background: "var(--surface-2)", color: "var(--muted)" }}>รวมทั้งสิ้น</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, fontSize: 14, background: "var(--surface-2)", fontVariantNumeric: "tabular-nums" }}>฿{baht(stats.totalAmount)}</td>
                        <td style={{ background: "var(--surface-2)" }}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { ScreenCustomerHistory });
