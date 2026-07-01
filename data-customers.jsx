// Shared components and icons for the ยายปู ERP
// Exposes globals: Icon, Sidebar, TopBar, KPI, Sparkline, Bar, Badge, Avatar, Donut, BarChart, AreaChart

const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.75 }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    factory: <><path d="M3 21V10l6 4V10l6 4V6l6 4v11H3z"/><path d="M9 21v-5M15 21v-5"/></>,
    box: <><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></>,
    cart: <><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 11.5a2 2 0 0 0 2 1.5h7.5a2 2 0 0 0 2-1.5L21 8H6"/></>,
    truck: <><rect x="2" y="6" width="13" height="10" rx="1"/><path d="M15 9h4l3 4v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    chart: <><path d="M3 21h18"/><path d="M6 17V9M11 17V5M16 17v-6M21 17v-3" strokeLinecap="round"/></>,
    users: <><circle cx="9" cy="9" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="16.5" cy="10" r="2.5"/><path d="M14 20c0-2.2 1.6-4.1 4-4.7"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .4-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.4h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.4 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" strokeLinecap="round"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    plus: <><path d="M12 5v14M5 12h14" strokeLinecap="round"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    download: <><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></>,
    upload: <><path d="M12 21V9m0 0-4 4m4-4 4 4M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></>,
    filter: <><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/></>,
    arrowDown: <><path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></>,
    arrowRight: <><path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></>,
    check: <><path d="m4 12 5 5L20 6" strokeLinecap="round" strokeLinejoin="round"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></>,
    flame: <><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-3 2-6 1 1 2 2 3 1z"/></>,
    leaf: <><path d="M4 20c10 0 17-7 17-17 0 0-10-1-15 4S4 20 4 20z"/><path d="M4 20 14 10" strokeLinecap="round"/></>,
    warn: <><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18.5v.1" strokeLinecap="round"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1" strokeLinecap="round"/></>,
    receipt: <><path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    package: <><path d="m3 7 9-4 9 4-9 4-9-4z"/><path d="m3 7 9 4 9-4M12 11v10M21 7v10l-9 4M3 7v10l9 4"/></>,
    sparkles: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5 8 16M16 8l2.5-2.5"/></>,
    more: <><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></>,
    pin: <><path d="M12 2 9 8l-5 1 4 4-2 8 6-4 6 4-2-8 4-4-5-1-3-6z"/></>,
    qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></>,
    money: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v4M18 10v4"/></>,
    salt: <><path d="M7 3h10l-1 5H8L7 3z"/><path d="M6 8h12l-1 13H7L6 8z"/><path d="M10 12v5M14 12v5" strokeLinecap="round"/></>,
  };
  const d = paths[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         style={{display:"block"}}>
      {d}
    </svg>
  );
};

