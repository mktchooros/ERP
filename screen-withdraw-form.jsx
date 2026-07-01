// พิมพ์ใบเบิกสินค้า FG — ใช้ฟอร์มเดียวกับใบเบิกวัตถุดิบ (FM-WH-04)
const printFGWithdrawal = (record, MENU_LIST, fmtDate, autoPrint = true) => {
  const prodName = (code) => {
    const p = (MENU_LIST || []).find(m => m.code === code);
    return p ? `${p.emoji || ""} ${p.name}` : code;
  };
  const items = record.items || [];
  const totalQty = items.reduce((s, it) => s + (parseInt(it.qty, 10) || 0), 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;margin:0;padding:12mm}
.page{width:210mm;min-height:297mm;padding:10mm;box-sizing:border-box;margin:0 auto;border:1px solid #ddd;page-break-after:always;font-size:10px}
.header{display:flex;gap:8px;align-items:center;margin-bottom:6px}
.logo{width:46px;height:46px;border-radius:3px;flex-shrink:0;object-fit:cover}
.header-center{flex:1;text-align:center}
.header-center h1{margin:0;font-size:14px;font-weight:bold}
.header-center .doctitle{font-size:13px;font-weight:bold;margin-top:2px}
.docno{text-align:right;font-size:10px;white-space:nowrap}
.toprow{display:flex;justify-content:space-between;gap:20px;margin:10px 0 4px;font-size:10px}
.toprow .fld{flex:1}
.line{display:inline-block;border-bottom:1px dotted #333;min-width:120px}
table{width:100%;border-collapse:collapse;font-size:9px;margin-top:6px}
th{background:#f0f0f0;border:1px solid #333;padding:4px 3px;text-align:center;font-weight:bold;line-height:1.2}
td{border:1px solid #333;padding:4px;height:22px}
.tot td{font-weight:bold;background:#f7f7f7}
.movetype{margin:10px 0 4px;font-size:11px}
.movetype .box{display:inline-block;margin-right:30px}
.sig-group{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:26px;text-align:center;font-size:10px}
.sig-group .dt{font-size:9px;margin-top:6px}
.footer-note{margin-top:10px;font-size:8px;color:#444}
@media print{body{margin:0;padding:0}.page{border:none;margin:0}}
  </style></head><body>
  <div class="page">
    <div class="header">
      <img src="logo.jpg" class="logo">
      <div class="header-center">
        <h1>บริษัท ชูรสยายปู จำกัด</h1>
        <div class="doctitle">บันทึกการเบิก-คืนผลิตภัณฑ์สำเร็จรูป</div>
      </div>
      <div class="docno">เลขที่เอกสาร<br>${record.docNumber || 'WH11-................'}</div>
    </div>

    <div class="toprow">
      <div class="fld">ผู้ขอเบิก/คืน <span class="line">${record.withdrawBy || ''}</span></div>
      <div class="fld" style="text-align:right">วันที่ <span class="line" style="min-width:90px">${fmtDate(record.date)}</span></div>
    </div>
    <div class="toprow" style="margin-top:0">
      <div class="fld">วัตถุประสงค์การเบิก/คืน <span class="line" style="min-width:240px">${record.type || ''}${record.reason ? ' · ' + record.reason : ''}</span></div>
    </div>

    <table>
      <thead><tr>
        <th style="width:28px">ลำดับ</th>
        <th>รายการ</th>
        <th style="width:55px">รหัส</th>
        <th style="width:60px">Lot No.</th>
        <th style="width:48px">จำนวน</th>
        <th style="width:38px">หน่วย</th>
        <th style="width:50px">เบิก/คืน</th>
        <th style="width:70px">เลขที่ใบสั่งผลิต</th>
        <th style="width:80px">หมายเหตุ</th>
      </tr></thead>
      <tbody>
        ${items.map((it, i) => `<tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${prodName(it.product)}</td>
          <td style="text-align:center">${it.product || ''}</td>
          <td style="text-align:center">${it.lot || ''}</td>
          <td style="text-align:right">${(parseInt(it.qty, 10) || 0).toLocaleString()}</td>
          <td style="text-align:center">${it.unit || 'ซอง'}</td>
          <td style="text-align:center">${record.mode || 'เบิก'}</td>
          <td style="text-align:center">${it.po || record.reference || ''}</td>
          <td>${it.note || ''}</td>
        </tr>`).join('')}
        ${Array(Math.max(0, 14 - items.length)).fill(0).map((_, i) => `<tr><td style="text-align:center">${items.length + i + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
        <tr class="tot"><td colspan="4" style="text-align:right">ยอดรวม</td><td style="text-align:right">${totalQty.toLocaleString()}</td><td colspan="4"></td></tr>
      </tbody>
    </table>

    <div class="movetype">
      ภท:
      <span class="box">${(record.mode || 'เบิก') === 'เบิก' ? '☑' : '☐'} เบิก</span>
      <span class="box">${record.mode === 'คืน' ? '☑' : '☐'} คืน</span>
    </div>

    <div class="sig-group">
      <div>
        ผู้อนุมัติ ...............................................
        <div class="dt">วันที่ ........./............/..............</div>
      </div>
      <div>
        ผู้จ่าย ...............................................
        <div class="dt">วันที่ ........./............/..............</div>
      </div>
      <div>
        ผู้รับเบิก/คืน ...............................................
        <div class="dt">วันที่ ........./............/..............</div>
      </div>
    </div>

    <div class="footer-note">FM-WH-11 Rev.00</div>
  </div>
  </body></html>`;
  const win = window.open('', '_blank');
  if (!win) { alert('⚠️ เบราว์เซอร์บล็อก popup'); return; }
  win.document.write(html);
  win.document.close();
  if (autoPrint) {
    win.focus();
    setTimeout(() => win.print(), 300);
  }
};

// 📦 บันทึกเบิกสินค้า FG (Finished Goods)
const ScreenWithdrawFG = () => {
  const [items, setItems] = React.useState([]);
  const [nextId, setNextId] = React.useState(0);
  const [withdrawDate, setWithdrawDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [withdrawType, setWithdrawType] = React.useState("ขาย"); // ขาย | ชงชิม | ทดลอง | แจกฟรี | ย้าย
  const [withdrawBy, setWithdrawBy] = React.useState("");
  const [approveBy, setApproveBy] = React.useState("");
  const [reference, setReference] = React.useState(""); // PO, SO, etc.
  const [reason, setReason] = React.useState("");
  const [mode, setMode] = React.useState("เบิก"); // เบิก | คืน
  const [message, setMessage] = React.useState("");

  const MENU_LIST = typeof MENU !== "undefined" ? MENU : [];

  // Add row
  const addRow = () => {
    setItems([...items, {
      id: nextId,
      product: "",
      lot: "",
      qty: 0,
      unit: "ซอง",
      po: "",
      note: ""
    }]);
    setNextId(nextId + 1);
  };

  // Remove row
  const removeRow = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Update item
  const updateItem = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id !== id) return item;
      
      if (field === "product") {
        const product = MENU_LIST.find(m => m.code === value);
        if (product) {
          return {
            ...item,
            product: product.code,
            unit: "ซอง"
          };
        }
      }
      
      return {
        ...item,
        [field]: field === "qty" || field === "id" ? parseFloat(value) || 0 : value
      };
    });
    setItems(newItems);
  };

  const filteredItems = items.filter(i => i.product);

  // Generate doc number
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  const runNum = String((Object.keys(localStorage).filter(k => k.startsWith('erp_fg_withdraw_')).length % 10000) + 1).padStart(4, '0');
  const docNumber = `WH11-${year}${month}${runNum}`;

  // Save
  const handleSave = () => {
    if (!withdrawDate || !withdrawBy || filteredItems.length === 0) {
      setMessage("⚠️ กรุณากรอกวันที่ | ผู้ขอเบิก/คืน | รายการ");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    // Save withdrawal record (FG stock จะถูกหักอัตโนมัติในสต๊อคการ์ด FG)
    const data = {
      docNumber,
      date: withdrawDate,
      type: withdrawType,
      mode,
      reference,
      withdrawBy,
      approveBy,
      reason,
      items: filteredItems,
      savedAt: new Date().toLocaleString("th-TH")
    };

    localStorage.setItem(`erp_fg_withdraw_${withdrawDate}_${docNumber}`, JSON.stringify(data));
    setMessage(`✅ บันทึกสำเร็จ ${docNumber}`);
    
    // Reset form
    setTimeout(() => {
      setItems([]);
      setNextId(0);
      setWithdrawDate(new Date().toISOString().split("T")[0]);
      setWithdrawType("ขาย");
      setMode("เบิก");
      setWithdrawBy("");
      setApproveBy("");
      setReference("");
      setReason("");
      setMessage("");
    }, 2000);
  };

  // Print — ใช้ฟอร์มเดียวกับใบเบิกวัตถุดิบ
  const fmtDate = (d) => window.fmtDateGlobal(d);

  const handlePrint = () => {
    if (filteredItems.length === 0) {
      setMessage("⚠️ ไม่มีรายการให้พิมพ์");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    const record = {
      docNumber, date: withdrawDate, type: withdrawType, mode,
      reference, withdrawBy, approveBy, reason, items: filteredItems,
    };
    printFGWithdrawal(record, MENU_LIST, fmtDate);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📦 บันทึกการเบิก-คืนผลิตภัณฑ์สำเร็จรูป</h1>
          <p className="page-sub">FM-WH-11 · เบิก/คืนสินค้าสำเร็จรูป (FG)</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px",
          marginBottom: "16px",
          borderRadius: "6px",
          background: message.includes("✅") ? "#dcfce7" : "#fee2e2",
          color: message.includes("✅") ? "#166534" : "#dc2626",
          fontSize: "13px"
        }}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                เลขที่เอกสาร
              </label>
              <div style={{ padding: "8px 12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace" }}>
                {docNumber}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                วันที่
              </label>
              <input
                type="date"
                value={withdrawDate}
                onChange={(e) => setWithdrawDate(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                ประเภทรายการ
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px" }}
              >
                <option value="เบิก">เบิก</option>
                <option value="คืน">คืน</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                วัตถุประสงค์การเบิก/คืน
              </label>
              <select
                value={withdrawType}
                onChange={(e) => setWithdrawType(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px" }}
              >
                <option value="ขาย">ขาย</option>
                <option value="ชงชิม">ชงชิม</option>
                <option value="ทดลอง">ทดลอง</option>
                <option value="แจกฟรี">แจกฟรี</option>
                <option value="ย้าย">ย้าย</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                ผู้ขอเบิก/คืน
              </label>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={withdrawBy}
                onChange={(e) => setWithdrawBy(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                ผู้อนุมัติ
              </label>
              <input
                type="text"
                placeholder="ชื่อ"
                value={approveBy}
                onChange={(e) => setApproveBy(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                เลขที่ใบสั่งผลิต (อ้างอิง)
              </label>
              <input
                type="text"
                placeholder="เช่น PD05260001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
              หมายเหตุ
            </label>
            <textarea
              placeholder="หมายเหตุเพิ่มเติม"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px", minHeight: "60px" }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-head">
          <h3 className="card-title">รายการเบิก-คืน</h3>
        </div>
        <div className="card-body" style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ลบ</th>
                <th>สินค้า</th>
                <th style={{ width: 70 }}>ล็อต</th>
                <th style={{ width: 80 }} className="num">จำนวน</th>
                <th style={{ width: 60 }}>หน่วย</th>
                <th style={{ width: 110 }}>เลขที่ใบสั่งผลิต</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => removeRow(item.id)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      ลบ
                    </button>
                  </td>
                  <td>
                    <select
                      value={item.product}
                      onChange={(e) => updateItem(item.id, "product", e.target.value)}
                      style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {MENU_LIST.map((m, i) => (
                        <option key={i} value={m.code}>
                          {m.emoji} {m.code} - {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="ล็อต"
                      value={item.lot}
                      onChange={(e) => updateItem(item.id, "lot", e.target.value)}
                      style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                      style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px", textAlign: "right" }}
                    />
                  </td>
                  <td style={{ textAlign: "center", fontSize: "12px" }}>
                    {item.unit}
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="PD…"
                      value={item.po || ""}
                      onChange={(e) => updateItem(item.id, "po", e.target.value)}
                      style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="หมายเหตุ"
                      value={item.note}
                      onChange={(e) => updateItem(item.id, "note", e.target.value)}
                      style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-foot" style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={addRow}
            style={{
              padding: "8px 16px",
              background: "var(--sky)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            + เพิ่มรายการ
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={handlePrint}
          style={{
            padding: "10px 20px",
            background: "var(--slate)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          🖨️ พิมพ์
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 20px",
            background: "var(--brand)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          💾 บันทึก
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenWithdrawFG, printFGWithdrawal });
