// Screen Purchase Entry NEW — บันทึกการซื้อวัตถุดิบใหม่ (เหมือนการขาย)
const ScreenPurchaseEntryNew = () => {
  const [items, setItems] = React.useState([]);
  const [nextId, setNextId] = React.useState(0);
  const [barcodeInput, setBarcodeInput] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [supplier, setSupplier] = React.useState("");
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [vat, setVat] = React.useState(7);
  const [vatType, setVatType] = React.useState("inclusive"); // 'inclusive' or 'exclusive'
  const [notes, setNotes] = React.useState("");
  const [message, setMessage] = React.useState("");

  const raw = typeof RAW !== 'undefined' ? RAW : [];

  // Handle Barcode Scan
  const handleBarcodeScan = (barcode) => {
    const material = raw.find((r) => r.barcode === barcode || r.code === barcode);

    if (!material) {
      setMessage(`❌ ไม่พบวัตถุดิบ: ${barcode}`);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    // Check if item exists
    const existingItem = items.find((i) => i.code === material.code);

    if (existingItem) {
      // Increase quantity
      updateItem(existingItem.id, "qty", existingItem.qty + 1);
    } else {
      // Add new item
      setItems([...items, {
        id: nextId,
        code: material.code,
        name: material.name,
        unit: material.unit,
        buyUnit: material.buyUnit || "—",
        qty: 1,
        cost: material.buyPrice || material.cost,
        total: material.buyPrice || material.cost,
        supplier: material.supplier,
        notes: ""
      }]);
      setNextId(nextId + 1);
    }

    setBarcodeInput("");
  };

  // Add Row
  const addRow = () => {
    setItems([...items, {
      id: nextId,
      code: "",
      name: "",
      unit: "",
      buyUnit: "—",
      qty: 0,
      cost: 0,
      total: 0,
      supplier: "",
      notes: ""
    }]);
    setNextId(nextId + 1);
  };

  // Remove Row
  const removeRow = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Update Item
  const updateItem = (id, field, value) => {
    const newItems = items.map((item) => {
      if (item.id !== id) return item;

      if (field === "code") {
        const mat = raw.find((r) => r.code === value);
        if (mat) {
          return {
            ...item,
            code: mat.code,
            name: mat.name,
            unit: mat.unit,
            buyUnit: mat.buyUnit || "—",
            cost: mat.buyPrice || mat.cost,
            total: (mat.buyPrice || mat.cost) * (item.qty || 1),
            supplier: mat.supplier
          };
        }
      } else if (field === "qty" || field === "cost") {
        const numVal = parseFloat(value) || 0;
        const newItem = { ...item, [field]: numVal };
        newItem.total = newItem.qty * newItem.cost;
        return newItem;
      } else {
        return { ...item, [field]: value };
      }

      return item;
    });
    setItems(newItems);
  };

  // Calculate Totals
  const filteredItems = items.filter((i) => i.code);
  const subtotal = filteredItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  let vatAmount, grandTotal;
  if (vatType === "inclusive") {
    // VAT ในราคา
    vatAmount = afterDiscount * (vat / 100) / (1 + vat / 100);
    grandTotal = afterDiscount;
  } else {
    // VAT นอกราคา
    vatAmount = afterDiscount * (vat / 100);
    grandTotal = afterDiscount + vatAmount;
  }

  // Save
  const handleSave = () => {
    if (!purchaseDate || !supplier || !filteredItems.length) {
      setMessage("⚠️ กรุณากรอก วันที่, ผู้ขาย, และเพิ่มรายการ");
      return;
    }

    const data = {
      date: purchaseDate,
      supplier,
      invoiceNumber,
      items: filteredItems,
      subtotal,
      discount,
      discountAmount,
      vat,
      vatType,
      vatAmount,
      grandTotal,
      notes,
      savedAt: new Date().toLocaleString("th-TH")
    };

    // Save to localStorage
    const key = `purchase_${purchaseDate}_${supplier}`;
    localStorage.setItem(key, JSON.stringify(data));
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

    let html = `<html><head><meta charset="utf-8"><title>บันทึกการซื้อวัตถุดิบ</title><style>
      body { font-family: 'Arial', sans-serif; padding: 30px; margin: 0; background: white; }
      .container { max-width: 900px; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
      .header h1 { margin: 0; font-size: 16px; font-weight: bold; }
      .header p { margin: 5px 0; font-size: 12px; }
      .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 15px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
      th, td { border: 1px solid #000; padding: 6px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      .totals-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 12px; text-align: right; }
      @media print { body { padding: 0; margin: 0; } }
    </style></head><body>
      <div class="container">
        <div class="header">
          <h1>บันทึกการซื้อวัตถุดิบ</h1>
          <p>บริษัท ชูรสยายปู จำกัด</p>
        </div>

        <div class="info-row">
          <div>
            <div><span style="font-weight: bold;">วันที่:</span> ${purchaseDate}</div>
            <div><span style="font-weight: bold;">ผู้ขาย:</span> ${supplier}</div>
          </div>
          <div>
            <div><span style="font-weight: bold;">เลขที่ใบแจ้ง:</span> ${invoiceNumber || "-"}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%">ลำดับ</th>
              <th style="width: 15%">รหัส</th>
              <th style="width: 30%">ชื่อวัตถุดิบ</th>
              <th style="width: 10%">จำนวน</th>
              <th style="width: 10%">หน่วย</th>
              <th style="width: 15%">ราคา/หน่วย</th>
              <th style="width: 15%">รวม</th>
            </tr>
          </thead>
          <tbody>`;

    filteredItems.forEach((item, idx) => {
      html += `<tr>
        <td style="text-align: center">${idx + 1}</td>
        <td>${item.code}</td>
        <td>${item.name}</td>
        <td style="text-align: right">${item.qty.toFixed(2)}</td>
        <td>${item.unit}</td>
        <td style="text-align: right">฿${item.cost.toFixed(2)}</td>
        <td style="text-align: right">฿${item.total.toFixed(2)}</td>
      </tr>`;
    });

    html += `</tbody></table>

    <div class="totals-row">
      <div><strong>รวมรวม:</strong></div>
      <div></div>
      <div>฿${subtotal.toFixed(2)}</div>
    </div>
    
    ${discount > 0 ? `<div class="totals-row">
      <div><strong>ส่วนลด ${discount}%:</strong></div>
      <div></div>
      <div>-฿${discountAmount.toFixed(2)}</div>
    </div>` : ''}

    <div class="totals-row">
      <div><strong>ยอดหลังส่วนลด:</strong></div>
      <div></div>
      <div>฿${afterDiscount.toFixed(2)}</div>
    </div>

    <div class="totals-row">
      <div><strong>VAT ${vat}% (${vatType === 'inclusive' ? 'ใน' : 'นอก'}):</strong></div>
      <div></div>
      <div>฿${vatAmount.toFixed(2)}</div>
    </div>

    <div class="totals-row" style="border-top: 2px solid #000; padding-top: 10px;">
      <div><strong>รวมสุทธิ:</strong></div>
      <div></div>
      <div><strong>฿${grandTotal.toFixed(2)}</strong></div>
    </div>

    ${notes ? `<div style="margin-top: 20px; font-size: 11px;">
      <strong>หมายเหตุ:</strong> ${notes}
    </div>` : ''}
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

    let csv = "บันทึกการซื้อวัตถุดิบ\n";
    csv += `บริษัท ชูรสยายปู จำกัด\n\n`;
    csv += `วันที่,${purchaseDate}\n`;
    csv += `ผู้ขาย,${supplier}\n`;
    csv += `เลขที่ใบแจ้ง,${invoiceNumber}\n\n`;

    csv += "ลำดับ,รหัส,ชื่อวัตถุดิบ,จำนวน,หน่วย,ราคา/หน่วย,รวม\n";

    filteredItems.forEach((item, idx) => {
      csv += `${idx + 1},${item.code},"${item.name}",${item.qty.toFixed(2)},${item.unit},${item.cost.toFixed(2)},${item.total.toFixed(2)}\n`;
    });

    csv += `\n,,,รวมรวม,,,฿${subtotal.toFixed(2)}\n`;
    csv += `,,,ส่วนลด ${discount}%,,,฿${discountAmount.toFixed(2)}\n`;
    csv += `,,,ยอดหลังส่วนลด,,,฿${afterDiscount.toFixed(2)}\n`;
    csv += `,,,VAT ${vat}% (${vatType === 'inclusive' ? 'ใน' : 'นอก'}),,,฿${vatAmount.toFixed(2)}\n`;
    csv += `,,,รวมสุทธิ,,,฿${grandTotal.toFixed(2)}\n`;
    csv += `\nหมายเหตุ,${notes}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `purchase_${purchaseDate}.csv`;
    link.click();
    setMessage("✅ ส่งออก Excel สำเร็จ");
    setTimeout(() => setMessage(""), 3000);
  };

  // Clear
  const handleClear = () => {
    if (confirm("ต้องการล้างแบบฟอร์มหรือไม่?")) {
      setItems([]);
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setSupplier("");
      setInvoiceNumber("");
      setDiscount(0);
      setVat(7);
      setVatType("inclusive");
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
      <div className="page-head">
        <div>
          <h1 className="page-title">📝 ใบสั่งซื้อ</h1>
          <p className="page-sub">สแกนหรือพิมพ์รหัสวัตถุดิบ แล้วกด Enter เพื่อเพิ่มรายการ</p>
        </div>
      </div>

      {/* Barcode Scan Input */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-body">
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", color: "var(--soy)" }}>
            📱 สแกนบาร์โค้ด / พิมพ์รหัส
          </label>
          <input
            type="text"
            placeholder="สแกนบาร์โค้ด หรือ พิมพ์รหัสวัตถุดิบ แล้วกด Enter"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && barcodeInput.trim()) {
                handleBarcodeScan(barcodeInput.trim());
              }
            }}
            autoFocus
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid var(--border)",
              borderRadius: "6px",
              fontSize: "16px",
              background: "#FFFFFF"
            }} />
          
        </div>
      </div>

      {/* Header Info */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                วันที่
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }} />
              
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>พนักงานขาย  

              </label>
              <input
                type="text"
                placeholder="ชื่อผู้ขาย"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }} />
              
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                เลขที่ใบแจ้ง
              </label>
              <input
                type="text"
                placeholder="INV-2605-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }} />
              
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                ส่วนลด (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px", textAlign: "right" }} />
              
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                VAT (%)
              </label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                <select
                  value={vatType}
                  onChange={(e) => setVatType(e.target.value)}
                  style={{ flex: 1, padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px" }}>
                  
                  <option value="inclusive">VAT ใน</option>
                  <option value="exclusive">VAT นอก</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={vat}
                  onChange={(e) => setVat(parseFloat(e.target.value) || 0)}
                  style={{ flex: 1, padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px", textAlign: "right" }} />
                
              </div>
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
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }} />
              
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
              <th style={{ width: "150px" }}>ชื่อวัตถุดิบ</th>
              <th style={{ width: "70px" }}>จำนวน</th>
              <th style={{ width: "60px" }}>หน่วย</th>
              <th style={{ width: "80px" }}>หน่วยที่ซื้อ</th>
              <th style={{ width: "100px" }}>ราคา/หน่วยซื้อ</th>
              <th style={{ width: "80px" }}>รวม</th>
              <th style={{ width: "80px" }}>ผู้ขาย</th>
              <th style={{ width: "100px" }}>หมายเหตุ</th>
              <th style={{ width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) =>
            <tr key={item.id}>
                <td className="num" style={{ textAlign: "center" }}>{idx + 1}</td>
                <td>
                  <select
                  value={item.code}
                  onChange={(e) => updateItem(item.id, "code", e.target.value)}
                  style={{ width: "100%", padding: "4px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px" }}>
                  
                    <option value="">-- เลือก --</option>
                    {raw.map((r) =>
                  <option key={r.code} value={r.code}>{r.code} - {r.name}</option>
                  )}
                  </select>
                </td>
                <td><span className="small">{item.name}</span></td>
                <td>
                  <input
                  type="number"
                  step="0.01"
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                  style={{ width: "100%", padding: "4px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px", textAlign: "right" }} />
                
                </td>
                <td className="small" style={{ textAlign: "center" }}>{item.unit}</td>
                <td className="small" style={{ textAlign: "center" }}>{item.buyUnit || "—"}</td>
                <td>
                  <input
                  type="number"
                  step="0.01"
                  value={item.cost}
                  onChange={(e) => updateItem(item.id, "cost", e.target.value)}
                  style={{ width: "100%", padding: "4px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px", textAlign: "right" }} />
                
                </td>
                <td style={{ textAlign: "right", fontWeight: "600", fontSize: "11px" }}>
                  ฿{item.total.toFixed(2)}
                </td>
                <td style={{ fontSize: "10px" }}>{item.supplier}</td>
                <td>
                  <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => updateItem(item.id, "notes", e.target.value)}
                  style={{ width: "100%", padding: "4px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px" }} />
                
                </td>
                <td>
                  <button
                  onClick={() => removeRow(item.id)}
                  style={{ background: "#FFE8E5", color: "var(--brand)", border: "1px solid #E9B6B1", padding: "3px 6px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>
                  
                    ลบ
                  </button>
                </td>
              </tr>
            )}
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
          fontSize: "13px"
        }}>
        
        + เพิ่มรายการ
      </button>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="small" style={{ color: "var(--muted)", marginBottom: "5px" }}>รวมรวม</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)" }}>฿{subtotal.toFixed(2)}</div>
          </div>
        </div>
        {discount > 0 &&
        <div className="card">
            <div className="card-body" style={{ textAlign: "center" }}>
              <div className="small" style={{ color: "var(--muted)", marginBottom: "5px" }}>ส่วนลด {discount}%</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#E74C3C" }}>-฿{discountAmount.toFixed(2)}</div>
            </div>
          </div>
        }
        <div className="card">
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="small" style={{ color: "var(--muted)", marginBottom: "5px" }}>VAT {vat}%</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--muted)" }}>฿{vatAmount.toFixed(2)}</div>
          </div>
        </div>
        <div className="card" style={{ border: "2px solid var(--brand)" }}>
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="small" style={{ color: "var(--brand)", marginBottom: "5px", fontWeight: "bold" }}>รวมสุทธิ</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--brand)" }}>฿{grandTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message &&
      <div style={{ padding: "10px", textAlign: "center", marginBottom: "15px", color: "var(--brand)" }}>
          {message}
        </div>
      }

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          onClick={handleClear}
          className="btn btn-secondary">
          
          ล้างแบบฟอร์ม
        </button>
        <button
          onClick={handlePrint}
          className="btn">
          
          🖨️ พิมพ์
        </button>
        <button
          onClick={handleExportPDF}
          className="btn">
          
          📄 ส่งออก PDF
        </button>
        <button
          onClick={handleExportExcel}
          className="btn">
          
          📊 ส่งออก Excel
        </button>
        <button
          onClick={handleSave}
          className="btn btn-primary">
          
          💾 บันทึก
        </button>
      </div>
    </div>);

};

Object.assign(window, { ScreenPurchaseEntryNew });