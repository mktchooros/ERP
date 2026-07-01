// 🥩 รายการวัตถุดิบ — Card view แบบเดียวกับสินค้า
const ScreenRawMaterialsList = () => {
  const [materials, setMaterials] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("code"); // code, name, stock
  const [filterLow, setFilterLow] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});
  const [message, setMessage] = React.useState("");
  const [detailId, setDetailId] = React.useState(null);

  // โหลดข้อมูล
  React.useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = () => {
    try {
      // โหลดรายการ — ใช้รายการที่แก้ไข/บันทึกไว้ก่อน (erp_raw_list) ถ้ามี ไม่งั้น fallback ไป RAW จาก data.jsx
      let rawList;
      const savedList = localStorage.getItem('erp_raw_list');
      if (savedList) {
        try { rawList = JSON.parse(savedList); } catch(e) { rawList = null; }
      }
      if (!Array.isArray(rawList) || rawList.length === 0) {
        rawList = typeof RAW !== 'undefined' ? RAW : [];
      }
      
      // โหลด stock จาก localStorage — รองรับทั้ง array [{raw,inHand,reorder}] และ map
      const savedStock = localStorage.getItem('erp_raw_stock');
      let stockMap = {};
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed)) {
          parsed.forEach(s => { stockMap[s.raw] = { inHand: s.inHand || 0, reorder: s.reorder || 0 }; });
        } else if (parsed && typeof parsed === 'object') {
          stockMap = parsed;
        }
      } else if (typeof RAW_STOCK !== 'undefined' && Array.isArray(RAW_STOCK)) {
        RAW_STOCK.forEach(s => { stockMap[s.raw] = { inHand: s.inHand || 0, reorder: s.reorder || 0 }; });
      }
      
      // รวม RAW + stock
      const combined = rawList.map(raw => ({
        ...raw,
        id: raw.code,
        stock: stockMap[raw.code] || { inHand: 0, reorder: 0 },
        history: []
      }));
      
      setMaterials(combined);
    } catch(e) {
      console.error('Error loading materials:', e);
    }
  };

  // บันทึก — เก็บทั้งตัวรายการ (erp_raw_list) และ stock (erp_raw_stock) ให้ค้างถาวร
  const saveMaterials = (updated) => {
    setMaterials(updated);
    try {
      // 1) เก็บ metadata ของรายการ (รหัส ชื่อ หน่วย ต้นทุน ฯลฯ) — เพื่อให้แก้ไข/สำเนา/ลบ ไม่หายตอนกลับเข้าหน้าใหม่
      const list = updated.map(({ stock, history, id, ...meta }) => meta);
      localStorage.setItem('erp_raw_list', JSON.stringify(list));
      // 2) เก็บ stock เป็น array [{raw,inHand,reorder}] ให้ตรงกับหน้าอื่น
      const arr = updated.map(m => ({ raw: m.code, inHand: (m.stock && m.stock.inHand) || 0, reorder: (m.stock && m.stock.reorder) || 0 }));
      localStorage.setItem('erp_raw_stock', JSON.stringify(arr));
      window.RAW_STOCK = arr;
    } catch(e) {
      console.error('Error saving:', e);
    }
  };

  // แก้ไข
  const handleEdit = (material) => {
    setEditingId(material.id);
    setEditForm({
      ...material,
      stock: { ...material.stock }
    });
  };

  const handleSaveEdit = () => {
    const updated = materials.map(m =>
      m.id === editingId ? editForm : m
    );
    saveMaterials(updated);
    setMessage("✅ บันทึกสำเร็จ");
    setTimeout(() => setMessage(""), 2000);
    setEditingId(null);
  };

  // สำเนา
  const handleDuplicate = (material) => {
    // หา รหัสสำเนาที่ไม่ซ้ำ (รองรับการกดสำเนาหลายครั้ง)
    const taken = new Set(materials.map(m => m.code));
    let n = 1;
    let newCode = `${material.code}_copy`;
    while (taken.has(newCode)) { n++; newCode = `${material.code}_copy${n}`; }
    const newMaterial = {
      ...material,
      code: newCode,
      id: newCode,
      name: `${material.name} (สำเนา)`,
      barcode: ""
    };
    // แทรกถัดจากตัวต้นฉบับเพื่อให้เห็นชัด
    const idx = materials.findIndex(m => m.id === material.id);
    const updated = [...materials];
    updated.splice(idx >= 0 ? idx + 1 : materials.length, 0, newMaterial);
    saveMaterials(updated);
    setMessage(`✅ สำเนาสำเร็จ → ${newCode}`);
    setTimeout(() => setMessage(""), 2500);
  };

  // ลบ
  const handleDelete = (material) => {
    if (!confirm(`ลบ ${material.code} - ${material.name}?`)) return;
    const updated = materials.filter(m => m.id !== material.id);
    saveMaterials(updated);
    setMessage("✅ ลบสำเร็จ");
    setTimeout(() => setMessage(""), 2000);
  };

  // ค้นหา + เรียงลำดับ
  let filtered = materials.filter(m =>
    (m.code.toLowerCase().includes(search.toLowerCase()) ||
     m.name.toLowerCase().includes(search.toLowerCase()) ||
     (m.supplier || "").toLowerCase().includes(search.toLowerCase()))
  );

  if (filterLow) {
    filtered = filtered.filter(m => (m.stock?.inHand || 0) <= (m.stock?.reorder || 0));
  }

  if (sortBy === "code") {
    filtered.sort((a, b) => a.code.localeCompare(b.code));
  } else if (sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  } else if (sortBy === "stock") {
    filtered.sort((a, b) => (a.stock?.inHand || 0) - (b.stock?.inHand || 0));
  }

  const lowStockCount = materials.filter(m => (m.stock?.inHand || 0) <= (m.stock?.reorder || 0)).length;
  const totalValue = materials.reduce((sum, m) => sum + ((m.stock?.inHand || 0) * (m.cost || 0)), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🥩 รายการวัตถุดิบ</h1>
          <p className="page-sub">จัดการวัตถุดิบ · แก้ไข · สำเนา · ลบ</p>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="small" style={{ color: "var(--muted)", marginBottom: "5px" }}>จำนวนรายการ</div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{materials.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="small" style={{ color: "var(--muted)", marginBottom: "5px" }}>มูลค่ารวม</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--brand)" }}>฿{totalValue.toFixed(0)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="small" style={{ color: "var(--muted)", marginBottom: "5px" }}>ต่ำกว่าเกณฑ์</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: lowStockCount > 0 ? "var(--brand)" : "var(--leaf)" }}>
              {lowStockCount}
            </div>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="ค้นหารหัส, ชื่อ, หรือผู้ขาย..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px" }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px" }}
        >
          <option value="code">เรียง: รหัส</option>
          <option value="name">เรียง: ชื่อ</option>
          <option value="stock">เรียง: สต๊อก</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filterLow}
            onChange={(e) => setFilterLow(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <span style={{ fontSize: "13px" }}>ต่ำกว่าเกณฑ์เท่านั้น</span>
        </label>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: "10px", marginBottom: "15px", background: "#E8F5E9", border: "1px solid #4CAF50", borderRadius: "6px", color: "#2E7D32", fontSize: "13px" }}>
          {message}
        </div>
      )}

      {/* Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filtered.map(material => {
          const isEditing = editingId === material.id;
          const isDetailed = detailId === material.id;
          const stock = material.stock || { inHand: 0, reorder: 0 };
          const isLow = stock.inHand <= stock.reorder;

          return (
            <div
              key={material.id}
              className="card"
              style={{
                border: isLow ? "2px solid var(--warn)" : "1px solid var(--border)",
                background: isEditing ? "var(--surface-2)" : "var(--surface)",
                cursor: "pointer"
              }}
              onClick={() => !isEditing && setDetailId(isDetailed ? null : material.id)}
            >
              {/* Header */}
              <div className="card-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, marginBottom: "2px" }}>
                    {material.code}
                  </div>
                  <h3 className="card-title" style={{ margin: "0 0 4px", fontSize: "14px", lineHeight: 1.3 }}>
                    {material.name}
                  </h3>
                  {isLow && (
                    <div style={{ fontSize: "10px", color: "var(--warn)", fontWeight: 600 }}>
                      ⚠️ ต่ำกว่าเกณฑ์
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="card-body" style={{ paddingTop: "0" }}>
                {!isEditing ? (
                  <>
                    {/* Display Mode */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px", fontSize: "12px" }}>
                      <div>
                        <div style={{ color: "var(--muted)", marginBottom: "2px" }}>ผู้ขาย</div>
                        <div style={{ fontWeight: 600 }}>{material.supplier || "—"}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--muted)", marginBottom: "2px" }}>ราคา/หน่วย</div>
                        <div style={{ fontWeight: 600 }}>฿{(material.cost || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--muted)", marginBottom: "2px" }}>หน่วยซื้อ</div>
                        <div style={{ fontWeight: 600 }}>{material.buyUnit || "—"}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--muted)", marginBottom: "2px" }}>หน่วย</div>
                        <div style={{ fontWeight: 600 }}>{material.unit || "—"}</div>
                      </div>
                    </div>

                    {/* Stock Section */}
                    <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "6px", marginBottom: "10px", fontSize: "12px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <div style={{ color: "var(--muted)", marginBottom: "2px" }}>คงเหลือ</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: stock.inHand > stock.reorder ? "var(--leaf)" : "var(--brand)" }}>
                            {stock.inHand || 0}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--muted)", marginBottom: "2px" }}>เกณฑ์สั่งซื้อ</div>
                          <div style={{ fontSize: "16px", fontWeight: 600 }}>{stock.reorder || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isDetailed && (
                      <div style={{ background: "var(--surface-sunken)", padding: "10px", borderRadius: "6px", fontSize: "11px", marginBottom: "10px", color: "var(--ink-2)" }}>
                        <div style={{ marginBottom: "6px" }}>
                          <strong>Barcode:</strong> {material.barcode || "—"}
                        </div>
                        <div>
                          <strong>มูลค่าคงเหลือ:</strong> ฿{(stock.inHand * material.cost).toFixed(0)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Edit Mode */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "4px", color: "var(--muted)", fontWeight: 600 }}>ชื่อ</label>
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", color: "var(--muted)", fontWeight: 600 }}>ราคา</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.cost || 0}
                            onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", color: "var(--muted)", fontWeight: 600 }}>ผู้ขาย</label>
                          <input
                            type="text"
                            value={editForm.supplier || ""}
                            onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", color: "var(--muted)", fontWeight: 600 }}>คงเหลือ</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.stock?.inHand || 0}
                            onChange={(e) => setEditForm({ ...editForm, stock: { ...editForm.stock, inHand: parseFloat(e.target.value) || 0 } })}
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", color: "var(--muted)", fontWeight: 600 }}>เกณฑ์สั่ง</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.stock?.reorder || 0}
                            onChange={(e) => setEditForm({ ...editForm, stock: { ...editForm.stock, reorder: parseFloat(e.target.value) || 0 } })}
                            style={{ width: "100%", padding: "6px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <button
                          onClick={handleSaveEdit}
                          style={{ padding: "6px", background: "var(--leaf)", color: "white", border: "none", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}
                        >
                          ✅ บันทึก
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: "6px", background: "var(--muted-2)", color: "white", border: "none", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              {!isEditing && (
                <div style={{ display: "flex", gap: "6px", padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(material);
                    }}
                    className="btn btn-sm"
                    style={{ flex: 1, fontSize: "11px" }}
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(material);
                    }}
                    className="btn btn-sm"
                    style={{ flex: 1, fontSize: "11px" }}
                  >
                    📋 สำเนา
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(material);
                    }}
                    className="btn btn-sm"
                    style={{ flex: 1, fontSize: "11px", color: "var(--brand)" }}
                  >
                    🗑️ ลบ
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ไม่พบรายการวัตถุดิบ
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenRawMaterialsList });
