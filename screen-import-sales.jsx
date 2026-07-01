// 📥 ใบรับเข้าวัตถุดิบและวัสดุบรรจุ — FM-WH-01
const ScreenGoodsReceipt = () => {
  const RAW_LIST = typeof RAW !== "undefined" ? RAW : [];
  const today = new Date().toISOString().split("T")[0];

  // ---- header state ----
  const [receiptDate, setReceiptDate] = React.useState(today);
  const [docNo, setDocNo] = React.useState(() => {
    const yymm = new Date().getFullYear().toString().slice(2) + String(new Date().getMonth() + 1).padStart(2, "0");
    const key = `gr_counter_${yymm}`;
    const cnt = parseInt(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, cnt.toString());
    return `GR${yymm}${String(cnt).padStart(4, "0")}`;
  });
  const [supplier, setSupplier] = React.useState("");
  const [approver, setApprover] = React.useState(""); // ผู้ทวนสอบและอนุมัติ
  const [approveDate, setApproveDate] = React.useState("");
  const [generalNotes, setGeneralNotes] = React.useState("");
  const [msg, setMsg] = React.useState("");

  // ---- items state ----
  const blankItem = (id) => ({
    id,
    rawCode: "",        // รหัสวัตถุดิบ
    rawName: "",        // รายการวัตถุดิบ
    lotNo: "",          // Lot ผู้ผลิต
    mfgDate: "",        // MFG. Date
    expDate: "",        // Exp. Date
    qty: "",            // จำนวนที่สั่งซื้อ
    unit: "กิโลกรัม",     // หน่วย
    qcResult: "pass",   // ผ่าน | ไม่ผ่าน
    qcAction: "",       // คืนผู้ขาย | กักกัน | ทำลาย (ถ้าไม่ผ่าน)
    qcNote: "",         // รายละเอียดผลตรวจสอบ
    qcPerson: "",       // ผู้ตัดสิน QC
    qcDate: today,
    deliverer: "",      // ผู้ส่งมอบ
    docCOA: false, docSPEC: false, docTest: false, docOther: "", // เอกสารคุณภาพ
    whPerson: "",       // ผู้ตรวจรับ WH
    whDate: today,
    itemNote: "",       // หมายเหตุรายการ
  });

  const [items, setItems] = React.useState([blankItem(0)]);
  const [nid, setNid] = React.useState(1);
  const [rawSearch, setRawSearch] = React.useState({});
  const [rawOpen, setRawOpen] = React.useState({});

  const setItem = (id, patch) => setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  const addItem = () => { setItems(prev => [...prev, blankItem(nid)]); setNid(n => n + 1); };
  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const pickRaw = (itemId, raw) => {
    setItem(itemId, { rawCode: raw.code, rawName: raw.name, unit: raw.unit || "" });
    setRawOpen(prev => ({ ...prev, [itemId]: false }));
    setRawSearch(prev => { const next = { ...prev }; delete next[itemId]; return next; });
  };

  const rawMatches = (itemId) => {
    const q = (rawSearch[itemId] || "").toLowerCase();
    if (!q) return RAW_LIST.slice(0, 12);
    return RAW_LIST.filter(r => (r.name || "").toLowerCase().includes(q) || (r.code || "").toLowerCase().includes(q)).slice(0, 12);
  };

  const inp = { border: "1px solid var(--border)", padding: "5px 8px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", width: "100%", background: "#fff" };
  const fmtDate = (d) => window.fmtDateGlobal(d);

  // ---- save ----
  const save = () => {
    if (!receiptDate || items.length === 0) { setMsg("❌ กรุณากรอกวันที่และรายการวัตถุดิบ"); return; }
    // กัน docNo ว่าง — สร้างใหม่อัตโนมัติถ้าผู้ใช้ลบทิ้ง (ป้องกัน orphan ใน erp_purchases)
    let useDocNo = (docNo || "").trim();
    if (!useDocNo) {
      const d = new Date();
      useDocNo = `GR${(d.getFullYear()+"").slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(Date.now()).slice(-4)}`;
      setDocNo(useDocNo);
    }
    const receipt = { docNo: useDocNo, receiptDate, supplier, approver, approveDate, generalNotes, items, createdAt: new Date().toISOString() };
    try {
      // บันทึกใบรับเข้า
      let list = JSON.parse(localStorage.getItem("goods_receipts_list") || "[]");
      const existing = list.findIndex(r => r.docNo === useDocNo);
      if (existing >= 0) list[existing] = receipt; else list.push(receipt);
      localStorage.setItem("goods_receipts_list", JSON.stringify(list));

      // ผูกกับสต็อคการ์ด — เฉพาะรายการที่ QC ผ่านเท่านั้น
      const passedItems = items.filter(it => it.qcResult === "pass" && it.rawCode && parseFloat(it.qty) > 0);
      if (passedItems.length > 0) {
        let purchases = [];
        try { purchases = JSON.parse(localStorage.getItem("erp_purchases") || "[]"); } catch (e) {}
        // ลบรายการเก่าของ docNo นี้ออกก่อน (กรณีแก้ไขแล้ว save ใหม่)
        purchases = purchases.filter(p => p._grDocNo !== useDocNo);
        passedItems.forEach(it => {
          purchases.push({
            code: useDocNo + "-" + it.rawCode,
            _grDocNo: useDocNo,
            date: receiptDate,
            raw: it.rawCode,
            qty: parseFloat(it.qty) || 0,
            unit: it.unit || "กิโลกรัม",
            supplier: supplier || it.deliverer || "",
            total: 0,
            lotNo: it.lotNo || "",
            mfgDate: it.mfgDate || "",
            expDate: it.expDate || "",
          });
        });
        localStorage.setItem("erp_purchases", JSON.stringify(purchases));
        window.dataCache?.invalidate?.("stockcard");
      }

      setMsg(`✅ บันทึกใบรับเข้าสำเร็จ — ${useDocNo} · เพิ่มสต็อค ${passedItems.length} รายการ (QC ผ่าน)`);
      setTimeout(() => setMsg(""), 4000);
    } catch (e) { setMsg("❌ บันทึกไม่สำเร็จ: " + e.message); }
  };

  // ---- print FM-WH-01 ----
  const printDoc = () => {
    const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const chk = (v) => v ? "☑" : "☐";

    const itemRows = items.map((it, i) => `
      <tr>
        <td class="c" rowspan="2">${i + 1}</td>
        <td rowspan="2"><strong>${esc(it.rawCode)}</strong><br><span style="font-size:10px">${esc(it.rawName)}</span></td>
        <td class="c">${esc(it.lotNo) || "—"}</td>
        <td class="c">${fmtDate(it.mfgDate)}</td>
        <td class="c">${fmtDate(it.expDate)}</td>
        <td class="c">${esc(it.qty)} ${esc(it.unit)}</td>
        <td rowspan="2">
          ${it.qcResult === "pass"
            ? `<strong style="color:#2D5128">☑ ผ่าน อนุมัติรับเข้า</strong><br>☐ ไม่ผ่าน<br><span style="color:#bbb;font-size:9px">☐ คืนผู้ขาย ☐ กักกัน ☐ ทำลาย</span>`
            : `☐ ผ่าน อนุมัติรับเข้า<br><strong style="color:#7A1411">☑ ไม่ผ่าน</strong><br>${chk(it.qcAction === "คืนผู้ขาย")} คืนผู้ขาย ${chk(it.qcAction === "กักกัน")} กักกัน ${chk(it.qcAction === "ทำลาย")} ทำลาย`}
          ${it.qcNote ? `<div style="font-size:9px;margin-top:3px;color:#555">${esc(it.qcNote)}</div>` : ""}
        </td>
        <td class="c" rowspan="2">${esc(it.qcPerson) || "—"}<br><span style="font-size:10px">${fmtDate(it.qcDate)}</span></td>
        <td class="c" rowspan="2">${esc(it.deliverer) || "—"}</td>
        <td rowspan="2" style="font-size:10px">
          ${chk(it.docCOA)} COA<br>${chk(it.docSPEC)} SPEC<br>${chk(it.docTest)} Test Report<br>${chk(!!it.docOther)} อื่น ${it.docOther && it.docOther.trim() ? esc(it.docOther) : "........................."}        
        </td>
        <td class="c" rowspan="2">${esc(it.whPerson) || "—"}<br><span style="font-size:10px">${fmtDate(it.whDate)}</span></td>
        <td rowspan="2">${esc(it.itemNote) || ""}</td>
      </tr>
      <tr style="background:#fafafa">
        <td colspan="4" style="font-size:10px;color:#555;padding:3px 6px">รายละเอียดเพิ่มเติม: ${esc(it.qcNote) || "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>FM-WH-01 ${esc(docNo)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:20px;font-size:11px;background:#e8e8e8;color:#000}
.doc{width:1200px;margin:0 auto;background:#fff;padding:20px 24px;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.head{display:grid;grid-template-columns:70px 1fr auto;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:6px}
.head img{width:65px;height:65px;object-fit:contain}
.co-name{font-size:16px;font-weight:700}.co-addr{font-size:10px;color:#444}
.doc-title{text-align:right}.doc-title .t{font-size:15px;font-weight:700}
.info-row{display:flex;gap:24px;margin-bottom:8px;font-size:11px;border-bottom:1px solid #ccc;padding-bottom:6px}
.info-row span{display:flex;gap:4px;align-items:center}
table{border-collapse:collapse;width:100%}
th{background:#e8e8e8;border:1px solid #000;padding:4px 5px;text-align:center;font-size:10px;font-weight:600;vertical-align:middle}
td{border:1px solid #000;padding:4px 5px;vertical-align:middle;font-size:10px}
.c{text-align:center}
.foot{margin-top:10px;font-size:10px}
.foot .note{margin-bottom:8px}
.sig-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:10px}
.sig-box{border:1px solid #aaa;border-radius:4px;padding:8px 10px;text-align:center;min-height:60px}
.sig-box .role{font-weight:600;margin-bottom:16px}
.sig-box .date{font-size:10px;color:#555;margin-top:6px}
.doc-no{font-size:10px;color:#888;text-align:right;margin-top:6px}
.bar{text-align:center;margin-top:14px}
.bar button{font-family:inherit;font-size:13px;font-weight:600;padding:8px 24px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}
@media print{body{background:#fff;padding:0}.doc{width:100%;box-shadow:none;padding:8mm}.no-print{display:none!important}@page{size:A3 landscape;margin:0}}
</style></head><body>
<div class="doc">
  <div class="head">
    <img src="${logoUrl}" alt="">
    <div><div class="co-name">บริษัท ชูรสยายปู จำกัด</div><div class="co-addr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div><div style="font-size:14px;font-weight:700;margin-top:4px">บันทึกการรับวัตถุดิบและวัสดุบรรจุ</div></div>
    <div class="doc-title"><div class="t">เลขที่: ${esc(docNo)}</div><div style="font-size:11px;margin-top:4px">FM-WH-01 Rev.00</div></div>
  </div>
  <div class="info-row">
    <span><strong>วันที่รับวัตถุดิบและวัสดุบรรจุ:</strong> ${fmtDate(receiptDate)}</span>
    <span><strong>ผู้ส่งมอบ:</strong> ${esc(supplier) || "—"}</span>
    ${generalNotes ? `<span><strong>หมายเหตุ:</strong> ${esc(generalNotes)}</span>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2" style="width:28px">ลำดับ</th>
        <th rowspan="2" style="width:130px">รายการวัตถุดิบและวัสดุบรรจุ</th>
        <th colspan="3" style="width:210px">รายละเอียดของวัตถุดิบและวัสดุบรรจุ</th>
        <th rowspan="2" style="width:65px">จำนวนที่สั่งซื้อ</th>
        <th colspan="2" style="width:190px">ผลการตรวจสอบ</th>
        <th rowspan="2" style="width:65px">ผู้ส่งมอบ</th>
        <th rowspan="2" style="width:90px">เอกสารคุณภาพ</th>
        <th rowspan="2" style="width:80px">ผู้ตรวจรับ (WH) และลงวันที่</th>
        <th rowspan="2" style="width:80px">หมายเหตุ</th>
      </tr>
      <tr>
        <th style="width:70px">Lot ผู้ผลิต</th>
        <th style="width:70px">MFG. Date</th>
        <th style="width:70px">Exp. Date</th>
        <th style="width:120px">ผลการตัดสิน</th>
        <th style="width:80px">ผู้ตัดสิน (QC) และลงวันที่</th>
      </tr>
    </thead>
    <tbody>${itemRows || '<tr><td colspan="12" class="c" style="padding:20px">ไม่มีรายการ</td></tr>'}</tbody>
  </table>

  <div class="foot">
    <div class="note"><strong>หมายเหตุ:</strong>
      <div>1. ตัวอย่างการตรวจสอบ ประกอบไปด้วย ลักษณะทางกายภาพ ความชื้น ความสะอาด สี กลิ่นปกติ ไม่พบสิ่งแปลกปลอม น้ำหนักวัสดุบรรจุอยู่ในสภาพสมบูรณ์ เป็นต้น ให้ระบุเป็นข้อความในช่องผลการตรวจสอบ</div>
      <div>2. เอกสารด้านคุณภาพ ประกอบไปด้วย COA/SPEC หรือ Test Report เป็นต้น โดยให้พิจารณาตามชนิดวัตถุดิบและวัสดุบรรจุที่สั่งซื้อ ให้ระบุเป็นข้อความในช่องผลการตรวจสอบ</div>
    </div>
    <div class="sig-row">
      <div></div>
      <div></div>
      <div class="sig-box">
        <div class="role">ผู้ทวนสอบและอนุมัติ</div>
        <div style="font-size:11px;min-height:20px">${esc(approver) || ""}</div>
        <div style="font-weight:600">ผู้จัดการฝ่ายผลิต</div>
        <div class="date">วันที่ ${approveDate ? fmtDate(approveDate) : "........... / ........... / .............."}</div>
      </div>
    </div>
  </div>
  <div class="doc-no no-print">FM-WH-01 Rev.00</div>
  <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
</div></body></html>`;
    const win = window.open("", "", "width=1300,height=900");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่"); return; }
    win.document.write(html); win.document.close();
  };

  const sectionLabel = { fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, marginTop: 14, display: "block" };

  const EMPLOYEES = ["โสภิณ", "ญาณษา", "ประภัสสรา", "ปนัดดา(แคร์)"];

  const EmpInput = ({ value, onChange, placeholder, style: st }) => (
    <>
      <input value={value} onChange={onChange} placeholder={placeholder} style={st} list="emp-datalist" />
      <datalist id="emp-datalist">
        {EMPLOYEES.map(e => <option key={e} value={e} />)}
      </datalist>
    </>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📥 บันทึกการรับวัตถุดิบและวัสดุบรรจุ</h1>
          <p className="page-sub">FM-WH-01 · กรอกรายละเอียดการรับวัตถุดิบและผลการตรวจสอบคุณภาพ</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={printDoc}>🖨️ พิมพ์ FM-WH-01</button>
          <button className="btn btn-primary" onClick={save}>💾 บันทึก</button>
        </div>
      </div>

      {msg && <div className={`alert${msg.includes("✅") ? "" : " danger"}`} style={{ marginBottom: 14 }}>{msg}</div>}

      {/* ===== หัวเอกสาร ===== */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3 className="card-title">📋 ข้อมูลเอกสาร</h3></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div>
              <label style={sectionLabel}>เลขที่เอกสาร</label>
              <input value={docNo} onChange={e => setDocNo(e.target.value)} style={{ border: "1px solid var(--border)", padding: "7px 10px", borderRadius: 7, fontSize: 13, width: "100%", fontFamily: "var(--font-mono)" }} />
            </div>
            <div>
              <label style={sectionLabel}>วันที่รับวัตถุดิบ</label>
              <input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} style={{ border: "1px solid var(--border)", padding: "7px 10px", borderRadius: 7, fontSize: 13, width: "100%" }} />
            </div>
            <div>
              <label style={sectionLabel}>ผู้ส่งมอบ</label>
              <input
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="ชื่อผู้ส่งมอบ / ซัพพลายเออร์"
                list="supplier-datalist"
                style={{ border: "1px solid var(--border)", padding: "7px 10px", borderRadius: 7, fontSize: 13, width: "100%" }}
              />
              <datalist id="supplier-datalist">
                {(typeof loadSuppliers === "function" ? loadSuppliers() : []).filter(s => s.status !== "inactive").map(s => (
                  <option key={s.id} value={s.name}>{s.id} — {s.name}</option>
                ))}
              </datalist>
            </div>
            <div>
              <label style={sectionLabel}>หมายเหตุทั่วไป</label>
              <input value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} placeholder="หมายเหตุ" style={{ border: "1px solid var(--border)", padding: "7px 10px", borderRadius: 7, fontSize: 13, width: "100%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== รายการวัตถุดิบ ===== */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3 className="card-title">🥩 รายการวัตถุดิบและวัสดุบรรจุ</h3>
          <button className="btn btn-sm btn-primary" onClick={addItem}>+ เพิ่มรายการ</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          {items.map((it, idx) => (
            <div key={it.id} style={{ borderBottom: "1px solid var(--border)", padding: "14px 16px", background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
              {/* Row header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--brand-soft)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, color: "var(--brand-ink)", flexShrink: 0 }}>{idx + 1}</div>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    value={rawSearch[it.id] !== undefined ? rawSearch[it.id] : (it.rawName || "")}
                    placeholder="ค้นหาวัตถุดิบ / พิมพ์ชื่อ…"
                    onChange={e => { setRawSearch(p => ({ ...p, [it.id]: e.target.value })); setRawOpen(p => ({ ...p, [it.id]: true })); }}
                    onFocus={() => setRawOpen(p => ({ ...p, [it.id]: true }))}
                    onBlur={() => setTimeout(() => setRawOpen(p => ({ ...p, [it.id]: false })), 180)}
                    style={{ border: "1px solid var(--border)", padding: "7px 10px", borderRadius: 7, fontSize: 13, width: "100%", fontWeight: it.rawName ? 500 : 400 }}
                  />
                  {rawOpen[it.id] && rawMatches(it.id).length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, maxHeight: 220, overflowY: "auto" }}>
                      {rawMatches(it.id).map(r => (
                        <div key={r.code} onMouseDown={() => pickRaw(it.id, r)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, display: "flex", gap: 10, alignItems: "center" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                          onMouseLeave={e => e.currentTarget.style.background = ""}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", width: 36, flexShrink: 0 }}>{r.code}</span>
                          <span>{r.name}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>{r.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {it.rawCode && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{it.rawCode}</span>}
                <button className="btn btn-sm btn-ghost" onClick={() => removeItem(it.id)} style={{ flexShrink: 0, color: "var(--brand)" }}>🗑️</button>
              </div>

              {/* Detail grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {/* Lot / MFG / Exp */}
                <div>
                  <label style={sectionLabel}>Lot ผู้ผลิต</label>
                  <input value={it.lotNo} onChange={e => setItem(it.id, { lotNo: e.target.value })} placeholder="เลขล็อต" style={inp} />
                </div>
                <div>
                  <label style={sectionLabel}>MFG. Date</label>
                  <input type="date" value={it.mfgDate} onChange={e => setItem(it.id, { mfgDate: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={sectionLabel}>Exp. Date</label>
                  <input type="date" value={it.expDate} onChange={e => setItem(it.id, { expDate: e.target.value })} style={inp} />
                </div>
                {/* จำนวน + หน่วย */}
                <div>
                  <label style={sectionLabel}>จำนวนที่สั่งซื้อ</label>
                  <input type="number" value={it.qty} onChange={e => setItem(it.id, { qty: e.target.value })} placeholder="0" style={inp} />
                </div>
                <div>
                  <label style={sectionLabel}>หน่วย (รับเข้า)</label>
                  <select value={it.unit || "กิโลกรัม"} onChange={e => setItem(it.id, { unit: e.target.value })} style={inp}>
                    <option value="กิโลกรัม">กิโลกรัม (kg) → สต๊อคเป็นกรัม</option>
                    <option value="กรัม">กรัม</option>
                    <option value="ซอง">ซอง</option>
                    <option value="ถุง">ถุง</option>
                  </select>
                </div>
                {/* ผู้ส่งมอบ */}
                <div>
                  <label style={sectionLabel}>ผู้ส่งมอบ</label>
                  <input value={it.deliverer} onChange={e => setItem(it.id, { deliverer: e.target.value })} placeholder="ชื่อผู้ส่งมอบ" style={inp} />
                </div>
              </div>

              {/* QC section */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 12, marginTop: 10, alignItems: "start" }}>
                {/* ผลการตัดสิน */}
                <div style={{ minWidth: 200 }}>
                  <label style={sectionLabel}>ผลการตัดสิน (QC)</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input type="radio" name={`qc_${it.id}`} value="pass" checked={it.qcResult === "pass"} onChange={() => setItem(it.id, { qcResult: "pass", qcAction: "" })} />
                      <span style={{ color: "#2D5128", fontWeight: 500 }}>✅ ผ่าน — อนุมัติรับเข้า</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input type="radio" name={`qc_${it.id}`} value="fail" checked={it.qcResult === "fail"} onChange={() => setItem(it.id, { qcResult: "fail" })} />
                      <span style={{ color: "var(--brand-ink)", fontWeight: 500 }}>❌ ไม่ผ่าน</span>
                    </label>
                    {it.qcResult === "fail" && (
                      <div style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                        {["คืนผู้ขาย", "กักกัน", "ทำลาย"].map(act => (
                          <label key={act} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                            <input type="radio" name={`qcact_${it.id}`} value={act} checked={it.qcAction === act} onChange={() => setItem(it.id, { qcAction: act })} />
                            {act}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* รายละเอียดผลตรวจสอบ */}
                <div>
                  <label style={sectionLabel}>รายละเอียดผลตรวจสอบ</label>
                  <textarea value={it.qcNote} onChange={e => setItem(it.id, { qcNote: e.target.value })} placeholder="ลักษณะทางกายภาพ, ความชื้น, สี, กลิ่น…" style={{ ...inp, minHeight: 68, resize: "vertical" }} />
                </div>

                {/* ผู้ตัดสิน QC */}
                <div>
                  <label style={sectionLabel}>ผู้ตัดสิน (QC) และวันที่</label>
                  <EmpInput value={it.qcPerson} onChange={e => setItem(it.id, { qcPerson: e.target.value })} placeholder="ชื่อผู้ตัดสิน QC" style={{ ...inp, marginBottom: 6 }} />
                  <input type="date" value={it.qcDate} onChange={e => setItem(it.id, { qcDate: e.target.value })} style={inp} />
                </div>

                {/* ผู้ตรวจรับ WH */}
                <div>
                  <label style={sectionLabel}>ผู้ตรวจรับ (WH) และวันที่</label>
                  <EmpInput value={it.whPerson} onChange={e => setItem(it.id, { whPerson: e.target.value })} placeholder="ชื่อผู้ตรวจรับ WH" style={{ ...inp, marginBottom: 6 }} />
                  <input type="date" value={it.whDate} onChange={e => setItem(it.id, { whDate: e.target.value })} style={inp} />
                </div>
              </div>

              {/* เอกสารคุณภาพ + หมายเหตุ */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, marginTop: 10 }}>
                <div>
                  <label style={sectionLabel}>ผู้ส่งมอบ (รายการ)</label>
                  <EmpInput value={it.deliverer} onChange={e => setItem(it.id, { deliverer: e.target.value })} placeholder="ชื่อผู้ส่งมอบ" style={{ ...inp, marginBottom: 8 }} />
                  <label style={sectionLabel}>เอกสารคุณภาพ</label>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[["docCOA", "COA"], ["docSPEC", "SPEC"], ["docTest", "Test Report"]].map(([k, l]) => (
                      <label key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}>
                        <input type="checkbox" checked={it[k]} onChange={e => setItem(it.id, { [k]: e.target.checked })} />
                        {l}
                      </label>
                    ))}
                    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}>
                      <input type="checkbox" checked={!!it.docOther} onChange={e => setItem(it.id, { docOther: e.target.checked ? it.docOther || " " : "" })} />
                      อื่นๆ
                      {it.docOther !== "" && <input value={it.docOther} onChange={e => setItem(it.id, { docOther: e.target.value })} placeholder="ระบุ…" style={{ ...inp, width: 120, marginLeft: 4 }} />}
                    </label>
                  </div>
                </div>
                <div>
                  <label style={sectionLabel}>หมายเหตุรายการ</label>
                  <input value={it.itemNote} onChange={e => setItem(it.id, { itemNote: e.target.value })} placeholder="หมายเหตุเพิ่มเติม" style={inp} />
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>กดปุ่ม "+ เพิ่มรายการ" เพื่อเริ่มกรอกข้อมูล</div>
          )}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-sm" onClick={addItem}>+ เพิ่มรายการวัตถุดิบ</button>
        </div>
      </div>

      {/* ===== ลายเซ็นผู้อนุมัติ ===== */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3 className="card-title">✍️ ผู้ทวนสอบและอนุมัติ</h3></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 480 }}>
            <div>
              <label style={sectionLabel}>ผู้จัดการฝ่ายผลิต</label>
              <EmpInput value={approver} onChange={e => setApprover(e.target.value)} placeholder="ชื่อผู้จัดการฝ่ายผลิต" style={{ border: "1px solid var(--border)", padding: "7px 10px", borderRadius: 7, fontSize: 13, width: "100%" }} />
            </div>
            <div>
              <label style={sectionLabel}>วันที่อนุมัติ</label>
              <input type="date" value={approveDate} onChange={e => setApproveDate(e.target.value)} style={{ border: "1px solid var(--border)", padding: "7px 10px", borderRadius: 7, fontSize: 13, width: "100%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenGoodsReceipt, printFMWH01: (receipt) => {
  // สร้าง instance ชั่วคราวของ printDoc โดยใช้ข้อมูล receipt ที่ส่งมา
  const logoUrl = new URL("logo-yaipu.png", window.location.href).href;
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const chk = (v) => v ? "☑" : "☐";
  const fmtDate = (d) => window.fmtDateGlobal(d);
  const items = receipt.items || [];
  const docNo = receipt.docNo || receipt.receiptNo || "";
  const receiptDate = receipt.receiptDate || "";
  const supplier = receipt.supplier || receipt.supplierName || "";
  const approver = receipt.approver || "";
  const approveDate = receipt.approveDate || "";
  const generalNotes = receipt.generalNotes || receipt.notes || "";

  const itemRows = items.map((it, i) => `
    <tr>
      <td class="c" rowspan="2">${i+1}</td>
      <td rowspan="2"><strong>${esc(it.rawCode||it.code||"")}</strong><br><span style="font-size:10px">${esc(it.rawName||it.name||it.description||"")}</span></td>
      <td class="c">${esc(it.lotNo)||"—"}</td>
      <td class="c">${fmtDate(it.mfgDate)}</td>
      <td class="c">${fmtDate(it.expDate||it.expireDate)}</td>
      <td class="c">${esc(it.qty)} ${esc(it.unit)}</td>
      <td rowspan="2">
        ${it.qcResult === "pass"
          ? `<strong style="color:#2D5128">☑ ผ่าน อนุมัติรับเข้า</strong><br>☐ ไม่ผ่าน<br><span style="color:#bbb;font-size:9px">☐ คืนผู้ขาย ☐ กักกัน ☐ ทำลาย</span>`
          : it.qcResult === "fail"
          ? `☐ ผ่าน อนุมัติรับเข้า<br><strong style="color:#7A1411">☑ ไม่ผ่าน</strong><br>${chk(it.qcAction==='คืนผู้ขาย')} คืนผู้ขาย ${chk(it.qcAction==='กักกัน')} กักกัน ${chk(it.qcAction==='ทำลาย')} ทำลาย`
          : `☐ ผ่าน อนุมัติรับเข้า<br>☐ ไม่ผ่าน<br><span style="color:#bbb;font-size:9px">☐ คืนผู้ขาย ☐ กักกัน ☐ ทำลาย</span>`}
        ${it.qcNote ? `<div style="font-size:9px;margin-top:3px;color:#555">${esc(it.qcNote)}</div>` : ""}
      </td>
      <td class="c" rowspan="2">${esc(it.qcPerson)||"—"}<br><span style="font-size:10px">${fmtDate(it.qcDate)}</span></td>
      <td class="c" rowspan="2">${esc(it.deliverer)||"—"}</td>
      <td rowspan="2" style="font-size:10px">
        ${chk(it.docCOA)} COA<br>${chk(it.docSPEC)} SPEC<br>${chk(it.docTest)} Test Report<br>${chk(!!it.docOther)} อื่น ${it.docOther&&it.docOther.trim()?esc(it.docOther):"........................."}      
      </td>
      <td class="c" rowspan="2">${esc(it.whPerson)||"—"}<br><span style="font-size:10px">${fmtDate(it.whDate)}</span></td>
      <td rowspan="2">${esc(it.itemNote)||""}</td>
    </tr>
    <tr style="background:#fafafa"><td colspan="4" style="font-size:9px;color:#555;padding:3px 6px">รายละเอียดเพิ่มเติม: ${esc(it.qcNote)||"—"}</td></tr>`).join("");

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>FM-WH-01 ${esc(docNo)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{font-family:'Sarabun',sans-serif;margin:0;padding:20px;font-size:11px;background:#e8e8e8;color:#000}.doc{width:1200px;margin:0 auto;background:#fff;padding:20px 24px;box-shadow:0 4px 20px rgba(0,0,0,.15)}.head{display:grid;grid-template-columns:70px 1fr auto;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:6px}.head img{width:65px;height:65px;object-fit:contain}.co-name{font-size:16px;font-weight:700}.co-addr{font-size:10px;color:#444}.doc-title{text-align:right}.doc-title .t{font-size:15px;font-weight:700}.info-row{display:flex;gap:24px;margin-bottom:8px;font-size:11px;border-bottom:1px solid #ccc;padding-bottom:6px}table{border-collapse:collapse;width:100%}th{background:#e8e8e8;border:1px solid #000;padding:4px 5px;text-align:center;font-size:10px;font-weight:600;vertical-align:middle}td{border:1px solid #000;padding:4px 5px;vertical-align:middle;font-size:10px}.c{text-align:center}.foot{margin-top:10px;font-size:10px}.sig-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:10px}.sig-box{border:1px solid #aaa;border-radius:4px;padding:8px 10px;text-align:center;min-height:60px}.sig-box .role{font-weight:600;margin-bottom:16px}.sig-box .date{font-size:10px;color:#555;margin-top:6px}.bar{text-align:center;margin-top:14px}.bar button{font-family:inherit;font-size:13px;font-weight:600;padding:8px 24px;border-radius:8px;border:none;cursor:pointer;background:#B6241F;color:#fff}@media print{body{background:#fff;padding:0}.doc{width:100%;box-shadow:none;padding:8mm}.no-print{display:none!important}@page{size:A3 landscape;margin:0}}</style>
</head><body><div class="doc">
  <div class="head"><img src="${logoUrl}" alt="">
  <div><div class="co-name">บริษัท ชูรสยายปู จำกัด</div><div class="co-addr">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div><div style="font-size:14px;font-weight:700;margin-top:4px">บันทึกการรับวัตถุดิบและวัสดุบรรจุ</div></div>
  <div class="doc-title"><div class="t">เลขที่: ${esc(docNo)}</div><div style="font-size:11px;margin-top:4px">FM-WH-01 Rev.00</div></div></div>
  <div class="info-row"><span><strong>วันที่รับวัตถุดิบและวัสดุบรรจุ:</strong> ${fmtDate(receiptDate)}</span><span><strong>ผู้ส่งมอบ:</strong> ${esc(supplier)||'—'}</span>${generalNotes?`<span><strong>หมายเหตุ:</strong> ${esc(generalNotes)}</span>`:""}</div>
  <table><thead><tr><th rowspan="2" style="width:28px">ลำดับ</th><th rowspan="2" style="width:130px">รายการวัตถุดิบและวัสดุบรรจุ</th><th colspan="3" style="width:210px">รายละเอียดของวัตถุดิบ</th><th rowspan="2" style="width:65px">จำนวนที่สั่งซื้อ</th><th colspan="2" style="width:190px">ผลการตรวจสอบ</th><th rowspan="2" style="width:65px">ผู้ส่งมอบ</th><th rowspan="2" style="width:90px">เอกสารคุณภาพ</th><th rowspan="2" style="width:80px">ผู้ตรวจรับ (WH)</th><th rowspan="2" style="width:80px">หมายเหตุ</th></tr><tr><th style="width:70px">Lot ผู้ผลิต</th><th style="width:70px">MFG. Date</th><th style="width:70px">Exp. Date</th><th style="width:120px">ผลการตัดสิน</th><th style="width:80px">ผู้ตัดสิน (QC)</th></tr></thead>
  <tbody>${itemRows||'<tr><td colspan="12" class="c" style="padding:20px">ไม่มีรายการ</td></tr>'}</tbody></table>
  <div class="foot"><div class="note"><strong>หมายเหตุ:</strong><div>1. ตัวอย่างการตรวจสอบ ประกอบไปด้วย ลักษณะทางกายภาพ ความชื้น ความสะอาด สี กลิ่นปกติ ไม่พบสิ่งแปลกปลอม</div><div>2. เอกสารด้านคุณภาพ ประกอบด้วย COA/SPEC หรือ Test Report เป็นต้น</div></div>
  <div class="sig-row"><div></div><div></div><div class="sig-box"><div class="role">ผู้ทวนสอบและอนุมัติ</div><div style="font-size:11px;min-height:20px">${esc(approver)||""}</div><div style="font-weight:600">ผู้จัดการฝ่ายผลิต</div><div class="date">วันที่ ${approveDate?fmtDate(approveDate):".......... / .......... / .............."}  </div></div></div></div>
  <div style="font-size:10px;color:#888;text-align:right;margin-top:6px">FM-WH-01 Rev.00</div>
  <div class="bar no-print"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
</div></body></html>`;
  const win = window.open("","","width=1300,height=900");
  if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่"); return; }
  win.document.write(html); win.document.close();
}});

