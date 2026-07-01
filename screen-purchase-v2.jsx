// Screen Purchase History — ประวัติการสั่งซื้อ
const ScreenPurchaseHistory = () => {
  const [purchases, setPurchases] = React.useState([]);
  const [filter, setFilter] = React.useState("");
  const [selectedPurchase, setSelectedPurchase] = React.useState(null);
  const [editMode, setEditMode] = React.useState(false);
  const [editData, setEditData] = React.useState(null);

  React.useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = () => {
    const allPurchases = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("purchase_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          allPurchases.push({ ...data, key });
        } catch (e) {
          console.error("Error parsing purchase:", e);
        }
      }
    }
    allPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    setPurchases(allPurchases);
  };

  const filteredPurchases = purchases.filter((p) => {
    const search = filter.toLowerCase();
    return (
      p.supplier.toLowerCase().includes(search) ||
      p.invoiceNumber.toLowerCase().includes(search) ||
      p.date.includes(search)
    );
  });

  const handleDelete = (key) => {
    if (confirm("ต้องการลบประวัติการสั่งซื้อนี้หรือไม่?")) {
      localStorage.removeItem(key);
      setPurchases(purchases.filter((p) => p.key !== key));
      setSelectedPurchase(null);
    }
  };

  const handleEdit = (purchase) => {
    setEditData({ ...purchase });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (editData && editData.key) {
      const oldKey = editData.key;
      const newKey = `purchase_${editData.date}_${editData.supplier}`;
      
      // ลบข้อมูลเก่า
      localStorage.removeItem(oldKey);
      
      // บันทึกข้อมูลใหม่
      const dataToSave = { ...editData };
      delete dataToSave.key;
      localStorage.setItem(newKey, JSON.stringify(dataToSave));
      
      // โหลดข้อมูลใหม่
      loadPurchases();
      setEditMode(false);
      setSelectedPurchase(null);
      setEditData(null);
    }
  };

  const handlePrint = (purchase) => {
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
            <div><span style="font-weight: bold;">วันที่:</span> ${purchase.date}</div>
            <div><span style="font-weight: bold;">ผู้ขาย:</span> ${purchase.supplier}</div>
          </div>
          <div>
            <div><span style="font-weight: bold;">เลขที่ใบแจ้ง:</span> ${purchase.invoiceNumber || "-"}</div>
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

    purchase.items.forEach((item, idx) => {
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
      <div>฿${purchase.subtotal.toFixed(2)}</div>
    </div>
    
    ${purchase.discount > 0 ? `<div class="totals-row">
      <div><strong>ส่วนลด ${purchase.discount}%:</strong></div>
      <div></div>
      <div>-฿${purchase.discountAmount.toFixed(2)}</div>
    </div>` : ''}

    <div class="totals-row">
      <div><strong>ยอดหลังส่วนลด:</strong></div>
      <div></div>
      <div>฿${purchase.afterDiscount?.toFixed(2) || (purchase.subtotal - purchase.discountAmount).toFixed(2)}</div>
    </div>

    <div class="totals-row">
      <div><strong>VAT ${purchase.vat}% (${purchase.vatType === "inclusive" ? "ใน" : "นอก"}):</strong></div>
      <div></div>
      <div>฿${purchase.vatAmount.toFixed(2)}</div>
    </div>

    <div class="totals-row" style="border-top: 2px solid #000; padding-top: 10px;">
      <div><strong>รวมสุทธิ:</strong></div>
      <div></div>
      <div><strong>฿${purchase.grandTotal.toFixed(2)}</strong></div>
    </div>

    ${purchase.notes ? `<div style="margin-top: 20px; font-size: 11px;">
      <strong>หมายเหตุ:</strong> ${purchase.notes}
    </div>` : ''}
      </div>
    </body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📋 ประวัติการสั่งซื้อ</h1>
          <p className="page-sub">ดูรายละเอียดการสั่งซื้อวัตถุดิบทั้งหมด</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-body">
          <input
            type="text"
            placeholder="ค้นหา ผู้ขาย, เลขที่ใบแจ้ง, หรือวันที่..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

      {/* Purchases List */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <table className="tbl" style={{ fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ width: "100px" }}>วันที่</th>
              <th style={{ width: "150px" }}>ผู้ขาย</th>
              <th style={{ width: "100px" }}>เลขที่ใบแจ้ง</th>
              <th style={{ width: "80px" }}>จำนวนรายการ</th>
              <th style={{ width: "100px" }}>รวมรวม</th>
              <th style={{ width: "100px" }}>ส่วนลด</th>
              <th style={{ width: "100px" }}>VAT</th>
              <th style={{ width: "120px" }}>รวมสุทธิ</th>
              <th style={{ width: "80px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                  ไม่มีข้อมูลการสั่งซื้อ
                </td>
              </tr>
            ) : (
              filteredPurchases.map((purchase, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedPurchase(purchase)}
                  style={{
                    cursor: "pointer",
                    background: selectedPurchase?.key === purchase.key ? "#FFF6E8" : "transparent",
                  }}
                >
                  <td style={{ fontWeight: "500" }}>{purchase.date}</td>
                  <td>{purchase.supplier}</td>
                  <td style={{ color: "var(--muted)", fontSize: "11px" }}>{purchase.invoiceNumber || "-"}</td>
                  <td style={{ textAlign: "center" }}>{purchase.items.length}</td>
                  <td style={{ textAlign: "right", fontWeight: "500" }}>฿{purchase.subtotal.toFixed(2)}</td>
                  <td style={{ textAlign: "right", color: purchase.discount > 0 ? "#E74C3C" : "var(--muted)" }}>
                    {purchase.discount > 0 ? `${purchase.discount}%` : "-"}
                  </td>
                  <td style={{ textAlign: "right", fontSize: "11px" }}>
                    {purchase.vat}% ({purchase.vatType === "inclusive" ? "ใน" : "นอก"})
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "700", color: "var(--brand)" }}>
                    ฿{purchase.grandTotal.toFixed(2)}
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(purchase.key);
                      }}
                      style={{
                        background: "#FFE8E5",
                        color: "var(--brand)",
                        border: "1px solid #E9B6B1",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail View */}
      {selectedPurchase && !editMode && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>รายละเอียดการสั่งซื้อ</h3>
              <button
                onClick={() => setSelectedPurchase(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Header Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>วันที่</div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedPurchase.date}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>ผู้ขาย</div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedPurchase.supplier}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>เลขที่ใบแจ้ง</div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedPurchase.invoiceNumber || "-"}</div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: "20px", overflowX: "auto" }}>
              <table className="tbl" style={{ fontSize: "11px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>ลำดับ</th>
                    <th style={{ width: "80px" }}>รหัส</th>
                    <th style={{ width: "150px" }}>ชื่อวัตถุดิบ</th>
                    <th style={{ width: "70px" }}>จำนวน</th>
                    <th style={{ width: "60px" }}>หน่วย</th>
                    <th style={{ width: "100px" }}>ราคา/หน่วย</th>
                    <th style={{ width: "100px" }}>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchase.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td style={{ textAlign: "right" }}>{item.qty.toFixed(2)}</td>
                      <td style={{ textAlign: "center" }}>{item.unit}</td>
                      <td style={{ textAlign: "right" }}>฿{item.cost.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: "600" }}>฿{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>รวมรวม</div>
                <div style={{ fontSize: "16px", fontWeight: "700" }}>฿{selectedPurchase.subtotal.toFixed(2)}</div>
              </div>
              {selectedPurchase.discount > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>ส่วนลด {selectedPurchase.discount}%</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#E74C3C" }}>-฿{selectedPurchase.discountAmount.toFixed(2)}</div>
                </div>
              )}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>VAT {selectedPurchase.vat}%</div>
                <div style={{ fontSize: "16px", fontWeight: "700" }}>฿{selectedPurchase.vatAmount.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: "right", border: "2px solid var(--brand)", padding: "10px", borderRadius: "6px" }}>
                <div style={{ fontSize: "11px", color: "var(--brand)", marginBottom: "4px", fontWeight: "600" }}>รวมสุทธิ</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--brand)" }}>฿{selectedPurchase.grandTotal.toFixed(2)}</div>
              </div>
            </div>

            {/* Notes */}
            {selectedPurchase.notes && (
              <div style={{ marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>หมายเหตุ</div>
                <div style={{ fontSize: "12px" }}>{selectedPurchase.notes}</div>
              </div>
            )}

            {/* Metadata */}
            <div style={{ marginBottom: "20px", fontSize: "10px", color: "var(--muted)" }}>
              บันทึก: {selectedPurchase.savedAt}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => handlePrint(selectedPurchase)}
                className="btn"
                style={{ background: "var(--surface-2)", color: "var(--ink)" }}
              >
                🖨️ พิมพ์
              </button>
              <button
                onClick={() => handleEdit(selectedPurchase)}
                className="btn"
                style={{ background: "var(--gold-soft)", color: "var(--soy)" }}
              >
                ✎ แก้ไข
              </button>
              <button
                onClick={() => handleDelete(selectedPurchase.key)}
                className="btn btn-secondary"
              >
                🗑️ ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {editMode && editData && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ margin: "0 0 15px 0" }}>แก้ไขการสั่งซื้อ</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>วันที่</label>
                <input
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>ผู้ขาย</label>
                <input
                  type="text"
                  value={editData.supplier}
                  onChange={(e) => setEditData({ ...editData, supplier: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>เลขที่ใบแจ้ง</label>
                <input
                  type="text"
                  value={editData.invoiceNumber}
                  onChange={(e) => setEditData({ ...editData, invoiceNumber: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>ส่วนลด (%)</label>
                <input
                  type="number"
                  value={editData.discount}
                  onChange={(e) => setEditData({ ...editData, discount: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>VAT (%)</label>
                <input
                  type="number"
                  value={editData.vat}
                  onChange={(e) => setEditData({ ...editData, vat: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>VAT Type</label>
                <select
                  value={editData.vatType}
                  onChange={(e) => setEditData({ ...editData, vatType: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}
                >
                  <option value="inclusive">VAT ใน</option>
                  <option value="exclusive">VAT นอก</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>หมายเหตุ</label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px", minHeight: "60px" }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditData(null);
                }}
                className="btn btn-secondary"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary"
              >
                💾 บันทึกแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenPurchaseHistory });
