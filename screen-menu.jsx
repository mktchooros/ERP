// Master Data screens — วัตถุดิบ / สูตร / การผลิต / เมนู

// Reference from data.jsx (via window globals)
// Data is attached to window by data.jsx: RECIPES, RAW, MENU, PRODUCTIONS

/* ───────────── Reusable modal ───────────── */
/* ── Searchable recipe combobox — พิมพ์ตัวอักษร/ตัวเลขเพื่อค้นหาสูตร ── */
const RecipeCombo = ({ recipes, value, onPick, placeholder = "พิมพ์รหัสหรือชื่อสูตรเพื่อค้นหา…" }) => {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const boxRef = React.useRef(null);

  const selected = recipes.find(r => r.code === value);
  const display = selected ? `${selected.code} · ${selected.name}` : "";

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return recipes;
    return recipes.filter(r =>
      (r.code || "").toLowerCase().includes(t) ||
      (r.name || "").toLowerCase().includes(t)
    );
  }, [q, recipes]);

  React.useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (r) => { onPick(r.code); setOpen(false); setQ(""); };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (open && filtered[hi]) choose(filtered[hi]); else setOpen(true); }
    else if (e.key === "Escape") { setOpen(false); setQ(""); }
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        className="form-input"
        value={open ? q : display}
        placeholder={selected ? display : placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => { setOpen(true); setQ(""); setHi(0); }}
        onKeyDown={onKeyDown}
        style={{ width: "100%" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: "#fff", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)", maxHeight: 260, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--muted)" }}>ไม่พบสูตรที่ตรงกับ "{q}"</div>
          ) : filtered.map((r, i) => (
            <div
              key={r.code}
              onMouseDown={(e) => { e.preventDefault(); choose(r); }}
              onMouseEnter={() => setHi(i)}
              style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", background: i === hi ? "var(--gold-soft, #FFF6E8)" : (r.code === value ? "#F6F2EA" : "#fff"), borderBottom: "1px solid #F0E8DC" }}
            >
              <b>{r.code}</b> · {r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Modal = ({ open, title, onClose, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{width}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{margin:0, fontFamily:"var(--font-display)", fontSize:16, fontWeight:600}}>{title}</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(34,26,20,.42);
          backdrop-filter: blur(2px);
          display: grid; place-items: center;
          z-index: 100;
          animation: fade .12s ease-out;
        }
        .modal {
          background: var(--surface);
          border-radius: 14px;
          border: 1px solid var(--border);
          box-shadow: 0 24px 60px -16px rgba(34,26,20,.4);
          max-width: 92vw;
          max-height: 88vh;
          display: flex; flex-direction: column;
          animation: pop .14s ease-out;
        }
        .modal-head {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-body { padding: 18px; overflow-y: auto; }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop  { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
        .modal-field {
          display: flex; flex-direction: column; gap: 5px;
          margin-bottom: 12px;
        }
        .modal-field > span {
          font-size: 12px; color: var(--muted); font-weight: 500;
        }
        .modal-field input, .modal-field select, .modal-field textarea {
          font-family: inherit; font-size: 13px;
          padding: 8px 11px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          outline: none;
        }
        .modal-field input:focus, .modal-field select:focus, .modal-field textarea:focus {
          border-color: var(--brand);
          box-shadow: 0 0 0 3px var(--brand-soft);
        }
        .modal-foot { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; padding-top: 14px; border-top: 1px solid var(--border); }
      `}</style>
    </div>
  );
};

/* ───────────── 🥩 วัตถุดิบ (Master) ───────────── */
const ScreenRaw = () => {
  const [list, setList] = React.useState([]);
  const [stocks, setStocks] = React.useState([]);

  // Load from localStorage หรือ RAW global
  React.useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('erp_raw');
      if (savedRaw) { setList(JSON.parse(savedRaw)); return; }
    } catch(e) {}
    setList(typeof RAW !== 'undefined' ? RAW : []);
  }, []);

  React.useEffect(() => {
    try {
      const savedStock = localStorage.getItem('erp_raw_stock');
      if (savedStock) { setStocks(JSON.parse(savedStock)); return; }
    } catch(e) {}
    setStocks(typeof RAW_STOCK !== 'undefined' ? RAW_STOCK : []);
  }, []);
  const [open, setOpen] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null);
  const [tempEdit, setTempEdit] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    unit: "กรัม",
    buyUnit: "",
    buyPrice: "",
    cost: "",
    supplier: "",
    barcode: "",
    inHand: "",
    reorder: "",
  });

  const filtered = list.filter(r =>
    !search || r.name.includes(search) || r.code.includes(search.toUpperCase()) ||
    (r.supplier && r.supplier.includes(search))
  );

  const onEditOpen = (idx) => {
    const item = list[idx];
    const stock = stocks.find(s => s.raw === item.code);
    setForm({
      name: item.name,
      unit: item.unit,
      buyUnit: item.buyUnit,
      buyPrice: item.buyPrice,
      cost: item.cost,
      supplier: item.supplier,
      inHand: stock?.inHand || 0,
      reorder: stock?.reorder || 0,
    });
    setEditIdx(idx);
    setOpen(true);
  };

  const onEditSave = (saveMode = true) => {
    const old = list[editIdx];
    const updated = list.map((item, i) => 
      i === editIdx 
        ? { ...item, name: form.name.trim(), unit: form.unit, buyUnit: form.buyUnit.trim()||"—", buyPrice: parseFloat(form.buyPrice)||0, cost: parseFloat(form.cost)||0, supplier: form.supplier.trim(), barcode: form.barcode.trim()||"—" }
        : item
    );
    
    if (saveMode) {
      setList(updated);
      window.RAW = updated;
      try { localStorage.setItem('erp_raw', JSON.stringify(updated)); } catch(e) {}

      const stockIdx = stocks.findIndex(s => s.raw === old.code);
      const updatedStocks = stocks.map((s, i) =>
        i === stockIdx ? { raw: s.raw, inHand: parseFloat(form.inHand)||0, reorder: parseFloat(form.reorder)||0 } : s
      );
      setStocks(updatedStocks);
      window.RAW_STOCK = updatedStocks;
      try { localStorage.setItem('erp_raw_stock', JSON.stringify(updatedStocks)); } catch(e) {}
      setTempEdit(null);
    } else {
      setTempEdit({ idx: editIdx, data: updated[editIdx] });
    }

    setOpen(false);
    setEditIdx(null);
    setForm({ name: "", unit: "กรัม", buyUnit: "", buyPrice: "", cost: "", supplier: "", barcode: "", inHand: "", reorder: "" });
  };

  const onDelete = (idx) => {
    const item = list[idx];
    if (!confirm(`ลบ ${item.code} - ${item.name}?`)) return;
    const updated = list.filter((_, i) => i !== idx);
    setList(updated);
    window.RAW = updated;
    try { localStorage.setItem('erp_raw', JSON.stringify(updated)); } catch(e) {}

    const updatedStocks = stocks.filter(s => s.raw !== item.code);
    setStocks(updatedStocks);
    window.RAW_STOCK = updatedStocks;
    try { localStorage.setItem('erp_raw_stock', JSON.stringify(updatedStocks)); } catch(e) {}
  };

    const handleSave = () => {
    if (!form.name.trim()) return alert("กรุณากรอกชื่อวัตถุดิบ");
    // Auto-generate next code: scan existing R## codes
    const used = list.map(r => parseInt((r.code.match(/^R(\d+)$/) || [])[1] || 0, 10));
    const next = Math.max(0, ...used) + 1;
    const code = "R" + String(next).padStart(2, "0");
    const newItem = {
      code,
      name: form.name.trim(),
      unit: form.unit || "กรัม",
      buyUnit: form.buyUnit.trim() || "—",
      buyPrice: parseFloat(form.buyPrice) || 0,
      cost: parseFloat(form.cost) || 0,
      supplier: form.supplier.trim() || "—",
      barcode: form.barcode.trim() || "",
    };
    setList([...list, newItem]);
    // บันทึก localStorage
    const updatedList = [...list, newItem];
    window.RAW = updatedList;
    try { localStorage.setItem('erp_raw', JSON.stringify(updatedList)); } catch(e) {}

    const inHand = parseFloat(form.inHand) || 0;
    const reorder = parseFloat(form.reorder) || 0;
    const newStock = { raw: code, inHand, reorder };
    const updatedStocks = [...stocks, newStock];
    setStocks(updatedStocks);
    window.RAW_STOCK = updatedStocks;
    try { localStorage.setItem('erp_raw_stock', JSON.stringify(updatedStocks)); } catch(e) {}

    setForm({ name: "", unit: "กรัม", buyUnit: "", buyPrice: "", cost: "", supplier: "", inHand: "", reorder: "" });
    setOpen(false);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🥩 วัตถุดิบ</h1>
          <p className="page-sub">รายการวัตถุดิบทั้งหมดที่ใช้ในการผลิต · {list.length} รายการ</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="download" size={14}/> ส่งออก</button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14}/> เพิ่มวัตถุดิบ
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <span className="card-title" style={{marginRight:"auto"}}>วัตถุดิบทั้งหมด</span>
          <div className="search" style={{width:240, padding:"4px 10px", margin:0}}>
            <Icon name="search" size={13}/>
            <input
              placeholder="ค้นหาชื่อ / รหัส / ซัพพลายเออร์"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อวัตถุดิบ</th>
              <th>หน่วยที่ใช้</th>
              <th>หน่วยที่ซื้อ</th>
              <th className="num">ราคา/หน่วยซื้อ</th>
              <th className="num">ต้นทุน/หน่วยใช้</th>
              <th>ซัพพลายเออร์</th>
              <th className="num">คงเหลือ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const stock = stocks.find(s => s.raw === r.code);
              const isLow = stock && stock.inHand < stock.reorder;
              return (
                <tr key={r.code}>
                  <td><span className="code">{r.code}</span></td>
                  <td style={{fontWeight:500}}>{r.name}</td>
                  <td className="small muted">{r.unit}</td>
                  <td className="small muted">{r.buyUnit || "—"}</td>
                  <td className="num tnum">{r.buyPrice ? baht(r.buyPrice) : <span className="muted">—</span>}</td>
                  <td className="num tnum">{baht(r.cost)}</td>
                  <td className="small">{r.supplier}</td>
                  <td className="num tnum" style={{fontWeight:600, color: isLow ? "var(--brand)" : "var(--ink)"}}>
                    {fmt(stock?.inHand || 0)}
                    {isLow && <Badge kind="stop"> ต่ำ</Badge>}
                  </td>
                  <td style={{display:"flex",gap:6}}>
                    <button className="btn btn-sm" onClick={() => onEditOpen(filtered.indexOf(r))}>✎</button>
                    <button className="btn btn-sm" onClick={() => onDelete(list.indexOf(r))} style={{color:"#ef4444"}}>✕</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{padding:"30px 14px", textAlign:"center", color:"var(--muted)"}}>
                ไม่พบวัตถุดิบที่ค้นหา
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => {setOpen(false); setEditIdx(null);}} title={editIdx !== null ? "✎ แก้ไขวัตถุดิบ" : "➕ เพิ่มวัตถุดิบใหม่"} width={520}>
        <label className="modal-field">
          <span>ชื่อวัตถุดิบ <span style={{color:"var(--brand)"}}>*</span></span>
          <input
            type="text"
            placeholder="เช่น พริกแห้งบด"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            autoFocus
          />
        </label>
        <div className="grid-2">
          <label className="modal-field">
            <span>หน่วยที่ใช้ผลิต <span style={{color:"var(--brand)"}}>*</span></span>
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
              <option>กรัม</option>
              <option>กิโลกรัม</option>
              <option>ลิตร</option>
              <option>มิลลิลิตร</option>
              <option>ใบ</option>
              <option>ซอง</option>
              <option>ขวด</option>
              <option>ม้วน</option>
              <option>กล่อง</option>
              <option>ลัง</option>
              <option>ถุง</option>
            </select>
          </label>
          <label className="modal-field">
            <span>ต้นทุน/หน่วยที่ใช้ (บาท)</span>
            <input
              type="number"
              step="0.001"
              placeholder="0.00"
              value={form.cost}
              onChange={e => setForm({...form, cost: e.target.value})}
            />
          </label>
        </div>
        <div className="grid-2">
          <label className="modal-field">
            <span>หน่วยที่ซื้อ</span>
            <input
              type="text"
              placeholder="เช่น กระสอบ 25 kg, ซอง 1 kg"
              value={form.buyUnit}
              onChange={e => setForm({...form, buyUnit: e.target.value})}
            />
          </label>
          <label className="modal-field">
            <span>ราคา/หน่วยที่ซื้อ (บาท)</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.buyPrice}
              onChange={e => setForm({...form, buyPrice: e.target.value})}
            />
          </label>
        </div>
        <label className="modal-field">
          <span>ซัพพลายเออร์</span>
          <input
            type="text"
            placeholder="เช่น Makro, ตลาดสด"
            value={form.supplier}
            onChange={e => setForm({...form, supplier: e.target.value})}
          />
        </label>
        <div className="grid-2">
          <label className="modal-field">
            <span>บาร์โค้ด</span>
            <input
              type="text"
              placeholder="88500020010079"
              value={form.barcode || ""}
              onChange={e => setForm({...form, barcode: e.target.value})}
            />
          </label>
          <label className="modal-field">
            <span>สต๊อกเริ่มต้น</span>
            <input
              type="number"
              placeholder="0"
              value={form.inHand}
              onChange={e => setForm({...form, inHand: e.target.value})}
            />
          </label>
          <label className="modal-field">
            <span>จุดสั่งซื้อ (Reorder)</span>
            <input
              type="number"
              placeholder="0"
              value={form.reorder}
              onChange={e => setForm({...form, reorder: e.target.value})}
            />
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => {setOpen(false); setEditIdx(null);}}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={() => editIdx !== null ? onEditSave(true) : handleSave()}>
            <Icon name="check" size={14}/> {editIdx !== null ? "อัปเดต" : "บันทึก"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

/* ───────────── 🧮 สูตร (Master) ───────────── */
const ScreenRecipe = () => {
  // โหลดจาก localStorage ก่อน → window.RECIPES → RECIPES (data.jsx)
  const loadRecipes = () => {
    try {
      const saved = localStorage.getItem('erp_recipes');
      if (saved && saved.length > 2) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) { console.error('loadRecipes error:', e); }
    const fallback = (window.RECIPES && window.RECIPES.length > 0) ? window.RECIPES : RECIPES;
    console.log('loadRecipes fallback:', fallback?.length, 'items', fallback);
    return fallback || [];
  };
  const saveRecipes = (updated) => {
    window.RECIPES = updated;
    try { 
      localStorage.setItem('erp_recipes', JSON.stringify(updated));
      console.log('✅ Recipes saved to localStorage:', updated?.length, 'items');
    } catch(e) { 
      console.error('❌ Failed to save recipes:', e);
    }
  };
  const [recipes, setRecipes] = React.useState([]);
  const [activeCode, setActiveCode] = React.useState("");

  // Load recipes เมื่อ component mount
  React.useEffect(() => {
    const loaded = loadRecipes();
    console.log('ScreenRecipe useEffect: loaded', loaded?.length, 'recipes');
    setRecipes(loaded);
    setActiveCode(loaded[0]?.code || "");
  }, []);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(null); // copy of items while editing
  const [draftName, setDraftName] = React.useState("");
  const [draftProduct, setDraftProduct] = React.useState("");
  const [draftMakesQty, setDraftMakesQty] = React.useState("1");
  const [draftMakesUnit, setDraftMakesUnit] = React.useState("ซอง");
  const [pendingNewCode, setPendingNewCode] = React.useState(null); // สูตรใหม่ที่ยังไม่ได้บันทึก
  const [returnToCode, setReturnToCode] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState(""); // ช่องค้นหาสูตร

  const parseMakes = (makes) => {
    const m = String(makes || "").match(/^\s*([\d.]+)\s*(.*)$/);
    return m ? { qty: m[1], unit: m[2].trim() } : { qty: "1", unit: String(makes || "").trim() };
  };

  const active = recipes.find(r => r.code === activeCode) || recipes[0];

  // ฟังชั่นกรองสูตร — ค้นหาจากรหัส, ชื่อ, หรือสินค้า
  const filteredRecipes = recipes.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return r.code.toLowerCase().includes(q) ||
           r.name.toLowerCase().includes(q) ||
           (r.product || "").toLowerCase().includes(q);
  });

  const costOfItems = (items) =>
    items.reduce((s, it) => {
      const raw = findRaw(it.raw);
      return s + (raw?.cost || 0) * (+it.qty || 0);
    }, 0);

  const costOfRecipe = (rec) => costOfItems(rec.items);

  // ── น้ำหนักรวมของสูตร (แปลงทุกหน่วยเป็นกรัม) ──
  const G_PER = { "กรัม": 1, "g": 1, "กก.": 1000, "กิโลกรัม": 1000, "kg": 1000 };
  const totalGrams = (items) =>
    items.reduce((s, it) => {
      const r = findRaw(it.raw);
      const f = G_PER[(r?.unit || "").trim()];
      return f ? s + f * (+it.qty || 0) : s;
    }, 0);

  const startEdit = () => {
    if (!active) return;
    setDraft((active.items || []).map(it => ({...it})));
    setDraftName(active.name || "");
    setDraftProduct(active.product || "");
    const pm = parseMakes(active.makes);
    setDraftMakesQty(pm.qty);
    setDraftMakesUnit(pm.unit);
    setEditing(true);
  };

  const cancelEdit = () => {
    // ถ้ากำลังสร้างสูตรใหม่/สำเนาอยู่แล้วยกเลิก → ลบออก ไม่ให้ค้างในรายการ
    if (pendingNewCode) {
      const updated = recipes.filter(r => r.code !== pendingNewCode);
      setRecipes(updated);
      saveRecipes(updated);
      setActiveCode(returnToCode || (updated[0] && updated[0].code));
      setPendingNewCode(null);
      setReturnToCode(null);
    }
    setEditing(false);
    setDraft(null);
  };

  const nextCode = () => {
    const nums = recipes
      .map(r => parseInt((r.code.match(/\d+/) || ["0"])[0], 10))
      .filter(n => !isNaN(n));
    return "S" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0");
  };

  // ── เพิ่มสูตรใหม่ — สร้างสูตรเปล่า แล้วเข้าโหมดแก้ไข ──
  const addRecipe = () => {
    const newRec = {
      code: nextCode(),
      name: "สูตรใหม่",
      product: (MENU[0] && MENU[0].code) || "",
      makes: "1 ซอง",
      items: [{ raw: RAW[0].code, qty: 1 }],
    };
    const updated = [...recipes, newRec];
    setRecipes(updated);
    saveRecipes(updated);
    setReturnToCode(activeCode);
    setPendingNewCode(newRec.code);
    setActiveCode(newRec.code);
    setDraft(newRec.items.map(it => ({ ...it })));
    setDraftName(newRec.name);
    setDraftMakesQty("1");
    setDraftMakesUnit("ซอง");
    setEditing(true);
  };

  // ── สำเนาสูตร — สร้างสูตรใหม่จากสูตรที่เลือก แล้วเข้าโหมดแก้ไขทันที ──
  const duplicateRecipe = (srcCode) => {
    const src = recipes.find(r => r.code === srcCode);
    if (!src) return;
    const copy = {
      ...src,
      code: nextCode(),
      name: src.name + " (สำเนา)",
      items: src.items.map(it => ({ ...it })),
    };
    const idx = recipes.findIndex(r => r.code === srcCode);
    const updated = [...recipes.slice(0, idx + 1), copy, ...recipes.slice(idx + 1)];
    setRecipes(updated);
    saveRecipes(updated);
    setReturnToCode(activeCode);
    setPendingNewCode(copy.code);
    setActiveCode(copy.code);
    setDraft((copy.items || []).map(it => ({ ...it })));
    setDraftName(copy.name || "");
    const pm = parseMakes(copy.makes);
    setDraftMakesQty(pm.qty);
    setDraftMakesUnit(pm.unit);
    setEditing(true);
  };

  // ── ลบสูตร ──
  const deleteRecipe = (code) => {
    const target = recipes.find(r => r.code === code);
    if (!target) return;
    if (!confirm(`ต้องการลบสูตร "${target.code} - ${target.name}" หรือไม่?`)) return;
    const updated = recipes.filter(r => r.code !== code);
    setRecipes(updated);
    saveRecipes(updated);
    setActiveCode(updated[0]?.code || "");
    setEditing(false);
    setDraft(null);
    setPendingNewCode(null);
    setReturnToCode(null);
  };

  const saveEdit = () => {
    const cleaned = draft
      .filter(it => it.raw && +it.qty > 0)
      .map(it => ({ raw: it.raw, qty: +it.qty }));
    const newMakes = `${draftMakesQty || "1"} ${draftMakesUnit || "ซอง"}`.trim();
    const updated = recipes.map(r =>
      r.code === activeCode ? { ...r, name: draftName.trim() || r.name, product: draftProduct, makes: newMakes, items: cleaned } : r
    );
    setRecipes(updated);
    saveRecipes(updated);
    setPendingNewCode(null);
    setReturnToCode(null);
    setEditing(false);
    setDraft(null);
    setSearchQuery(""); // ล้างการค้นหาเพื่อแสดงสูตรทั้งหมด
  };

  const updateDraftItem = (i, patch) => {
    setDraft(draft.map((it, idx) => idx === i ? {...it, ...patch} : it));
  };
  const removeDraftItem = (i) => {
    setDraft(draft.filter((_, idx) => idx !== i));
  };
  const addDraftItem = () => {
    // pick first raw not yet used
    const used = new Set(draft.map(d => d.raw));
    const firstUnused = RAW.find(r => !used.has(r.code)) || RAW[0];
    setDraft([...draft, { raw: firstUnused.code, qty: 1 }]);
  };

  const itemsToShow = editing ? draft : (active?.items || []);
  const recipeCost = costOfItems(itemsToShow);
  const product = findProduct(active?.product);
  const makesNum = parseInt(String(editing ? draftMakesQty : (active?.makes || "1")).replace(/[^\d.]/g, ""), 10) || 1;
  const recipeGrams = totalGrams(itemsToShow);
  const perUnitCost = recipeCost / makesNum;

  // Guard: รอให้ recipes load
  if (!recipes?.length) return <div className="page" style={{padding: "2rem"}}>กำลังโหลดสูตร...</div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🧮 สูตร</h1>
          <p className="page-sub">สูตรการผลิตและส่วนผสมต่อล็อตมาตรฐาน · {recipes.length} สูตร · คลิกแถวเพื่อดูรายละเอียด แล้วกด "แก้ไข"</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={addRecipe}><Icon name="plus" size={14}/> เพิ่มสูตรใหม่</button>
          {active && (
            <>
              <button className="btn" onClick={() => {
                const r = active;
                const items = r.items || [];
                const html = `<!DOCTYPE html><html><head>
                  <meta charset="utf-8"/>
                  <title>สูตร ${r.code} - ${r.name}</title>
                  <style>
                    body{font-family:sans-serif;margin:20px;font-size:13px}
                    h2{text-align:center;margin-bottom:4px}
                    p{text-align:center;color:#666;margin-top:0}
                    table{width:100%;border-collapse:collapse;margin-top:16px}
                    th{background:#f5f5f5;padding:8px;text-align:left;border:1px solid #ddd}
                    td{border:1px solid #ddd;padding:8px}
                    .num{text-align:right}
                    @media print{button{display:none}}
                  </style>
                </head><body>
                  <h2>สูตรการผลิต</h2>
                  <p style="font-size:16px;margin:8px 0"><strong>${r.code} - ${r.name}</strong></p>
                  <p>ผลิตได้: ${r.makes} | สำหรับสินค้า: ${r.product || "—"}</p>
                  <button onclick="window.print()" style="display:block;margin:0 auto 16px;padding:8px 24px;background:#c0392b;color:white;border:none;border-radius:4px;cursor:pointer">🖨️ พิมพ์</button>
                  <table>
                    <thead><tr>
                      <th>#</th><th>วัตถุดิบ</th><th className="num">จำนวน</th><th>หน่วย</th><th className="num">ต้นทุน</th>
                    </tr></thead>
                    <tbody>
                      ${items.map((it, i) => {
                        const raw = RAW.find(r => r.code === it.raw);
                        const cost = (parseFloat(it.qty) || 0) * (parseFloat(raw?.cost) || 0);
                        return `<tr>
                          <td>${i+1}</td>
                          <td><strong>${it.raw}</strong> ${raw?.name || ""}</td>
                          <td style="text-align:right">${(parseFloat(it.qty) || 0).toLocaleString("en-US", {maximumFractionDigits:2})}</td>
                          <td>${raw?.unit || ""}</td>
                          <td style="text-align:right">฿${cost.toLocaleString("en-US", {maximumFractionDigits:2})}</td>
                        </tr>`;
                      }).join("")}
                    </tbody>
                  </table>
                </body></html>`;
                const win = window.open('', '_blank');
                win.document.write(html);
                win.document.close();
              }} title="พิมพ์สูตรนี้">🖨️ พิมพ์</button>
              <button className="btn" onClick={() => {
                const r = active;
                const items = r.items || [];
                let csv = "สูตร,วัตถุดิบ,จำนวน,หน่วย,ต้นทุน\\n";
                csv += `"${r.code} - ${r.name}","ผลิตได้: ${r.makes}","สำหรับ: ${r.product || "—"}","","\\n"\\n`;
                csv += `"#","วัตถุดิบ","จำนวน","หน่วย","ต้นทุน"\\n`;
                items.forEach((it, i) => {
                  const raw = RAW.find(rr => rr.code === it.raw);
                  const cost = (parseFloat(it.qty) || 0) * (parseFloat(raw?.cost) || 0);
                  csv += `${i+1},"${it.raw} ${raw?.name || ""}",${parseFloat(it.qty) || 0},"${raw?.unit || ""}",${cost}\\n`;
                });
                const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `สูตร_${r.code}.csv`;
                link.click();
              }} title="ดาวน์โหลด CSV">📥 Export</button>
            </>
          )}
        </div>
      </div>

      <div className="grid-dash">
        {/* Left: recipe list */}
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">สูตรทั้งหมด</h3>
          </div>
          {/* ช่องค้นหาสูตร */}
          <div style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
            <input
              type="text"
              placeholder="🔍 ค้นหาจากรหัส, ชื่อสูตร, หรือสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                fontSize: "13px",
                fontFamily: "inherit"
              }}
            />
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อสูตร</th>
                <th>ผลิตได้</th>
                <th>สำหรับสินค้า</th>
                <th className="num">ต้นทุน/ล็อต</th>
                <th className="num">ต้นทุน/หน่วย</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...filteredRecipes].sort((a, b) => {
                const na = parseInt((a.code.match(/\d+/) || ["0"])[0], 10);
                const nb = parseInt((b.code.match(/\d+/) || ["0"])[0], 10);
                return nb - na;
              }).map(r => {
                const c = costOfRecipe(r);
                const n = parseInt(r.makes.replace(/[^\d]/g, ""), 10) || 1;
                const p = findProduct(r.product);
                return (
                  <tr key={r.code}
                      onClick={() => { if (!editing) setActiveCode(r.code); }}
                      style={{
                        cursor: editing ? "not-allowed" : "pointer",
                        background: active.code === r.code ? "var(--brand-soft)" : "",
                        opacity: editing && active.code !== r.code ? 0.5 : 1,
                      }}>
                    <td><span className="code">{r.code}</span></td>
                    <td style={{fontWeight: active?.code === r.code ? 600 : 500}}>{r.name || "—"}</td>
                    <td className="small tnum">{r.makes}</td>
                    <td className="small muted">{p?.name || "—"}</td>
                    <td className="num tnum">{baht0(c)}</td>
                    <td className="num tnum" style={{fontWeight:600}}>{baht(c/n)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost"
                        title="สำเนาสูตรนี้"
                        onClick={(e) => { e.stopPropagation(); if (!editing) duplicateRecipe(r.code); }}
                        disabled={editing}
                        style={{padding:"2px 6px", opacity: editing ? 0.4 : 1}}
                      >
                        <Icon name="copy" size={13}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right: active recipe detail */}
        <div className="card">
          <div className="card-head">
            <div className="grow" style={{minWidth:0}}>
              {editing ? (
                <input
                  type="text"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  className="form-input"
                  style={{fontFamily:"var(--font-display)", fontSize:14, fontWeight:600, width:"100%"}}
                />
              ) : (
                <h3 className="card-title">{active?.name || "—"}</h3>
              )}
              {editing ? (
                <span className="card-sub" style={{display:"inline-flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                  {active.code} · ผลิตได้
                  <input type="number" min="1" step="1" className="form-input tnum"
                    value={draftMakesQty}
                    onChange={e => setDraftMakesQty(e.target.value)}
                    style={{width:60, padding:"2px 6px", fontSize:12, textAlign:"right"}}/>
                  <input type="text" className="form-input"
                    value={draftMakesUnit}
                    onChange={e => setDraftMakesUnit(e.target.value)}
                    style={{width:64, padding:"2px 6px", fontSize:12}}/>
                  <span style={{color:"var(--brand)"}}>· กำลังแก้ไข</span>
                </span>
              ) : (
                <span className="card-sub">{active.code} · ผลิตได้ {active.makes}</span>
              )}
              {editing && (
                <div style={{marginTop: 10, display: "flex", alignItems: "center", gap: 8, width: "100%"}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap"}}>สำหรับสินค้า:</label>
                  <select
                    className="form-input"
                    value={draftProduct || ""}
                    onChange={e => setDraftProduct(e.target.value)}
                    style={{padding: "6px 8px", fontSize: 12, flex: 1}}
                  >
                    <option value="">— เลือกสินค้า —</option>
                    {(window.MENU || MENU).map(m => (
                      <option key={m.code} value={m.code}>{m.code} · {m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {!editing ? (
              <div className="row" style={{gap:6}}>
                <button className="btn btn-sm" onClick={() => duplicateRecipe(active.code)} title="สร้างสำเนาของสูตรนี้">
                  <Icon name="copy" size={12}/> สำเนา
                </button>
                <button className="btn btn-sm btn-primary" onClick={startEdit}>
                  <Icon name="settings" size={12}/> แก้ไข
                </button>
                <button className="btn btn-sm" onClick={() => deleteRecipe(active.code)} title="ลบสูตรนี้"
                  style={{background:"#FFE8E5", border:"1px solid #E9B6B1", color:"var(--brand)"}}>
                  🗑️ ลบ
                </button>
              </div>
            ) : (
              <div className="row" style={{gap:6}}>
                <button className="btn btn-sm" onClick={cancelEdit}>ยกเลิก</button>
                <button className="btn btn-sm btn-primary" onClick={saveEdit}>
                  <Icon name="check" size={12}/> บันทึก
                </button>
              </div>
            )}
          </div>
          <div className="card-body" style={{paddingTop:6}}>
            <div className="ing-row" style={{fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600,
                  gridTemplateColumns: editing ? "1fr 80px 60px 80px 28px" : "1fr 70px 90px 90px"}}>
              <span>วัตถุดิบ</span>
              <span className="tnum" style={{textAlign:"right"}}>ปริมาณ</span>
              <span className="tnum" style={{textAlign:"right"}}>หน่วย</span>
              <span className="tnum" style={{textAlign:"right"}}>ต้นทุน</span>
              {editing && <span></span>}
            </div>
            {itemsToShow.map((it, i) => {
              const r = findRaw(it.raw);
              if (editing) {
                return (
                  <div className="ing-row" key={i} style={{gridTemplateColumns: "1fr 80px 60px 80px 28px"}}>
                    <select
                      className="form-input"
                      style={{padding:"4px 8px", fontSize:12}}
                      value={it.raw}
                      onChange={e => updateDraftItem(i, { raw: e.target.value })}
                    >
                      {RAW.map(raw => (
                        <option key={raw.code} value={raw.code}>{raw.code} · {raw.name}</option>
                      ))}
                    </select>
                    <input
                      className="form-input tnum"
                      type="number"
                      step="0.001"
                      style={{padding:"4px 8px", fontSize:12, textAlign:"right"}}
                      value={it.qty}
                      onChange={e => updateDraftItem(i, { qty: e.target.value })}
                    />
                    <span className="tnum small muted" style={{textAlign:"right", alignSelf:"center"}}>{r?.unit}</span>
                    <span className="tnum small" style={{textAlign:"right", alignSelf:"center"}}>{baht0((r?.cost || 0) * (+it.qty || 0))}</span>
                    <button
                      onClick={() => removeDraftItem(i)}
                      className="btn btn-sm btn-ghost"
                      style={{padding:"2px 6px", color:"var(--brand)"}}
                      title="ลบรายการนี้"
                    >✕</button>
                  </div>
                );
              }
              return (
                <div className="ing-row" key={i}>
                  <span>
                    <span style={{fontWeight:500}}>{r?.name}</span>
                    <span className="small muted" style={{marginLeft:6}}>{it.raw}</span>
                  </span>
                  <span className="tnum" style={{textAlign:"right", fontWeight:600}}>{it.qty}</span>
                  <span className="tnum" style={{textAlign:"right", color:"var(--muted)"}}>{r?.unit}</span>
                  <span className="tnum" style={{textAlign:"right"}}>{baht0(r?.cost * it.qty)}</span>
                </div>
              );
            })}
            {editing && (
              <button
                onClick={addDraftItem}
                className="btn btn-sm"
                style={{marginTop:10, width:"100%", justifyContent:"center", borderStyle:"dashed"}}
              >
                <Icon name="plus" size={12}/> เพิ่มวัตถุดิบ
              </button>
            )}
            <div style={{padding:"12px 0 0", marginTop:4, borderTop:"1px solid var(--border)"}}>
              <div className="row" style={{justifyContent:"space-between"}}>
                <span className="small muted">น้ำหนักรวม (วัตถุดิบ)</span>
                <span className="tnum" style={{fontWeight:700, fontFamily:"var(--font-display)", fontSize:16, color:"var(--gold-ink, #6F4E12)"}}>
                  {fmt(Math.round(recipeGrams * 1000) / 1000)} <span className="small muted" style={{fontWeight:400}}>กรัม</span>
                </span>
              </div>
              <div className="row" style={{justifyContent:"space-between", marginTop:4}}>
                <span className="small muted">น้ำหนัก/{draftMakesUnit && editing ? draftMakesUnit : (active.makes.replace(/[\d.\s]/g,"") || "หน่วย")}</span>
                <span className="tnum" style={{fontWeight:600}}>
                  {fmt(Math.round((recipeGrams / makesNum) * 1000) / 1000)} <span className="small muted" style={{fontWeight:400}}>กรัม</span>
                </span>
              </div>
              <div className="row" style={{justifyContent:"space-between", marginTop:10, paddingTop:10, borderTop:"1px dashed var(--border)"}}>
                <span className="small muted">ต้นทุนวัตถุดิบรวม</span>
                <span className="tnum" style={{fontWeight:700, fontFamily:"var(--font-display)", fontSize:18}}>{baht0(recipeCost)}</span>
              </div>
              <div className="row" style={{justifyContent:"space-between"}}>
                <span className="small muted">ต้นทุน/หน่วย ({product?.unit})</span>
                <span className="tnum" style={{fontWeight:600}}>{baht(perUnitCost)}</span>
              </div>
              <div className="row" style={{justifyContent:"space-between", marginTop:4}}>
                <span className="small muted">ราคาขาย/หน่วย</span>
                <span className="tnum" style={{fontWeight:600}}>{baht(product?.price || 0)}</span>
              </div>
              <div className="row" style={{justifyContent:"space-between", marginTop:6, paddingTop:6, borderTop:"1px dashed var(--border)"}}>
                <span className="small muted">กำไรขั้นต้น/หน่วย</span>
                <span className="tnum" style={{fontWeight:700, color:"var(--leaf)", fontSize:15}}>
                  {baht((product?.price || 0) - perUnitCost)}
                  <span className="small" style={{marginLeft:6, color:"var(--muted)"}}>
                    ({Math.round((((product?.price || 0) - perUnitCost) / (product?.price || 1)) * 100)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────── 🏭 การผลิต ───────────── */
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
// แปลงค่าวันที่จาก input type="date" (YYYY-MM-DD) → "18 พฤษภาคม" ให้ตรงกับรูปแบบเดิม
const isoToThaiDate = (iso) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const day = parseInt(m[3], 10);
  const month = THAI_MONTHS[parseInt(m[2], 10) - 1] || "";
  return `${day} ${month}`;
};
// แสดงผลวันที่ให้เป็นไทยเสมอ — รองรับข้อมูลเก่าทุกรูปแบบที่ค้างใน localStorage
const displayThaiDate = (val) => {
  const s = String(val || "").trim();
  if (!s) return "—";
  // ISO: 2026-06-20
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${parseInt(m[3],10)} ${THAI_MONTHS[parseInt(m[2],10)-1]||""}`;
  // รูปแบบบั๊กเดิม "MM DD" หรือ "MM DD." (เดือนเว้นวรรควัน)
  m = s.match(/^(\d{1,2})\s+(\d{1,2})\.?$/);
  if (m) return `${parseInt(m[2],10)} ${THAI_MONTHS[parseInt(m[1],10)-1]||""}`;
  // อื่น ๆ ถือว่าเป็นไทยอยู่แล้ว
  return s;
};
const ScreenProduction = () => {
  const loadProds = () => {
    // Seed baseline ครั้งเดียว — หลังจากนั้นอ่านจาก localStorage ล้วน (ลบแล้วหายถาวร)
    try {
      const saved = localStorage.getItem('erp_productions');
      if (saved !== null) {
        // มีข้อมูลใน localStorage แล้ว → ใช้เลย ไม่ merge baseline (เคารพการลบ)
        const arr = JSON.parse(saved);
        window.PRODUCTIONS = arr;
        return arr;
      }
      // ครั้งแรกสุด — seed จาก baseline
      const base = (window.PRODUCTIONS && window.PRODUCTIONS.length > 0) ? window.PRODUCTIONS : PRODUCTIONS;
      const seeded = [...base];
      localStorage.setItem('erp_productions', JSON.stringify(seeded));
      window.PRODUCTIONS = seeded;
      return seeded;
    } catch(e) {
      return (window.PRODUCTIONS && window.PRODUCTIONS.length>0) ? window.PRODUCTIONS : PRODUCTIONS;
    }
  };
  const saveProds = (u) => { window.PRODUCTIONS=u; try{localStorage.setItem('erp_productions',JSON.stringify(u));}catch(e){} };
  const allRecipes = () => { try{const s=localStorage.getItem('erp_recipes');if(s)return JSON.parse(s);}catch(e){} return window.RECIPES||RECIPES; };

  // Rebuild FG stock — เรียกใช้ทั่วทั้งแอป (ScreenProduction + ScreenStockCardFinished)
  window.rebuildFGStockNow = () => {
    try {
      const map = new Map();
      let products = (typeof MENU !== 'undefined') ? MENU : [];
      try {
        const savedMenu = localStorage.getItem('erp_menu');
        if (savedMenu) products = JSON.parse(savedMenu);
      } catch(e) {}
      products.forEach(p => {
        map.set(p.code, { product: p.code, code: p.code, name: p.name, inHand: 0, reorder: 100 });
      });
      
      let prods = (typeof PRODUCTIONS !== 'undefined') ? PRODUCTIONS : [];
      try {
        const savedProds = localStorage.getItem('erp_productions');
        if (savedProds) prods = JSON.parse(savedProds);
      } catch(e) {}
      
      let recipes = (typeof RECIPES !== 'undefined') ? RECIPES : [];
      try {
        const savedRecipes = localStorage.getItem('erp_recipes');
        if (savedRecipes) recipes = JSON.parse(savedRecipes);
      } catch(e) {}
      
      prods.forEach(prod => {
        // นับเฉพาะล็อตที่ผลิต "เสร็จแล้ว" เท่านั้น (รองรับค่าเก่า "done")
        if (prod.status !== "เสร็จแล้ว" && prod.status !== "done") return;
        // ใช้สินค้าที่เลือกในใบสั่งผลิตก่อน → fallback ไปใช้ recipe.product
        const recipe = recipes.find(r => r.code === prod.recipe);
        const targetCode = prod.product || (recipe ? recipe.product : null);
        if (targetCode) {
          const key = targetCode;
          const curr = map.get(key) || { product: key, code: key, name: "", inHand: 0, reorder: 100 };
          curr.inHand = (curr.inHand || 0) + (parseFloat(prod.actualQty) || parseFloat(prod.qty) || 0);
          map.set(key, curr);
        }
      });
      
      products.forEach(p => {
        if (!map.has(p.code)) {
          map.set(p.code, { product: p.code, code: p.code, name: p.name, inHand: 0, reorder: 100 });
        }
      });
      
      const rebuilt = Array.from(map.values());
      window.FINISHED_STOCK = rebuilt;
      localStorage.setItem('erp_finished_stock', JSON.stringify(rebuilt));
      return rebuilt;
    } catch(e) {
      console.error('Error rebuilding FG stock:', e);
      return (typeof FINISHED_STOCK !== 'undefined') ? FINISHED_STOCK : [];
    }
  };

  const [prods, setProds] = React.useState([]);
  const [menu, setMenu] = React.useState([]);

  React.useEffect(() => {
    const loaded = loadProds();
    setProds(loaded);
    window.PRODUCTIONS = loaded;  // sync
    window.rebuildFGStockNow();  // rebuild FG stock จากการสั่งผลิตทั้งหมด
    // โหลด menu ด้วย
    try {
      const base = (typeof MENU !== 'undefined') ? MENU : [];
      const saved = localStorage.getItem('erp_menu');
      const savedArr = saved ? JSON.parse(saved) : [];
      const map = new Map();
      base.forEach(p => map.set(p.code, p));
      savedArr.forEach(p => map.set(p.code, p));
      const merged = Array.from(map.values());
      setMenu(merged);
      window.MENU = merged;
    } catch(e) {
      setMenu((typeof MENU !== 'undefined') ? MENU : []);
    }
  }, []);
  const [printDoc, setPrintDoc] = React.useState(null);
  const [form, setForm] = React.useState(() => {
    const maxNum = (loadProds()).reduce((max, p) => {
      const m = String(p.code || "").match(/PD\d{4}(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return { code:`PD0526${String(maxNum+1).padStart(4,"0")}`, date:"2026-05-18", recipe:allRecipes()[0]?.code||"", product:"", qty:"", actualQty:"", by:"ยายปู", note:"", status:"รอผลิต" };
  });
  
  // Auto-suggest product จาก recipe, แต่ allow user override
  React.useEffect(() => {
    if (form.recipe) {
      const recipe = allRecipes().find(r => r.code === form.recipe);
      if (recipe) {
        const makesNum = parseInt(String(recipe.makes||"").replace(/[^\d]/g,""),10) || "";
        setForm(f => ({
          ...f,
          product: (recipe.product && !f.product) ? recipe.product : f.product,
          qty: (makesNum!=="" && (f.qty===""||f.qty==null)) ? String(makesNum) : f.qty,
        }));
      }
    }
  }, [form.recipe]);

  const [flash, setFlash] = React.useState(null);
  const [editIdx, setEditIdx] = React.useState(null);
  const [editForm, setEditForm] = React.useState(null);
  const total = prods.reduce((s,p)=>s+(p.qty||0),0);

  // ปรับสต็อค: sign=1 เพิ่ม, sign=-1 ลด
  // productCode = สินค้าที่เลือกในใบสั่งผลิต (ถ้าไม่ระบุ fallback ไปใช้ recipe.product)
  // ปรับสต๊อกวัตถุดิบ (RAW) ตามการผลิต — FG จะคำนวณแยกผ่าน rebuildFGStockNow (นับเฉพาะ "เสร็จแล้ว")
  const adjustStock = (recipeCode, actualQty, sign, productCode) => {
    const recipes = allRecipes();
    const recipe = recipes.find(r=>r.code===recipeCode);
    if (recipe && recipe.items) {
      const rawStock = (typeof RAW_STOCK!=='undefined') ? RAW_STOCK : [];
      recipe.items.forEach(it=>{ const s=rawStock.find(x=>x.raw===it.raw); if(s) s.inHand=Math.max(0,(s.inHand||0)-sign*it.qty*actualQty); });
      window.RAW_STOCK=rawStock; try{localStorage.setItem('erp_raw_stock',JSON.stringify(rawStock));}catch(e){}
    }
    // FG stock ไม่ปรับแบบ incremental ที่นี่ — ให้ rebuildFGStockNow() คำนวณจากล็อตที่ "เสร็จแล้ว" เท่านั้น
  };

  const onEditOpen = (idx) => {
    const p=prods[idx]; setEditIdx(idx);
    setEditForm({code:p.code,date:p.date,recipe:p.recipe,product:p.product||"",qty:p.qty,actualQty:p.actualQty||p.qty,by:p.by||"ยายปู",note:p.note||"",status:p.status||"รอผลิต"});
  };
  const onEditSave = () => {
    const old = prods[editIdx];
    const oldActual = parseFloat(old.actualQty) || parseFloat(old.qty);
    const newActual = parseFloat(editForm.actualQty) || parseFloat(editForm.qty);
    
    // ลดสต๊อควัตถุดิบเก่า
    adjustStock(old.recipe, oldActual, -1, old.product);
    
    // อัปเดต
    const updated = prods.map((p, i) => 
      i === editIdx ? {...p, ...editForm, qty: parseFloat(editForm.qty), actualQty: newActual} : p
    );
    setProds(updated);
    saveProds(updated);
    
    // หักวัตถุดิบใหม่
    adjustStock(editForm.recipe, newActual, 1, editForm.product);
    // คำนวณ FG ใหม่ (นับเฉพาะล็อตที่ "เสร็จแล้ว")
    if (window.rebuildFGStockNow) window.rebuildFGStockNow();
    
    setFlash(`✓ อัปเดต ${editForm.code} สำเร็จ`);
    setTimeout(() => setFlash(null), 3000);
    setEditIdx(null);
    setEditForm(null);
  };
  const onDelete = (idx) => {
    const p=prods[idx];
    if(!confirm(`ลบ ${p.code}?`)) return;
    adjustStock(p.recipe, p.actualQty||p.qty, -1, p.product);
    const updated=prods.filter((_,i)=>i!==idx);
    setProds(updated); saveProds(updated);
    if (window.rebuildFGStockNow) window.rebuildFGStockNow();
    setFlash(`⚠ ลบ ${p.code} เสร็จ`); setTimeout(()=>setFlash(null),3000);
  };

  const onDuplicate = (idx) => {
    const p = prods[idx];
    // หารหัส PD สูงสุดแล้ว +1 (ไม่ซ้ำแน่นอน)
    const maxNum = prods.reduce((max, prod) => {
      const m = String(prod.code || "").match(/PD\d{4}(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const newCode = `PD0526${String(maxNum + 1).padStart(4, "0")}`;
    const _now = new Date();
    const newProd = { ...p, code: newCode, date: `${_now.getDate()} ${THAI_MONTHS[_now.getMonth()]}`, status: "รอผลิต", actualQty: p.qty };
    const updated = [newProd, ...prods];
    setProds(updated);
    saveProds(updated);
    setFlash(`✓ สำเนา ${p.code} → ${newCode} สำเร็จ`);
    setTimeout(() => setFlash(null), 3000);
    setTimeout(() => onEditOpen(0), 0);  // เปิดแก้ไขสำเนาที่ index 0
  };

  const onSave = () => {
    if (!form.recipe || !form.product || !form.qty) return alert("กรุณากรอกสูตร สินค้า และจำนวน");
    const qty = parseFloat(form.qty);
    const actualQty = parseFloat(form.actualQty) || qty;
    const recipes = allRecipes();
    const recipe = recipes.find(r=>r.code===form.recipe);
    
    // หารหัสสูงสุดเพื่อ +1
    const maxNum = prods.reduce((max, p) => {
      const m = String(p.code || "").match(/PD\d{4}(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const newCode = `PD0526${String(maxNum+1).padStart(4,"0")}`;
    
    const newProd = { date:isoToThaiDate(form.date), status:form.status||"รอผลิต", code:newCode, recipe:form.recipe, product:form.product, qty:qty, actualQty:actualQty, by:form.by, note:form.note };
    const updated = [newProd,...prods];
    setProds(updated); saveProds(updated);
    adjustStock(form.recipe, actualQty, 1, form.product);
    if (window.rebuildFGStockNow) window.rebuildFGStockNow();
    const stockNote = (form.status === "เสร็จแล้ว") ? "" : " (ยังไม่เข้าสต๊อก — รอสถานะเสร็จแล้ว)";
    setFlash(`✓ บันทึก ${newProd.code} — ผลิตจริง ${actualQty} ซอง${stockNote}`); setTimeout(()=>setFlash(null),4000);
    
    // รีเซ็ตฟอร์มด้วยรหัสใหม่
    setForm(prev => ({ ...prev, code: `PD0526${String(maxNum+2).padStart(4,"0")}`, qty:"", actualQty:"", product:"", note:"", status:"รอผลิต" }));
  };

  const doPrint = (p) => { setPrintDoc(p); setTimeout(()=>window.print(),200); };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🏭 การผลิต</h1>
          <p className="page-sub">บันทึกล็อตการผลิตและประวัติย้อนหลัง · {prods.length} ล็อต</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="download" size={14}/> ส่งออก</button>
          <button className="btn btn-primary"><Icon name="plus" size={14}/> สร้างล็อตการผลิตใหม่</button>
        </div>
      </div>

      <div className="kpi-row" style={{marginBottom:14, gridTemplateColumns:"repeat(3, 1fr)"}}>
        <KPI label="ล็อตที่ผลิต" value={String(prods.length)} unit="ล็อต"
             hint={`ผลิตได้รวม ${fmt(total)} ชิ้น/ซอง/ถุง`}/>
        <KPI label="ผลิตล่าสุด" value={prods[0]?.date ? window.fmtDateGlobal(prods[0].date) : "—"}
             hint={`${prods[0]?.code||""} · ${prods[0]?.recipe||""}`}/>
        <KPI label="ผู้รับผิดชอบ" value="2" unit="คน"
             hint="คุณยายปู · คุณพี่นิด"/>
      </div>

      <div className="grid-dash">
        <div className="card no-print-on-print">
          <div className="card-head">
            <h3 className="card-title">ประวัติการผลิต</h3>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เลขที่</th>
                <th>สูตรที่ใช้</th>
                <th>สินค้าที่ได้</th>
                <th>สถานะ</th>
                <th className="num">สั่งผลิต</th>
                    <th className="num">ผลิตจริง</th>
                <th>ผู้ผลิต</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prods.map((p, i) => {
                const recipe = allRecipes().find(r => r.code === p.recipe);
                const product = (p.product ? findProduct(p.product) : null) || (recipe ? findProduct(recipe.product) : null);
                return (
                  <tr key={i}>
                    <td className="small muted tnum">{window.fmtDateGlobal(p.date)}</td>
                    <td><span className="code">{p.code}</span></td>
                    <td>
                      <div className="col">
                        <span style={{fontWeight:500}}>{recipe?.name}</span>
                        <span className="sku">{p.recipe}</span>
                      </div>
                    </td>
                    <td className="small">{product?.name || "—"}</td>
                    <td>
                      <span style={{
                        display:"inline-block",padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:600,
                        background:p.status==="เสร็จแล้ว"?"#dcfce7":p.status==="กำลังผลิต"?"#dbeafe":p.status==="รอคิวซี"?"#fce7f3":p.status==="รอเบิก"?"#ede9fe":p.status==="ระหว่างผลิต"?"#cffafe":"#fef3c7",
                        color:p.status==="เสร็จแล้ว"?"#16a34a":p.status==="กำลังผลิต"?"#2563eb":p.status==="รอคิวซี"?"#db2777":p.status==="รอเบิก"?"#7c3aed":p.status==="ระหว่างผลิต"?"#0891b2":"#d97706",
                      }}>{p.status||"รอผลิต"}</span>
                    </td>
                    <td className="num tnum" style={{fontWeight:600}}>{fmt(p.qty)} <span className="muted small">{p.unit}</span></td>
                    <td className="num tnum" style={{fontWeight:600,color:p.actualQty&&p.actualQty!==p.qty?(p.actualQty>p.qty?"var(--green)":"#ef4444"):""}}>
                      {fmt(p.actualQty||p.qty)} <span className="muted small">{p.unit}</span>
                    </td>
                    <td>{p.by}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => onEditOpen(i)} title="แก้ไข">✎</button>
                      <button className="btn btn-sm" onClick={() => onDuplicate(i)} title="สำเนา">📋</button>
                      <button className="btn btn-sm" onClick={() => onDelete(i)} title="ลบ" style={{color:"#ef4444"}}>✕</button>
                      <button className="btn btn-sm" onClick={() => doPrint(p)} title="ปริ้น">🖨</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card no-print-on-print" style={{alignSelf:"flex-start"}}>
          <div className="card-head">
            <h3 className="card-title">บันทึกล็อตใหม่</h3>
          </div>
          <div className="card-body" style={{display:"flex", flexDirection:"column", gap:12}}>
            {flash && <div style={{background:"#f0fdf4",color:"#16a34a",padding:"8px 12px",borderRadius:6,marginBottom:4}}>{flash}</div>}
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>เลขที่</span>
              <input type="text" className="form-input" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/>
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>วันที่</span>
              <input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>สูตร</span>
              <RecipeCombo recipes={allRecipes()} value={form.recipe} onPick={code=>{
                const rec = allRecipes().find(r=>r.code===code);
                const makesNum = rec ? (parseInt(String(rec.makes||"").replace(/[^\d]/g,""),10) || "") : "";
                setForm(f=>({...f, recipe:code, qty: makesNum===""?f.qty:String(makesNum), product: (rec&&rec.product)?rec.product:f.product}));
              }} />
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>สินค้าที่ผลิต</span>
              <select className="form-input" value={form.product} onChange={e=>setForm({...form,product:e.target.value})}>
                <option value="">-- เลือกสินค้า --</option>
                {menu.map((p,i)=><option key={i} value={p.code}>{p.code} · {p.name}</option>)}
              </select>
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>จำนวนที่สั่งผลิต (ซอง)</span>
              <input type="number" className="form-input" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="เช่น 100"/>
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>จำนวนที่ผลิตได้จริง (ซอง)</span>
              <input type="number" className="form-input" value={form.actualQty} onChange={e=>setForm({...form,actualQty:e.target.value})} placeholder="ถ้าเว้นว่างจะใช้ค่าเดียวกับสั่งผลิต" style={{borderColor: form.actualQty && parseFloat(form.actualQty) !== parseFloat(form.qty) ? "#f59e0b" : ""}}/>
              {form.actualQty && parseFloat(form.actualQty) !== parseFloat(form.qty) && (
                <span className="small" style={{color:"#f59e0b"}}>⚠ ได้จริงต่างจากที่สั่ง {parseFloat(form.actualQty)-parseFloat(form.qty||0) > 0 ? "+" : ""}{parseFloat(form.actualQty||0)-parseFloat(form.qty||0)} ซอง</span>
              )}
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>สถานะ</span>
              <select className="form-input" value={form.status||"รอผลิต"} onChange={e=>setForm({...form,status:e.target.value})}>
                {["รอผลิต","กำลังผลิต","ระหว่างผลิต","รอคิวซี","รอเบิก","เสร็จแล้ว"].map((o,i)=><option key={i}>{o}</option>)}
              </select>
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>ผู้ผลิต</span>
              <select className="form-input" value={form.by} onChange={e=>setForm({...form,by:e.target.value})}>
                <option value="ปนัดดา(แหม่ม)">ปนัดดา(แหม่ม)</option>
                <option value="ปนัดดา(แคร์)">ปนัดดา(แคร์)</option>
                <option value="คุณปริม">คุณปริม</option>
                <option value="คุณจักรพงศ์">คุณจักรพงศ์</option>
                <option value="คุณสมเจตน์">คุณสมเจตน์</option>
              </select>
            </label>
            <label className="col" style={{gap:5}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>หมายเหตุ</span>
              <textarea className="form-input" rows={2} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="บันทึกเพิ่มเติม (ถ้ามี)"></textarea>
            </label>
            <button className="btn btn-primary" style={{justifyContent:"center"}} onClick={onSave}>
              <Icon name="check" size={14}/> ยืนยันการผลิต
            </button>
          </div>
        </div>
      </div>

      {editIdx !== null && editForm && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setEditIdx(null);setEditForm(null);}}>
          <div style={{background:"var(--bg)",borderRadius:12,padding:24,width:360,display:"flex",flexDirection:"column",gap:12}} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:0}}>✎ แก้ไข {editForm.code}</h3>
            {[
              {label:"เลขที่",key:"code",type:"text"},
              {label:"วันที่",key:"date",type:"date"},
              {label:"สถานะ",key:"status",type:"select",options:["รอผลิต","กำลังผลิต","ระหว่างผลิต","รอคิวซี","รอเบิก","เสร็จแล้ว"]},
            {label:"ผู้ผลิต",key:"by",type:"select",options:["ยายปู","พี่นิด","อื่น ๆ"]},
            ].map((f,i)=>(
              <label key={i} style={{display:"flex",flexDirection:"column",gap:4}}>
                <span className="small" style={{color:"var(--muted)",fontWeight:500}}>{f.label}</span>
                {f.type==="select"?(
                  <select className="form-input" value={editForm[f.key]} onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})}>
                    {f.options.map((o,j)=><option key={j}>{o}</option>)}
                  </select>
                ):(
                  <input type={f.type} className="form-input" value={editForm[f.key]} onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})}/>
                )}
              </label>
            ))}
            <label style={{display:"flex",flexDirection:"column",gap:4}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>สูตร</span>
              <RecipeCombo recipes={allRecipes()} value={editForm.recipe} onPick={code=>setEditForm({...editForm,recipe:code})} />
            </label>
            <label style={{display:"flex",flexDirection:"column",gap:4}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>สินค้าที่ได้</span>
              <select className="form-input" value={editForm.product||""} onChange={e=>setEditForm({...editForm,product:e.target.value})}>
                <option value="">-- เลือกสินค้า --</option>
                {menu.map((p,i)=><option key={i} value={p.code}>{p.code} · {p.name}</option>)}
              </select>
            </label>
            <label style={{display:"flex",flexDirection:"column",gap:4}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>จำนวนสั่งผลิต</span>
              <input type="number" className="form-input" value={editForm.qty} onChange={e=>setEditForm({...editForm,qty:e.target.value})}/>
            </label>
            <label style={{display:"flex",flexDirection:"column",gap:4}}>
              <span className="small" style={{color:"var(--muted)",fontWeight:500}}>จำนวนผลิตได้จริง</span>
              <input type="number" className="form-input" value={editForm.actualQty} onChange={e=>setEditForm({...editForm,actualQty:e.target.value})}/>
            </label>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={onEditSave}>อัปเดต</button>
              <button className="btn" onClick={()=>{setEditIdx(null);setEditForm(null);}}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
      {printDoc && <PrintProductionOrder doc={printDoc} onClose={() => setPrintDoc(null)}/>}
    </div>
  );
};

// Printable production order document — A4 sized, includes ingredient breakdown
const PrintProductionOrder = ({ doc, onClose }) => {
  const _pr = (()=>{ try { const s=localStorage.getItem('erp_recipes'); if(s) return JSON.parse(s); } catch(e){} return window.RECIPES||RECIPES; })();
  const recipe = _pr.find(r => r.code === doc.recipe);
  const product = (doc.product ? findProduct(doc.product) : null) || (recipe ? findProduct(recipe.product) : null);
  const batches = doc.qty; // จำนวนซองที่ผลิต

  // makesNum = จำนวนซองที่สูตรนี้ผลิตได้ (จาก recipe.makes เช่น "1 ซอง" → 1, "350 ซอง" → 350)
  const makesNum = parseInt(String(recipe?.makes || "1").replace(/[^\d]/g, ""), 10) || 1;

  const lines = (recipe?.items || []).map(it => {
    const r = findRaw(it.raw);
    const unit = r?.unit || "";
    // หน่วยกรัมหาร makesNum, หน่วยอื่น (ใบ ฯลฯ) ไม่หาร
    const isGram = unit === "กรัม";
    const perUnit = isGram ? it.qty / makesNum : it.qty;
    const total = perUnit * batches;
    return {
      code: it.raw,
      name: r?.name || "—",
      unit,
      perUnit: isGram ? +perUnit.toFixed(4) : perUnit,
      total,
      cost: (r?.cost || 0) * total,
    };
  });
  const totalCost = lines.reduce((s, l) => s + l.cost, 0);

  return (
    <>
      <div className="print-overlay" onClick={onClose}>
        <div className="print-doc" onClick={e => e.stopPropagation()}>
          <div className="print-toolbar no-print">
            <button className="btn" onClick={onClose}>← ปิด</button>
            <span style={{marginLeft:"auto", fontSize:13, color:"var(--muted)"}}>ใบสั่งผลิต · พรีวิวก่อนพิมพ์</span>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨 พิมพ์</button>
          </div>

          <div className="print-page">
            <div className="print-head">
              <div className="row" style={{alignItems:"center", gap:14}}>
                <div style={{width:64, height:64, borderRadius:12, background:"#FFF6E8", overflow:"hidden", border:"2px solid #C99432"}}>
                  <img src="logo.jpg" alt="ยายปู" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-display)", fontWeight:700, fontSize:18, color:"#7A1411"}}>ชูรสยายปู — ใบสั่งผลิต</div>
                  <div style={{fontSize:12, color:"#666"}}>Production Order · เอกสารภายในโรงงาน</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11, color:"#666"}}>เลขที่</div>
                <div style={{fontFamily:"var(--font-mono)", fontWeight:700, fontSize:18, color:"#B6241F"}}>{doc.code}</div>
                <div style={{fontSize:12, marginTop:4}}>วันที่ {doc.date} 2569</div>
              </div>
            </div>

            <table className="print-info">
              <tbody>
                <tr>
                  <td className="lbl">สินค้าที่ผลิต</td>
                  <td><b>{product?.name || "—"}</b></td>
                  <td className="lbl">สูตรที่ใช้</td>
                  <td><b>{recipe?.code}</b> · {recipe?.name || "—"}</td>
                </tr>
                <tr>
                  <td className="lbl">จำนวนที่ผลิต</td>
                  <td><b style={{fontSize:16}}>{fmt(doc.qty)} {doc.unit}</b></td>
                  <td className="lbl">ผู้รับผิดชอบ</td>
                  <td><b>{doc.by}</b></td>
                </tr>
              </tbody>
            </table>

            <h3 className="print-section">รายการวัตถุดิบที่ต้องใช้</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{width:42}}>#</th>
                  <th style={{width:60}}>รหัส</th>
                  <th>วัตถุดิบ</th>
                  <th style={{width:80}} className="num">ปริมาณ/ซอง</th>
                  <th style={{width:90}} className="num">รวม</th>
                  <th style={{width:50}}>หน่วย</th>
                  <th style={{width:46, textAlign:"center"}}>ตรวจ ✓</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="tnum">{i+1}</td>
                    <td><span style={{fontFamily:"var(--font-mono)", fontSize:11}}>{l.code}</span></td>
                    <td>{l.name}</td>
                    <td className="num tnum">{l.perUnit}</td>
                    <td className="num tnum" style={{fontWeight:600}}>{fmt(+l.total.toFixed(2))}</td>
                    <td>{l.unit}</td>
                    <td style={{textAlign:"center"}}>☐</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{textAlign:"right", fontWeight:600}}>ต้นทุนวัตถุดิบรวม</td>
                  <td colSpan="3" className="num tnum" style={{fontWeight:700, fontSize:14}}>{baht0(totalCost)}</td>
                </tr>
              </tfoot>
            </table>

            <h3 className="print-section">ขั้นตอนการผลิต</h3>
            <ol className="print-steps">
              <li>เตรียมวัตถุดิบตามรายการด้านบน ชั่งให้แม่นยำ</li>
              <li>ผสมวัตถุดิบในเครื่องผสม กวนให้เข้ากันประมาณ 15–20 นาที</li>
              <li>นำเข้าเครื่องบรรจุซอง ตามขนาดที่กำหนด</li>
              <li>ตรวจคุณภาพ — น้ำหนักต่อซอง การปิดผนึก และฉลาก</li>
              <li>บรรจุลงกล่อง ระบุล็อตและวันที่ผลิต</li>
              <li>นำส่งคลังสินค้าและบันทึกในระบบ</li>
            </ol>

            <div className="print-signatures">
              <div>
                <div className="sigline"></div>
                <div className="siglabel">ผู้สั่งผลิต</div>
                <div className="sigdate">วันที่ ___/___/_______</div>
              </div>
              <div>
                <div className="sigline"></div>
                <div className="siglabel">ผู้ผลิต</div>
                <div className="sigdate">วันที่ ___/___/_______</div>
              </div>
              <div>
                <div className="sigline"></div>
                <div className="siglabel">ผู้ตรวจสอบ (QC)</div>
                <div className="sigdate">วันที่ ___/___/_______</div>
              </div>
            </div>

            <div className="print-foot">
              <span>ชูรสยายปู · พิมพ์จากระบบ ERP เมื่อ {TODAY}</span>
              <span>หน้า 1/1</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .print-overlay {
          position: fixed; inset: 0;
          background: rgba(34,26,20,.55);
          z-index: 200;
          overflow-y: auto;
          padding: 24px 0;
        }
        .print-doc {
          background: #f3efe7;
          max-width: 900px;
          margin: 0 auto;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 30px 80px -20px rgba(0,0,0,.5);
        }
        .print-toolbar {
          padding: 12px 16px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex; gap: 8px; align-items: center;
        }
        .print-page {
          background: white;
          padding: 32px 40px;
          color: #222;
          font-size: 12.5px;
          line-height: 1.55;
        }
        .print-head {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding-bottom: 14px;
          border-bottom: 2px solid #B6241F;
          margin-bottom: 18px;
        }
        .print-info {
          width: 100%;
          margin-bottom: 18px;
          font-size: 12.5px;
        }
        .print-info td {
          padding: 6px 8px;
          border: 1px solid #d0c5ad;
          vertical-align: top;
        }
        .print-info td.lbl {
          background: #FBF7EE;
          color: #666;
          font-size: 11px;
          width: 110px;
          font-weight: 500;
        }
        .print-section {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          color: #7A1411;
          margin: 16px 0 8px;
          padding-bottom: 4px;
          border-bottom: 1px dashed #C99432;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .print-table th {
          background: #FBF7EE;
          padding: 7px 8px;
          font-size: 11px;
          font-weight: 600;
          color: #555;
          text-align: left;
          border: 1px solid #d0c5ad;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .print-table th.num { text-align: right; }
        .print-table td {
          padding: 6px 8px;
          border: 1px solid #d0c5ad;
        }
        .print-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
        .print-table tfoot td {
          background: #FBF7EE;
        }
        .print-steps {
          font-size: 12.5px;
          padding-left: 22px;
          margin: 6px 0 16px;
        }
        .print-steps li { padding: 3px 0; }
        .print-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          margin-top: 28px;
        }
        .sigline {
          border-top: 1px solid #222;
          margin-top: 32px;
        }
        .siglabel {
          font-size: 12px; font-weight: 600;
          margin-top: 4px;
          text-align: center;
          color: #444;
        }
        .sigdate {
          font-size: 11px;
          text-align: center;
          color: #888;
          margin-top: 2px;
        }
        .print-foot {
          margin-top: 24px;
          padding-top: 10px;
          border-top: 1px solid #d0c5ad;
          display: flex; justify-content: space-between;
          font-size: 10.5px; color: #999;
        }

        @media print {
          body * { visibility: hidden; }
          .print-overlay, .print-overlay * { visibility: visible; }
          .print-overlay {
            position: absolute;
            background: white;
            padding: 0;
            inset: auto;
            left: 0; top: 0;
          }
          .print-doc {
            box-shadow: none;
            background: white;
            max-width: none;
            border-radius: 0;
          }
          .print-toolbar { display: none !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0; }
          @page { size: A4; margin: 14mm; }
        }
      `}</style>
    </>
  );
};

/* ───────────── 📖 เมนู (Products Master) ───────────── */
const ScreenProduct = () => {
  const [filter, setFilter] = React.useState("ทั้งหมด");
  const [menu, setMenu] = React.useState([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});
  const [message, setMessage] = React.useState("");

  // Load menu — รวม MENU (data.jsx baseline) + localStorage (สิ่งที่ผู้ใช้แก้ไข/เพิ่ม)
  // ใช้รหัสสินค้าเป็นกุญแจ: ข้อมูลที่ผู้ใช้แก้ไขจะทับ baseline, รายการใหม่ใน data.jsx ก็จะปรากฏ
  React.useEffect(() => {
    try {
      const base = (typeof MENU !== 'undefined') ? MENU : [];
      const saved = localStorage.getItem('erp_menu');
      const savedArr = saved ? JSON.parse(saved) : [];
      // ติดตามรายการที่ผู้ใช้ลบ (เก็บไว้ใน erp_menu_deleted)
      let deleted = [];
      try { deleted = JSON.parse(localStorage.getItem('erp_menu_deleted') || '[]'); } catch(e) {}
      const map = new Map();
      base.forEach(p => map.set(p.code, p));        // baseline จาก data.jsx
      savedArr.forEach(p => map.set(p.code, p));     // ทับด้วยข้อมูลผู้ใช้
      deleted.forEach(code => map.delete(code));      // เอารายการที่ลบออก
      const merged = Array.from(map.values());
      setMenu(merged);
      // sync กลับเข้า localStorage ให้เป็นแหล่งข้อมูลเดียว
      window.MENU = merged;
      localStorage.setItem('erp_menu', JSON.stringify(merged));
    } catch(e) {
      if (typeof MENU !== 'undefined') setMenu(MENU);
    }
  }, []);

  const flavors = ["ทั้งหมด", ...new Set(menu.map(p => p.flavor))];
  const shown = filter === "ทั้งหมด" ? menu : menu.filter(p => p.flavor === filter);

  const saveMenu = (data) => {
    window.MENU = data;
    try { 
      localStorage.setItem('erp_menu', JSON.stringify(data));
      console.log('✅ Menu saved to localStorage:', data?.length, 'items');
      return true;
    } catch(e) { 
      console.error('❌ Failed to save menu:', e);
      // พื้นที่จัดเก็บเต็ม — เตือนผู้ใช้ (ไม่ปล่อยให้บันทึกล้มเหลวเงียบๆ)
      if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message || ''))) {
        alert("⚠️ พื้นที่จัดเก็บเต็ม! บันทึกไม่สำเร็จ\n\nสาเหตุมักมาจากรูปภาพสินค้าที่ใหญ่เกินไป\nกรุณาลบรูปภาพบางรายการ หรือดาวน์โหลด Backup แล้วลบข้อมูลเก่าออก");
      } else {
        alert("⚠️ บันทึกไม่สำเร็จ: " + (e.message || e));
      }
      return false;
    }
  };

  // หารหัสสินค้าใหม่ที่ไม่ซ้ำ — รวมรหัสที่ใช้อยู่ + รหัสที่เคยถูกลบ (tombstone ใน erp_menu_deleted)
  // สำคัญ: ถ้าสร้างรหัสซ้ำกับรหัสที่เคยลบ ตัว merge ตอนโหลดจะตัดรายการใหม่ทิ้งทันที (เพิ่มสินค้าไม่ติด)
  const nextProductCode = () => {
    let deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('erp_menu_deleted') || '[]'); } catch(e) {}
    const codes = [...menu.map(p => p.code), ...deleted];
    const maxNum = codes.reduce((max, c) => {
      const m = String(c || "").match(/^P(\d+)$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return `P${String(maxNum + 1).padStart(2, '0')}`;
  };

  // เอารหัสออกจากรายการลบ (tombstone) — เรียกเมื่อผู้ใช้สร้าง/บันทึกรหัสนั้นใหม่
  const untombstone = (code) => {
    try {
      const deleted = JSON.parse(localStorage.getItem('erp_menu_deleted') || '[]');
      if (deleted.includes(code)) {
        localStorage.setItem('erp_menu_deleted', JSON.stringify(deleted.filter(c => c !== code)));
      }
    } catch(e) {}
  };

  const handleAdd = () => {
    setEditIdx(null);
    setEditForm({
      code: nextProductCode(),
      barcode: "",
      image: "",
      name: "",
      flavor: "ธรรมชาติ",
      size: 30,
      emoji: "🍗",
      unit: "ซอง",
      price: 0,
      cost: 0
    });
    setEditOpen(true);
  };

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditForm({ ...menu[idx] });
    setEditOpen(true);
  };

  const handleSave = () => {
    console.log('handleSave called, editForm:', editForm);
    if (!editForm.name || !editForm.code) {
      setMessage("⚠️ กรุณากรอกรหัส และ ชื่อสินค้า");
      console.warn('Validation failed: name or code is empty');
      return;
    }

    // ตรวจสอบรหัสซ้ำ (ยกเว้นตอนแก้ไขรายการเดิม)
    const dupIdx = menu.findIndex(p => p.code === editForm.code);
    if (dupIdx !== -1 && dupIdx !== editIdx) {
      setMessage(`⚠️ รหัส ${editForm.code} มีอยู่แล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    let updated;
    if (editIdx !== null) {
      // Edit
      updated = menu.map((item, idx) => idx === editIdx ? editForm : item);
    } else {
      // Add
      updated = [...menu, editForm];
    }

    console.log('Updated menu:', updated);
    // ถ้ารหัสนี้เคยถูกลบ (tombstone) ให้เอาออกจากรายการลบ มิฉะนั้น merge ตอนโหลดจะตัดทิ้ง
    untombstone(editForm.code);
    // บันทึกก่อน — ถ้าสำเร็จค่อยอัปเดตจอและปิด modal
    const ok = saveMenu(updated);
    if (!ok) return;  // บันทึกล้มเหลว (พื้นที่เต็ม) — ไม่ปิด modal, ผู้ใช้แก้ไขรูปได้
    setMenu(updated);
    setMessage(editIdx !== null ? "✅ แก้ไขสินค้าแล้ว" : "✅ เพิ่มสินค้าแล้ว");
    setEditOpen(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = (idx) => {
    if (confirm("ต้องการลบสินค้านี้หรือไม่?")) {
      const removed = menu[idx];
      const updated = menu.filter((_, i) => i !== idx);
      setMenu(updated);
      saveMenu(updated);
      // บันทึกรหัสที่ลบ เพื่อไม่ให้ merge ดึงกลับมาจาก data.jsx
      if (removed && removed.code) {
        try {
          const deleted = JSON.parse(localStorage.getItem('erp_menu_deleted') || '[]');
          if (!deleted.includes(removed.code)) {
            deleted.push(removed.code);
            localStorage.setItem('erp_menu_deleted', JSON.stringify(deleted));
          }
        } catch(e) {}
      }
      setMessage("✅ ลบสินค้าแล้ว");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // สำเนาสินค้า — สร้างรายการใหม่จากรายการที่เลือก ด้วยรหัสใหม่ที่ไม่ซ้ำ แล้วบันทึกถาวร
  const handleDuplicate = (idx) => {
    const src = menu[idx];
    if (!src) return;
    const newCode = nextProductCode();
    untombstone(newCode);
    const copy = {
      ...src,
      code: newCode,
      name: `${src.name} (สำเนา)`,
      barcode: "",  // ล้างบาร์โค้ดเพื่อไม่ให้ซ้ำ
    };
    const updated = [...menu, copy];
    const ok = saveMenu(updated);
    if (!ok) return;  // บันทึกล้มเหลว (พื้นที่เต็ม)
    setMenu(updated);
    setMessage(`✅ สำเนาสินค้าเป็น ${newCode} แล้ว`);
    setTimeout(() => setMessage(""), 3000);
  };

  // Generate CODE128 barcode SVG using JsBarcode-like approach
  const generateBarcode128 = (text) => {
    if (!text) return null;
    
    // Simplified CODE128 encoder
    const code128Map = {
      ' ': [0, 0, 1, 1, 0, 1, 0], '!': [0, 1, 0, 0, 1, 1, 0], '"': [0, 1, 0, 0, 1, 1, 0],
      '0': [1, 0, 0, 1, 1, 0, 0], '1': [1, 1, 0, 0, 1, 1, 0], '2': [1, 1, 0, 0, 1, 0, 0],
      '3': [0, 0, 1, 0, 0, 1, 0], '4': [1, 0, 1, 0, 0, 1, 0], '5': [1, 1, 0, 1, 0, 0, 0],
      '6': [0, 0, 1, 1, 0, 0, 0], '7': [1, 0, 0, 1, 0, 1, 0], '8': [1, 0, 0, 1, 0, 0, 0],
      '9': [1, 0, 0, 0, 1, 0, 0], 'A': [0, 1, 0, 1, 1, 0, 0], 'B': [0, 1, 0, 1, 0, 0, 0],
    };
    
    let svg = `<svg width="250" height="100" viewBox="0 0 250 100" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #ccc;">`;
    
    // Draw start code
    let x = 10;
    const barWidth = 2;
    const barHeight = 60;
    
    // Simple pattern: alternating bars based on character values
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const val = char.charCodeAt(0);
      const pattern = [
        val % 2 === 0 ? 3 : 1,
        (val >> 1) % 2 === 0 ? 3 : 1,
        (val >> 2) % 2 === 0 ? 3 : 1,
        (val >> 3) % 2 === 0 ? 3 : 1,
        (val >> 4) % 2 === 0 ? 3 : 1,
        (val >> 5) % 2 === 0 ? 3 : 1,
      ];
      
      for (let j = 0; j < pattern.length; j++) {
        const width = pattern[j] * barWidth;
        if (j % 2 === 0) {
          svg += `<rect x="${x}" y="10" width="${width}" height="${barHeight}" fill="black"/>`;
        }
        x += width;
      }
    }
    
    // Draw stop code
    svg += `<rect x="${x}" y="10" width="${barWidth * 3}" height="${barHeight}" fill="black"/>`;
    svg += `<rect x="${x + barWidth * 3}" y="10" width="${barWidth}" height="${barHeight}" fill="white"/>`;
    svg += `<rect x="${x + barWidth * 4}" y="10" width="${barWidth * 3}" height="${barHeight}" fill="black"/>`;
    
    // Add text
    svg += `<text x="125" y="82" font-family="monospace" font-size="14" text-anchor="middle" font-weight="bold">${text}</text>`;
    svg += `</svg>`;
    
    return svg;
  };

  const handleExportBarcodes = () => {
    if (shown.length === 0) {
      setMessage("⚠️ ไม่มีสินค้า");
      return;
    }
    let html = `<html><head><meta charset="utf-8"><title>บาร์โค้ด</title><style>
      body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
      .barcode-label { page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100mm; padding: 10mm; border: 1px solid #ddd; }
      .barcode-label svg { height: 40mm; }
      .barcode-text { margin-top: 5mm; font-size: 14px; font-weight: bold; }
      .product-name { font-size: 12px; color: #666; margin-top: 3mm; }
    </style></head><body>`;
    shown.forEach(p => {
      const barcodeSvg = generateBarcode128(p.barcode || p.code);
      html += `<div class="barcode-label">${barcodeSvg || `<div style="font-size:24px;font-weight:bold;">${p.barcode || p.code}</div>`}<div class="barcode-text">${p.barcode || p.code}</div><div class="product-name">${p.name}</div></div>`;
    });
    html += `</body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setMessage("✅ เปิดสำหรับพิมพ์บาร์โค้ด");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
  <div className="page">
    <div className="page-head">
      <div>
        <h1 className="page-title">📖 เมนู</h1>
        <p className="page-sub">รายการสินค้าที่จำหน่าย · {menu.length} รายการ · {flavors.length - 1} รสชาติ</p>
      </div>
      <div className="page-actions">
        <button className="btn" onClick={handleExportBarcodes}><Icon name="download" size={14}/> พิมพ์บาร์โค้ด</button>
        <button className="btn btn-primary" onClick={handleAdd}><Icon name="plus" size={14}/> เพิ่มสินค้า</button>
      </div>
    </div>

    {message && (
      <div style={{ padding: "10px", textAlign: "center", marginBottom: "15px", color: "var(--brand)" }}>
        {message}
      </div>
    )}

    <div className="row" style={{gap:6, marginBottom:14, flexWrap:"wrap"}}>
      {flavors.map((f, fi) => (
        <button key={f == null ? `flavor-${fi}` : String(f)}
          className={`chip ${filter === f ? "active" : ""}`}
          onClick={() => setFilter(f)}>
          {f === "ทั้งหมด" ? "ทั้งหมด" : f}
          <span className="small tnum" style={{marginLeft:4, opacity:0.6}}>
            {f === "ทั้งหมด" ? menu.length : menu.filter(p => p.flavor === f).length}
          </span>
        </button>
      ))}
    </div>

    <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14}}>
      {shown.map((p, idx) => {
        const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100).toFixed(0) : 0;
        const barcodeSvg = generateBarcode128(p.barcode || p.code);
        return (
          <div key={p.code} className="card" style={{padding:14, display:"flex", flexDirection:"column", gap:10}}>
            <div className="row" style={{gap:10}}>
              <div className="swatch" style={{
                width:44, height:44, borderRadius:10,
                fontSize:22, lineHeight:1,
                background:"var(--gold-soft)", border:"1px solid #E7D6A9",
                backgroundImage: p.image ? `url(${p.image})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                overflow:"hidden"
              }}>
                {!p.image && p.emoji}
              </div>
              <div className="col grow" style={{minWidth:0}}>
                <div className="row" style={{gap:6}}>
                  <span className="code">{p.code}</span>
                  <span className="badge b-neutral" style={{fontSize:10, padding:"0 6px"}}>{p.flavor} · {p.size}ก.</span>
                </div>
                <div style={{fontWeight:600, fontSize:13, lineHeight:1.3, marginTop:2}}>{p.name}</div>
              </div>
            </div>

            {/* Barcode Display */}
            {barcodeSvg && (
              <div style={{background:"#f9f9f9", padding:"8px", borderRadius:"4px", textAlign:"center"}}>
                <div dangerouslySetInnerHTML={{__html: barcodeSvg}} />
                <div style={{fontSize:"10px", fontFamily:"monospace", marginTop:"4px"}}>{p.barcode || p.code}</div>
              </div>
            )}

            <div className="row" style={{justifyContent:"space-between", paddingTop:6, borderTop:"1px dashed var(--border)"}}>
              <span className="small muted">ราคาขาย</span>
              <span className="tnum" style={{fontWeight:700, fontSize:16, fontFamily:"var(--font-display)"}}>{baht(p.price)}<span className="small muted"> /{p.unit}</span></span>
            </div>
            <div className="row" style={{justifyContent:"space-between"}}>
              <span className="small muted">ต้นทุน</span>
              <span className="tnum">{baht(p.cost)}</span>
            </div>
            <div className="row" style={{justifyContent:"space-between"}}>
              <span className="small muted">กำไร</span>
              <span className="tnum" style={{color:"var(--leaf)", fontWeight:600}}>{baht(p.price - p.cost)} · {margin}%</span>
            </div>
            <div className="row" style={{gap:6, marginTop:8}}>
              <button 
                onClick={() => handleEdit(menu.indexOf(p))}
                style={{flex:1, padding:"6px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"4px", cursor:"pointer", fontSize:"12px"}}>
                ✏️ แก้ไข
              </button>
              <button 
                onClick={() => handleDuplicate(menu.indexOf(p))}
                style={{flex:1, padding:"6px", background:"var(--gold-soft)", border:"1px solid #E7D6A9", borderRadius:"4px", cursor:"pointer", fontSize:"12px"}}>
                ⧉ สำเนา
              </button>
              <button 
                onClick={() => handleDelete(menu.indexOf(p))}
                style={{flex:1, padding:"6px", background:"#FFE8E5", border:"1px solid #E9B6B1", borderRadius:"4px", cursor:"pointer", color:"var(--brand)", fontSize:"12px"}}>
                🗑️ ลบ
              </button>
            </div>
          </div>
        );
      })}
    </div>

    {/* Edit Modal */}
    {editOpen && (
      <div style={{position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999}} onClick={() => setEditOpen(false)}>
        <div style={{background:"white", padding:"20px", borderRadius:"8px", minWidth:"500px", maxHeight:"80vh", overflowY:"auto"}} onClick={e => e.stopPropagation()}>
          <h3 style={{margin:"0 0 15px"}}>
            {editIdx !== null ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
          </h3>
          
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:15, marginBottom:15}}>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>รหัส</label>
              <input type="text" value={editForm.code || ""} onChange={(e) => setEditForm({...editForm, code: e.target.value})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} />
            </div>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>ภาพสินค้า</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  // ย่อรูปอัตโนมัติด้วย canvas ก่อนบันทึก (กว้างสูงสุด 400px, JPEG คุณภาพ 0.7)
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                      const MAX = 400;
                      let w = img.width, h = img.height;
                      if (w > MAX || h > MAX) {
                        if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
                        else { w = Math.round(w * MAX / h); h = MAX; }
                      }
                      const canvas = document.createElement('canvas');
                      canvas.width = w; canvas.height = h;
                      const ctx = canvas.getContext('2d');
                      ctx.fillStyle = '#fff';
                      ctx.fillRect(0, 0, w, h);
                      ctx.drawImage(img, 0, 0, w, h);
                      const resized = canvas.toDataURL('image/jpeg', 0.7);
                      setEditForm(prev => ({...prev, image: resized}));
                    };
                    img.onerror = () => setEditForm(prev => ({...prev, image: event.target.result}));
                    img.src = event.target.result;
                  };
                  reader.readAsDataURL(file);
                }}
                style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} 
              />
              {editForm.image && (
                <img src={editForm.image} alt="preview" style={{width:"100%", height:"80px", marginTop:"8px", borderRadius:"4px", objectFit:"cover"}} />
              )}
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>บาร์โค้ด</label>
              <div style={{display:"flex", gap:"8px"}}>
                <input type="text" value={editForm.barcode || ""} onChange={(e) => setEditForm({...editForm, barcode: e.target.value})} style={{flex:1, padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} placeholder="เช่น 8850000000001" />
                <button 
                  onClick={() => {
                    const newBarcode = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');
                    setEditForm({...editForm, barcode: newBarcode});
                  }}
                  style={{padding:"8px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"4px", cursor:"pointer", fontSize:"12px", fontWeight:600}}>
                  🎲 สร้าง
                </button>
              </div>
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>ชื่อสินค้า</label>
              <input type="text" value={editForm.name || ""} onChange={(e) => setEditForm({...editForm, name: e.target.value})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} />
            </div>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>รส</label>
              <input type="text" value={editForm.flavor || ""} onChange={(e) => setEditForm({...editForm, flavor: e.target.value})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} />
            </div>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>ขนาด (กรัม)</label>
              <input type="number" value={editForm.size || 0} onChange={(e) => setEditForm({...editForm, size: parseFloat(e.target.value)})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} />
            </div>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>Emoji (ถ้าไม่มีรูป)</label>
              <input type="text" value={editForm.emoji || ""} onChange={(e) => setEditForm({...editForm, emoji: e.target.value})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} maxLength="2" />
            </div>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>หน่วย</label>
              <input type="text" value={editForm.unit || ""} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} />
            </div>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>ราคาขาย</label>
              <input type="number" step="0.01" value={editForm.price || 0} onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} />
            </div>
            <div>
              <label style={{display:"block", fontSize:"12px", color:"var(--muted)", fontWeight:600, marginBottom:"6px", textTransform:"uppercase"}}>ต้นทุน</label>
              <input type="number" step="0.01" value={editForm.cost || 0} onChange={(e) => setEditForm({...editForm, cost: parseFloat(e.target.value)})} style={{width:"100%", padding:"8px", border:"1px solid var(--border)", borderRadius:"4px", fontSize:"14px"}} />
            </div>
          </div>

          <div style={{display:"flex", gap:10, justifyContent:"flex-end"}}>
            <button onClick={() => setEditOpen(false)} className="btn btn-secondary">ปิด</button>
            <button onClick={handleSave} className="btn btn-primary">💾 บันทึก</button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

Object.assign(window, { ScreenRaw, ScreenRecipe, ScreenProduction, ScreenProduct });
