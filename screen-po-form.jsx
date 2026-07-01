// Main Menu — hub screen modeled after the Google Sheet's main menu
const ScreenMenu = ({ setCurrent }) => {
  // ⏰ ติดตามวันที่สำรองข้อมูลครั้งล่าสุด (กันข้อมูลหาย)
  const [lastBackup, setLastBackup] = React.useState(() => {
    const v = localStorage.getItem("erp_last_backup");
    return v ? parseInt(v, 10) : 0;
  });

  // ฟังชั่น Export Backup
  const exportBackup = (format = "json") => {
    const timestamp = new Date().toLocaleString("th-TH").replace(/[\/:]/g, "-");
    // ดึงข้อมูลล่าสุดจาก localStorage (ที่ผู้ใช้แก้ไข) ก่อน → fallback ไปข้อมูลพื้นฐาน
    const pick = (lsKey, globalVar) => {
      try {
        const s = localStorage.getItem(lsKey);
        if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; }
      } catch (e) {}
      return Array.isArray(globalVar) ? globalVar : [];
    };
    const data = {
      RAW:            pick("erp_raw", typeof RAW !== "undefined" ? RAW : []),
      RECIPES:        pick("erp_recipes", typeof RECIPES !== "undefined" ? RECIPES : []),
      PRODUCTS:       pick("erp_menu", typeof MENU !== "undefined" ? MENU : []),
      CUSTOMERS:      (typeof loadCustomers === "function" ? loadCustomers() : pick("CUSTOMERS", typeof SAMPLE_CUSTOMERS !== "undefined" ? SAMPLE_CUSTOMERS : [])),
      SALES:          pick("erp_sales", typeof SALES !== "undefined" ? SALES : []),
      PURCHASES:      pick("erp_purchases", typeof PURCHASES !== "undefined" ? PURCHASES : []),
      EXPENSES:       pick("erp_expenses", typeof EXPENSES !== "undefined" ? EXPENSES : []),
      RAW_STOCK:      pick("erp_raw_stock", typeof RAW_STOCK !== "undefined" ? RAW_STOCK : []),
      FINISHED_STOCK: pick("erp_finished_stock", typeof FINISHED_STOCK !== "undefined" ? FINISHED_STOCK : []),
      PRODUCTIONS:    pick("erp_productions", typeof PRODUCTIONS !== "undefined" ? PRODUCTIONS : []),
    };

    if (format === "json") {
      const backup = { exportDate: new Date().toISOString(), ...data };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (format === "csv") {
      // CSV export — สร้าง CSV สำหรับแต่ละ table (มี BOM เพื่อให้ Excel อ่านภาษาไทยได้)
      let csv = "\uFEFF";
      const esc = (val) => {
        if (val === null || val === undefined) return "";
        const s = String(val);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      Object.entries(data).forEach(([name, rows]) => {
        if (!rows || rows.length === 0) return;
        csv += `\n=== ${name} ===\n`;
        const headers = Object.keys(rows[0]);
        csv += headers.map(esc).join(",") + "\n";
        rows.forEach((row) => {
          csv += headers.map(h => esc(row[h])).join(",") + "\n";
        });
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  // 💾 สำรองข้อมูลทั้งหมด (เก็บทุก key ใน localStorage แบบครบถ้วน — ปลอดภัยที่สุด)
  const fullBackup = () => {
    const store = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      store[k] = localStorage.getItem(k);
    }
    const payload = {
      __backupType: "yaipu-erp-full",
      __version: 1,
      exportDate: new Date().toISOString(),
      keyCount: Object.keys(store).length,
      store,
    };
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}`;
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yaipu-backup-เต็ม-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    // บันทึกเวลาสำรองล่าสุด → ซ่อนแถบเตือน
    try { localStorage.setItem("erp_last_backup", String(Date.now())); setLastBackup(Date.now()); } catch (e) {}
  };

  const restoreInputRef = React.useRef(null);

  // ♻️ กู้คืนข้อมูลจากไฟล์สำรอง
  const handleRestoreFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const store = parsed && parsed.store;
        if (!store || parsed.__backupType !== "yaipu-erp-full") {
          alert("❌ ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลเต็มของระบบ\n(กรุณาใช้ไฟล์ที่ได้จากปุ่ม \"สำรองข้อมูล\")");
          return;
        }
        const n = Object.keys(store).length;
        const when = parsed.exportDate ? new Date(parsed.exportDate).toLocaleString("th-TH") : "ไม่ทราบ";
        if (!confirm(`⚠️ กู้คืนข้อมูล ${n} รายการ\nจากไฟล์สำรองวันที่: ${when}\n\nข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ — ดำเนินการต่อหรือไม่?`)) return;
        localStorage.clear();
        Object.keys(store).forEach((k) => localStorage.setItem(k, store[k]));
        alert("✅ กู้คืนข้อมูลสำเร็จ — ระบบจะรีโหลดหน้าใหม่");
        location.reload();
      } catch (err) {
        alert("❌ อ่านไฟล์ไม่สำเร็จ: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  // อ่านข้อมูล "สด" จาก localStorage (ที่ผู้ใช้บันทึกจริง) → fallback ไปข้อมูลตั้งต้น
  const liveArr = (lsKey, seed) => {
    try {
      const s = localStorage.getItem(lsKey);
      if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; }
    } catch (e) {}
    return Array.isArray(seed) ? seed : [];
  };

  // รวมรายการขายจากทุกแหล่ง: ใบสั่งขาย (sales_order_*) + รายการขายเดิม (sales/erp_sales)
  const gatherSales = () => {
    const out = [];
    let legacy = [];
    try { legacy = JSON.parse(localStorage.getItem("sales") || localStorage.getItem("erp_sales") || "[]") || []; } catch (e) {}
    legacy.forEach(s => out.push({ date: s.date, total: +s.total || 0 }));
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sales_order_")) {
        try { const o = JSON.parse(localStorage.getItem(key)); out.push({ date: o.orderDate, total: +o.totalAmount || 0 }); } catch (e) {}
      }
    }
    // ยังไม่มีข้อมูลจริง → ใช้ข้อมูลตัวอย่างเพื่อไม่ให้การ์ดว่าง
    if (out.length === 0 && typeof SALES !== "undefined") SALES.forEach(s => out.push({ date: s.date, total: +s.total || 0 }));
    return out;
  };

  const salesLive    = gatherSales();
  const expensesLive  = liveArr("erp_expenses", typeof EXPENSES !== "undefined" ? EXPENSES : []);
  const purchasesLive = liveArr("erp_purchases", typeof PURCHASES !== "undefined" ? PURCHASES : []);
  const finishedLive  = liveArr("erp_finished_stock", typeof FINISHED_STOCK !== "undefined" ? FINISHED_STOCK : []);
  const rawStockLive  = liveArr("erp_raw_stock", typeof RAW_STOCK !== "undefined" ? RAW_STOCK : []);

  // "วันนี้" — เทียบทั้งรูปแบบ ISO (2026-05-18) และรูปแบบเดิม (18 พ.ค.)
  const todayISO = new Date().toISOString().slice(0, 10);
  const isToday = (d) => d === todayISO || d === "18 พ.ค." || d === TODAY;
  const today = salesLive.filter(s => isToday(s.date));
  const todayRev = today.reduce((s, x) => s + (x.total || 0), 0);
  const monthRev = salesLive.reduce((s, x) => s + (x.total || 0), 0);
  const monthExp = expensesLive.reduce((s, x) => s + (x.amount || 0), 0);
  const monthPur = purchasesLive.reduce((s, x) => s + (x.total || 0), 0);
  const lowFinished = finishedLive.filter(s => s.inHand < s.reorder).length;
  const lowRaw = rawStockLive.filter(s => s.inHand < s.reorder).length;

  const sections = [
    {
      title: "Transaction Data",
      sub: "บันทึกธุรกรรมประจำวัน",
      tone: "var(--brand)",
      items: [
        { id: "po",           emoji: "📋", label: "ใบสั่งซื้อ (PO)" },
        { id: "po-report",    emoji: "🗂️", label: "รายงานใบสั่งซื้อ" },
        { id: "goods-receipt", emoji: "📥", label: "ใบรับเข้าวัตถุดิบ" },
        { id: "goods-receipt-list", emoji: "🗃️", label: "รายการใบรับเข้า" },
        { id: "expense",      emoji: "💰", label: "บัญชี" },
        { id: "receivables",  emoji: "💳", label: "ลูกหนี้ / เจ้าหนี้" },
        { id: "sale",         emoji: "📋", label: "ฝ่ายขาย" },
        { id: "quotation-new", emoji: "📄", label: "ใบเสนอราคา" },
        { id: "quotation",    emoji: "🧾", label: "รายการใบเสนอราคา" },
        { id: "sales-new",    emoji: "📝", label: "ใบสั่งขาย" },
        { id: "cash-bill",    emoji: "💵", label: "บิลเงินสด" },
        { id: "tax-invoice",  emoji: "📄", label: "ใบกำกับภาษี" },
        { id: "delivery-note", emoji: "📦", label: "ใบส่งของ" },
        { id: "loan-form",    emoji: "📋", label: "ใบยืม" },
        { id: "adj-finished", emoji: "⊕", label: "ปรับปรุงสินค้าพร้อมขาย" },
        { id: "adj-raw",      emoji: "⊕", label: "ปรับปรุงวัตถุดิบ" },
        { id: "withdraw-form", emoji: "📦", label: "เบิกวัตถุดิบ (แบบฟอร์ม)" },
        { id: "lots",         emoji: "📅", label: "ล็อต & วันหมดอายุ" },
      ],
    },
    {
      title: "Master Data",
      sub: "ข้อมูลหลักของกิจการ",
      tone: "var(--gold)",
      items: [
        { id: "raw-materials-hub", emoji: "🥩", label: "รายการวัตถุดิบ" },
        { id: "recipe",     emoji: "🧮", label: "สูตรการผลิต (MOB)" },
        { id: "production", emoji: "🏭", label: "การผลิต" },
        { id: "product",    emoji: "📖", label: "รายการสินค้า" },
      ],
    },
    {
      title: "Report",
      sub: "ดูภาพรวมและสรุปยอด",
      tone: "var(--brand)",
      items: [
        { id: "stock-card",     emoji: "🗂️", label: "สต๊อคการ์ด" },
        { id: "report-month",   emoji: "📈", label: "รายงานขายรายเดือน" },
        { id: "report-year",    emoji: "📈", label: "รายงานขายรายปี" },
        { id: "costing",        emoji: "💹", label: "ต้นทุน & กำไร" },
        { id: "reports-sales",  emoji: "📊", label: "รายงานฝ่ายขาย" },
      ],
    },
  ];

  // ⏰ สถานะการสำรอง: เกิน 20 ชม. หรือยังไม่เคย → เตือน
  const hoursSinceBackup = lastBackup ? (Date.now() - lastBackup) / 3600000 : Infinity;
  const backupOverdue = hoursSinceBackup > 20;
  const lastBackupText = lastBackup
    ? new Date(lastBackup).toLocaleString("th-TH", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
    : null;

  return (
    <div className="page">
      {backupOverdue && (
        <div className="backup-nag">
          <span className="backup-nag-icon">⚠️</span>
          <div className="backup-nag-text">
            <strong>อย่าลืมสำรองข้อมูล!</strong>{" "}
            {lastBackupText
              ? `สำรองครั้งล่าสุด: ${lastBackupText}`
              : "ยังไม่เคยสำรองข้อมูลจากเครื่องนี้"}
            {" — กดปุ่มด้านล่างเพื่อกันข้อมูลหาย"}
          </div>
          <button className="btn" onClick={fullBackup} style={{background:"#fff", color:"#8A2A12", border:"1px solid #E7B9A6", whiteSpace:"nowrap"}}>
            <Icon name="download" size={14}/> สำรองเดี๋ยวนี้
          </button>
        </div>
      )}
      <div className="page-head" style={{alignItems:"center"}}>
        <div className="row" style={{gap:18, alignItems:"center"}}>
          <div style={{
            width:88, height:88, borderRadius:16,
            background:"#FFF6E8",
            border:"2px solid var(--gold-soft)",
            overflow:"hidden",
            display:"grid", placeItems:"center",
            boxShadow:"0 6px 18px -8px rgba(182,36,31,.3)",
            flex:"0 0 88px",
          }}>
            <img src="logo.jpg" alt="ชูรสยายปู" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
          </div>
          <div>
            <h1 className="page-title">จัดการการผลิต ชูรสยายปู</h1>
            <p className="page-sub">13 มิถุนายน 2569 · ยินดีต้อนรับพนักงานที่น่ารักทุกท่าน เลือกเมนูจากด้านล่างแล้วทำงานกันได้เลยจ้า</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={fullBackup} title="ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมด (แนะนำให้ทำสม่ำเสมอ)" style={{background:"#E2EDDC", color:"#2D5128", border:"1px solid #B9D2AC"}}>
            <Icon name="download" size={14}/> สำรองข้อมูล
          </button>
          <button className="btn" onClick={() => restoreInputRef.current && restoreInputRef.current.click()} title="กู้คืนข้อมูลจากไฟล์สำรอง">
            <Icon name="upload" size={14}/> กู้คืน
          </button>
          <input ref={restoreInputRef} type="file" accept="application/json,.json" onChange={handleRestoreFile} style={{display:"none"}} />
          <button className="btn" onClick={() => exportBackup("csv")} title="ดาวน์โหลด CSV">
            <Icon name="download" size={14}/> CSV
          </button>
          <button className="btn" onClick={() => exportBackup("json")} title="ดาวน์โหลด JSON">
            <Icon name="download" size={14}/> JSON
          </button>
          <button className="btn btn-primary" onClick={() => setCurrent("sale")}>
            <Icon name="plus" size={14}/> ใบสั่งขาย
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="kpi-row" style={{marginBottom:22}}>
        <KPI label="ขายวันนี้" value={baht0(todayRev)}
             hint={`${today.length} รายการ`}
             spark={[2,3,3,4,5,5,4,5,6]} sparkColor="var(--brand)"/>
        <KPI label={`ขายเดือน ${MONTH_LABEL}`} value={baht0(monthRev)}
             hint={`ซื้อ ${baht0(monthPur)} · ค่าใช้จ่าย ${baht0(monthExp)}`}
             spark={[12,15,18,22,28,32,38,42,46,50]} sparkColor="var(--gold)"/>
        <KPI label="สินค้าใกล้หมด" value={String(lowFinished)} unit="รายการ"
             hint="ต้องวางแผนผลิตเพิ่ม"/>
        <KPI label="วัตถุดิบใกล้หมด" value={String(lowRaw)} unit="รายการ"
             hint="ต้องสั่งซื้อเพิ่ม"/>
      </div>

      {/* 3-column menu grid */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16}}>
        {sections.map((sec) => (
          <div key={sec.title} className="card" style={{display:"flex", flexDirection:"column"}}>
            <div className="card-head" style={{borderBottom:`2px solid ${sec.tone}`, paddingBottom:12}}>
              <div>
                <div className="card-title" style={{fontFamily:"var(--font-display)", fontSize:16, color:sec.tone}}>
                  {sec.title}
                </div>
                <div className="card-sub">{sec.sub}</div>
              </div>
              <div className="badge" style={{background:"var(--surface-sunken)"}}>
                <span className="dot" style={{background:sec.tone}}></span>
                {sec.items.length} เมนู
              </div>
            </div>
            <div className="card-body" style={{padding:10, flex:1, display:"flex", flexDirection:"column", gap:6}}>
              {sec.items.map(it => (
                <button
                  key={it.id}
                  onClick={() => setCurrent(it.id)}
                  className="menu-tile"
                >
                  <span className="menu-tile-emoji">{it.emoji}</span>
                  <span className="menu-tile-label">{it.label}</span>
                  <span className="menu-tile-arrow"><Icon name="arrowRight" size={14}/></span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .backup-nag {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 18px;
          background: linear-gradient(0deg, #FDECE4, #FDECE4);
          border: 1px solid #F0C2AE;
          border-left: 4px solid var(--brand);
          border-radius: 10px;
          color: #7A2A14;
          font-size: 14px;
        }
        .backup-nag-icon { font-size: 20px; line-height: 1; }
        .backup-nag-text { flex: 1; line-height: 1.45; }
        .backup-nag-text strong { color: var(--brand); }
        .menu-tile {
          display: grid;
          grid-template-columns: 36px 1fr 18px;
          gap: 10px;
          align-items: center;
          padding: 12px 14px;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 10px;
          text-align: left;
          font-family: inherit;
          color: var(--ink);
          font-size: 14px;
          transition: all 120ms;
        }
        .menu-tile:hover {
          background: var(--surface-2);
          border-color: var(--border-strong);
          transform: translateX(2px);
        }
        .menu-tile-emoji {
          font-size: 22px;
          line-height: 1;
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          background: var(--surface-2);
          border-radius: 8px;
        }
        .menu-tile-label {
          font-weight: 500;
        }
        .menu-tile-arrow {
          color: var(--muted-2);
          opacity: 0;
          transition: opacity 120ms;
        }
        .menu-tile:hover .menu-tile-arrow { opacity: 1; color: var(--brand); }
      `}</style>
    </div>
  );
};

Object.assign(window, { ScreenMenu });
