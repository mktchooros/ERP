// 📝 ใบขอซื้อ (Purchase Requisition — PR)
const ScreenPRForm = ({ setCurrent }) => {
  const RAW_LIST = typeof RAW !== "undefined" ? RAW : [];
  const today = new Date().toISOString().split("T")[0];

  // ---- header ----
  const [prNumber, setPrNumber] = React.useState(() => {
    const d = new Date(); const yymm = (d.getFullYear()+"").slice(2) + String(d.getMonth()+1).padStart(2,"0");
    const key = `pr_counter_${yymm}`; const cnt = parseInt(localStorage.getItem(key)||"0")+1;
    localStorage.setItem(key, cnt); return `PR${yymm}${String(cnt).padStart(4,"0")}`;
  });
  const [prDate, setPrDate]         = React.useState(today);
  const [requiredDate, setRequiredDate] = React.useState("");
  const [requester, setRequester]   = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [purpose, setPurpose]       = React.useState("");
  const [status, setStatus]         = React.useState("draft");
  const [approver, setApprover]     = React.useState("");
  const [approveDate, setApproveDate] = React.useState("");

  // ---- supplier (preferred) ----
  const [suppliers, setSuppliers]     = React.useState([]);
  const [supplierOpen, setSupplierOpen] = React.useState(false);
  const [supplierId, setSupplierId]   = React.useState("");
  const [supplierName, setSupplierName] = React.useState("");
  const [supplierAddress, setSupplierAddress] = React.useState("");
  const [supplierPhone, setSupplierPhone] = React.useState("");
  const [supplierTax, setSupplierTax] = React.useState("");

  // ---- items ----
  const [nid, setNid] = React.useState(2);
  const [items, setItems] = React.useState([{ id: 1, code: "", qty: 1, unit: "", cost: 0 }]);
  const [openSearch, setOpenSearch] = React.useState(null);

  // ---- payment ----
  const PAY_METHODS = [
    { value: "cash", label: "เงินสด" }, { value: "transfer", label: "โอนจ่าย" },
    { value: "credit", label: "เครดิต" }, { value: "cheque", label: "แคชเชียร์เช็ค" },
  ];
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [creditDays, setCreditDays]       = React.useState(30);
  const [discount, setDiscount]           = React.useState(0);
  const [taxRate, setTaxRate]             = React.useState(7);
  const [vatType, setVatType]             = React.useState("exclusive");
  const [notes, setNotes]                 = React.useState("");
  const [msg, setMsg]                     = React.useState("");

  const STATUS_LIST = [
    { value: "draft",    label: "ร่าง",          color: "var(--muted)" },
    { value: "pending",  label: "รออนุมัติ",     color: "var(--gold)" },
    { value: "approved", label: "อนุมัติแล้ว",   color: "var(--leaf)" },
    { value: "rejected", label: "ไม่อนุมัติ",    color: "var(--brand)" },
    { value: "converted",label: "แปลงเป็น PO",   color: "var(--ink-2)" },
  ];

  React.useEffect(() => {
    const list = typeof loadSuppliers === "function" ? loadSuppliers() : [];
    setSuppliers(list.filter(s => s.status !== "inactive"));
  }, []);

  const supplierMatches = React.useMemo(() => {
    if (!supplierOpen) return [];
    const q = supplierName.trim().toLowerCase();
    if (!q) return suppliers.slice(0, 10);
    return suppliers.filter(s => (s.name||"").toLowerCase().includes(q) || (s.id||"").toLowerCase().includes(q)).slice(0, 10);
  }, [supplierName, supplierOpen, suppliers]);

  const pickSupplier = (s) => {
    setSupplierId(s.id); setSupplierName(s.name); setSupplierAddress(s.address||"");
    setSupplierPhone(s.phone||""); setSupplierTax(s.taxId||s.tax||""); setSupplierOpen(false);
  };

  const productMatches = (q) => {
    if (!q) return [];
    const tl = q.toLowerCase();
    return RAW_LIST.filter(r => (r.name||"").toLowerCase().includes(tl)||(r.code||"").toLowerCase().includes(tl)).slice(0, 8);
  };

  const addRow = () => { setItems(p => [...p, { id: nid, code: "", qty: 1, unit: "", cost: 0 }]); setNid(n=>n+1); };
  const rmRow  = (id) => setItems(p => p.filter(i => i.id !== id));
  const setIt  = (id, patch) => setItems(p => p.map(i => i.id === id ? { ...i, ...patch } : i));
  const pickProduct = (id, code) => {
    const p = RAW_LIST.find(r => r.code === code);
    setIt(id, { code, cost: p ? (p.buyPrice||p.cost||0) : 0, unit: p ? (p.buyUnit||p.unit||"") : "" });
    setOpenSearch(null);
  };

  const lines = items.filter(i => i.code).map(i => {
    const p = RAW_LIST.find(r => r.code === i.code) || {};
    const qty = parseFloat(i.qty)||0; const cost = parseFloat(i.cost)||0;
    return { ...i, name: p.name||"", unit: i.unit||p.buyUnit||p.unit||"", lineTotal: qty*cost };
  });

  const subtotal     = lines.reduce((s,l) => s+l.lineTotal, 0);
  const discAmt      = subtotal * ((parseFloat(discount)||0)/100);
  const afterDisc    = subtotal - discAmt;
  const rate         = (parseFloat(taxRate)||0)/100;
  const taxAmt       = vatType === "inclusive" ? afterDisc*rate/(1+rate) : afterDisc*rate;
  const grandTotal   = vatType === "inclusive" ? afterDisc : afterDisc+taxAmt;

  const fmt = n => Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtDate = (d) => window.fmtDateGlobal(d);

  // ---- save ----
  const save = () => {
    if (!requester.trim()) { setMsg("⚠️ กรุณากรอกชื่อผู้ขอซื้อ"); setTimeout(()=>setMsg(""),2500); return; }
    const pr = {
      prNumber, prDate, requiredDate, requester, department, purpose, status, approver, approveDate,
      supplierId, supplierName, supplierAddress, supplierPhone, supplierTax,
      paymentMethod, creditDays, discount, taxRate, vatType, notes,
      items: lines, subtotal, discAmt, taxAmt, grandTotal,
      createdAt: new Date().toISOString(),
    };
    try {
      let list = JSON.parse(localStorage.getItem("pr_list")||"[]");
      const idx = list.findIndex(r => r.prNumber === prNumber);
      if (idx >= 0) list[idx] = pr; else list.unshift(pr);
      localStorage.setItem("pr_list", JSON.stringify(list));
      setMsg("✅ บันทึกใบขอซื้อสำเร็จ — "+prNumber);
      setTimeout(()=>setMsg(""),3000);
    } catch(e) { setMsg("❌ บันทึกไม่สำเร็จ: "+e.message); }
  };

  // ---- print ----
  const printDoc = () => {
    const logoUrl = new URL("logo-yaipu.png",window.location.href).href;
    const esc = v => String(v==null?"":v).replace(/[&<>]/g,c=>({  "&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
    const rowsHtml = lines.map((l,i) => `<tr>
      <td class="c">${i+1}</td><td><b>${esc(l.code)}</b><br><span style="font-size:10px">${esc(l.name)}</span></td>
      <td class="r">${(parseFloat(l.qty)||0).toLocaleString("th-TH",{minimumFractionDigits:2})}</td>
      <td class="c">${esc(l.unit)}</td>
      <td class="r">${fmt(l.cost)}</td>
      <td class="r">${fmt(l.lineTotal)}</td>
    </tr>`).join("");
    const blankRows = Math.max(0,8-lines.length);
    const stLabel = STATUS_LIST.find(s=>s.value===status)||{label:status};
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ใบขอซื้อ ${esc(prNumber)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:20px;font-size:11px;background:#e8e8e8;color:#000}
.doc{width:800px;min-height:1080px;margin:0 auto;background:#fff;padding:28px 30px;position:relative;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0}
.wm img{width:380px;opacity:.05}.layer{position:relative;z-index:1}
.chead{display:grid;grid-template-columns:80px 1fr;gap:10px;margin-bottom:10px}
.chead img{width:76px;height:76px;object-fit:contain}
.ctr{text-align:center}.cname{font-size:20px;font-weight:700}.caddr{font-size:10px;margin-top:3px}
.titlerow{display:grid;grid-template-columns:1fr 250px;gap:10px;align-items:center;margin-bottom:8px}
.titlerow .t{text-align:center;font-size:17px;font-weight:700}
table{border-collapse:collapse}
.nbox{width:100%;font-size:11px}.nbox td{border:1px solid #000;padding:3px 7px}.nbox td.k{background:#f0f0f0;width:80px}
.info{width:100%;font-size:11px;border:1px solid #000;margin-bottom:8px}.info td{padding:3px 6px;vertical-align:top}.info td.sep{border-left:1px solid #000}
.items{width:100%;font-size:11px}.items th{background:#e8e8e8;border:1px solid #000;padding:5px 6px}
.items td{border:1px solid #000;padding:4px 6px;vertical-align:top}
.c{text-align:center}.r{text-align:right}
.sum{width:100%;font-size:11px;margin-top:-1px}.sum td{border:1px solid #000;padding:3px 8px}
.sum tr.grand td{font-weight:700;background:#f0f0f0}
.sig{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:40px}
.sig div{text-align:center}.sig .line{border-bottom:1px dotted #000;height:44px;margin-bottom:3px}.sig .role{font-size:10px}.sig .date{font-size:10px;margin-top:5px}
.bar{text-align:center;margin-top:16px}
.bar button{font-family:inherit;font-size:13px;font-weight:600;padding:8px 22px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;min-height:auto;box-shadow:none;padding:10mm}.no-print{display:none!important}@page{size:A4;margin:0}}
</style></head><body>
<div class="doc">
  <div class="wm"><img src="${logoUrl}" alt=""></div>
  <div class="layer">
    <div class="chead">
      <img src="${logoUrl}" alt="">
      <div class="ctr"><div class="cname">บริษัท ชูรสยายปู จำกัด</div>
      <div class="caddr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160 เลขที่ผู้เสียภาษี 0495567000363</div></div>
    </div>
    <div class="titlerow">
      <div class="t">ใบขอซื้อ / Purchase Requisition</div>
      <table class="nbox"><tbody>
        <tr><td class="k">เลขที่ PR</td><td>${esc(prNumber)}</td></tr>
        <tr><td class="k">วันที่</td><td>${fmtDate(prDate)}</td></tr>
        <tr><td class="k">สถานะ</td><td>${esc(stLabel.label)}</td></tr>
      </tbody></table>
    </div>
    <table class="info"><tbody>
      <tr>
        <td style="width:80px">ผู้ขอซื้อ</td><td style="font-weight:600">${esc(requester)||"—"}</td>
        <td class="sep" style="width:80px">แผนก</td><td>${esc(department)||"—"}</td>
      </tr>
      <tr>
        <td>วัตถุประสงค์</td><td colspan="3">${esc(purpose)||"—"}</td>
      </tr>
      <tr>
        <td>ผู้ขายที่แนะนำ</td><td>${esc(supplierName)||"—"}</td>
        <td class="sep">กำหนดรับของ</td><td>${fmtDate(requiredDate)}</td>
      </tr>
      <tr>
        <td>เงื่อนไขชำระ</td>
        <td>${({cash:"เงินสด",transfer:"โอนจ่าย",credit:`เครดิต ${creditDays} วัน`,cheque:"แคชเชียร์เช็ค"})[paymentMethod]||paymentMethod}</td>
        <td class="sep">หมายเหตุ</td><td>${esc(notes)||"—"}</td>
      </tr>
    </tbody></table>
    <table class="items">
      <thead><tr>
        <th class="c" style="width:28px">#</th><th>รายการ</th>
        <th class="r" style="width:65px">จำนวน</th><th class="c" style="width:55px">หน่วย</th>
        <th class="r" style="width:80px">ราคา/หน่วย</th><th class="r" style="width:90px">รวม (บาท)</th>
      </tr></thead>
      <tbody>
        ${rowsHtml}
        ${Array.from({length:blankRows}).map(()=>`<tr style="height:24px"><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("")}
      </tbody>
    </table>
    <table class="sum"><tbody>
      <tr><td style="width:56%;vertical-align:top" rowspan="4"><b>หมายเหตุ:</b> ${esc(notes)||""}</td>
        <td style="width:100px">รวมเงิน</td><td class="r" style="width:110px">${fmt(subtotal)}</td></tr>
      <tr><td>ส่วนลด ${discount}%</td><td class="r">${fmt(discAmt)}</td></tr>
      <tr><td>VAT ${taxRate}% (${vatType==="inclusive"?"ใน":"นอก"})</td><td class="r">${fmt(taxAmt)}</td></tr>
      <tr class="grand"><td>จำนวนเงินทั้งสิ้น</td><td class="r">${fmt(grandTotal)}</td></tr>
    </tbody></table>
    <div class="sig">
      <div><div class="line"></div><div class="role">ผู้ขอซื้อ</div><div class="date">${esc(requester)||""}</div><div class="date">วันที่ ${fmtDate(prDate)}</div></div>
      <div><div class="line"></div><div class="role">หัวหน้าแผนก</div><div class="date">วันที่ ____/____/______</div></div>
      <div><div class="line"></div><div class="role">ผู้อนุมัติ</div><div class="date">${esc(approver)||""}</div><div class="date">วันที่ ${approveDate?fmtDate(approveDate):"____/____/______"}</div></div>
      <div><div class="line"></div><div class="role">จัดซื้อ</div><div class="date">วันที่ ____/____/______</div></div>
    </div>
    <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
  </div>
</div></body></html>`;
    const win = window.open("","","width=880,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่"); return; }
    win.document.write(html); win.document.close();
  };

  const inp = { border:"1px solid var(--border)", padding:"7px 10px", borderRadius:7, fontSize:13, width:"100%", fontFamily:"inherit" };
  const lbl = { fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📝 ใบขอซื้อ (PR)</h1>
          <p className="page-sub">Purchase Requisition · สร้างคำขอซื้อสินค้า/วัตถุดิบ</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => setCurrent && setCurrent("pr-list")}>📋 รายการ PR</button>
          <button className="btn" onClick={printDoc}>🖨️ พิมพ์</button>
          <button className="btn btn-primary" onClick={save}>💾 บันทึก</button>
        </div>
      </div>

      {msg && <div className={`alert${msg.includes("✅")?" success":""}`} style={{ marginBottom:14, background:msg.includes("✅")?"var(--leaf-soft)":"var(--brand-soft)", border:`1px solid ${msg.includes("✅")?"#B9D4B2":"#E9B6B1"}`, color:msg.includes("✅")?"#2D5128":"var(--brand-ink)" }}>{msg}</div>}

      {/* เลขที่ + วันที่ + สถานะ */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:14 }}>
        <div><label style={lbl}>เลขที่ PR</label><input value={prNumber} onChange={e=>setPrNumber(e.target.value)} style={{ ...inp, fontFamily:"var(--font-mono)" }}/></div>
        <div><label style={lbl}>วันที่ขอซื้อ</label><input type="date" value={prDate} onChange={e=>setPrDate(e.target.value)} style={inp}/></div>
        <div><label style={lbl}>กำหนดรับของ</label><input type="date" value={requiredDate} onChange={e=>setRequiredDate(e.target.value)} style={inp}/></div>
        <div>
          <label style={lbl}>สถานะ</label>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={inp}>
            {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* ผู้ขอซื้อ */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-head"><h3 className="card-title">👤 ผู้ขอซื้อ</h3></div>
        <div className="card-body" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          <div><label style={lbl}>ชื่อผู้ขอซื้อ *</label><input value={requester} onChange={e=>setRequester(e.target.value)} placeholder="ชื่อ-นามสกุล" style={inp}/></div>
          <div><label style={lbl}>แผนก / ฝ่าย</label><input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="เช่น ฝ่ายผลิต" style={inp}/></div>
          <div><label style={lbl}>วัตถุประสงค์</label><input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="เหตุผลที่ขอซื้อ" style={inp}/></div>
        </div>
      </div>

      {/* ผู้ขายที่แนะนำ */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-head"><h3 className="card-title">🏭 ผู้ขายที่แนะนำ (ไม่บังคับ)</h3></div>
        <div className="card-body" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ position:"relative" }}>
            <label style={lbl}>ชื่อผู้ขาย</label>
            <input value={supplierName} onChange={e=>{ setSupplierName(e.target.value); setSupplierOpen(true); }}
              onFocus={()=>setSupplierOpen(true)} onBlur={()=>setTimeout(()=>setSupplierOpen(false),180)}
              placeholder="พิมพ์เพื่อค้นหาจากระบบ…" style={inp}/>
            {supplierOpen && supplierMatches.length > 0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid var(--border)", borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,.12)", zIndex:50, maxHeight:200, overflowY:"auto" }}>
                {supplierMatches.map(s => (
                  <div key={s.id} onMouseDown={()=>pickSupplier(s)} style={{ padding:"9px 13px", cursor:"pointer", fontSize:13 }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--surface-2)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <strong>{s.name}</strong>
                    <span style={{ fontSize:11, color:"var(--muted)", marginLeft:8 }}>{s.id} · {s.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div><label style={lbl}>เลขประจำตัวผู้เสียภาษี</label><input value={supplierTax} onChange={e=>setSupplierTax(e.target.value)} placeholder="—" style={{ ...inp, fontFamily:"var(--font-mono)" }}/></div>
          <div><label style={lbl}>ที่อยู่</label><input value={supplierAddress} onChange={e=>setSupplierAddress(e.target.value)} placeholder="—" style={inp}/></div>
          <div><label style={lbl}>เบอร์โทร</label><input value={supplierPhone} onChange={e=>setSupplierPhone(e.target.value)} placeholder="—" style={inp}/></div>
        </div>
      </div>

      {/* รายการสินค้า */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-head">
          <h3 className="card-title">📦 รายการที่ขอซื้อ</h3>
          <button className="btn btn-sm btn-primary" onClick={addRow}>+ เพิ่มรายการ</button>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table className="tbl" style={{ fontSize:12 }}>
            <thead>
              <tr>
                <th style={{ width:40 }}>#</th>
                <th style={{ width:80 }}>รหัส</th>
                <th>รายการ</th>
                <th style={{ width:80, textAlign:"right" }}>จำนวน</th>
                <th style={{ width:80 }}>หน่วย</th>
                <th style={{ width:100, textAlign:"right" }}>ราคา/หน่วย</th>
                <th style={{ width:110, textAlign:"right" }}>รวม (บาท)</th>
                <th style={{ width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const p = RAW_LIST.find(r => r.code === it.code) || {};
                return (
                  <tr key={it.id}>
                    <td style={{ textAlign:"center", color:"var(--muted)" }}>{idx+1}</td>
                    <td style={{ position:"relative" }}>
                      <input value={it.code} placeholder="รหัส"
                        onChange={e => { setIt(it.id,{code:e.target.value}); setOpenSearch(it.id); }}
                        onFocus={() => setOpenSearch(it.id)}
                        onBlur={() => setTimeout(()=>setOpenSearch(null),180)}
                        style={{ ...inp, fontSize:11, fontFamily:"var(--font-mono)" }}/>
                      {openSearch===it.id && productMatches(it.code).length > 0 && (
                        <div style={{ position:"absolute", top:"100%", left:0, width:280, background:"#fff", border:"1px solid var(--border)", borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,.12)", zIndex:50, maxHeight:180, overflowY:"auto" }}>
                          {productMatches(it.code).map(r => (
                            <div key={r.code} onMouseDown={()=>pickProduct(it.id,r.code)}
                              style={{ padding:"8px 11px", cursor:"pointer", fontSize:12 }}
                              onMouseEnter={e=>e.currentTarget.style.background="var(--surface-2)"}
                              onMouseLeave={e=>e.currentTarget.style.background=""}>
                              <span style={{ fontFamily:"var(--font-mono)", color:"var(--muted)", fontSize:11 }}>{r.code}</span> {r.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight:500, fontSize:12, color:"var(--ink-2)" }}>{p.name||<span style={{ color:"var(--muted-2)" }}>—</span>}</td>
                    <td><input type="number" value={it.qty} min={0} onChange={e=>setIt(it.id,{qty:e.target.value})} style={{ ...inp, fontSize:12, textAlign:"right" }}/></td>
                    <td><input value={it.unit} onChange={e=>setIt(it.id,{unit:e.target.value})} placeholder="หน่วย" style={{ ...inp, fontSize:12 }}/></td>
                    <td><input type="number" value={it.cost} min={0} onChange={e=>setIt(it.id,{cost:e.target.value})} style={{ ...inp, fontSize:12, textAlign:"right" }}/></td>
                    <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums", fontWeight:600 }}>
                      {((parseFloat(it.qty)||0)*(parseFloat(it.cost)||0)).toLocaleString("th-TH",{minimumFractionDigits:2})}
                    </td>
                    <td style={{ textAlign:"center" }}>
                      <button className="btn btn-sm" onClick={()=>rmRow(it.id)} style={{ color:"var(--brand)" }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 16px", borderTop:"1px solid var(--border)" }}>
          <button className="btn btn-sm" onClick={addRow}>+ เพิ่มรายการ</button>
        </div>
      </div>

      {/* เงื่อนไข + สรุป */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div className="card">
          <div className="card-head"><h3 className="card-title">💳 เงื่อนไขการชำระ</h3></div>
          <div className="card-body" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={lbl}>ประเภทการชำระ</label>
              <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} style={inp}>
                {PAY_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            {paymentMethod === "credit" && (
              <div><label style={lbl}>เครดิต (วัน)</label><input type="number" value={creditDays} onChange={e=>setCreditDays(e.target.value)} style={inp}/></div>
            )}
            <div><label style={lbl}>ส่วนลด (%)</label><input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} style={inp}/></div>
            <div>
              <label style={lbl}>VAT (%)</label>
              <div style={{ display:"flex", gap:6 }}>
                <input type="number" value={taxRate} onChange={e=>setTaxRate(e.target.value)} style={{ ...inp, flex:1 }}/>
                <select value={vatType} onChange={e=>setVatType(e.target.value)} style={{ ...inp, width:"auto" }}>
                  <option value="exclusive">นอก</option><option value="inclusive">ใน</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3 className="card-title">🧾 สรุปยอด</h3></div>
          <div className="card-body">
            {[["รวมเงิน",subtotal],["ส่วนลด",-discAmt],["VAT "+taxRate+"%",taxAmt]].map(([l,v])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
                <span style={{ color:"var(--muted)" }}>{l}</span>
                <span style={{ fontVariantNumeric:"tabular-nums" }}>{fmt(v)}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", borderTop:"2px solid var(--border)", paddingTop:8, fontSize:16, fontWeight:700 }}>
              <span>รวมทั้งสิ้น</span>
              <span style={{ fontVariantNumeric:"tabular-nums", color:"var(--brand)" }}>฿{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* หมายเหตุ + ผู้อนุมัติ */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-head"><h3 className="card-title">✍️ หมายเหตุและการอนุมัติ</h3></div>
        <div className="card-body" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          <div style={{ gridColumn:"1/2" }}><label style={lbl}>หมายเหตุ</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{ ...inp, resize:"vertical" }} placeholder="หมายเหตุ"/></div>
          <div><label style={lbl}>ผู้อนุมัติ</label><input value={approver} onChange={e=>setApprover(e.target.value)} placeholder="ชื่อผู้อนุมัติ" style={inp}/></div>
          <div><label style={lbl}>วันที่อนุมัติ</label><input type="date" value={approveDate} onChange={e=>setApproveDate(e.target.value)} style={inp}/></div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenPRForm });
