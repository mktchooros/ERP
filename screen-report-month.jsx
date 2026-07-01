// 💳 ลูกหนี้ / เจ้าหนี้การค้า (AR / AP)
// ลูกหนี้: ดึงจากใบสั่งขาย (sales_order_*) ที่มี paymentStatus
// เจ้าหนี้: ดึงจากบิลจัดซื้อ (erp_purchases) — สถานะการจ่ายเก็บแยกใน localStorage "ap_paid"
// ทุกการกดปุ่มเขียน localStorage → App bump store version → หน้านี้ re-render เอง
const AR_THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const arFmtDate = (d) => window.fmtDateGlobal(d);
const arAddDays = (iso, days) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2]-1, +m[3]);
  d.setDate(d.getDate() + (parseInt(days,10) || 0));
  return d;
};

const ScreenReceivables = () => {
  const [tab, setTab] = React.useState(() => localStorage.getItem("ar_ap_tab") || "ar"); // ar | ap (จำข้าม remount)
  const todayMid = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  // ลูกหนี้
  const arRows = (() => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("sales_order_")) continue;
      let o; try { o = JSON.parse(localStorage.getItem(key)); } catch (e) { continue; }
      if (!o) continue;
      const status = o.paymentStatus || "unpaid";
      const total = +o.totalAmount || 0;
      // กรณีเครดิต: นับวันครบกำหนดจากวันที่ส่งของ (ถ้าไม่มีให้ใช้วันที่ออกบิล)
      const isCredit = o.paymentMethod === "credit";
      const dueBase = (isCredit && o.deliveryDate) ? o.deliveryDate : o.orderDate;
      const due = arAddDays(dueBase, o.creditDays != null ? o.creditDays : 7);
      const overdue = status !== "paid" && due && due < todayMid;
      out.push({ key, number: o.orderNumber || key.replace("sales_order_",""), date: o.orderDate, customer: o.customerName || "—", total, status, due, overdue });
    }
    out.sort((a, b) => (b.overdue - a.overdue) || String(b.date).localeCompare(String(a.date)));
    return out;
  })();

  // เจ้าหนี้
  const apPaid = (() => { try { return new Set(JSON.parse(localStorage.getItem("ap_paid") || "[]")); } catch (e) { return new Set(); } })();
  const apRows = (() => {
    let list = [];
    try { const s = localStorage.getItem("erp_purchases"); if (s) list = JSON.parse(s); } catch (e) {}
    if (!Array.isArray(list) || !list.length) list = typeof PURCHASES !== "undefined" ? PURCHASES : [];
    return list.map((p, i) => {
      const id = p.code || ("PO#" + i);
      const rawName = (typeof findRaw === "function" && findRaw(p.raw)) ? findRaw(p.raw).name : (p.raw || "");
      return { id, idx: i, date: p.date, supplier: p.supplier || "—", raw: rawName, total: +p.total || 0, paid: apPaid.has(id) };
    }).sort((a, b) => (a.paid - b.paid));
  })();

  const setArPaid = (key, paid) => {
    try { const o = JSON.parse(localStorage.getItem(key)); o.paymentStatus = paid ? "paid" : "unpaid"; localStorage.setItem(key, JSON.stringify(o)); } catch (e) {}
  };
  const setApPaid = (id, paid) => {
    const cur = (() => { try { return JSON.parse(localStorage.getItem("ap_paid") || "[]"); } catch (e) { return []; } })();
    const next = paid ? Array.from(new Set([...cur, id])) : cur.filter(x => x !== id);
    localStorage.setItem("ap_paid", JSON.stringify(next));
  };

  const arOutstanding = arRows.filter(r => r.status !== "paid");
  const arTotal = arOutstanding.reduce((s, r) => s + r.total, 0);
  const arOverdue = arOutstanding.filter(r => r.overdue);
  const arOverdueTotal = arOverdue.reduce((s, r) => s + r.total, 0);

  const apOutstanding = apRows.filter(r => !r.paid);
  const apTotal = apOutstanding.reduce((s, r) => s + r.total, 0);
  const apSuppliers = new Set(apOutstanding.map(r => r.supplier)).size;

  // 🖨️ สั่งพิมพ์รายการที่กำลังแสดงอยู่ (ลูกหนี้ หรือ เจ้าหนี้)
  const printList = () => {
    const isAR = tab === "ar";
    const title = isAR ? "รายการลูกหนี้การค้า (AR)" : "รายการเจ้าหนี้การค้า (AP)";
    const today = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    let headHtml, rowsHtml, totalLabel, totalVal;
    if (isAR) {
      headHtml = `<tr><th>เลขที่</th><th>ลูกค้า</th><th>วันที่</th><th>ครบกำหนด</th><th class="r">ยอดเงิน</th><th class="c">สถานะ</th></tr>`;
      rowsHtml = arRows.map(r => `<tr><td>${r.number}</td><td>${r.customer}</td><td>${arFmtDate(r.date)}</td><td>${r.due ? arFmtDate(toISO(r.due)) : "—"}</td><td class="r">${baht(r.total)}</td><td class="c">${r.status === "paid" ? "ชำระแล้ว" : (r.overdue ? "เกินกำหนด" : "ค้างชำระ")}</td></tr>`).join("");
      totalLabel = "ยอดค้างรับรวม"; totalVal = baht(arTotal);
    } else {
      headHtml = `<tr><th>เลขที่</th><th>ผู้ขาย</th><th>วันที่</th><th>วัตถุดิบ</th><th class="r">ยอดเงิน</th><th class="c">สถานะ</th></tr>`;
      rowsHtml = apRows.map(r => `<tr><td>${r.id}</td><td>${r.supplier}</td><td>${r.date ? arFmtDate(r.date) : "—"}</td><td>${r.raw}</td><td class="r">${baht(r.total)}</td><td class="c">${r.paid ? "จ่ายแล้ว" : "ค้างจ่าย"}</td></tr>`).join("");
      totalLabel = "ยอดค้างจ่ายรวม"; totalVal = baht(apTotal);
    }
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:32px;color:#221A14}h1{font-size:20px;margin:0 0 4px}.sub{color:#6b6b6b;font-size:13px;margin:0 0 18px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #ddd;padding:7px 10px;text-align:left}th{background:#f5f1ea;font-weight:600}.r{text-align:right}.c{text-align:center}tfoot td{font-weight:700;background:#faf7f2}@media print{body{padding:0}}</style></head><body>
<h1>${title}</h1>
<p class="sub">โรงงานชูรสยายปู · พิมพ์เมื่อ ${today}</p>
<table><thead>${headHtml}</thead><tbody>${rowsHtml || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">ไม่มีรายการ</td></tr>`}</tbody>
<tfoot><tr><td colspan="4">${totalLabel}</td><td class="r">${totalVal}</td><td></td></tr></tfoot></table>
<script>window.onload=function(){window.print();}<\/script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const StatusPill = ({ r }) => {
    const map = {
      paid:    ["ชำระแล้ว", "var(--leaf)", "var(--leaf-soft)"],
      partial: ["ชำระบางส่วน", "var(--soy)", "var(--gold-soft)"],
      unpaid:  [r.overdue ? "เกินกำหนด" : "ค้างชำระ", r.overdue ? "var(--brand)" : "var(--warn)", r.overdue ? "var(--brand-soft)" : "var(--warn-soft)"],
    };
    const [label, fg, bg] = map[r.status] || map.unpaid;
    return <span style={{fontSize:11.5, fontWeight:600, padding:"3px 10px", borderRadius:20, color:fg, background:bg, whiteSpace:"nowrap"}}>{label}</span>;
  };

  const TabBtn = ({ id, label, badge }) => (
    <button onClick={() => { try { localStorage.setItem("ar_ap_tab", id); } catch (e) {} setTab(id); }} className={"btn" + (tab === id ? " btn-primary" : "")} style={{display:"flex", alignItems:"center", gap:8}}>
      {label}
      <span style={{fontSize:11, padding:"1px 7px", borderRadius:20, background: tab===id ? "rgba(255,255,255,.25)" : "var(--surface-sunken)", color: tab===id ? "#fff" : "var(--muted)"}}>{badge}</span>
    </button>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">ลูกหนี้ / เจ้าหนี้การค้า</h1>
          <p className="page-sub">ติดตามยอดค้างรับจากลูกค้า และยอดค้างจ่ายผู้ขาย — กดปุ่มเพื่อบันทึกการชำระ</p>
        </div>
        <div className="page-actions" style={{display:"flex", gap:8}}>
          <TabBtn id="ar" label="ลูกหนี้ (รับ)" badge={arOutstanding.length}/>
          <TabBtn id="ap" label="เจ้าหนี้ (จ่าย)" badge={apOutstanding.length}/>
          <button className="btn" onClick={printList} title="สั่งพิมพ์รายการที่แสดงอยู่">🖨️ สั่งพิมพ์</button>
        </div>
      </div>

      {tab === "ar" ? (
        <>
          <div className="kpi-row" style={{marginBottom:20}}>
            <KPI label="ยอดค้างรับรวม" value={baht0(arTotal)} hint={arOutstanding.length + " ใบที่ยังไม่ชำระ"}/>
            <KPI label="เกินกำหนดชำระ" value={baht0(arOverdueTotal)} hint={arOverdue.length + " ใบเลยกำหนด"}/>
            <KPI label="ใบสั่งขายทั้งหมด" value={String(arRows.length)} unit="ใบ" hint="รวมที่ชำระแล้ว"/>
          </div>
          <div className="card">
            <div className="card-head">
              <div><div className="card-title">รายการลูกหนี้</div><div className="card-sub">ครบกำหนด = วันที่ส่งของ + เครดิต (กรณีเครดิต) · มิฉะนั้นนับจากวันที่ออกบิล · ค่าเริ่มต้น 7 วัน</div></div>
              <div className="badge" style={{background:"var(--surface-sunken)"}}>{arOutstanding.length} ค้างชำระ</div>
            </div>
            <table className="tbl">
              <thead><tr>
                <th>เลขที่</th><th>ลูกค้า</th><th>วันที่</th><th>ครบกำหนด</th>
                <th style={{textAlign:"right"}}>ยอดเงิน</th><th style={{textAlign:"center"}}>สถานะ</th><th style={{textAlign:"right"}}>จัดการ</th>
              </tr></thead>
              <tbody>
                {arRows.length === 0 ? (
                  <tr><td colSpan={7} className="muted" style={{textAlign:"center", padding:28}}>ยังไม่มีใบสั่งขาย</td></tr>
                ) : arRows.map(r => (
                  <tr key={r.key} style={r.overdue ? {background:"color-mix(in srgb, var(--brand-soft) 35%, transparent)"} : null}>
                    <td><span className="code">{r.number}</span></td>
                    <td>{r.customer}</td>
                    <td className="small muted">{arFmtDate(r.date)}</td>
                    <td className="small" style={{color: r.overdue ? "var(--brand)" : "var(--muted)", fontWeight: r.overdue ? 600 : 400}}>{r.due ? arFmtDate(toISO(r.due)) : "—"}</td>
                    <td className="num tnum" style={{fontWeight:600}}>{baht(r.total)}</td>
                    <td style={{textAlign:"center"}}><StatusPill r={r}/></td>
                    <td style={{textAlign:"right"}}>
                      {r.status === "paid"
                        ? <button className="btn btn-sm btn-ghost" onClick={() => setArPaid(r.key, false)}>ยกเลิก</button>
                        : <button className="btn btn-sm btn-primary" onClick={() => setArPaid(r.key, true)}>รับชำระแล้ว</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="kpi-row" style={{marginBottom:20}}>
            <KPI label="ยอดค้างจ่ายรวม" value={baht0(apTotal)} hint={apOutstanding.length + " บิลที่ยังไม่จ่าย"}/>
            <KPI label="ผู้ขายที่มียอดค้าง" value={String(apSuppliers)} unit="ราย" hint="กระจายความเสี่ยง"/>
            <KPI label="บิลจัดซื้อทั้งหมด" value={String(apRows.length)} unit="บิล" hint="รวมที่จ่ายแล้ว"/>
          </div>
          <div className="card">
            <div className="card-head">
              <div><div className="card-title">รายการเจ้าหนี้</div><div className="card-sub">สถานะการจ่ายบันทึกแยกจากบิลจัดซื้อ — กดเพื่อทำเครื่องหมายจ่ายแล้ว</div></div>
              <div className="badge" style={{background:"var(--surface-sunken)"}}>{apOutstanding.length} ค้างจ่าย</div>
            </div>
            <table className="tbl">
              <thead><tr>
                <th>เลขที่</th><th>ผู้ขาย</th><th>วันที่</th><th>วัตถุดิบ</th>
                <th style={{textAlign:"right"}}>ยอดเงิน</th><th style={{textAlign:"center"}}>สถานะ</th><th style={{textAlign:"right"}}>จัดการ</th>
              </tr></thead>
              <tbody>
                {apRows.length === 0 ? (
                  <tr><td colSpan={7} className="muted" style={{textAlign:"center", padding:28}}>ยังไม่มีบิลจัดซื้อ</td></tr>
                ) : apRows.map(r => (
                  <tr key={r.id + "@" + r.idx}>
                    <td><span className="code">{r.id}</span></td>
                    <td>{r.supplier}</td>
                    <td className="small muted">{r.date ? arFmtDate(r.date) : "—"}</td>
                    <td className="small muted">{r.raw}</td>
                    <td className="num tnum" style={{fontWeight:600}}>{baht(r.total)}</td>
                    <td style={{textAlign:"center"}}>
                      <span style={{fontSize:11.5, fontWeight:600, padding:"3px 10px", borderRadius:20, color: r.paid ? "var(--leaf)" : "var(--warn)", background: r.paid ? "var(--leaf-soft)" : "var(--warn-soft)", whiteSpace:"nowrap"}}>{r.paid ? "จ่ายแล้ว" : "ค้างจ่าย"}</span>
                    </td>
                    <td style={{textAlign:"right"}}>
                      {r.paid
                        ? <button className="btn btn-sm btn-ghost" onClick={() => setApPaid(r.id, false)}>ยกเลิก</button>
                        : <button className="btn btn-sm btn-primary" onClick={() => setApPaid(r.id, true)}>จ่ายแล้ว</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="small muted" style={{marginTop:14, lineHeight:1.6}}>
        หมายเหตุ · ลูกหนี้ดึงจากใบสั่งขายที่มีสถานะการชำระ · เจ้าหนี้ดึงจากบิลจัดซื้อ (สถานะการจ่ายบันทึกแยก)
      </div>
    </div>
  );
};

Object.assign(window, { ScreenReceivables });
