// Screen Withdraw Form — ระบบเบิกวัตถุดิบ (พร้อม PO integration)
const ScreenWithdrawForm = () => {
  const [items, setItems] = React.useState([]);
  const [nextId, setNextId] = React.useState(0);
  const [selectedPOs, setSelectedPOs] = React.useState([]);
  // แปลงดัชนีสูตรที่เลือก → ข้อความ "PD - สูตร" สำหรับบันทึก/ส่งออก
  const poLabels = () => selectedPOs.map(key => {
    const po = prodOptions[parseInt(key, 10)];
    return po ? `${po.code} - ${po.recipe}` : key;
  });
  const [withdrawDate, setWithdrawDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [department, setDepartment] = React.useState("");
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  const runNum = String((Object.keys(localStorage).filter(k => k.startsWith('withdrawal_')).length % 10000) + 1).padStart(4, '0');
  const [docNumber, setDocNumber] = React.useState(month + year + runNum);
  const [withdrawBy, setWithdrawBy] = React.useState("");
  const [withdrawByDate, setWithdrawByDate] = React.useState("");
  const [approveBy, setApproveBy] = React.useState("");
  const [approveByDate, setApproveByDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState("เบิก");
  const [message, setMessage] = React.useState("");

  // รายการ PD จากข้อมูลล่าสุด (erp_productions) — เคารพการลบ/เพิ่มของผู้ใช้
  const [prodOptions, setProdOptions] = React.useState([]);
  React.useEffect(() => {
    let list = (typeof PRODUCTIONS !== "undefined") ? PRODUCTIONS : [];
    try { const s = localStorage.getItem('erp_productions'); if (s) list = JSON.parse(s); } catch(e) {}
    setProdOptions(list);
  }, []);

  // Handle PO selection - auto-load raw materials from all selected POs
  // poKey = index ของแถวผลิตใน prodOptions (เลือกทีละสูตร)
  const handlePOChange = (poKey, isChecked) => {
    let newSelectedPOs = isChecked 
      ? [...selectedPOs, poKey]
      : selectedPOs.filter(p => p !== poKey);
    
    setSelectedPOs(newSelectedPOs);
    
    if (newSelectedPOs.length === 0) {
      setItems([{ id: 0, code: "", name: "", lot: "", qty: 0, unit: "", withdraw: 0, return: 0, other: 0, note: "" }]);
      setNextId(1);
      return;
    }

    // อ่านข้อมูลล่าสุดจาก localStorage
    let prodList = PRODUCTIONS;
    try { const s = localStorage.getItem('erp_productions'); if (s) prodList = JSON.parse(s); } catch(e) {}
    let recipeList = RECIPES;
    try { const s = localStorage.getItem('erp_recipes'); if (s) recipeList = JSON.parse(s); } catch(e) {}
    let rawList = RAW;
    try { const s = localStorage.getItem('erp_raw'); if (s) rawList = JSON.parse(s); } catch(e) {}

    // รวมวัตถุดิบจากแต่ละสูตรที่เลือก
    const itemMap = {}; // key = raw code, value = { ...item }
    let hasError = false;

    newSelectedPOs.forEach(poKey => {
      // poKey = ดัชนีแถวผลิต → หนึ่งสูตร
      const po = prodList[parseInt(poKey, 10)];
      if (!po) {
        setMessage(`⚠️ ไม่พบรายการผลิตที่เลือก`);
        hasError = true;
        return;
      }
      const tag = `${po.code}/${po.recipe}`;

      const recipe = recipeList.find(r => r.code === po.recipe);
      if (!recipe || !recipe.items || recipe.items.length === 0) {
        setMessage(`⚠️ ไม่พบสูตร "${po.recipe}" หรือไม่มีวัตถุดิบ`);
        hasError = true;
        return;
      }

      const batchSize = parseFloat(recipe.makes) || 1;

      recipe.items.forEach((recipeItem) => {
        const raw = rawList.find(r => r.code === recipeItem.raw);
        const isPackaging = (recipeItem.raw || "").toUpperCase().startsWith("PK") || (raw && raw.unit === "ใบ");
        const computedQty = isPackaging
          ? po.qty
          : Math.round(recipeItem.qty * po.qty / batchSize);

        if (!itemMap[recipeItem.raw]) {
          itemMap[recipeItem.raw] = {
            id: Object.keys(itemMap).length,
            code: recipeItem.raw,
            name: raw ? raw.name : "",
            lot: "",
            qty: computedQty,
            unit: raw ? raw.unit : "",
            withdraw: computedQty,
            return: 0,
            other: 0,
            note: `สำหรับ ${tag}`
          };
        } else {
          // รวมปริมาณถ้าวัตถุดิบซ้ำ
          itemMap[recipeItem.raw].qty += computedQty;
          itemMap[recipeItem.raw].withdraw += computedQty;
          if (!itemMap[recipeItem.raw].note.includes(tag)) {
            itemMap[recipeItem.raw].note += `, ${tag}`;
          }
        }
      });
    });

    if (hasError) {
      setTimeout(() => setMessage(""), 4000);
    }

    const newItems = Object.values(itemMap);
    setItems(newItems.length > 0 ? newItems : [{ id: 0, code: "", name: "", lot: "", qty: 0, unit: "", withdraw: 0, return: 0, other: 0, note: "" }]);
    setNextId(newItems.length);
  };

  // Add row
  const addRow = () => {
    setItems([...items, { 
      id: nextId, 
      code: "", 
      name: "", 
      lot: "",
      qty: 0, 
      unit: "", 
      withdraw: 0,
      return: 0,
      other: 0,
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
      
      if (field === "code") {
        const raw = RAW.find(r => r.code === value);
        if (raw) {
          return {
            ...item,
            code: raw.code,
            name: raw.name,
            unit: raw.unit,
          };
        }
      } else {
        return {
          ...item,
          [field]: field === "note" ? value : (parseFloat(value) || 0),
        };
      }
      
      return item;
    });
    setItems(newItems);
  };

  // Calculate totals
  const filteredItems = items.filter(i => i.code);

  // Save
  const handleSave = () => {
    if (!withdrawDate || !withdrawBy) {
      setMessage("⚠️ กรุณากรอกวันที่เบิก และ ผู้เบิก");
      return;
    }
    
    const data = {
      date: withdrawDate,
      department,
      docNumber,
      selectedPOs,
      productionOrderNo: poLabels().join(", "),
      status,
      withdrawBy,
      withdrawByDate,
      approveBy,
      approveByDate,
      items: filteredItems,
      reason,
      notes,
      savedAt: new Date().toLocaleString("th-TH"),
    };
    
    localStorage.setItem("withdrawal_" + withdrawDate, JSON.stringify(data));
    setMessage("✅ บันทึกสำเร็จ");
    setTimeout(() => setMessage(""), 3000);
  };

  // Print
  const handlePrint = () => {
    if (!filteredItems.length) {
      setMessage("⚠️ ไม่มีรายการให้พิมพ์");
      return;
    }
    window.print();
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!filteredItems.length) {
      setMessage("⚠️ ไม่มีรายการให้ส่งออก");
      return;
    }
    
    let html = `<html><head><meta charset="utf-8"><title>บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ</title><style>
      body { font-family: 'Arial', sans-serif; padding: 30px; margin: 0; background: white; }
      .container { max-width: 900px; margin: 0 auto; }
      .header-top { display: grid; grid-template-columns: 80px 1fr 200px; gap: 20px; margin-bottom: 20px; align-items: start; }
      .logo { width: 80px; height: 80px; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
      .logo img { width: 100%; height: 100%; object-fit: cover; }
      .header-center { text-align: center; }
      .header-center h1 { margin: 0; font-size: 16px; font-weight: bold; }
      .header-center p { margin: 5px 0; font-size: 12px; }
      .header-right { text-align: right; font-size: 11px; line-height: 1.6; }
      .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 15px; font-size: 12px; }
      .info-row div { }
      .info-label { font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
      th, td { border: 1px solid #000; padding: 6px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      td { height: 20px; }
      .checkbox-group { margin: 15px 0; font-size: 12px; }
      .checkbox-group label { margin-right: 25px; }
      .signature-area { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 40px; font-size: 11px; }
      .sig-box { text-align: center; }
      .sig-line { border-top: 1px solid #000; height: 40px; margin-bottom: 5px; }
      .sig-label { font-weight: bold; }
      .sig-date { font-size: 10px; }
      @media print {
        body { padding: 0; margin: 0; }
        .container { max-width: 100%; }
      }
    </style></head><body>
      <div class="container">
        <div class="header-top">
          <div class="logo">
            <img src="logo.jpg" alt="logo" />
          </div>
          <div class="header-center">
            <h1>บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ</h1>
            <p>บริษัท ชูรสยายปู จำกัด</p>
          </div>
          <div class="header-right">
            <div><span class="info-label">เลขที่เอกสาร:</span> WH04-${docNumber}</div>
            <div><span class="info-label">สถานะ:</span> ${status}</div>
          </div>
        </div>

        <div class="info-row">
          <div>
            <div><span class="info-label">วันที่เบิก:</span> ${withdrawDate}</div>
            <div><span class="info-label">แผนก:</span> ${department || ".................."}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%">ลำดับ</th>
              <th style="width: 25%">รายการ</th>
              <th style="width: 10%">Lot จำนวน</th>
              <th style="width: 8%">จำนวน</th>
              <th style="width: 8%">หน่วย</th>
              <th style="width: 8%">เบิก</th>
              <th style="width: 8%">คืน</th>
              <th style="width: 8%">เบิกอื่น</th>
              <th style="width: 12%">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>`;
    
    filteredItems.forEach((item, idx) => {
      html += `<tr>
        <td style="text-align: center">${idx + 1}</td>
        <td>${item.name}</td>
        <td>${item.lot}</td>
        <td style="text-align: right">${item.qty.toFixed(2)}</td>
        <td>${item.unit}</td>
        <td style="text-align: right">${item.withdraw.toFixed(2)}</td>
        <td style="text-align: right">${item.return.toFixed(2)}</td>
        <td style="text-align: right">${item.other.toFixed(2)}</td>
        <td>${item.note}</td>
      </tr>`;
    });
    
    html += `</tbody></table>

    <div class="checkbox-group">
      <label><input type="checkbox" ${status === "เบิก" ? "checked" : ""} /> เบิก</label>
      <label><input type="checkbox" ${status === "คืน" ? "checked" : ""} /> คืน</label>
      <label><input type="checkbox" ${status === "เบิกอื่น" ? "checked" : ""} /> เบิกอื่น</label>
    </div>

    <div class="signature-area">
      <div class="sig-box">
        <div class="sig-label">ผู้เบิก / วันที่</div>
        <div class="sig-line"></div>
        <div>${withdrawBy || "A"}</div>
        <div class="sig-date">${withdrawByDate}</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">ผู้อนุมัติ / วันที่</div>
        <div class="sig-line"></div>
        <div>${approveBy || "B"}</div>
        <div class="sig-date">${approveByDate}</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">สาเหตุ (หากมี)</div>
        <div class="sig-line"></div>
        <div style="font-size: 9px">${reason || "."}</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">หมายเหตุ</div>
        <div class="sig-line"></div>
        <div style="font-size: 9px">${notes || "."}</div>
      </div>
    </div>
      </div>
    </body></html>`;
    
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setMessage("✅ เปิดสำหรับพิมพ์ PDF");
    setTimeout(() => setMessage(""), 3000);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!filteredItems.length) {
      setMessage("⚠️ ไม่มีรายการให้ส่งออก");
      return;
    }
    
    let csv = "บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ\n";
    csv += `บริษัท ชูรสยายปู จำกัด\n\n`;
    csv += `วันที่เบิก,${withdrawDate}\n`;
    csv += `แผนก,${department}\n`;
    csv += `เลขที่เอกสาร,WH04-${docNumber}\n`;
    csv += `Production Order,${poLabels().join(" | ")}\n`;
    csv += `สถานะ,${status}\n\n`;
    
    csv += "ลำดับ,รายการ,Lot จำนวน,จำนวน,หน่วย,เบิก,คืน,เบิกอื่น,หมายเหตุ\n";
    
    filteredItems.forEach((item, idx) => {
      csv += `${idx + 1},"${item.name}",${item.lot},${item.qty.toFixed(2)},${item.unit},${item.withdraw.toFixed(2)},${item.return.toFixed(2)},${item.other.toFixed(2)},"${item.note}"\n`;
    });
    
    csv += `\nผู้เบิก,${withdrawBy},วันที่,${withdrawByDate}\n`;
    csv += `ผู้อนุมัติ,${approveBy || "-"},วันที่,${approveByDate || "-"}\n`;
    csv += `สาเหตุ,${reason || "-"}\n`;
    csv += `หมายเหตุ,${notes || "-"}\n`;
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `withdrawal_${withdrawDate}.csv`;
    link.click();
    setMessage("✅ ส่งออก Excel สำเร็จ");
    setTimeout(() => setMessage(""), 3000);
  };

  // Clear
  const handleClear = () => {
    if (confirm("ต้องการล้างแบบฟอร์มหรือไม่?")) {
      setItems([]);
      setSelectedPOs([]);
      setDepartment("");
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = String(today.getFullYear()).slice(-2);
      const runNum = String((Object.keys(localStorage).filter(k => k.startsWith('withdrawal_')).length % 10000) + 1).padStart(4, '0');
      setDocNumber(month + year + runNum);
      setWithdrawBy("");
      setWithdrawByDate("");
      setApproveBy("");
      setApproveByDate("");
      setReason("");
      setNotes("");
      addRow();
      setMessage("✅ ล้างแบบฟอร์มแล้ว");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  React.useEffect(() => {
    if (items.length === 0) addRow();
  }, []);

  return (
    <div className="page">
      <div className="page-head" style={{ alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", width: "100%" }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            background: "#FFF6E8",
            border: "2px solid var(--gold-soft)",
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 4px 12px -6px rgba(182,36,31,.2)",
            flex: "0 0 80px",
          }}>
            <img src="logo.jpg" alt="ชูรสยายปู" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--muted)" }}>บริษัท ชูรสยายปู จำกัด</p>
            <h1 className="page-title" style={{ margin: "0 0 4px", fontSize: "20px" }}>บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ</h1>
          </div>
        </div>
      </div>

      {/* Header Info */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                เลือก Production Order (เลือกทีละสูตร)
              </label>
              {(() => {
                // แต่ละสูตร = หนึ่งตัวเลือก (key = ดัชนีแถวใน prodOptions)
                const label = (po) => `${po.code} - ${po.recipe} (${(parseFloat(po.qty)||0).toLocaleString()} ซอง)`;
                const available = prodOptions
                  .map((po, idx) => ({ po, key: String(idx) }))
                  .filter(({ key }) => !selectedPOs.includes(key));
                return (
                  <>
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value !== "") handlePOChange(e.target.value, true); }}
                      disabled={prodOptions.length === 0}
                      style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px", background: "#fff" }}
                    >
                      <option value="">
                        {prodOptions.length === 0 ? "ไม่มี Production Order" : (available.length === 0 ? "— เลือกครบทุกสูตรแล้ว —" : "— เลือกสูตรที่จะเบิก —")}
                      </option>
                      {available.map(({ po, key }) => (
                        <option key={key} value={key}>{label(po)}</option>
                      ))}
                    </select>
                    {selectedPOs.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {selectedPOs.map(key => {
                          const po = prodOptions[parseInt(key, 10)];
                          return (
                            <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 8px", background: "var(--gold-soft, #FFF6E8)", border: "1px solid #E7D6A9", borderRadius: "999px", fontSize: "12px" }}>
                              {po ? label(po) : key}
                              <button
                                type="button"
                                onClick={() => handlePOChange(key, false)}
                                title="เอาออก"
                                style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--brand)", fontSize: "14px", lineHeight: 1, padding: 0 }}
                              >×</button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                วันที่
              </label>
              <input
                type="date"
                value={withdrawDate}
                onChange={(e) => setWithdrawDate(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                แผนก
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              >
                <option value="">-- เลือกแผนก --</option>
                <option value="ผลิต">ผลิต</option>
                <option value="QC">QC</option>
                <option value="จัดซื้อ">จัดซื้อ</option>
                <option value="บัญชี">บัญชี</option>
                <option value="ฝ่ายขาย">ฝ่ายขาย</option>
                <option value="แพ๊คกิ้ง">แพ๊คกิ้ง</option>
                <option value="ขนส่ง">ขนส่ง</option>
                <option value="หน่วยรถ">หน่วยรถ</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                เลขที่เอกสาร
              </label>
              <div style={{ display: "flex", gap: "5px" }}>
                <input
                  type="text"
                  value="WH04"
                  disabled
                  style={{ width: "35%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px", background: "#f5f5f5" }}
                />
                <input
                  type="text"
                  placeholder="05260001"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  style={{ width: "65%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                สถานะ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              >
                <option value="เบิก">☐ เบิก</option>
                <option value="คืน">☐ คืน</option>
                <option value="เบลี่ยม">☐ เบลี่ยม</option>
              </select>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border)", margin: "15px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                ผู้เบิก
              </label>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={withdrawBy}
                onChange={(e) => setWithdrawBy(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                วันที่เบิก
              </label>
              <input
                type="date"
                value={withdrawByDate}
                onChange={(e) => setWithdrawByDate(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                ผู้อนุมัติ
              </label>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={approveBy}
                onChange={(e) => setApproveBy(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                วันที่อนุมัติ
              </label>
              <input
                type="date"
                value={approveByDate}
                onChange={(e) => setApproveByDate(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                สาเหตุ (หากมี)
              </label>
              <input
                type="text"
                placeholder="เช่น เสียหาย, สูญหาย, ปรับปรุง"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                หมายเหตุ
              </label>
              <input
                type="text"
                placeholder="บันทึกเพิ่มเติม"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card" style={{ marginBottom: "20px", overflowX: "auto" }}>
        <table className="tbl" style={{ fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ width: "40px" }}>ลำดับ</th>
              <th style={{ width: "80px" }}>รหัส</th>
              <th style={{ width: "150px" }}>รายการ</th>
              <th style={{ width: "100px" }}>Lot จำนวน</th>
              <th style={{ width: "120px" }}>จำนวน</th>
              <th style={{ width: "60px" }}>หน่วย</th>
              <th style={{ width: "110px" }}>เบิก</th>
              <th style={{ width: "110px" }}>คืน</th>
              <th style={{ width: "110px" }}>เบิกอื่น</th>
              <th style={{ width: "100px" }}>หมายเหตุ</th>
              <th style={{ width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="num" style={{ textAlign: "center" }}>{idx + 1}</td>
                <td>
                  <select
                    value={item.code}
                    onChange={(e) => updateItem(item.id, "code", e.target.value)}
                    style={{ width: "100%", padding: "4px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px" }}
                  >
                    <option value="">-- เลือก --</option>
                    {RAW.map(r => (
                      <option key={r.code} value={r.code}>{r.code} - {r.name}</option>
                    ))}
                  </select>
                </td>
                <td><span className="small">{item.name}</span></td>
                <td>
                  <input
                    type="text"
                    value={item.lot}
                    onChange={(e) => updateItem(item.id, "lot", e.target.value)}
                    style={{ width: "100%", padding: "4px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px" }}
                    placeholder="001"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                    style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px", textAlign: "right" }}
                  />
                </td>
                <td className="small" style={{ textAlign: "center" }}>{item.unit}</td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={item.withdraw}
                    onChange={(e) => updateItem(item.id, "withdraw", e.target.value)}
                    style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px", textAlign: "right" }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={item.return}
                    onChange={(e) => updateItem(item.id, "return", e.target.value)}
                    style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px", textAlign: "right" }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={item.other}
                    onChange={(e) => updateItem(item.id, "other", e.target.value)}
                    style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px", textAlign: "right" }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => updateItem(item.id, "note", e.target.value)}
                    style={{ width: "100%", padding: "4px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px" }}
                  />
                </td>
                <td>
                  <button
                    onClick={() => removeRow(item.id)}
                    style={{ background: "#FFE8E5", color: "var(--brand)", border: "1px solid #E9B6B1", padding: "3px 6px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <button
        onClick={addRow}
        style={{
          background: "var(--surface)",
          border: "1px dashed var(--border)",
          padding: "10px",
          borderRadius: "6px",
          cursor: "pointer",
          textAlign: "center",
          color: "var(--muted)",
          marginBottom: "20px",
          width: "100%",
          fontSize: "13px",
        }}
      >
        + เพิ่มรายการ
      </button>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="small" style={{ color: "var(--muted)", marginBottom: "5px", textTransform: "uppercase" }}>จำนวนรายการ</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--ink)" }}>{filteredItems.length}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ padding: "10px", textAlign: "center", marginBottom: "15px", color: "var(--brand)" }}>
          {message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          onClick={handleClear}
          className="btn btn-secondary"
        >
          ล้างแบบฟอร์ม
        </button>
        <button
          onClick={handlePrint}
          className="btn"
        >
          🖨️ พิมพ์
        </button>
        <button
          onClick={handleExportPDF}
          className="btn"
        >
          📄 ส่งออก PDF
        </button>
        <button
          onClick={handleExportExcel}
          className="btn"
        >
          📊 ส่งออก Excel
        </button>
        <button
          onClick={handleSave}
          className="btn btn-primary"
        >
          💾 บันทึก
        </button>
      </div>
    </div>
  );
};

// Export for app.jsx
Object.assign(window, { ScreenWithdrawForm });
