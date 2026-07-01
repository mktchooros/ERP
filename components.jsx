// 🔎 ตัวเลือกสินค้าแบบค้นหาได้ (พิมพ์ตัวอักษรแล้วขึ้นรายการให้เลือก)
// ใช้ร่วมกันในหน้าใบสั่งขาย + แก้ไขใบสั่งขาย

const ProductPicker = ({ menu, value, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const boxRef = React.useRef(null);

  const selected = (menu || []).find(p => p.code === value);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return menu || [];
    return (menu || []).filter(p =>
      (p.code && p.code.toLowerCase().includes(s)) ||
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.flavor && String(p.flavor).toLowerCase().includes(s)) ||
      (p.barcode && String(p.barcode).includes(s))
    );
  }, [q, menu]);

  React.useEffect(() => { if (hi >= filtered.length) setHi(0); }, [filtered.length, hi]);

  const choose = (p) => {
    if (!p) return;
    onSelect(p.code);
    setOpen(false);
    setQ("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (open && filtered[hi]) choose(filtered[hi]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const display = open ? q : (selected ? `${selected.code} — ${selected.name}` : "");

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={display}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => { setOpen(true); setQ(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onKeyDown={onKeyDown}
        placeholder="พิมพ์ชื่อ/รหัสสินค้า…"
        style={{
          width: "100%", padding: "6px 8px", border: "1px solid var(--border)",
          borderRadius: "3px", fontSize: "12px", background: "white",
          color: selected && !open ? "var(--ink)" : undefined,
        }}
      />
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60,
          background: "white", border: "1px solid var(--border)", borderRadius: "4px",
          marginTop: "2px", maxHeight: "260px", overflowY: "auto",
          boxShadow: "0 6px 18px rgba(34,26,20,0.16)", minWidth: "280px",
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "10px", fontSize: "12px", color: "var(--muted)" }}>ไม่พบสินค้า</div>
          ) : (
            filtered.map((p, i) => (
              <div
                key={p.code}
                onMouseDown={() => choose(p)}
                onMouseEnter={() => setHi(i)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "7px 10px", fontSize: "12px", cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: i === hi ? "var(--surface-2, #FBF7EE)" : "white",
                }}
              >
                <span style={{ fontSize: "15px", flex: "0 0 auto" }}>{p.emoji || "📦"}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 600, color: "var(--brand)" }}>{p.code}</span>
                  <span style={{ color: "var(--ink)" }}> — {p.name}</span>
                </span>
                <span style={{ flex: "0 0 auto", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                  {(p.price || 0).toLocaleString("th-TH")} ฿
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ป้ายชื่อวิธีชำระเงิน + ระยะเครดิต ใช้ร่วมกันในใบพิมพ์/รายการ
const PAYMENT_LABELS = {
  cash: "เงินสด",
  transfer: "เงินโอน",
  credit: "เครดิต",
  cod: "เก็บเงินปลายทาง (COD)",
  consignment: "ฝากขาย",
};
const paymentMethodLabel = (form) => {
  const base = PAYMENT_LABELS[form.paymentMethod] || form.paymentMethod || "—";
  if (form.paymentMethod === "credit" && form.creditDays) return `${base} ${form.creditDays} วัน`;
  return base;
};

Object.assign(window, { ProductPicker, PAYMENT_LABELS, paymentMethodLabel });
