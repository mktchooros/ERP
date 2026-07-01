// 🥩 วัตถุดิบ — รวมทุกอย่างไว้ที่เดียว (รายการ / บาร์โค้ด / สต๊อค)
const ScreenRawMaterialsHub = ({ setCurrent }) => {
  const [tab, setTab] = React.useState("list");

  const tabs = [
    { id: "list",    label: "📋 รายการวัตถุดิบ" },
    { id: "barcode", label: "📷 บาร์โค้ด" },
    { id: "stock",   label: "🏪 สต๊อค" },
  ];

  const tabBtn = (t) => ({
    padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: "pointer", border: "none", transition: "all 80ms",
    background: tab === t.id ? "var(--brand)" : "var(--surface-2)",
    color: tab === t.id ? "#fff" : "var(--ink-2)",
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🥩 วัตถุดิบ</h1>
          <p className="page-sub">รายการ · บาร์โค้ด · สต๊อค — ทุกอย่างในที่เดียว</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.id} style={tabBtn(t)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {tab === "list"    && <ScreenRawMaterialsList />}
      {tab === "barcode" && <ScreenRawMaterialBarcode />}
      {tab === "stock"   && <ScreenRawStock />}
    </div>
  );
};

Object.assign(window, { ScreenRawMaterialsHub });