const Sidebar = ({ current, setCurrent }) => {
  const sections = [
    { kind: "single", id: "menu", label: "เมนูหลัก", icon: "dashboard" },
    {
      kind: "group", title: "Transaction Data", items: [
        { id: "po",              emoji: "📋", label: "ใบสั่งซื้อ (PO)" },
        { id: "po-report",       emoji: "🗂️", label: "รายงานใบสั่งซื้อ" },
        { id: "goods-receipt",   emoji: "📥", label: "ใบรับเข้าวัตถุดิบ" },
        { id: "goods-receipt-list", emoji: "🗃️", label: "รายการใบรับเข้า" },
        { id: "expense",         emoji: "📝", label: "แผนกบัญชี" },
      ]
    },
    {
      kind: "group", title: "Sales", items: [
        { id: "customer",         emoji: "👥", label: "รายชื่อลูกค้า" },
        { id: "customer-history", emoji: "📦", label: "ประวัติสั่งซื้อลูกค้า" },
        { id: "quotation-new", emoji: "📄", label: "ใบเสนอราคา" },
        { id: "quotation",    emoji: "🧾", label: "รายการใบเสนอราคา" },
        { id: "sales-new",    emoji: "📝", label: "ใบสั่งขาย" },
        { id: "sale",         emoji: "📋", label: "รายการขาย" },
      ]
    },
    {
      kind: "group", title: "Master Data", items: [
        { id: "raw-materials-hub", emoji: "🥩", label: "วัตถุดิบ" },
        { id: "supplier",         emoji: "🏥", label: "ซัพพลายเออร์" },
        { id: "recipe",     emoji: "🧮", label: "สูตรการผลิต (MOB)" },
        { id: "production", emoji: "🏭", label: "การผลิต" },
        { id: "product",    emoji: "📖", label: "รายการสินค้า" },
      ]
    },
    {
      kind: "group", title: "Warehouse", items: [
        { id: "warehouse", emoji: "🏪", label: "คลังสินค้า", submenu: [
          { id: "withdraw-fg", emoji: "📤", label: "บันทึกเบิก FG" },
          { id: "withdrawal-history", emoji: "📋", label: "ประวัติเบิก" },
          { id: "withdrawal-fg-history", emoji: "📋", label: "ประวัติเบิก FG" },
        ]},
      ]
    },
    {
      kind: "group", title: "Report", items: [
        { id: "stock-card",     emoji: "🗂️", label: "สต๊อคการ์ด" },
        { id: "stock-card-fg",  emoji: "📦", label: "สต๊อคการ์ดผลิตภัณฑ์ FG" },
        { id: "stock-finished", emoji: "📦", label: "สต๊อคสินค้า FG" },
        { id: "report-month",      emoji: "📈", label: "รายงานขายรายเดือน" },
        { id: "report-year",       emoji: "📈", label: "รายงานขายรายปี" },
        { id: "report-raw-usage",  emoji: "📊", label: "การใช้วัตถุดิบ" },
      ]
    },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" style={{background:"#FFF6E8", padding:0, overflow:"hidden"}}>
          <img src="logo.jpg" alt="ยายปู" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
        </div>
        <div className="col">
          <div className="brand-name">ชูรสยายปู</div>
          <div className="brand-sub">จัดการการผลิต · v2</div>
        </div>
      </div>

      {sections.map((sec, si) => {
        if (sec.kind === "single") {
          return (
            <button
              key={sec.id}
              className={`nav-item ${current === sec.id ? "active" : ""}`}
              onClick={() => setCurrent(sec.id)}
            >
              <span className="ico"><Icon name={sec.icon} size={16}/></span>
              <span>{sec.label}</span>
            </button>
          );
        }
        return (
          <React.Fragment key={si}>
            <div className="nav-section">{sec.title}</div>
            {sec.items.map(it => (
              <React.Fragment key={it.id}>
                <button
                  className={`nav-item ${current === it.id ? "active" : ""}`}
                  onClick={() => setCurrent(it.id)}
                >
                  <span className="ico" style={{fontSize:14, lineHeight:1}}>{it.emoji}</span>
                  <span>{it.label}</span>
                </button>
                {it.submenu && it.submenu.map(sub => (
                  <button
                    key={sub.id}
                    className={`nav-item ${current === sub.id ? "active" : ""}`}
                    onClick={() => setCurrent(sub.id)}
                    style={{paddingLeft: "36px", fontSize: "12px"}}
                  >
                    <span className="ico" style={{fontSize:12, lineHeight:1}}>{sub.emoji}</span>
                    <span>{sub.label}</span>
                  </button>
                ))}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}

      <div className="sidebar-foot">
        <div className="avatar" style={{background:"#FFF6E8", padding:0, overflow:"hidden"}}>
          <img src="logo.jpg" alt="ยายปู" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
        </div>
        <div className="col grow">
          <div className="user-name">คุณยายปู</div>
          <div className="user-role">เจ้าของกิจการ</div>
        </div>
        <Icon name="more" size={14} color="#7E6A52"/>
      </div>
    </aside>
  );
};

const TopBar = ({ crumb }) => (
  <div className="topbar">
    <div className="breadcrumb">
      <span>ยายปู ERP</span>
      <span className="sep">/</span>
      <span className="here">{crumb}</span>
    </div>
    <div className="search">
      <Icon name="search" size={14}/>
      <input placeholder="ค้นหาออเดอร์ ลูกค้า สินค้า หรือล็อตการผลิต..." />
      <span className="kbd">⌘K</span>
    </div>
    <button className="icon-btn" title="กิจกรรม">
      <Icon name="bell" size={16}/>
      <span className="dot"></span>
    </button>
    <button className="icon-btn" title="ดาวน์โหลด">
      <Icon name="download" size={16}/>
    </button>
  </div>
);

/* ---------- Tiny visualization components (inline SVG, no libs) ---------- */

const Sparkline = ({ data, color = "var(--brand)", width = 96, height = 32, fill = true }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const dFill = d + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      {fill && <path d={dFill} fill={color} opacity="0.12" />}
      <path d={d} stroke={color} fill="none" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
    </svg>
  );
};

const Badge = ({ kind = "neutral", children }) => (
  <span className={`badge b-${kind}`}>
    <span className="dot"></span>
    {children}
  </span>
);

const Bar = ({ value, max = 100, kind }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const cls = kind || (pct < 25 ? "danger" : pct < 55 ? "warn" : "");
  return (
    <div className={`bar ${cls}`}>
      <div className="fill" style={{ width: `${pct}%` }}></div>
    </div>
  );
};

const KPI = ({ label, value, unit, delta, deltaDir = "up", spark, sparkColor, hint }) => (
  <div className="kpi">
    <div className="label">{label}</div>
    <div className="value">
      {value}{unit && <span className="unit"> {unit}</span>}
    </div>
    {delta && (
      <span className={`delta ${deltaDir}`}>
        <Icon name={deltaDir === "up" ? "arrowUp" : deltaDir === "down" ? "arrowDown" : "arrowRight"} size={11}/>
        {delta}
      </span>
    )}
    {hint && <div className="small muted" style={{marginTop:6}}>{hint}</div>}
    {spark && (
      <div className="kpi-spark">
        <Sparkline data={spark} color={sparkColor || "var(--brand)"} width={88} height={30}/>
      </div>
    )}
  </div>
);

// Simple area chart for dashboards
const AreaChart = ({ data, height = 180, color = "var(--brand)", gold = "var(--gold)" }) => {
  // data: array of {label, a, b}
  const w = 720, h = height, pad = 28;
  const labels = data.map(d => d.label);
  const all = data.flatMap(d => [d.a, d.b]);
  const max = Math.max(...all) * 1.15;
  const min = 0;
  const xs = i => pad + (i / (data.length - 1)) * (w - pad * 2);
  const ys = v => h - pad - ((v - min) / (max - min)) * (h - pad * 1.5);

  const pathFor = key => data.map((d, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)},${ys(d[key]).toFixed(1)}`).join(" ");
  const fillFor = key => pathFor(key) + ` L${xs(data.length-1)},${h-pad} L${xs(0)},${h-pad} Z`;

  const yTicks = 4;
  const ticks = [];
  for (let i = 0; i <= yTicks; i++) {
    const v = (max / yTicks) * i;
    ticks.push(v);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{display:"block"}}>
      {/* grid */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={pad} y1={ys(v)} x2={w-pad} y2={ys(v)} stroke="var(--border)" strokeDasharray="2 4"/>
          <text x={pad-6} y={ys(v)+3} fontSize="10" textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">{Math.round(v).toLocaleString()}</text>
        </g>
      ))}
      {/* X labels */}
      {labels.map((l, i) => (
        <text key={i} x={xs(i)} y={h - 8} fontSize="10.5" textAnchor="middle" fill="var(--muted)">{l}</text>
      ))}
      {/* area b (gold) */}
      <path d={fillFor("b")} fill={gold} opacity="0.16"/>
      <path d={pathFor("b")} stroke={gold} strokeWidth="1.75" fill="none"/>
      {/* area a (brand) */}
      <path d={fillFor("a")} fill={color} opacity="0.14"/>
      <path d={pathFor("a")} stroke={color} strokeWidth="2" fill="none"/>
      {/* dots last point */}
      <circle cx={xs(data.length-1)} cy={ys(data[data.length-1].a)} r="3.5" fill={color}/>
      <circle cx={xs(data.length-1)} cy={ys(data[data.length-1].b)} r="3" fill={gold}/>
    </svg>
  );
};

const BarChart = ({ data, height = 160, color = "var(--brand)" }) => {
  const w = 360, h = height, pad = 24;
  const max = Math.max(...data.map(d => d.v)) * 1.1;
  const bw = (w - pad * 2) / data.length * 0.62;
  const step = (w - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="var(--border)"/>
      {data.map((d, i) => {
        const x = pad + i * step + (step - bw) / 2;
        const bh = ((d.v) / max) * (h - pad * 2);
        return (
          <g key={i}>
            <rect x={x} y={h - pad - bh} width={bw} height={bh} fill={d.color || color} rx="3" opacity={d.dim ? 0.45 : 1}/>
            <text x={x + bw/2} y={h - 8} fontSize="10.5" textAnchor="middle" fill="var(--muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

const Donut = ({ items, size = 140, thickness = 18 }) => {
  // items: [{label, value, color}]
  const total = items.reduce((s, i) => s + i.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size}>
      <circle cx={c} cy={c} r={r} stroke="var(--surface-sunken)" strokeWidth={thickness} fill="none"/>
      {items.map((it, i) => {
        const frac = it.value / total;
        const dash = 2 * Math.PI * r;
        const dashArr = `${dash * frac} ${dash * (1 - frac)}`;
        const off = -dash * acc;
        acc += frac;
        return (
          <circle key={i} cx={c} cy={c} r={r}
            stroke={it.color} strokeWidth={thickness} fill="none"
            strokeDasharray={dashArr} strokeDashoffset={off}
            transform={`rotate(-90 ${c} ${c})`}
            strokeLinecap="butt"/>
        );
      })}
      <text x={c} y={c-2} fontSize="22" textAnchor="middle" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)">{total.toLocaleString()}</text>
      <text x={c} y={c+16} fontSize="10.5" textAnchor="middle" fill="var(--muted)">รวม (กก.)</text>
    </svg>
  );
};

Object.assign(window, { Icon, Sidebar, TopBar, KPI, Sparkline, Bar, Badge, AreaChart, BarChart, Donut });
