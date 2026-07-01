// App shell — routing + tweaks
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "density": "comfortable",
  "showSpark": true
}/*EDITMODE-END*/;

const THEME_ORDER = ["warm","midnight","fresh","classic"];
const THEMES = {
  warm: {
    label: "อุ่น (ดั้งเดิม)",
    palette: ["#B6241F","#F6F1E8","#C99432"],
    vars: {}
  },
  midnight: {
    label: "กลางคืน",
    palette: ["#E26A5C","#161310","#D4A24C"],
    vars: {
      "--bg":"#161310","--surface":"#211C18","--surface-2":"#1B1714","--surface-sunken":"#13100D",
      "--border":"#332A23","--border-strong":"#4A3D33",
      "--ink":"#F4E8CF","--ink-2":"#D9C9AC","--muted":"#9C8B72","--muted-2":"#6E5F4A",
      "--brand":"#E26A5C","--brand-ink":"#C24438","--brand-soft":"#3D1F1B",
      "--gold":"#D4A24C","--gold-soft":"#3D2F1A","--leaf":"#7BA577","--leaf-soft":"#26331F",
      "--warn":"#E58E3D","--warn-soft":"#3A2818",
    }
  },
  fresh: {
    label: "สดใส",
    palette: ["#1F6A3D","#F1F4EE","#C28A1A"],
    vars: {
      "--bg":"#F1F4EE","--surface":"#FFFFFF","--surface-2":"#F7F9F4","--surface-sunken":"#E8ECE2",
      "--border":"#DCE2D2","--border-strong":"#B8C2A4",
      "--brand":"#1F6A3D","--brand-ink":"#0F4A28","--brand-soft":"#DCEDE2",
      "--gold":"#C28A1A","--gold-soft":"#F4E5C2","--leaf":"#4F7A4A","--leaf-soft":"#E2EDDC",
    }
  },
  classic: {
    label: "คลาสสิก",
    palette: ["#7A2E2A","#F4F0E8","#A8821E"],
    vars: {
      "--bg":"#F4F0E8","--brand":"#7A2E2A","--brand-ink":"#591914","--brand-soft":"#F0DDD8",
      "--gold":"#A8821E","--gold-soft":"#EFE0BB","--leaf":"#3F624A","--leaf-soft":"#DBE6DD",
    }
  },
};

function applyTheme(name) {
  const t = THEMES[name] || THEMES.warm;
  for (const themeKey of Object.keys(THEMES)) {
    for (const k of Object.keys(THEMES[themeKey].vars)) {
      document.documentElement.style.removeProperty(k);
    }
  }
  for (const [k, v] of Object.entries(t.vars)) {
    document.documentElement.style.setProperty(k, v);
  }
}

const CRUMBS = {
  menu:          ["หน้าหลัก", "🗄️ เมนู"],
  warehouse:     ["Warehouse", "🏪 คลังสินค้า"],
  customer:      ["Sales", "👥 จัดการลูกค้า"],
  "customer-history": ["Sales", "📦 ประวัติการสั่งซื้อลูกค้า"],
  expense:       ["Transaction Data", "💰 บัญชี"],
  pr:             ["Transaction Data", "📝 ใบขอซื้อ (PR)"],
  po:            ["Transaction Data", "📋 ใบสั่งซื้อ (PO)"],
  "po-report":   ["Transaction Data", "🗂️ รายงานใบสั่งซื้อ"],
  purchase:           ["Transaction Data", "📥 รับเข้าวัตถุดิบ"],
  "purchase-history":  ["Transaction Data", "📋 ประวัติการซื้อ"],
  "goods-receipt":     ["Transaction Data", "📥 ใบรับเข้าวัตถุดิบ"],
  "goods-receipt-list":["Transaction Data", "🗃️ รายการใบรับเข้า"],
  sale:          ["Sales", "📝 รายการขาย"],
  "quotation-new": ["Sales", "📄 ใบเสนอราคา"],
  quotation:     ["Sales", "🧾 รายการใบเสนอราคา"],
  "sales-new":   ["Sales", "📝 ใบสั่งขาย"],
  "adj-finished":["Warehouse", "⊕ ปรับปรุงสินค้าพร้อมขาย"],
  "adj-raw":     ["Warehouse", "⊕ ปรับปรุงวัตถุดิบ"],
  withdraw:      ["Transaction", "📤 เบิกของ"],
  "withdraw-form": ["Warehouse", "📦 บันทึกเบิก - คืนวัตถุดิบและวัสดุบรรจุ"],
  "withdraw-fg": ["Warehouse", "📤 บันทึกเบิก FG"],
  "withdrawal-history": ["Warehouse", "📋 ประวัติเบิก"],
  "withdrawal-fg-history": ["Warehouse", "📋 ประวัติเบิก FG"],
  "goods-receipt": ["Warehouse", "📥 ใบรับเข้า"],
  "goods-receipt-new": ["Warehouse", "📥 ใบรับเข้าใหม่"],
  raw:           ["Master Data", "🥩 วัตถุดิบ"],
  recipe:        ["Master Data", "🧮 สูตรการผลิต (MOB)"],
  production:    ["Master Data", "🏭 การผลิต"],
  product:       ["Master Data", "📖 รายการสินค้า"],
  "stock-card":    ["Report", "🗂️ สต๊อคการ์ด"],
  "stock-card-fg": ["Report", "📦 สต๊อคการ์ดผลิตภัณฑ์ FG"],
  "stock-finished":["Report", "📦 สต๊อคสินค้า FG"],
  "stock-raw":     ["Report", "🥩 จัดการสต๊อควัตถุดิบ"],
  "report-month":     ["Report", "📈 รายงานขายรายเดือน"],
  "report-production": ["Report", "📋 รายงานบันทึกการผลิต"],
  "report-year":       ["Report", "📈 รายงานขายรายปี"],
  "report-raw-usage":  ["Report", "📊 การใช้วัตถุดิบ"],
  "costing":       ["Report", "💹 ต้นทุน & กำไร"],
  "receivables":   ["Transaction Data", "💳 ลูกหนี้ / เจ้าหนี้"],
  "raw-materials-hub":  ["Master Data", "🥩 วัตถุดิบ"],
  "supplier":             ["Master Data", "🏥 ซัพพลายเออร์"],
  "raw-material-barcode": ["Master Data", "📷 บาร์โค้ดวัตถุดิบ"],
  "lots":          ["Warehouse", "📅 ล็อต & วันหมดอายุ"],
  "reports-sales": ["Report", "📊 ฝ่ายขาย"],
  "cash-bill":     ["Transaction Data", "💵 บิลเงินสด"],
  "tax-invoice":   ["Transaction Data", "📄 ใบกำกับภาษี"],
  "delivery-note": ["Warehouse", "📦 ใบส่งของ"],
  "loan-form":     ["Warehouse", "📋 ใบยืม"],
};

const App = () => {
  const [current, setCurrent] = React.useState("menu");
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // เพิ่มขึ้นทุกครั้งที่มีการบันทึก/แก้/ลบ → บังคับให้หน้าที่เปิดอยู่โหลดข้อมูลใหม่เอง
  const dataVersion = useStoreVersion();

  // เริ่มต้นลูกค้าตัวอย่างเมื่อโหลด
  React.useEffect(() => {
    if (window.CUSTOMERS && !localStorage.getItem("CUSTOMERS")) {
      localStorage.setItem("CUSTOMERS", JSON.stringify(window.CUSTOMERS));
    }
  }, []);

  React.useEffect(() => { applyTheme(t.theme); }, [t.theme]);
  React.useEffect(() => { document.body.dataset.density = t.density; }, [t.density]);

  // Scroll to top when changing screen
  const mainRef = React.useRef(null);
  React.useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "instant" });
  }, [current]);

  const renderScreen = () => {
    switch (current) {
      case "menu":             return <ScreenMenu setCurrent={setCurrent}/>;
      case "warehouse":        return <ScreenWarehouse/>;
      case "expense":          return <ScreenExpense/>;
      case "pr":               return <ScreenPRForm setCurrent={setCurrent}/>;
      case "po":               return <ScreenPOForm/>;
      case "po-report":        return <ScreenPOReport setCurrent={setCurrent}/>;
      case "purchase":         return <ScreenPurchaseV2/>;
      case "purchase-new":     return <ScreenPurchaseEntryNew/>;
      case "purchase-history": return <ScreenPurchaseHistory/>;
      case "customer":         return <ScreenCustomer/>;
      case "customer-history": return <ScreenCustomerHistory setCurrent={setCurrent}/>;
      case "sale":             return <ScreenSalesList setCurrent={setCurrent}/>;
      case "adj-finished":     return <ScreenAdjFinished/>;
      case "adj-raw":          return <ScreenAdjRaw/>;
      case "withdraw-form":    return <ScreenWithdrawForm/>;
      case "withdraw-fg":      return <ScreenWithdrawFG/>;
      case "withdrawal-history": return <ScreenWithdrawalHistory/>;
      case "withdrawal-fg-history": return <ScreenWithdrawalFGHistory/>;
      case "raw-materials-hub":  return <ScreenRawMaterialsHub setCurrent={setCurrent}/>;
      case "raw-stock":        return <ScreenRawStock/>;
      case "supplier":            return <ScreenSupplier/>;
      case "raw-material-barcode": return <ScreenRawMaterialBarcode/>;
      case "raw":              return <ScreenRaw/>;
      case "recipe":           return <ScreenRecipe/>;
      case "production":       return <ScreenProduction/>;
      case "product":          return <ScreenProduct/>;
      case "stock-card":     return <ScreenStockCardV2/>;
      case "stock-card-fg":  return <ScreenStockCardFGCard/>;
      case "raw-materials-list": return <ScreenRawMaterialsList/>;

      case "stock-finished": return <ScreenStockCardFinished/>;
      case "stock-raw":      return <ScreenRawStock/>;
      case "inventory-check": return <ScreenInventoryCheck/>;
      case "expense-new":    return <ScreenExpenseNew/>;
      case "sales-new":       return <ScreenSalesOrder setCurrent={setCurrent}/>;
      case "quotation-new":   return <ScreenQuotation/>;
      case "quotation":       return <ScreenQuotationList setCurrent={setCurrent}/>;
      case "goods-receipt":      return <ScreenGoodsReceipt/>;
      case "goods-receipt-list":  return <ScreenGoodsReceiptList setCurrent={setCurrent}/>;
      case "import-sales":  return <ScreenImportSales/>;
      case "report-raw-usage":  return <ScreenReportRawUsage/>;
      case "report-month":      return <ScreenReportMonth/>;
      case "report-production": return <ScreenReportProduction/>;
      case "report-year":    return <ScreenReportYear/>;
      case "costing":        return <ScreenCosting/>;
      case "receivables":    return <ScreenReceivables/>;
      case "customers-creditors": return <ScreenCustomersCreditors/>;
      case "lots":           return <ScreenLots/>;
      case "reports-sales":  return <ScreenReportsSales/>;
      case "cash-bill":      return <ScreenCashBill/>;
      case "tax-invoice":    return <ScreenTaxInvoice/>;
      case "delivery-note":  return <ScreenDeliveryNote/>;
      case "loan-form":      return <ScreenLoanForm/>;
      default:               return <ScreenMenu setCurrent={setCurrent}/>;
    }
  };

  const paletteOptions = THEME_ORDER.map(n => THEMES[n].palette);
  const currentPalette = THEMES[t.theme]?.palette || paletteOptions[0];

  const crumb = CRUMBS[current] || ["", ""];

  return (
    <div className="app" data-screen-label={current}>
      <Sidebar current={current} setCurrent={setCurrent}/>
      <div className="main" ref={mainRef}>
        <div className="topbar">
          <div className="breadcrumb">
            <button onClick={() => setCurrent("menu")} className="btn btn-sm btn-ghost" style={{padding:"3px 8px"}}>
              <Icon name="dashboard" size={12}/> หน้าหลัก
            </button>
            <span className="sep">/</span>
            <span>{crumb[0]}</span>
            <span className="sep">/</span>
            <span className="here">{crumb[1]}</span>
          </div>
          <div className="search">
            <Icon name="search" size={14}/>
            <input placeholder="ค้นหารายการ สินค้า หรือวัตถุดิบ..." />
            <span className="kbd">⌘K</span>
          </div>
          <button className="icon-btn" title="แจ้งเตือน">
            <Icon name="bell" size={16}/>
            <span className="dot"></span>
          </button>
        </div>
        <div className="screen-host" style={{display:"contents"}} key={current}>
          {renderScreen()}
        </div>
      </div>

      <TweaksPanel title="Tweaks · ยายปู ERP">
        <TweakSection label="ธีมสี">
          <TweakColor
            label="ชุดสี"
            value={currentPalette}
            options={paletteOptions}
            onChange={(palette) => {
              const idx = paletteOptions.findIndex(p => JSON.stringify(p) === JSON.stringify(palette));
              if (idx >= 0) setTweak("theme", THEME_ORDER[idx]);
            }}
          />
          <div style={{fontSize:11, color:"var(--muted)", marginTop:-2}}>
            {THEMES[t.theme]?.label}
          </div>
        </TweakSection>

        <TweakSection label="ความหนาแน่นข้อมูล">
          <TweakRadio
            label="แถวตาราง"
            value={t.density}
            options={[
              { value: "comfortable", label: "สบาย" },
              { value: "compact",     label: "หนาแน่น" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
        </TweakSection>

        <TweakSection label="การแสดงผล">
          <TweakToggle
            label="กราฟเล็กในการ์ด KPI"
            value={t.showSpark}
            onChange={(v) => setTweak("showSpark", v)}
          />
        </TweakSection>

        <TweakSection label="ไปยังหน้าจอ">
          <TweakSelect
            label="หน้าจอ"
            value={current}
            options={Object.entries(CRUMBS).map(([v, l]) => ({ value: v, label: l[1] || l[0] }))}
            onChange={(v) => setCurrent(v)}
          />
        </TweakSection>
      </TweaksPanel>

      <style>{`
        ${t.showSpark ? "" : ".kpi-spark { display: none !important; }"}
        body[data-density="compact"] .tbl tbody td { padding: 7px 12px; font-size: 12.5px; }
        body[data-density="compact"] .tbl thead th { padding: 7px 12px; }
        body[data-density="compact"] .card-body { padding: 12px; }
        body[data-density="compact"] .kpi { padding: 12px 14px; }
        body[data-density="compact"] .kpi .value { font-size: 22px; }
        body[data-density="compact"] .page { padding: 18px 22px 60px; }
        .main { overflow-y: auto; height: 100vh; }
      `}</style>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
