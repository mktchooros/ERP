// 📋 ประวัติการเบิกวัตถุดิบ — กู้กลับ (อ่านจาก localStorage withdrawal_*)
const ScreenWithdrawalHistory = () => {
  const [records, setRecords] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [openKey, setOpenKey] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [editRec, setEditRec] = React.useState(null);

  const RAW_LIST = typeof RAW !== "undefined" ? RAW : [];
  const PROD_LIST = typeof PRODUCTIONS !== "undefined" ? PRODUCTIONS : [];

  const load = React.useCallback(() => {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("withdrawal_")) {
        const rec = JSON.parse(localStorage.getItem(key));
        list.push({ ...rec, key });
      }
    }
    setRecords(list.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || "")));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const del = (key) => {
    if (!confirm("ลบรายการเบิกนี้?")) return;
    localStorage.removeItem(key);
    load();
  };

  const saveEdit = () => {
    if (!editRec) return;
    const { key, ...data } = editRec;
    data.items = (data.items || []).filter(it => it.code || it.name);
    localStorage.setItem(key, JSON.stringify(data));
    setEditRec(null);
    setMsg("✅ บันทึกการแก้ไขสำเร็จ");
    setTimeout(() => setMsg(""), 3000);
    load();
  };

  const updEdit = (field, value) => setEditRec(p => ({ ...p, [field]: value }));
  const updEditItem = (idx, field, value) => setEditRec(p => {
    const items = [...(p.items || [])];
    items[idx] = { ...items[idx], [field]: field === "qty" ? (parseFloat(value) || 0) : value };
    if (field === "code") {
      const raw = RAW_LIST.find(r => r.code === value);
      if (raw) items[idx].name = raw.name;
    }
    return { ...p, items };
  });
  const addEditItem = () => setEditRec(p => ({ ...p, items: [...(p.items || []), { code: "", name: "", qty: 0, unit: "" }] }));
  const delEditItem = (idx) => setEditRec(p => ({ ...p, items: (p.items || []).filter((_, i) => i !== idx) }));

  const fmtDate = (d) => window.fmtDateGlobal(d);

  const statusBadge = (s) => {
    if (/อนุมัติ|approve|เสร็จ/i.test(s || "")) return "b-done";
    if (/รอ|wait|pending/i.test(s || "")) return "b-wait";
    return "b-neutral";
  };

  const handlePreview = (record) => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;margin:0;padding:12mm}
