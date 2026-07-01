// 🏪 คลังสินค้า — หน้าหลัก

const ScreenWarehouse = () => {
  const [current, setCurrent] = React.useState(null);

  // รายการเมนูย่อย
  const warehouseItems = [
    { id: "adj-finished", emoji: "⊕", label: "ปรับปรุงสินค้าพร้อมขาย", desc: "ปรับยอดเมื่อมีสินค้าเสีย หมดอายุ หรือนับสต๊อกใหม่" },
    { id: "adj-raw", emoji: "⊕", label: "ปรับปรุงวัตถุดิบ", desc: "ปรับยอดวัตถุดิบเมื่อมีการสูญเสีย หกระหว่างผลิต หรือนับสต๊อกใหม่" },
    { id: "withdraw-form", emoji: "📦", label: "บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ", desc: "บันทึกการเบิกและคืนวัตถุดิบและวัสดุบรรจุ" },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">🏪 คลังสินค้า</h1>
        <p className="page-sub">จัดการและติดตามสินค้าคงเหลือ</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {warehouseItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrent(item.id)}
            className="card"
            style={{
              padding: 16,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              cursor: "pointer",
              transition: "all 120ms",
              textAlign: "left",
              display: "block",
              width: "100%",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--brand)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
              {item.label}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
              {item.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Render the selected submenu screen */}
      {current === "adj-finished" && <ScreenAdjFinished />}
      {current === "adj-raw" && <ScreenAdjRaw />}
      {current === "withdraw-form" && <ScreenWithdrawForm />}
      {current === "raw-stock" && <ScreenRawStock />}
    </div>
  );
};

Object.assign(window, { ScreenWarehouse });