.page{width:210mm;height:297mm;padding:10mm;box-sizing:border-box;margin:0 auto;border:1px solid #ddd;page-break-after:always;font-size:10px}
.header{display:flex;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #333}
.logo{width:40px;height:40px;border-radius:3px;flex-shrink:0}
.header h1{margin:0;font-size:14px;color:#B6241F;font-weight:bold}
.header p{margin:2px 0;font-size:9px;color:#666}
.title{text-align:center;font-size:13px;font-weight:bold;margin:8px 0}
.subtitle{text-align:center;font-size:11px;font-weight:bold;margin:6px 0;background:#f5f5f5;padding:4px}
.info{display:grid;grid-template-columns:1fr 2fr 1fr 1fr;gap:6px;margin-bottom:8px;font-size:10px}
.info-field{border:1px solid #333;padding:3px;min-height:20px}
.info-label{display:block;font-size:9px;font-weight:bold;margin-bottom:1px}
table{width:100%;border-collapse:collapse;font-size:9px;margin-top:6px}
th{background:#f5f5f5;border:1px solid #333;padding:3px;text-align:left;font-weight:bold;line-height:1.2}
td{border:1px solid #ddd;padding:4px;height:24px}
.checkbox-group{display:flex;gap:20px;margin:8px 0;font-size:10px}
.checkbox-item{display:flex;align-items:center;gap:6px}
.checkbox-item input{width:16px;height:16px;cursor:pointer}
.sig-group{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:15px;text-align:center;font-size:9px}
.sig-line{margin-top:25px;border-top:1px solid #333;padding-top:2px}
.footer-note{text-align:right;margin-top:6px;font-size:8px;color:#666}
@media print{body{margin:0;padding:0}.page{border:none;margin:0}}
    </style></head><body>
    <div class="page">
      <div class="header">
        <img src="logo.jpg" class="logo">
        <div>
          <h1>บริษัท ชูรสยายปู จำกัด</h1>
          <p>บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ</p>
        </div>
      </div>
      <div class="subtitle">บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ</div>
      
      <div class="info">
        <div class="info-field"><span class="info-label">วันที่</span>${fmtDate(record.date)}</div>
        <div class="info-field"><span class="info-label">แผนก</span>${record.department||'—'}</div>
        <div class="info-field"><span class="info-label">เลขที่เอกสาร (WH04)</span>${record.docNumber||'—'}</div>
        <div></div>
      </div>

      <table>
        <thead><tr>
          <th style="width:30px">ลำดับ</th>
          <th>รายการ</th>
          <th style="width:60px">รหัส</th>
          <th style="width:70px">Lot รุ่นเข้า</th>
          <th style="width:50px;text-align:right">จำนวน</th>
          <th style="width:40px">หมาย</th>
          <th style="width:40px">เบิก</th>
          <th style="width:40px">คืน</th>
          <th style="width:50px">เปลี่ยน</th>
          <th style="width:60px">ใช้กับใบสั่งผลิตเลขที่</th>
          <th>หมายเหตุ</th>
        </tr></thead>
        <tbody>
          ${(record.items||[]).map((it,i)=>`<tr>
            <td style="text-align:center">${i+1}</td>
            <td>${it.name}</td>
            <td>${it.code}</td>
            <td></td>
            <td style="text-align:right">${it.qty}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${record.productionOrderNo||'—'}</td>
            <td></td>
          </tr>`).join('')}
          ${Array(Math.max(0,12-(record.items||[]).length)).fill(0).map(()=>`<tr><td colspan="11"></td></tr>`).join('')}
        </tbody>
      </table>

      <div class="checkbox-group">
        <div class="checkbox-item">
          <input type="checkbox" id="ch1">
          <label for="ch1" style="cursor:pointer">☐ เบิก</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="ch2">
          <label for="ch2" style="cursor:pointer">☐ คืน</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="ch3">
          <label for="ch3" style="cursor:pointer">☐ เบิกชิน</label>
        </div>
      </div>

      <div style="margin:8px 0;font-size:9px">
        <strong>ประเภทการเคลื่อนไหว:</strong>
      </div>

      <div class="sig-group">
        <div>
          <p style="margin:0">ผู้เบิก / คืน ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
        <div>
          <p style="margin:0">ผู้อนุมัติ ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
        <div>
          <p style="margin:0">ผู้ตรวจสอบ ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
        <div>
          <p style="margin:0">ผู้จัด (คลังสิน) ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
      </div>

      <div class="footer-note">FM-WH-04 Rev.00</div>
    </div>
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) {
      alert('⚠️ เบราว์เซอร์บล็อก popup');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  const handlePrint = (record) => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;margin:0;padding:12mm}
.page{width:210mm;height:297mm;padding:10mm;box-sizing:border-box;margin:0 auto;border:1px solid #ddd;page-break-after:always;font-size:10px}
.header{display:flex;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #333}
.logo{width:40px;height:40px;border-radius:3px;flex-shrink:0}
.header h1{margin:0;font-size:14px;color:#B6241F;font-weight:bold}
.header p{margin:2px 0;font-size:9px;color:#666}
.title{text-align:center;font-size:13px;font-weight:bold;margin:8px 0}
.subtitle{text-align:center;font-size:11px;font-weight:bold;margin:6px 0;background:#f5f5f5;padding:4px}
.info{display:grid;grid-template-columns:1fr 2fr 1fr 1fr;gap:6px;margin-bottom:8px;font-size:10px}
.info-field{border:1px solid #333;padding:3px;min-height:20px}
.info-label{display:block;font-size:9px;font-weight:bold;margin-bottom:1px}
table{width:100%;border-collapse:collapse;font-size:9px;margin-top:6px}
th{background:#f5f5f5;border:1px solid #333;padding:3px;text-align:left;font-weight:bold;line-height:1.2}
td{border:1px solid #ddd;padding:4px;height:24px}
.checkbox-group{display:flex;gap:20px;margin:8px 0;font-size:10px}
.checkbox-item{display:flex;align-items:center;gap:6px}
.checkbox-item input{width:16px;height:16px;cursor:pointer}
.sig-group{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:15px;text-align:center;font-size:9px}
.sig-line{margin-top:25px;border-top:1px solid #333;padding-top:2px}
.footer-note{text-align:right;margin-top:6px;font-size:8px;color:#666}
@media print{body{margin:0;padding:0}.page{border:none;margin:0}}
    </style></head><body>
    <div class="page">
      <div class="header">
        <img src="logo.jpg" class="logo">
        <div>
          <h1>บริษัท ชูรสยายปู จำกัด</h1>
          <p>บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ</p>
        </div>
      </div>
      <div class="subtitle">บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ</div>
      
      <div class="info">
        <div class="info-field"><span class="info-label">วันที่</span>${fmtDate(record.date)}</div>
        <div class="info-field"><span class="info-label">แผนก</span>${record.department||'—'}</div>
        <div class="info-field"><span class="info-label">เลขที่เอกสาร (WH04)</span>${record.docNumber||'—'}</div>
        <div></div>
      </div>

      <table>
        <thead><tr>
          <th style="width:30px">ลำดับ</th>
          <th>รายการ</th>
          <th style="width:60px">รหัส</th>
          <th style="width:70px">Lot รุ่นเข้า</th>
          <th style="width:50px;text-align:right">จำนวน</th>
          <th style="width:40px">หมาย</th>
          <th style="width:40px">เบิก</th>
          <th style="width:40px">คืน</th>
          <th style="width:50px">เปลี่ยน</th>
          <th style="width:60px">ใช้กับใบสั่งผลิตเลขที่</th>
          <th>หมายเหตุ</th>
        </tr></thead>
        <tbody>
          ${(record.items||[]).map((it,i)=>`<tr>
            <td style="text-align:center">${i+1}</td>
            <td>${it.name}</td>
            <td>${it.code}</td>
            <td></td>
            <td style="text-align:right">${it.qty}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${record.productionOrderNo||'—'}</td>
            <td></td>
          </tr>`).join('')}
          ${Array(Math.max(0,12-(record.items||[]).length)).fill(0).map(()=>`<tr><td colspan="11"></td></tr>`).join('')}
        </tbody>
      </table>

      <div class="checkbox-group">
        <div class="checkbox-item">
          <input type="checkbox" id="ch1">
          <label for="ch1" style="cursor:pointer">☐ เบิก</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="ch2">
          <label for="ch2" style="cursor:pointer">☐ คืน</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="ch3">
          <label for="ch3" style="cursor:pointer">☐ เปลี่ยน</label>
        </div>
      </div>

      <div style="margin:8px 0;font-size:9px">
        <strong>ประเภทการเคลื่อนไหว:</strong>
      </div>

      <div class="sig-group">
        <div>
          <p style="margin:0">ผู้เบิก / คืน ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
        <div>
          <p style="margin:0">ผู้อนุมัติ ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
        <div>
          <p style="margin:0">ผู้ตรวจสอบ ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
        <div>
          <p style="margin:0">ผู้จัด (คลังสิน) ........................</p>
          <p style="margin:4px 0 0;font-size:8px">วันที่ .......... เดือน ........... ปี</p>
        </div>
      </div>

      <div class="footer-note">FM-WH-04 Rev.00</div>
    </div>
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) {
      alert('⚠️ เบราว์เซอร์บล็อก popup');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const filtered = records.filter(r => {
    const q = search.trim().toLowerCase();
    return !q || (r.docNumber || "").toLowerCase().includes(q) || (r.withdrawBy || "").toLowerCase().includes(q) || (r.date || "").includes(q) || (r.department || "").toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📋 ประวัติการเบิกวัตถุดิบ</h1>
          <p className="page-sub">รายการเบิกทั้งหมด {records.length} ใบ · คลิกแถวเพื่อดูรายละเอียด</p>
        </div>
      </div>

      {msg && <div className="alert" style={{ background: "var(--leaf-soft)", border: "1px solid #B9D4B2", color: "#2D5128", marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input placeholder="ค้นหา เลขที่เอกสาร / ผู้เบิก / วันที่ / แผนก…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 110 }}>วันที่</th>
              <th>เลขที่เอกสาร</th>
              <th>แผนก</th>
              <th>ผู้เบิก</th>
              <th className="num">จำนวนรายการ</th>
              <th style={{ width: 90 }}>สถานะ</th>
              <th style={{ width: 140 }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ยังไม่มีประวัติการเบิก</td></tr>
            ) : filtered.map(r => (
              <React.Fragment key={r.key}>
                <tr onClick={() => setOpenKey(openKey === r.key ? null : r.key)} style={{ cursor: "pointer" }}>
                  <td className="small muted">{fmtDate(r.date)}</td>
                  <td><span className="code">{r.docNumber || "—"}</span></td>
                  <td className="small">{r.department || "—"}</td>
                  <td className="small">{r.withdrawBy || "—"}</td>
                  <td className="num tnum">{(r.items || []).length}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status || "—"}</span></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setEditRec({ ...r, items: (r.items || []).map(it => ({ ...it })) }); }} title="แก้ไข">✏️</button>
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handlePreview(r); }} title="ดูตัวอย่าง">👁️</button>
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handlePrint(r); }} title="พิมพ์">🖨️</button>
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); del(r.key); }} style={{ color: "var(--brand)" }} title="ลบ">🗑️</button>
                  </td>
                </tr>
                {openKey === r.key && (
                  <tr>
                    <td colSpan={7} style={{ background: "var(--surface-2)", padding: 14 }}>
                      <div className="small muted" style={{ marginBottom: 8 }}>
                        {r.reason ? <span>เหตุผล: {r.reason} · </span> : null}
                        {r.notes ? <span>หมายเหตุ: {r.notes} · </span> : null}
                        บันทึกเมื่อ {r.savedAt || "—"}
                      </div>
                      <table className="tbl" style={{ background: "white", borderRadius: 8 }}>
                        <thead><tr><th>รหัส</th><th>ชื่อวัตถุดิบ</th><th className="num">จำนวน</th><th>หน่วย</th></tr></thead>
                        <tbody>
                          {(r.items || []).map((it, idx) => (
                            <tr key={idx}>
                              <td className="code">{it.code}</td>
                              <td className="small">{it.name}</td>
                              <td className="num tnum">{it.qty}</td>
                              <td className="small">{it.unit || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {editRec && (
        <div onClick={() => setEditRec(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 12, width: "100%", maxWidth: 760, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✏️ แก้ไขใบเบิก · {editRec.docNumber || "—"}</h2>
              <button className="btn btn-sm" onClick={() => setEditRec(null)}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่เบิก</label>
                  <input type="date" value={editRec.date || ""} onChange={(e) => updEdit("date", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>แผนก</label>
                  <input value={editRec.department || ""} onChange={(e) => updEdit("department", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ผู้เบิก</label>
                  <input value={editRec.withdrawBy || ""} onChange={(e) => updEdit("withdrawBy", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ใช้กับใบสั่งผลิตเลขที่</label>
                  <select value={editRec.productionOrderNo || ""} onChange={(e) => updEdit("productionOrderNo", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
                    <option value="">-- เลือก PO --</option>
                    {PROD_LIST.map((po, i) => (
                      <option key={`po_${i}_${po.code}`} value={po.code}>{po.code} - {po.recipe} ({po.qty} {po.unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="small muted" style={{ display: "block", marginBottom: 4 }}>สถานะ</label>
                  <select value={editRec.status || ""} onChange={(e) => updEdit("status", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
                    <option value="รออนุมัติ">รออนุมัติ</option>
                    <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                    <option value="เบิกเสร็จ">เบิกเสร็จ</option>
                  </select>
                </div>
              </div>

              <label className="small muted" style={{ display: "block", marginBottom: 6 }}>รายการวัตถุดิบ</label>
              <table className="tbl" style={{ marginBottom: 10 }}>
                <thead><tr><th style={{ width: 200 }}>รหัส</th><th>ชื่อวัตถุดิบ</th><th className="num" style={{ width: 90 }}>จำนวน</th><th style={{ width: 70 }}>หน่วย</th><th style={{ width: 40 }}></th></tr></thead>
                <tbody>
                  {(editRec.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={it.code || ""} onChange={(e) => updEditItem(idx, "code", e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}>
                          <option value="">-- เลือก --</option>
                          {RAW_LIST.map(r => <option key={r.code} value={r.code}>{r.code} - {r.name}</option>)}
                        </select>
                      </td>
                      <td className="small">{it.name || "—"}</td>
                      <td><input type="number" value={it.qty || 0} onChange={(e) => updEditItem(idx, "qty", e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, textAlign: "right" }} /></td>
                      <td><input value={it.unit || ""} onChange={(e) => updEditItem(idx, "unit", e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} /></td>
                      <td><button className="btn btn-sm" onClick={() => delEditItem(idx)} style={{ color: "var(--brand)" }}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-sm" onClick={addEditItem} style={{ marginBottom: 16 }}>+ เพิ่มรายการ</button>

              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>หมายเหตุ</label>
                <textarea value={editRec.notes || ""} onChange={(e) => updEdit("notes", e.target.value)} rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
              <button className="btn" onClick={() => setEditRec(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={saveEdit}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenWithdrawalHistory });
