import { useState, useEffect, createContext, useContext } from "react"

const API_URL = "http://localhost:8000/api"
const AuthContext = createContext(null)
function useAuth() { return useContext(AuthContext) }

function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("token")
  return fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  }).then(r => r.json())
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      apiCall("/users/me").then(data => {
        if (data.id) setUser(data)
        else localStorage.removeItem("token")
        setLoading(false)
      }).catch(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const login = async (email, password) => {
    const form = new FormData()
    form.append("username", email)
    form.append("password", password)
    const data = await fetch(`${API_URL}/auth/login`, { method: "POST", body: form }).then(r => r.json())
    if (data.access_token) {
      localStorage.setItem("token", data.access_token)
      const me = await apiCall("/users/me")
      setUser(me)
      return { success: true }
    }
    return { success: false, error: data.detail }
  }

  const logout = () => { localStorage.removeItem("token"); setUser(null) }
  return <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>{children}</AuthContext.Provider>
}

// Inline SVG Icons
const ICONS = {
  home: ({ color }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  contract: ({ color }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  notification: ({ color }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  setting: ({ color }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  kidney: ({ color }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 5 5 5 9c0 5 3 8 5 10 1 1 2 1 2 1s1 0 2-1c2-2 5-5 5-10 0-4-3-7-7-7z"/>
      <path d="M12 7v5l3 3"/>
    </svg>
  ),
  body: ({ color }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v6"/>
      <path d="M8 10h8"/>
      <path d="M10 13l-2 6"/>
      <path d="M14 13l2 6"/>
    </svg>
  ),
  health: ({ color }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
}

// Etizan Design System — matches UI PDF
const C = {
  bg: "#f2f8f6",
  card: "#ffffff",
  card2: "#f7fbf9",
  border: "#e0eeea",
  accent: "#2ec4a3",
  accentDark: "#1ea88c",
  purple: "#7c6ff7",
  green: "#2ec4a3",
  teal: "#2ec4a3",
  orange: "#ff8c42",
  red: "#e74c3c",
  pink: "#e84393",
  blue: "#3b82f6",
  yellow: "#f59e0b",
  text: "#1c2b28",
  muted: "#8aada5",
  navBg: "#ffffff",
  header: "#2ec4a3",
  headerGrad: "linear-gradient(160deg, #2ec4a3 0%, #45d4b0 100%)",
  splashGrad: "linear-gradient(180deg, #b8eaf0 0%, #c8f0e4 60%, #d4f5e9 100%)",
  weightColor: "#2ec4a3",
  bmiColor: "#7c6ff7",
  waterColor: "#3b82f6",
  fatColor: "#ff8c42",
  muscleColor: "#2ec4a3",
  heartColor: "#e74c3c",
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Nunito:wght@700;800;900&family=Syne:wght@700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{background:${C.bg};color:${C.text};font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;overscroll-behavior:none}
  h1,h2,h3,h4{font-family:'Syne',sans-serif}
  input,select,textarea{background:#ffffff;border:1.5px solid ${C.border};color:${C.text};padding:14px 16px;border-radius:12px;font-size:15px;width:100%;outline:none;transition:border-color .2s,box-shadow .2s;font-family:'Plus Jakarta Sans',sans-serif;-webkit-appearance:none;box-shadow:none}
  input:focus,select:focus{border-color:${C.accent};box-shadow:0 0 0 3px rgba(46,196,163,0.15)}
  input::placeholder{color:#b8cdc8}
  select option{background:#ffffff;color:${C.text}}
  label{display:block;font-size:12px;font-weight:700;color:${C.text};margin-bottom:6px;letter-spacing:.2px}
  ::-webkit-scrollbar{width:0px}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .slide-up{animation:slideUp .3s cubic-bezier(.22,.68,0,1.2) both}
  .fade-in{animation:fadeIn .3s ease both}
  .pulse{animation:pulse 2s infinite}
  input[type=range]{padding:0;height:6px;border:none;box-shadow:none;background:transparent}
`

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    ...style
  }}>{children}</div>
)

const Btn = ({ children, onClick, disabled, variant = "primary", style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: "100%", padding: "16px", borderRadius: 14, border: "none",
    fontSize: 16, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all .2s",
    opacity: disabled ? .5 : 1,
    background: variant === "primary"
      ? C.accent
      : variant === "danger"
      ? "rgba(231,76,60,.08)"
      : "rgba(46,196,163,0.10)",
    color: variant === "danger" ? C.red : variant === "ghost" ? C.text : "#fff",
    border: variant === "ghost" ? `1.5px solid ${C.border}` : "none",
    boxShadow: variant === "primary" ? "0 4px 18px rgba(46,196,163,0.32)" : "none",
    ...style
  }}>{children}</button>
)

const Badge = ({ children, color }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600,
    background: `${color}20`, color
  }}>{children}</span>
)

const StatCard = ({ label, value, unit, color, sub }) => (
  <Card style={{ position: "relative", overflow: "hidden", padding: 16 }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${color},${color}40)`, borderRadius: "20px 20px 0 0" }} />
    <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 60, borderRadius: "50%", background: `${color}08`, transform: "translate(10px,10px)" }} />
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Nunito', sans-serif", color, lineHeight: 1, letterSpacing: "-0.5px" }}>
        {value ?? "—"}<span style={{ fontSize: 13, color: C.muted, fontWeight: 600, fontFamily: "Plus Jakarta Sans", letterSpacing: 0 }}> {unit}</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, marginTop: 3, fontWeight: 600, opacity: 0.8 }}>{sub}</div>}
    </div>
  </Card>
)

const DonutChart = ({ fat, water, muscle, bone, weight }) => {
  if (!fat || !weight) return null
  const fatKg = (fat / 100) * weight
  const waterKg = water ? (water / 100) * weight : 0
  const muscleKg = muscle || 0
  const boneKg = bone || 0
  const otherKg = Math.max(0, weight - fatKg - waterKg - muscleKg - boneKg)
  const segments = [
    { v: fatKg, c: "#ff8c42", l: "دهون", p: fat },
    { v: waterKg, c: "#2196f3", l: "ماء", p: water || 0 },
    { v: muscleKg, c: "#05c27c", l: "عضلات", p: +((muscleKg / weight) * 100).toFixed(1) },
    { v: boneKg, c: "#a78bfa", l: "عظام", p: +((boneKg / weight) * 100).toFixed(1) },
    { v: otherKg, c: "#cbd5e1", l: "أخرى", p: +((otherKg / weight) * 100).toFixed(1) },
  ].filter(s => s.v > 0)
  const total = segments.reduce((a, s) => a + s.v, 0)
  const cx = 70, cy = 70, R = 55, r = 36
  let ang = -Math.PI / 2
  const slices = segments.map(s => {
    const a = (s.v / total) * 2 * Math.PI
    const s1 = ang, e1 = ang + a; ang = e1
    const x1 = cx + R * Math.cos(s1), y1 = cy + R * Math.sin(s1)
    const x2 = cx + R * Math.cos(e1), y2 = cy + R * Math.sin(e1)
    const ix1 = cx + r * Math.cos(s1), iy1 = cy + r * Math.sin(s1)
    const ix2 = cx + r * Math.cos(e1), iy2 = cy + r * Math.sin(e1)
    const lg = a > Math.PI ? 1 : 0
    return { ...s, path: `M${x1} ${y1} A${R} ${R} 0 ${lg} 1 ${x2} ${y2} L${ix2} ${iy2} A${r} ${r} 0 ${lg} 0 ${ix1} ${iy1}Z` }
  })
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <svg viewBox="0 0 140 140" style={{ width: 120, height: 120, flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.c} stroke="#fff" strokeWidth="2" />)}
        <text x={cx} y={cy - 5} textAnchor="middle" fill={C.text} fontSize="18" fontWeight="900" fontFamily="Nunito">{weight.toFixed(0)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={C.muted} fontSize="10">كغ</text>
      </svg>
      <div style={{ flex: 1 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.c }} />
              <span style={{ fontSize: 12, color: C.muted }}>{s.l}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.p}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const BMIGauge = ({ bmi }) => {
  if (!bmi) return null
  const zones = [
    { l: "سمنة", min: 30, max: 45, c: "#f44336", emoji: "↑↑" },
    { l: "زيادة", min: 25, max: 30, c: "#ffc107", emoji: "↑" },
    { l: "مثالي", min: 18.5, max: 25, c: "#05c27c", emoji: "" },
    { l: "نقص", min: 10, max: 18.5, c: "#2196f3", emoji: "" },
  ]
  const activeZone = zones.find(z => bmi >= z.min && bmi < z.max) || zones[3]
  const totalRange = 35 // 10 to 45
  const pct = Math.min(100, Math.max(0, 100 - ((bmi - 10) / totalRange) * 100))

  return (
    <div>
      {/* Big number display */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Nunito',sans-serif", color: activeZone.c, lineHeight: 1, letterSpacing: "-1px" }}>
            {bmi.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 2 }}>مؤشر كتلة الجسم</div>
        </div>
        <div style={{ textAlign: "center", background: `${activeZone.c}15`, borderRadius: 16, padding: "10px 18px", border: `2px solid ${activeZone.c}30` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: activeZone.c, fontFamily: "'Nunito',sans-serif" }}>{activeZone.l}</div>
        </div>
      </div>

      {/* Gradient track bar */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ height: 10, borderRadius: 6, background: "linear-gradient(to left, #2196f3 0%, #05c27c 30%, #ffc107 65%, #f44336 100%)", position: "relative", overflow: "visible" }}>
          {/* Indicator */}
          <div style={{
            position: "absolute", top: "50%", left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 18, height: 18, borderRadius: "50%",
            background: "#fff", border: `2.5px solid ${activeZone.c}`,
            boxShadow: `0 2px 8px ${activeZone.c}60`,
            transition: "left 1s ease"
          }} />
        </div>
        {/* Zone labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {zones.map((z,i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ width: 1, height: 6, background: C.border, margin: "0 auto 4px" }} />
              <div style={{ fontSize: 9, color: z.l === activeZone.l ? z.c : C.muted, fontWeight: z.l === activeZone.l ? 700 : 400 }}>{z.l}</div>
              <div style={{ fontSize: 8, color: C.muted }}>{z.min}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const WeightChart = ({ data, stats }) => {
  if (!data || data.length < 2) return (
    <div style={{ textAlign: "center", padding: 24, color: C.muted, fontSize: 13 }}>
      ستظهر بعد قياسين أو أكثر
    </div>
  )
  const weights = data.map(d => d.weight_kg).filter(Boolean)
  const minW = Math.min(...weights) - 1.5, maxW = Math.max(...weights) + 1.5
  const W = 300, H = 140
  const gx = i => (i / (data.length - 1)) * (W - 40) + 20
  const gy = w => H - 30 - ((w - minW) / (maxW - minW)) * (H - 50)

  const pts = data.map((d, i) => ({ x: gx(i), y: gy(d.weight_kg) }))
  const smoothPath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = pts[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`
  }, "")
  const fillPath = `${smoothPath} L${pts[pts.length-1].x},${H-30} L${pts[0].x},${H-30}Z`

  const lastPt = pts[pts.length - 1]
  const firstPt = pts[0]
  const trend = weights[weights.length-1] - weights[0]

  // نطاق SD
  const sdColor = stats ? {good:"#05c27c",ok:"#ffc107",warning:"#ff8c42",danger:"#f44336"}[stats.stability_level] : null
  const upperY = stats ? gy(Math.min(stats.upper_band, maxW)) : null
  const lowerY = stats ? gy(Math.max(stats.lower_band, minW)) : null

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Nunito',sans-serif", color: trend <= 0 ? "#05c27c" : "#ff8c42" }}>
          {trend > 0 ? "+" : ""}{trend.toFixed(1)} كغ
        </span>
        {stats && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${sdColor}12`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${sdColor}25` }}>
            <div style={{ width: 12, height: 2, background: sdColor, opacity: .7, borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: sdColor, fontWeight: 700 }}>هامش التأرجح ±{stats.sd.toFixed(1)} كغ</span>
          </div>
        )}
        <span style={{ fontSize: 11, color: C.muted }}>
          {new Date(data[0].measured_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
          {" — "}
          {new Date(data[data.length-1].measured_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#05c27c" stopOpacity=".3" />
            <stop offset="100%" stopColor="#05c27c" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((f, i) => {
          const yVal = minW + f * (maxW - minW)
          return (
            <g key={i}>
              <line x1="20" y1={gy(yVal)} x2={W-20} y2={gy(yVal)} stroke={C.border} strokeWidth="1" strokeDasharray="4,4" />
              <text x="18" y={gy(yVal)+4} textAnchor="end" fill={C.muted} fontSize="8" fontFamily="Nunito">{yVal.toFixed(0)}</text>
            </g>
          )
        })}

        {/* نطاق SD — ظل بين upper و lower band */}
        {stats && upperY !== null && lowerY !== null && (
          <rect
            x="20" y={upperY}
            width={W - 40} height={lowerY - upperY}
            fill={sdColor} opacity="0.08"
            rx="3"
          />
        )}

        {/* خط upper band متقطع */}
        {stats && upperY !== null && (
          <line x1="20" y1={upperY} x2={W-20} y2={upperY}
            stroke={sdColor} strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />
        )}

        {/* خط lower band متقطع */}
        {stats && lowerY !== null && (
          <line x1="20" y1={lowerY} x2={W-20} y2={lowerY}
            stroke={sdColor} strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />
        )}

        {/* Area fill */}
        <path d={fillPath} fill="url(#wg)" />

        {/* Main line */}
        <path d={smoothPath} fill="none" stroke="#05c27c" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />

        {/* Data points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="#05c27c" opacity=".1" />
            <circle cx={p.x} cy={p.y} r="3.5" fill="#05c27c" stroke="#fff" strokeWidth="2" />
          </g>
        ))}

        {/* First & last labels */}
        <text x={firstPt.x} y={firstPt.y - 10} textAnchor="middle" fill="#05c27c" fontSize="10" fontWeight="700" fontFamily="Nunito">{weights[0].toFixed(1)}</text>
        <text x={lastPt.x} y={lastPt.y - 10} textAnchor="middle" fill="#05c27c" fontSize="10" fontWeight="700" fontFamily="Nunito">{weights[weights.length-1].toFixed(1)}</text>
      </svg>
    </div>
  )
}

const MetricBar = ({ label, value, min, max, unit, color, icon }) => {
  if (!value) return null
  const isNormal = value >= min && value <= max
  const barColor = isNormal ? C.green : (value > max ? C.red : C.blue)
  const pct = Math.min(100, (value / (max * 1.4)) * 100)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.text }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: barColor }}>{value.toFixed(1)} <span style={{ fontSize: 10, color: C.muted }}>{unit}</span></span>
          <Badge color={isNormal ? C.green : C.red}>{isNormal ? "طبيعي" : value > max ? "مرتفع" : "منخفض"}</Badge>
        </div>
      </div>
      <div style={{ height: 8, background: C.border, borderRadius: 4, position: "relative" }}>
        <div style={{ position: "absolute", left: `${(min / (max * 1.4)) * 100}%`, width: `${((max - min) / (max * 1.4)) * 100}%`, height: "100%", background: `${C.green}25`, borderRadius: 4 }} />
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 1s ease", boxShadow: `0 0 6px ${barColor}60` }} />
      </div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>المعدل الطبيعي: {min}–{max} {unit}</div>
    </div>
  )
}

// بطاقة استقرار الوزن — مصطلحات سهلة الفهم
const WeightStabilityCard = ({ weekly, monthly, isKidney, isPregnant, onBack }) => {
  if (!weekly) return null

  const levels = {
    good:    { color: "#05c27c", bg: "#f0fdf7", title: "وزنك ثابت ومستقر",      desc: "تغيراتك خلال الفترة طفيفة جداً — هذا ممتاز" },
    ok:      { color: "#f59e0b", bg: "#fffbeb", title: "تغير خفيف في الوزن",     desc: "وزنك يتذبذب قليلاً — وهذا طبيعي في الغالب"  },
    warning: { color: "#f97316", bg: "#fff7ed", title: "تغيرات ملحوظة في الوزن", desc: "وزنك يتغير بشكل واضح — يستحق المتابعة"       },
    danger:  { color: "#ef4444", bg: "#fef2f2", title: "تقلبات كبيرة في الوزن",  desc: "وزنك يتغير بشكل غير طبيعي — راجع طبيبك"     },
  }

  const activeStats = weekly
  const L = levels[activeStats.stability_level] || levels.ok
  const sdKg = weekly.sd.toFixed(1)
  const meanKg = weekly.mean.toFixed(1)
  const barPct = Math.min(100, (activeStats.sd / 2.5) * 100)
  const zones = [
    { label: "مستقر", color: "#05c27c" },
    { label: "خفيف",  color: "#f59e0b" },
    { label: "ملحوظ", color: "#f97316" },
    { label: "كبير",  color: "#ef4444" },
  ]

  return (
    <div className="slide-up" style={{ padding: "0 0 100px", direction: "rtl", background: C.bg, minHeight: "100vh" }}>

      {/* هيدر */}
      <div style={{ background: C.headerGrad, padding: "28px 20px 50px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <h2 style={{ fontSize: 22, color: "#fff", fontFamily: "Syne", fontWeight: 800 }}>استقرار الوزن</h2>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "20px 16px 0" }}>

        {/* حالة الاستقرار */}
        <div style={{ background: L.bg, borderRadius: 16, padding: "16px 18px", marginBottom: 16, border: `1px solid ${L.color}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: L.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1a2332" }}>{L.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{L.desc}</div>
            </div>
          </div>
        </div>

        {/* الجملة التفسيرية */}
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 16, direction: "rtl" }}>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.9 }}>
            خلال آخر <strong style={{ color: "#1a2332" }}>7 أيام</strong>، كان وزنك يتأرجح بين{" "}
            <strong style={{ color: L.color, fontFamily: "'Nunito',sans-serif", fontSize: 15 }}>{(weekly.mean - weekly.sd).toFixed(1)}</strong>
            {" "}و{" "}
            <strong style={{ color: L.color, fontFamily: "'Nunito',sans-serif", fontSize: 15 }}>{(weekly.mean + weekly.sd).toFixed(1)}</strong>
            {" "}كغ حول وزنك المعتاد{" "}
            <strong style={{ color: "#1a2332", fontFamily: "'Nunito',sans-serif" }}>{meanKg} كغ</strong>
          </div>
        </div>

        {/* مقياس التذبذب */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>مقياس تذبذب وزنك</span>
          </div>

          {/* الشريط */}
          <div style={{ position: "relative", marginBottom: 28 }}>
            <div style={{ height: 14, borderRadius: 8, background: "linear-gradient(to left, #ef4444 0%, #f97316 35%, #f59e0b 60%, #05c27c 100%)", position: "relative", overflow: "visible", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)" }}>
              {[0.5/2.5, 1/2.5, 2/2.5].map((f, i) => (
                <div key={i} style={{ position: "absolute", top: -2, left: `${(1-f)*100}%`, width: 2, height: 18, background: "rgba(255,255,255,0.6)", borderRadius: 1 }} />
              ))}
              <div style={{ position: "absolute", top: "50%", left: `${100 - barPct}%`, transform: "translate(-50%, -50%)", width: 22, height: 22, borderRadius: "50%", background: "#fff", border: `3px solid ${L.color}`, boxShadow: `0 2px 10px ${L.color}60, 0 0 0 4px ${L.color}20`, transition: "left 1.2s cubic-bezier(0.34,1.56,0.64,1)", zIndex: 2 }} />
            </div>
            <div style={{ position: "absolute", top: 20, left: 0, right: 0, display: "flex", justifyContent: "space-between", flexDirection: "row-reverse" }}>
              {zones.map((z, i) => (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: activeStats.stability_level === ["good","ok","warning","danger"][i] ? z.color : "#94a3b8" }}>{z.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* بطاقتا الأسبوع والشهر */}
        <div style={{ display: "grid", gridTemplateColumns: monthly ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "هذا الأسبوع", stats: weekly },
            ...(monthly ? [{ label: "هذا الشهر", stats: monthly }] : [])
          ].map(({ label, stats }) => {
            const lv = levels[stats.stability_level] || levels.ok
            return (
              <div key={label} style={{ background: "#f8fafc", borderRadius: 14, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>{label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>الوزن المعتاد</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1a2332", fontFamily: "'Nunito',sans-serif" }}>{stats.mean} كغ</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>هامش التأرجح</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: lv.color, fontFamily: "'Nunito',sans-serif" }}>± {stats.sd.toFixed(1)} كغ</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>الفرق الأعلى–الأدنى</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#475569", fontFamily: "'Nunito',sans-serif" }}>{stats.range.toFixed(1)} كغ</span>
                  </div>
                  <div style={{ marginTop: 4, padding: "5px 10px", borderRadius: 20, background: `${lv.color}15`, textAlign: "center", fontSize: 11, fontWeight: 700, color: lv.color }}>{lv.title}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* تنبيه الكلى */}
        {isKidney && weekly.sd > 1.5 && (
          <div style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", marginBottom: 4 }}>تنبيه لمريض الكلى</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
              وزنك تغير بمقدار <strong style={{ color: "#ef4444" }}>±{sdKg} كغ</strong> هذا الأسبوع — أكثر من الحد المسموح به (1.5 كغ). قد يعني احتباس سوائل — أخبر طبيبك.
            </div>
          </div>
        )}

        {/* تنبيه الحمل */}
        {isPregnant && weekly.sd > 0.8 && (
          <div style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#ec4899", marginBottom: 4 }}>ملاحظة أثناء الحمل</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
              وزنك تغير بمقدار <strong style={{ color: "#ec4899" }}>±{sdKg} كغ</strong> — أكثر من المعتاد. يُفضّل ذكر ذلك لطبيبك.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

//  Splash Screen 
function SplashScreen({ onLogin, onRegister }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      background: "linear-gradient(180deg, #b8eaf5 0%, #c5f0e4 45%, #cdf5e2 100%)",
      padding: "0 32px",
      direction: "rtl",
    }}>

      {/* المنتصف — اللوغو والاسم */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>

        {/* أيقونة الميزان */}
        <div style={{
          width: 160, height: 160,
          borderRadius: 36,
          background: "#fff",
          border: "3px solid #1d7a5f",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(29,122,95,0.15)",
          gap: 4,
        }}>
          {/* عقرب الميزان */}
          <svg width="110" height="56" viewBox="0 0 110 56" fill="none">
            {/* الإطار الداخلي البيضاوي */}
            <rect x="8" y="8" width="94" height="40" rx="12" stroke="#1d7a5f" strokeWidth="2.5" fill="none"/>
            {/* خطوط الدرجات */}
            <line x1="20" y1="28" x2="24" y2="28" stroke="#1d7a5f" strokeWidth="2" strokeLinecap="round"/>
            <line x1="28" y1="18" x2="31" y2="21" stroke="#1d7a5f" strokeWidth="2" strokeLinecap="round"/>
            <line x1="82" y1="18" x2="79" y2="21" stroke="#1d7a5f" strokeWidth="2" strokeLinecap="round"/>
            <line x1="90" y1="28" x2="86" y2="28" stroke="#1d7a5f" strokeWidth="2" strokeLinecap="round"/>
            <line x1="40" y1="14" x2="40" y2="18" stroke="#1d7a5f" strokeWidth="2" strokeLinecap="round"/>
            <line x1="70" y1="14" x2="70" y2="18" stroke="#1d7a5f" strokeWidth="2" strokeLinecap="round"/>
            {/* العقرب */}
            <line x1="55" y1="38" x2="55" y2="16" stroke="#1d7a5f" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="55" cy="38" r="3.5" fill="#1d7a5f"/>
          </svg>
          {/* اسم التطبيق داخل اللوغو */}
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1d7a5f", fontFamily: "Syne", lineHeight: 1 }}>Etizan</div>
          <div style={{ fontSize: 11, color: "#1d7a5f", opacity: 0.7, letterSpacing: 1 }}>24/7</div>
        </div>

        {/* الاسم تحت اللوغو */}
        <h1 style={{
          fontSize: 30, fontWeight: 800,
          color: "#1c2b28",
          fontFamily: "Syne",
          textAlign: "center",
          letterSpacing: -0.5,
        }}>اتزان | Etizan</h1>
      </div>

      {/* الأزرار في الأسفل */}
      <div style={{ width: "100%", paddingBottom: 56, display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={onLogin} style={{
          width: "100%", padding: "17px",
          borderRadius: 50, border: "none",
          background: "#2ec4a3",
          color: "#fff", fontSize: 17, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
          boxShadow: "0 4px 20px rgba(46,196,163,0.4)",
          letterSpacing: 0.3,
        }}>تسجيل الدخول</button>

        <button onClick={onRegister} style={{
          width: "100%", padding: "17px",
          borderRadius: 50, border: "none",
          background: "rgba(46,196,163,0.15)",
          color: "#1d7a5f", fontSize: 17, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
          letterSpacing: 0.3,
        }}>إنشاء حساب</button>
      </div>
    </div>
  )
}

// Login Page
function LoginPage({ onSwitch }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()

  const submit = async () => {
    setLoading(true); setError("")
    const r = await login(email, password)
    if (!r.success) setError(r.error || "بيانات الدخول غير صحيحة")
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.splashGrad }}>
      {/* Header green section */}
      <div style={{ background: C.headerGrad, padding: "60px 24px 48px", textAlign: "center", borderRadius: "0 0 32px 32px" }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,255,255,0.25)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="7" width="18" height="13" rx="2"/>
            <path d="M8 7V5a2 2 0 0 1 4 0v2"/>
            <circle cx="12" cy="13" r="2" fill="white" stroke="none"/>
            <line x1="12" y1="15" x2="12" y2="17"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 26, color: "#fff", fontFamily: "Syne", fontWeight: 800 }}>تسجيل الدخول</h1>
      </div>

      {/* White card body */}
      <div style={{ flex: 1, background: "#fff", margin: "-20px 0 0", borderRadius: "28px 28px 0 0", padding: "36px 24px 32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8, display: "block" }}>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" onKeyDown={e => e.key === "Enter" && submit()} style={{ borderRadius: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8, display: "block" }}>كلمة المرور</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submit()} style={{ borderRadius: 12 }} />
          </div>

          {error && <div style={{ background: "rgba(231,76,60,.07)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: 12, padding: "12px 16px", color: C.red, fontSize: 13 }}>{error}</div>}

          <div style={{ marginTop: 8 }}>
            <Btn onClick={submit} disabled={loading} style={{ borderRadius: 14, fontSize: 16 }}>{loading ? "جاري الدخول..." : "تسجيل الدخول"}</Btn>
          </div>

          <p style={{ textAlign: "center", color: C.muted, fontSize: 14, marginTop: 4 }}>
            ليس لديك حساب؟ <span style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }} onClick={onSwitch}>سجّل الآن</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Register Page
function RegisterPage({ onSwitch }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: "", password: "", name: "", gender: "female", birthdate: "", height_cm: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setLoading(true); setError("")
    try {
      const res = await apiCall("/auth/register", { method: "POST", body: JSON.stringify({ ...form, height_cm: form.height_cm ? parseFloat(form.height_cm) : null }) })
      if (res.access_token) {
        localStorage.setItem("token", res.access_token)
        await login(form.email, form.password)
      } else setError(res.detail || "خطأ في التسجيل")
    } catch { setError("خطأ في الاتصال") }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.splashGrad }}>
      {/* Header */}
      <div style={{ background: C.headerGrad, padding: "56px 24px 44px", textAlign: "center", borderRadius: "0 0 32px 32px" }}>
        <h1 style={{ fontSize: 26, color: "#fff", fontFamily: "Syne", fontWeight: 800 }}>إنشاء حساب</h1>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
          {[1, 2].map(s => <div key={s} style={{ width: s <= step ? 28 : 18, height: 5, borderRadius: 3, background: s <= step ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", transition: "all .3s" }} />)}
        </div>
      </div>
      {/* White card */}
      <div style={{ flex: 1, background: "#fff", margin: "-20px 0 0", borderRadius: "28px 28px 0 0", padding: "28px 24px 32px", overflowY: "auto" }}>

      {step === 1 && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><label>الاسم الكامل</label><input value={form.name} onChange={e => up("name", e.target.value)} placeholder="الاسم" /></div>
            <div><label>البريد الإلكتروني</label><input type="email" value={form.email} onChange={e => up("email", e.target.value)} /></div>
            <div><label>كلمة المرور</label><input type="password" value={form.password} onChange={e => up("password", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label>تاريخ الميلاد</label><input type="date" value={form.birthdate} onChange={e => up("birthdate", e.target.value)} /></div>
              <div><label>الطول (سم)</label><input type="number" value={form.height_cm} onChange={e => up("height_cm", e.target.value)} placeholder="165" /></div>
            </div>
            <div>
              <label>الجنس</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                {[["female", "أنثى"], ["male", "ذكر"]].map(([v, l]) => (
                  <div key={v} onClick={() => up("gender", v)} style={{ padding: 16, borderRadius: 14, textAlign: "center", border: `2px solid ${form.gender === v ? C.accent : C.border}`, background: form.gender === v ? `rgba(0,184,148,.1)` : "#fff", cursor: "pointer", transition: "all .2s" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: form.gender === v ? C.accent : C.text }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <Btn onClick={() => form.name && form.email && form.password && setStep(2)}>التالي</Btn>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>هذه المعلومات تساعد النظام على تحليل قياساتك بدقة</p>
            {error && <div style={{ background: "rgba(231,76,60,.08)", border: "1px solid #e74c3c", borderRadius: 12, padding: 12, color: C.red, fontSize: 14 }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Btn variant="ghost" onClick={() => setStep(1)}>السابق</Btn>
              <Btn onClick={submit} disabled={loading}>{loading ? "جاري..." : "إنشاء الحساب"}</Btn>
            </div>
          </div>
        </Card>
      )}

        <p style={{ textAlign: "center", marginTop: 20, color: C.muted, fontSize: 14 }}>
          لديك حساب؟ <span style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }} onClick={onSwitch}>تسجيل الدخول</span>
        </p>
      </div>
    </div>
  )
}


//  مكوّن تقويم التاريخ — مثل الصورة 
function DateNavigator({ period }) {
  const [offset, setOffset] = useState(0)

  useEffect(() => { setOffset(0) }, [period])

  const getLabel = () => {
    const now = new Date()
    if (period === "day") {
      const d = new Date(now); d.setDate(d.getDate() - offset)
      if (offset === 0) return "اليوم، " + d.toLocaleDateString("ar-SA-u-nu-latn", { month:"long", day:"numeric" })
      if (offset === 1) return "أمس، " + d.toLocaleDateString("ar-SA-u-nu-latn", { month:"long", day:"numeric" })
      return d.toLocaleDateString("ar-SA-u-nu-latn", { weekday:"long", month:"long", day:"numeric" })
    }
    if (period === "week") {
      const end = new Date(now); end.setDate(end.getDate() - offset*7)
      const start = new Date(end); start.setDate(start.getDate() - 6)
      const fmt = d => d.toLocaleDateString("ar-SA-u-nu-latn", { month:"short", day:"numeric" })
      return fmt(start) + " — " + fmt(end)
    }
    if (period === "month") {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      return d.toLocaleDateString("ar-SA-u-nu-latn", { month:"long", year:"numeric" })
    }
    if (period === "year") {
      return String(now.getFullYear() - offset)
    }
    return ""
  }

  return (
    <div style={{
      background: "rgba(0,0,0,0.12)",
      padding: "10px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* زر التالي (يسار في RTL = التالي) */}
      <button
        onClick={() => setOffset(o => Math.max(0, o-1))}
        disabled={offset === 0}
        style={{
          width: 32, height: 32, borderRadius: "50%",
          background: offset===0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
          border: "none", cursor: offset===0 ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: offset===0 ? 0.4 : 1,
        }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* التسمية */}
      <span style={{ color:"#fff", fontSize:15, fontWeight:700, fontFamily:"Plus Jakarta Sans", letterSpacing:0.2 }}>
        {getLabel()}
      </span>

      {/* زر السابق (يمين في RTL = السابق) */}
      <button
        onClick={() => setOffset(o => o+1)}
        style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>
  )
}

//  صفحة السجل الصحي الطبي 
function HistoryPage({ onBack }) {
  const { user } = useAuth()
  const [period, setPeriod] = useState("week")
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("charts") // charts | summary | symptoms

  useEffect(() => {
    setLoading(true)
    apiCall(`/users/me/history?period=${period}`)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [period])

  const periodLabel = { day:"اليوم", week:"الأسبوع", month:"الشهر", year:"السنة" }
  const today = new Date().toLocaleDateString("ar-SA-u-nu-latn", { year:"numeric", month:"long", day:"numeric" })

  //  بيانات تجريبية ثابتة 
  const n = period==="day"?8:period==="week"?7:period==="month"?30:12
  const demoLabels = period==="day"
    ? Array.from({length:n},(_,i)=>`${6+i*2}:00`)
    : period==="year"
    ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
    : Array.from({length:n},(_,i)=>`${i+1}`)
  const seed = [0.5,1.2,-0.3,0.8,-0.6,1.4,0.2,-0.9,0.7,-0.4,1.1,-0.2,0.6,-0.8,0.3,0.9,-0.5,1.3,-0.1,0.4,-0.7,1.0,0.1,-0.3,0.8,0.5,-0.2,1.1,-0.6,0.3]
  const makeSeries = (base, amp, labels) =>
    labels.map((label, i) => ({ label, value: +(base + Math.sin(i*0.8)*amp + seed[i%seed.length]*amp*0.4).toFixed(2) }))
  const fallback = {
    weight:   makeSeries(72, 1.5, demoLabels),
    bmi:      makeSeries(24.2, 0.3, demoLabels),
    water:    makeSeries(57, 2.0, demoLabels),
    fat:      makeSeries(22, 1.0, demoLabels),
    muscle:   makeSeries(27.4, 0.5, demoLabels),
    symptoms: demoLabels.slice(0, period==="month"?4:n).map((label,i) => ({
      label, value: [0,1,0,2,1,0,3,1,0,0,2,1,0,1,0,2,0,1,3,0,1,0,2,1,0,1,0,0,1,2][i%30]
    })),
  }
  const d = {
    weight:   data?.weight?.length   >= 2 ? data.weight   : fallback.weight,
    bmi:      data?.bmi?.length      >= 2 ? data.bmi      : fallback.bmi,
    water:    data?.water?.length    >= 2 ? data.water     : fallback.water,
    fat:      data?.fat?.length      >= 2 ? data.fat       : fallback.fat,
    muscle:   data?.muscle?.length   >= 2 ? data.muscle    : fallback.muscle,
    symptoms: data?.symptoms?.length >= 1 ? data.symptoms  : fallback.symptoms,
    isDemo: !data,
  }

  //  إحصائيات محسوبة 
  const stat = (arr) => {
    if (!arr?.length) return { min:"—", max:"—", avg:"—", last:"—", trend:0 }
    const vals = arr.map(p=>p.value)
    const avg = vals.reduce((s,v)=>s+v,0)/vals.length
    const trend = vals.length >= 2 ? vals[vals.length-1] - vals[0] : 0
    return { min:Math.min(...vals).toFixed(1), max:Math.max(...vals).toFixed(1), avg:avg.toFixed(1), last:vals[vals.length-1].toFixed(1), trend:+trend.toFixed(2) }
  }
  const ws = stat(d.weight), bs = stat(d.bmi), fs = stat(d.fat), ms = stat(d.muscle), wts = stat(d.water)

  //  تفسير طبي 
  const bmiStatus = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return null
    if (n < 18.5) return { label:"نقص الوزن", color:"#3b82f6" }
    if (n < 25)   return { label:"طبيعي", color:"#2ec4a3" }
    if (n < 30)   return { label:"زيادة وزن", color:"#f97316" }
    return { label:"سمنة", color:"#e74c3c" }
  }
  const bmiInfo = bmiStatus(bs.last)

  //  رسم بياني خطي طبي 
  const MedChart = ({ points=[], color=C.accent, unit="", height=110, refMin=null, refMax=null }) => {
    if (!points || points.length < 2) return (
      <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:12 }}>لا توجد بيانات كافية</div>
    )
    const W=320, H=height
    const vals = points.map(p=>p.value)
    const dataMin = Math.min(...vals), dataMax = Math.max(...vals)
    const allVals = [...vals, ...(refMin!=null?[refMin]:[]), ...(refMax!=null?[refMax]:[])]
    const minV = Math.min(...allVals)*0.98, maxV = Math.max(...allVals)*1.02
    const range = maxV - minV || 1
    const px = (i) => 28 + (i/(points.length-1))*(W-56)
    const py = (v) => H-18-((v-minV)/range)*(H-32)
    const pathD = points.map((p,i)=>`${i===0?"M":"L"}${px(i).toFixed(1)},${py(p.value).toFixed(1)}`).join(" ")
    const fillD = pathD+` L${px(points.length-1).toFixed(1)},${H} L${px(0).toFixed(1)},${H} Z`
    // نقطة أعلى وأدنى
    const maxIdx = vals.indexOf(Math.max(...vals))
    const minIdx = vals.indexOf(Math.min(...vals))
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`mg_${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {/* خطوط المرجع الطبي */}
        {refMax!=null && <line x1="0" y1={py(refMax).toFixed(1)} x2={W} y2={py(refMax).toFixed(1)} stroke="#f97316" strokeWidth="1" strokeDasharray="4,3" opacity="0.6"/>}
        {refMin!=null && <line x1="0" y1={py(refMin).toFixed(1)} x2={W} y2={py(refMin).toFixed(1)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,3" opacity="0.6"/>}
        {/* خطوط شبكة خفيفة */}
        {[0.25,0.5,0.75].map(f=>(
          <line key={f} x1="28" y1={(py(minV+range*f)).toFixed(1)} x2={W-28} y2={(py(minV+range*f)).toFixed(1)} stroke="#e0eeea" strokeWidth="1"/>
        ))}
        {/* المنطقة */}
        <path d={fillD} fill={`url(#mg_${color.replace("#","")})`}/>
        {/* الخط */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* النقاط */}
        {points.map((p,i)=>(
          <circle key={i} cx={px(i)} cy={py(p.value)} r={i===maxIdx||i===minIdx?"4.5":"2.8"} fill={i===maxIdx?"#e74c3c":i===minIdx?"#3b82f6":color} stroke="#fff" strokeWidth="1.5"/>
        ))}
        {/* قيمة أعلى */}
        <text x={px(maxIdx)} y={py(vals[maxIdx])-8} textAnchor="middle" fill="#e74c3c" fontSize="8.5" fontWeight="800" fontFamily="Nunito">{vals[maxIdx].toFixed(1)}</text>
        {/* قيمة أدنى */}
        <text x={px(minIdx)} y={py(vals[minIdx])+16} textAnchor="middle" fill="#3b82f6" fontSize="8.5" fontWeight="800" fontFamily="Nunito">{vals[minIdx].toFixed(1)}</text>
        {/* تسميات المحور السفلي */}
        {points.filter((_,i)=> {
          if (points.length<=7) return true
          return i===0 || i===Math.floor(points.length/4) || i===Math.floor(points.length/2) || i===Math.floor(points.length*3/4) || i===points.length-1
        }).map(p=>{
          const idx=points.indexOf(p)
          return <text key={idx} x={px(idx)} y={H-4} textAnchor="middle" fill={C.muted} fontSize="7.5" fontFamily="Plus Jakarta Sans">{p.label}</text>
        })}
        {/* وحدة القياس */}
        <text x={W-4} y={12} textAnchor="end" fill={C.muted} fontSize="7" fontFamily="Plus Jakarta Sans">{unit}</text>
      </svg>
    )
  }

  //  بطاقة مؤشر مع تريند 
  const StatRow = ({ label, value, unit, color, trend }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:12, color:C.muted }}>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {trend !== undefined && trend !== 0 && (
          <span style={{ fontSize:10, color: trend>0?"#e74c3c":"#2ec4a3", fontWeight:700 }}>
            {trend>0?"↑":"↓"} {Math.abs(trend).toFixed(1)}
          </span>
        )}
        <span style={{ fontSize:14, fontWeight:800, color, fontFamily:"Nunito" }}>{value}</span>
        <span style={{ fontSize:10, color:C.muted }}>{unit}</span>
      </div>
    </div>
  )

  //  شريط الأعراض المحسّن 
  const SymptomBar = ({ points=[], height=100 }) => {
    if (!points?.length) return null
    const maxVal = Math.max(...points.map(p=>p.value), 1)
    const colorFor = (v) => v===0?"#e0eeea":v===1?"#fde68a":v===2?"#fdba74":"#fca5a5"
    return (
      <div style={{ display:"flex", alignItems:"flex-end", gap:3, height, paddingBottom:18 }}>
        {points.map((p,i)=>{
          const barH = p.value===0 ? 4 : Math.max(8,(p.value/maxVal)*(height-22))
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              {p.value>0 && <span style={{ fontSize:8, fontWeight:800, color:"#374151" }}>{p.value}</span>}
              <div style={{ width:"100%", height:barH, borderRadius:"3px 3px 0 0", background:colorFor(p.value), transition:"height .4s" }}/>
              <span style={{ fontSize:6.5, color:C.muted, textAlign:"center", lineHeight:1.2 }}>{p.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const totalSymptoms = d.symptoms?.reduce((s,p)=>s+p.value,0)||0

  //  رسم بياني متعدد الخطوط 
  const MultiChart = ({ series, height=160 }) => {
    const W=320, H=height
    const allVals = series.flatMap(s=>s.points.map(p=>p.value))
    if (allVals.length < 2) return null
    const minV = Math.min(...allVals)*0.97, maxV = Math.max(...allVals)*1.03
    const range = maxV - minV || 1
    const n = series[0].points.length
    const mpx = (i) => 24 + (i/(n-1))*(W-48)
    const mpy = (v) => H-20-((v-minV)/range)*(H-36)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }} preserveAspectRatio="none">
        <defs>
          {series.map(s=>(
            <linearGradient key={s.key} id={`mcg_${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.12"/>
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01"/>
            </linearGradient>
          ))}
        </defs>
        {[0.25,0.5,0.75].map(f=>(
          <line key={f} x1="24" y1={(mpy(minV+range*f)).toFixed(1)} x2={W-24} y2={(mpy(minV+range*f)).toFixed(1)} stroke="#e8f0ed" strokeWidth="1"/>
        ))}
        {series.map(s=>{
          const pathD = s.points.map((p,i)=>`${i===0?"M":"L"}${mpx(i).toFixed(1)},${mpy(p.value).toFixed(1)}`).join(" ")
          const fillD = pathD+` L${mpx(n-1).toFixed(1)},${H} L${mpx(0).toFixed(1)},${H} Z`
          return (
            <g key={s.key}>
              <path d={fillD} fill={`url(#mcg_${s.key})`}/>
              <path d={pathD} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {s.points.map((p,i)=>(
                <circle key={i} cx={mpx(i)} cy={mpy(p.value)} r="2.5" fill={s.color} stroke="#fff" strokeWidth="1.2"/>
              ))}
            </g>
          )
        })}
        {series[0].points.filter((_,i)=>i===0||i===Math.floor(n/2)||i===n-1).map(p=>{
          const idx=series[0].points.indexOf(p)
          return <text key={idx} x={mpx(idx)} y={H-5} textAnchor="middle" fill={C.muted} fontSize="7.5" fontFamily="Plus Jakarta Sans">{p.label}</text>
        })}
      </svg>
    )
  }

  const compositionSeries = [
    { key:"bmi",    label:"BMI",      color:C.purple,  unit:"",   points:d.bmi,    last:bs.last },
    { key:"fat",    label:"الدهون",   color:C.orange,  unit:"%",  points:d.fat,    last:fs.last },
    { key:"muscle", label:"العضلات",  color:"#2ec4a3", unit:"كغ", points:d.muscle, last:ms.last },
    { key:"water",  label:"الماء",    color:C.blue,    unit:"%",  points:d.water,  last:wts.last },
  ]

  return (
    <div className="slide-up" style={{ padding:"0 0 110px", direction:"rtl", background:C.bg, minHeight:"100vh" }}>

      {/*  هيدر — فلتر الفترة بداخله مثل الصورة  */}
      <div style={{ background: C.headerGrad, paddingTop:28, paddingBottom:0 }}>
        {/* صف العنوان + زر الرجوع */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0 20px 18px" }}>
          <button onClick={onBack} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <h2 style={{ fontSize:22, color:"#fff", fontFamily:"Syne", fontWeight:800, flex:1 }}>السجل الصحي</h2>
        </div>

        {/* تبويبات الرسوم / الملخص */}
        <div style={{ display:"flex", padding:"0 20px", borderBottom:"1px solid rgba(255,255,255,0.2)", marginBottom:0 }}>
          {[["charts","الرسوم البيانية"],["summary","الملخص الطبي"]].map(([tab,label])=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{
              flex:1, padding:"10px 4px 12px", border:"none", cursor:"pointer",
              fontFamily:"Plus Jakarta Sans", fontSize:13, fontWeight:700, transition:"all .2s",
              background:"transparent",
              color: activeTab===tab?"#fff":"rgba(255,255,255,0.55)",
              borderBottom: activeTab===tab?"2.5px solid #fff":"2.5px solid transparent",
              marginBottom:-1,
            }}>{label}</button>
          ))}
        </div>

        {/* فلتر الفترة — Day/Week/Month/Year داخل الهيدر */}
        <div style={{ background:"rgba(0,0,0,0.15)", padding:"0 20px" }}>
          <div style={{ display:"flex" }}>
            {[["day","يوم"],["week","أسبوع"],["month","شهر"],["year","سنة"]].map(([val,label])=>(
              <button key={val} onClick={()=>setPeriod(val)} style={{
                flex:1, padding:"11px 4px", border:"none", cursor:"pointer",
                fontFamily:"Plus Jakarta Sans", fontSize:13, fontWeight:700, transition:"all .2s",
                background:"transparent",
                color: period===val?"#fff":"rgba(255,255,255,0.5)",
                borderBottom: period===val?"2.5px solid #fff":"2.5px solid transparent",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/*  تقويم التنقل بين التواريخ  */}
        <DateNavigator period={period} />
      </div>

      {/*  White sheet  */}
      <div style={{ background:"#fff", borderRadius:"28px 28px 0 0", marginTop:0 }}>

        {/* تنبيه بيانات تجريبية */}
        {d.isDemo && (
          <div style={{ margin:"14px 16px 0", padding:"8px 12px", background:"#fff8ed", borderRadius:10, border:"1px solid #fde68a", fontSize:11, color:"#92400e" }}>
            بيانات تجريبية — ستُستبدل بقياساتك الفعلية بعد ربط الجهاز
          </div>
        )}

        <div style={{ padding:"14px 16px 0" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:40, color:C.muted }}>
              <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.accent}`, borderTopColor:"transparent", margin:"0 auto 12px", animation:"spin 1s linear infinite" }}/>
              جاري تحميل البيانات...
            </div>
          ) : (

            // 
            // تاب ١: الرسوم البيانية
            // 
            activeTab === "charts" ? (
                <>
                  {/*  الوزن  */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                        <span style={{ fontSize:15, fontWeight:800, color:C.text }}>الوزن</span>
                        <span style={{ fontSize:11, color:C.muted }}>كيلوغرام</span>
                      </div>
                      <div style={{ display:"flex", gap:10 }}>
                        <span style={{ fontSize:9.5, color:"#e74c3c" }}> أعلى</span>
                        <span style={{ fontSize:9.5, color:"#3b82f6" }}> أدنى</span>
                      </div>
                    </div>
                    <div style={{ background:"#f9fdfb", borderRadius:16, padding:"14px 10px 8px", border:`1px solid ${C.border}` }}>
                      <MedChart points={d.weight} color={C.accent} unit="كغ" height={130}/>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginTop:8 }}>
                      {[{l:"أدنى",v:ws.min,c:"#3b82f6"},{l:"متوسط",v:ws.avg,c:C.accent},{l:"أعلى",v:ws.max,c:"#e74c3c"}].map(s=>(
                        <div key={s.l} style={{ background:C.bg, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
                          <div style={{ fontSize:9.5, color:C.muted }}>{s.l}</div>
                          <div style={{ fontSize:17, fontWeight:800, color:s.c, fontFamily:"Nunito" }}>{s.v}</div>
                          <div style={{ fontSize:9, color:C.muted }}>كغ</div>
                        </div>
                      ))}
                    </div>
                    {ws.trend !== 0 && (
                      <div style={{ marginTop:7, padding:"7px 12px", borderRadius:9, background:ws.trend>0?"#fef2f2":"#f0fdf4" }}>
                        <span style={{ fontSize:11, color:ws.trend>0?"#dc2626":"#16a34a", fontWeight:700 }}>
                          {ws.trend>0?"+" : "-"}{Math.abs(ws.trend)} كغ خلال {periodLabel[period]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/*  مؤشر كتلة الجسم BMI — رسم بياني منفرد  */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                        <span style={{ fontSize:15, fontWeight:800, color:C.text }}>مؤشر كتلة الجسم</span>
                        <span style={{ fontSize:11, color:C.muted }}>BMI</span>
                      </div>
                      {bmiInfo && (
                        <span style={{ fontSize:10, fontWeight:700, color:bmiInfo.color, background:bmiInfo.color+"18", padding:"3px 9px", borderRadius:20 }}>{bmiInfo.label}</span>
                      )}
                    </div>
                    <div style={{ background:"#f9fdfb", borderRadius:16, padding:"14px 10px 4px", border:`1px solid ${C.border}` }}>
                      <MedChart points={d.bmi} color={C.purple} height={110} refMin={18.5} refMax={25}/>
                      <div style={{ display:"flex", gap:14, justifyContent:"center", paddingBottom:8 }}>
                        <span style={{ fontSize:8.5, color:"#f97316" }}>- - الحد الأعلى (25)</span>
                        <span style={{ fontSize:8.5, color:"#3b82f6" }}>- - الحد الأدنى (18.5)</span>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:8 }}>
                      {[{l:"أدنى",v:bs.min,c:"#3b82f6"},{l:"أعلى",v:bs.max,c:"#e74c3c"}].map(s=>(
                        <div key={s.l} style={{ background:C.bg, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
                          <div style={{ fontSize:9.5, color:C.muted }}>{s.l}</div>
                          <div style={{ fontSize:17, fontWeight:800, color:s.c, fontFamily:"Nunito" }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/*  تركيب الجسم — بطاقات أدنى/أعلى بدون رسم بياني  */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:12 }}>تركيب الجسم</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {[
                        { label:"الدهون", unit:"%", min:fs.min, max:fs.max, last:fs.last, color:C.orange },
                        { label:"العضلات", unit:"كغ", min:ms.min, max:ms.max, last:ms.last, color:"#2ec4a3" },
                        { label:"الماء", unit:"%", min:wts.min, max:wts.max, last:wts.last, color:C.blue },
                      ].map(item=>(
                        <div key={item.label} style={{ background:"#f9fdfb", borderRadius:14, padding:"12px 14px", border:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{item.label}</span>
                            <span style={{ fontSize:18, fontWeight:800, color:item.color, fontFamily:"Nunito" }}>
                              {item.last}<span style={{ fontSize:11, color:C.muted, marginRight:3 }}>{item.unit}</span>
                            </span>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            <div style={{ background:"#e8f7f4", borderRadius:8, padding:"7px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontSize:10, color:C.muted }}>أدنى</span>
                              <span style={{ fontSize:14, fontWeight:800, color:"#3b82f6", fontFamily:"Nunito" }}>{item.min} <span style={{ fontSize:9, color:C.muted }}>{item.unit}</span></span>
                            </div>
                            <div style={{ background:"#fef2f2", borderRadius:8, padding:"7px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontSize:10, color:C.muted }}>أعلى</span>
                              <span style={{ fontSize:14, fontWeight:800, color:"#e74c3c", fontFamily:"Nunito" }}>{item.max} <span style={{ fontSize:9, color:C.muted }}>{item.unit}</span></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>

            // 
            // تاب ٢: الملخص الطبي
            // 
            ) : activeTab === "summary" ? (
              <>
                {/* بطاقة الملخص الطبي الشاملة */}
                <div style={{ background:"#f9fdfb", borderRadius:16, border:`1.5px solid ${C.border}`, overflow:"hidden", marginBottom:14 }}>
                  {/* رأس الملخص */}
                  <div style={{ background:C.accent, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#fff", fontFamily:"Syne" }}>ملخص الفترة</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.85)" }}>{periodLabel[period]}</div>
                  </div>

                  <div style={{ padding:"12px 14px" }}>
                    {/* الوزن */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.text, marginBottom:6, paddingBottom:4, borderBottom:`1px solid ${C.border}` }}>الوزن</div>
                      <StatRow label="آخر قياس" value={ws.last} unit="كغ" color={C.accent}/>
                      <StatRow label="متوسط الفترة" value={ws.avg} unit="كغ" color={C.text}/>
                      <StatRow label="أدنى قياس" value={ws.min} unit="كغ" color="#3b82f6"/>
                      <StatRow label="أعلى قياس" value={ws.max} unit="كغ" color="#e74c3c"/>
                      <StatRow label="التغيّر الإجمالي" value={ws.trend>0?`+${ws.trend}`:ws.trend} unit="كغ" color={ws.trend>0?"#e74c3c":"#2ec4a3"} trend={undefined}/>
                    </div>

                    {/* تركيب الجسم */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.text, marginBottom:6, paddingBottom:4, borderBottom:`1px solid ${C.border}` }}>تركيب الجسم</div>
                      <StatRow label="مؤشر كتلة الجسم (BMI)" value={bs.last} unit="" color={bmiInfo?.color||C.text}/>
                      {bmiInfo && (
                        <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:4 }}>
                          <span style={{ fontSize:10, color:bmiInfo.color, background:bmiInfo.color+"15", padding:"2px 10px", borderRadius:20, fontWeight:700 }}>{bmiInfo.label}</span>
                        </div>
                      )}
                      <StatRow label="نسبة الدهون" value={fs.last} unit="%" color={C.orange}/>
                      <StatRow label="الكتلة العضلية" value={ms.last} unit="كغ" color="#2ec4a3"/>
                      <StatRow label="نسبة الماء" value={wts.last} unit="%" color={C.blue}/>
                    </div>

                    {/* الأعراض — أسماء الأعراض الأكثر تكراراً */}
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.text, marginBottom:6, paddingBottom:4, borderBottom:`1px solid ${C.border}` }}>الأعراض</div>
                      {(() => {
                        // قائمة الأعراض المسجّلة من بيانات الـ API أو demo
                        const symptomNames = data?.top_symptoms?.length
                          ? data.top_symptoms
                          : ["تعب عام", "ضيق تنفس", "تورم القدمين"]
                        return (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, paddingTop:2 }}>
                            {symptomNames.map((s,i)=>(
                              <div key={i} style={{ display:"flex", alignItems:"center", gap:5, background:C.purple+"12", border:`1px solid ${C.purple}30`, borderRadius:20, padding:"4px 10px" }}>
                                <div style={{ width:6, height:6, borderRadius:"50%", background:C.purple }}/>
                                <span style={{ fontSize:11, color:C.purple, fontWeight:600 }}>{s}</span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* ملاحظات للطبيب */}
                <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#92400e", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    ملاحظات للطبيب
                  </div>
                  <div style={{ fontSize:11, color:"#78350f", lineHeight:1.8 }}>
                    {ws.trend > 1.5 && <div>- زيادة في الوزن بمقدار {ws.trend} كغ خلال {periodLabel[period]} — يُرجى المراجعة</div>}
                    {ws.trend < -1.5 && <div>- انخفاض في الوزن بمقدار {Math.abs(ws.trend)} كغ خلال {periodLabel[period]}</div>}
                    {parseFloat(bs.last) >= 30 && <div>- مؤشر BMI في نطاق السمنة ({bs.last})</div>}
                    {parseFloat(bs.last) < 18.5 && parseFloat(bs.last) > 0 && <div>- مؤشر BMI يشير إلى نقص الوزن ({bs.last})</div>}
                    {parseFloat(wts.last) < 45 && <div>- نسبة الماء منخفضة ({wts.last}%) — احتمال جفاف</div>}
                    {ws.trend <= 1.5 && ws.trend >= -1.5 && parseFloat(bs.last) >= 18.5 && parseFloat(bs.last) < 30 && (
                      <div style={{ color:"#15803d" }}>المؤشرات ضمن النطاق الطبيعي خلال هذه الفترة</div>
                    )}
                  </div>
                </div>
              </>

            ) : null
          )}
        </div>
      </div>
    </div>
  )
}

// Dashboard
// مكوّن رأس القسم مع زر "عرض الكل"
const SectionHeader = ({ title, onExpand, expanded, accent }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</span>
    {onExpand && (
      <button onClick={onExpand} style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: 600, color: accent || C.accent,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        display: "flex", alignItems: "center", gap: 3, padding: "4px 0"
      }}>
        {expanded ? "إخفاء" : "عرض الكل"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {expanded
            ? <polyline points="18 15 12 9 6 15"/>
            : <polyline points="6 9 12 15 18 9"/>}
        </svg>
      </button>
    )}
  </div>
)

function Dashboard({ setPage }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // حالة التوسّع لكل قسم
  // body analysis states moved to dedicated page
  const [showStability, setShowStability]   = useState(false)
  const [showAI, setShowAI]                 = useState(false)

  useEffect(() => {
    apiCall("/users/me/dashboard").then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg,#00b894,#6c5ce7)", animation: "pulse 2s infinite" }} />
      <div style={{ color: C.muted, fontSize: 14 }}>جاري التحميل...</div>
    </div>
  )

  const m = data?.latest_measurement
  const profile = data?.health_profile
  const ws = data?.weight_stats

  return (
    <div className="slide-up" style={{ padding: "0 0 100px", direction: "rtl" }}>

      {/*  رأس الصفحة — مرحبا + الاسم كبير */}
      <div style={{ background: C.headerGrad, padding: "40px 24px 72px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500, marginBottom: 2 }}>مرحبا</div>
            <h2 style={{ fontSize: 38, color: "#fff", fontFamily: "Syne", fontWeight: 900, lineHeight: 1, margin: 0 }}>
              {user?.name}!
            </h2>
            {profile?.is_pregnant && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 8, fontWeight: 600 }}>
                حامل في الأسبوع {profile.pregnancy_week}
              </div>
            )}
          </div>
          {!data?.withings_connected && (
            <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 10, padding: "6px 12px", fontSize: 11, color: "#fff" }}>
              الميزان غير مربوط
            </div>
          )}
        </div>
      </div>

      {/* White sheet */}
      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", marginTop: -36, paddingTop: 0 }}>

      <div style={{ padding: "24px 20px 0" }}>

        {/*  تنبيهات طارئة — خط أحمر جانبي مع نقطة  */}
        {data?.unread_alerts?.filter(a => ["emergency","critical"].includes(a.severity)).length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {data.unread_alerts.filter(a => ["emergency","critical"].includes(a.severity)).map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "stretch", marginBottom: 16, direction: "rtl" }}>
                {/* النقطة + العنوان */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
                    <span style={{ color: C.red, fontWeight: 700, fontSize: 15 }}>{a.title}:</span>
                  </div>
                  {a.message && (
                    <div style={{ color: C.muted, fontSize: 12, paddingRight: 16, lineHeight: 1.6 }}>{a.message}</div>
                  )}
                </div>
                {/* الخط الأحمر الجانبي — يمين لأن RTL */}
                <div style={{ width: 3, background: C.red, borderRadius: 3, marginRight: 12, flexShrink: 0, minHeight: 36 }} />
              </div>
            ))}
          </div>
        )}

        {m ? (
          <>
            {/* ── البطاقات: flex row — الوزن أولاً = يمين الشاشة، ثم عمود BMI+نبض = يسار ── */}
            <div style={{ display: "flex", flexDirection: "row", gap: 14, marginBottom: 24, alignItems: "stretch" }}>

              {/* الوزن — يمين الشاشة (أول عنصر في RTL) */}
              <div style={{
                background: `${C.accent}18`,
                border: `2px solid ${C.accent}`,
                borderRadius: 24,
                padding: "32px 14px",
                textAlign: "center",
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                flex: "0 0 55%",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                minHeight: 190,
              }}>
                <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "'Nunito',sans-serif", color: C.text, lineHeight: 1 }}>
                  {m.weight_kg?.toFixed(1) ?? "—"}
                </div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>كغ</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 12 }}>الوزن</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  {new Date(m.measured_at).toLocaleDateString("ar-SA", { month:"short", day:"numeric" })}
                </div>
              </div>

              {/* BMI + نبض — يسار الشاشة (ثاني عنصر في RTL) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

                {/* BMI */}
                <div style={{
                  background: "#fff", borderRadius: 24, padding: "18px 10px",
                  textAlign: "center", flex: 1,
                  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Nunito',sans-serif", color: C.text, lineHeight: 1, marginBottom: 4 }}>
                    {m.bmi?.toFixed(1) ?? "—"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>BMI</div>
                  {m.bmi && (
                    <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600,
                      color: m.bmi < 18.5 ? C.blue : m.bmi < 25 ? C.accent : m.bmi < 30 ? C.orange : C.red }}>
                      {m.bmi < 18.5 ? "نقص وزن" : m.bmi < 25 ? "مثالي" : m.bmi < 30 ? "زيادة وزن" : "سمنة"}
                    </div>
                  )}
                </div>

                {/* نبض القلب */}
                <div style={{
                  background: "#fff", borderRadius: 24, padding: "18px 10px",
                  textAlign: "center", flex: 1,
                  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Nunito',sans-serif", color: C.text, lineHeight: 1, marginBottom: 4 }}>
                    {m.heart_rate ?? "—"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>نبض القلب</div>
                  {m.heart_rate && (
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>نبضة / د</div>
                  )}
                </div>

              </div>
            </div>

            {/*  متابعة الحمل (دائماً ظاهرة إذا حامل)  */}
            {profile?.is_pregnant && m.pregnancy_weight_gain != null && (
              <Card style={{ marginBottom: 16, borderColor: C.pink + "40", background: "rgba(232,67,147,.03)" }}>
                <h4 style={{ color: C.pink, marginBottom: 14, fontSize: 15 }}>متابعة الحمل</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.pink, fontFamily: "'Nunito',sans-serif" }}>+{m.pregnancy_weight_gain?.toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>زيادة كغ</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, fontFamily: "'Nunito',sans-serif" }}>{profile.pregnancy_week}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>أسبوع الحمل</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.green, fontFamily: "'Nunito',sans-serif" }}>
                      {profile.expected_due_date ? new Date(profile.expected_due_date).toLocaleDateString("ar-SA") : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>موعد الولادة</div>
                  </div>
                </div>
              </Card>
            )}

            {/* 
                القسم ٢ — الرسم البياني + استقرار الوزن
                الرسم دائماً ظاهر، بطاقة SD قابلة للتوسع
             */}
            <Card style={{ marginBottom: 12 }}>
              <SectionHeader title="تغيرات الوزن" />
              <WeightChart data={data.history} stats={ws?.weekly} />

              {/* ملخص SD مضغوط داخل نفس البطاقة */}
              {ws?.weekly && (
                <div
                  onClick={() => setPage("stability")}
                  style={{
                    marginTop: 14, padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: 12, cursor: "pointer",
                    border: `1px solid ${C.border}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: { good: "#05c27c", ok: "#f59e0b", warning: "#f97316", danger: "#ef4444" }[ws.weekly.stability_level] || C.accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>استقرار الوزن</div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {{ good: "وزنك ثابت ومستقر", ok: "تغير خفيف طبيعي", warning: "تغيرات تستحق المتابعة", danger: "تقلبات كبيرة — راجع طبيبك" }[ws.weekly.stability_level]}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>التفاصيل</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              )}
            </Card>

            {/* 
                بطاقة الانتقال لصفحة تحليل الجسم
             */}
            {(m.fat_ratio || m.bmi) && (
              <div
                onClick={() => setPage("body")}
                style={{ marginBottom: 12, cursor: "pointer" }}
              >
                <Card style={{ padding: 0, overflow: "hidden", border: `1px solid ${C.border}`, transition: "transform .15s, box-shadow .15s" }}
                  onClick={() => {}}>
                  {/* شريط علوي أخضر */}
                  <div style={{ height: 4, background: C.headerGrad }} />
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,rgba(124,111,247,.12),rgba(5,194,124,.12))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M8 10h8"/><path d="M10 13l-2 6"/><path d="M14 13l2 6"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>تحليل الجسم</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>تكوين الجسم · BMI · مقارنة بالمعدل</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.accent }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>عرض الكل</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                    {/* معاينة — الوزن و BMI */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { label: "الوزن",  value: m.weight_kg?.toFixed(1), unit: "كغ", color: C.accent },
                        { label: "BMI",    value: m.bmi?.toFixed(1),        unit: "",   color: C.purple },
                        ...(m.heart_rate ? [{ label: "نبض القلب", value: m.heart_rate, unit: "ن/د", color: C.red }] : []),
                      ].filter(s => s.value).map((s, i) => (
                        <div key={i} style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Nunito',sans-serif", color: s.color, lineHeight: 1 }}>
                            {s.value}<span style={{ fontSize: 9, color: C.muted }}>{s.unit ? ` ${s.unit}` : ""}</span>
                          </div>
                          <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* 
                القسم ٦ — تحليل الذكاء الاصطناعي (قابل للتوسع)
             */}
            {m.ai_analysis && (
              <Card style={{ marginBottom: 12, borderColor: C.purple + "30", background: "linear-gradient(135deg,rgba(108,92,231,.03),rgba(0,184,148,.03))" }}>
                <SectionHeader
                  title="تحليل الذكاء الاصطناعي"
                  onExpand={() => setShowAI(s => !s)}
                  expanded={showAI}
                  accent={C.purple}
                />
                {/* معاينة: أول سطر فقط */}
                {!showAI && (
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {m.ai_analysis}
                  </p>
                )}
                {showAI && (
                  <p style={{ lineHeight: 1.9, color: C.text, fontSize: 14, marginTop: 4 }}>{m.ai_analysis}</p>
                )}
              </Card>
            )}
              {/* 
                  زر السجل الصحي
               */}
              <div
                onClick={() => setPage("history")}
                style={{ marginBottom:12, cursor:"pointer" }}
              >
                <Card style={{ padding:"16px 18px", background:"linear-gradient(135deg,rgba(46,196,163,0.05),rgba(124,111,247,0.05))", border:`1px solid ${C.accent}30`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,rgba(46,196,163,.15),rgba(124,111,247,.15))", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:C.text }}>السجل الصحي</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>رسوم بيانية · قياسات · أعراض</div>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </Card>
              </div>
          </>
        ) : (
          <Card style={{ textAlign: "center", padding: 48, marginTop: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#e8f8f2,#f0e8ff)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect x="4" y="18" width="32" height="4" rx="2" fill="#00b894"/><rect x="14" y="8" width="12" height="24" rx="2" fill="#6c5ce7" opacity="0.5"/><circle cx="20" cy="20" r="4" fill="#00b894"/></svg>
            </div>
            <h3 style={{ marginBottom: 8, fontSize: 18, color: C.text }}>لا توجد قياسات بعد</h3>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>اربط ميزانك Withings لرؤية التحليل الصحي</p>
          </Card>
        )}
      </div>
      </div>{/* end white sheet */}
    </div>
  )
}

// Symptoms Page
function SymptomsPage() {
  const { user } = useAuth()
  const [isPregnant, setIsPregnant] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showMonthPicker, setShowMonthPicker] = useState(false)  // month/year picker overlay

  // دالة لحساب تاريخ الـ symptom_date من currentDate
  const getSymptomDate = () => currentDate.toISOString().split("T")[0]


  const [form, setForm] = useState({
    symptom_date: new Date().toISOString().split("T")[0],
    headache_level: 0, swelling_level: 0, nausea_level: 0, fatigue_level: 0,
    blurred_vision: false, upper_abdominal_pain: false, light_sensitivity: false,
    shortness_of_breath: false, dizziness: false, chest_pain: false,
    decreased_urination: false, leg_cramps: false,
    mood: "", sleep_hours: "", water_intake_liters: "", notes: "",
    swelling_location: [],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const SliderRow = ({ label, k }) => {
    const colors = [C.green, "#22d3ee", C.yellow, C.orange, C.red]
    const level = Math.min(4, Math.floor(form[k] / 2))
    return (
      <div style={{ marginBottom: 20, direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: C.text }}>{label}</span>
          <span style={{ fontWeight: 700, color: colors[level], fontSize: 16, minWidth: 24, textAlign: "center" }}>{form[k]}</span>
        </div>
        <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", right: 0, left: 0, height: 6, borderRadius: 3, background: C.border }} />
          <div style={{ position: "absolute", right: 0, width: `${form[k] * 10}%`, height: 6, borderRadius: 3, background: `linear-gradient(to left, ${colors[level]}, ${colors[0]})`, transition: "width .2s" }} />
          <input
            type="range" min="0" max="10" value={form[k]}
            onChange={e => up(k, parseInt(e.target.value))}
            style={{ position: "absolute", right: 0, left: 0, width: "100%", opacity: 0, height: 32, cursor: "pointer", direction: "rtl" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: 10, color: C.muted }}>شديد جداً</span>
          <span style={{ fontSize: 10, color: C.muted }}>لا يوجد</span>
        </div>
      </div>
    )
  }

  const ToggleChip = ({ k, label, color }) => (
    <div onClick={() => up(k, !form[k])} style={{ padding: "12px 16px", borderRadius: 12, cursor: "pointer", border: `2px solid ${form[k] ? color : C.border}`, background: form[k] ? `${color}10` : "#fff", transition: "all .2s", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${form[k] ? color : C.border}`, background: form[k] ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {form[k] && <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
      </div>
      <span style={{ fontSize: 13, flex: 1, color: C.text }}>{label}</span>
    </div>
  )

  const save = async () => {
    setSaving(true)
    const payload = { ...form, symptom_date: getSymptomDate() }
    await apiCall("/symptoms/", { method: "POST", body: JSON.stringify(payload) })
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="slide-up" style={{ padding: "0 0 100px" }}>
      <div style={{ background: C.headerGrad, padding: "28px 20px 50px" }}>
        <h2 style={{ fontSize: 22, color: "#fff", fontFamily: "Syne", fontWeight: 800, marginBottom: 2 }}>تسجيل الأعراض</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>سجّل كيف تشعر اليوم</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "16px 16px 0" }}>

      {/*  منتقي التاريخ — Week Strip  */}
      {(() => {
        const today = new Date(); today.setHours(0,0,0,0)

        // بداية الأسبوع (السبت)
        const weekStart = new Date(currentDate); weekStart.setHours(0,0,0,0)
        const diffToSat = (weekStart.getDay() - 6 + 7) % 7
        weekStart.setDate(weekStart.getDate() - diffToSat)
        const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d })

        const selStr   = currentDate.toDateString()
        const todayStr = today.toDateString()
        const isToday  = selStr === todayStr
        const monthLabel = currentDate.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })
        const dayNamesAr = ["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"]

        const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d) }
        const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d<=today ? d : new Date(today)) }
        const canGoNext = new Date(currentDate).setDate(currentDate.getDate()+1) <= today

        // بيانات month picker
        const pickerYear  = currentDate.getFullYear()
        const pickerMonth = currentDate.getMonth()
        const monthsAr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
        const currentYear = today.getFullYear()
        const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i)  // آخر 5 سنوات + الحالية

        const selectMonthYear = (m, y) => {
          const d = new Date(currentDate)
          d.setFullYear(y); d.setMonth(m)
          // إذا كان في المستقبل، اذهب لآخر يوم متاح في ذلك الشهر
          if (d > today) {
            setCurrentDate(new Date(today))
          } else {
            // إذا كان اليوم المحدد أكبر من أيام الشهر، اذهب لآخر يوم
            const lastDay = new Date(y, m+1, 0).getDate()
            if (d.getDate() > lastDay) d.setDate(lastDay)
            setCurrentDate(d)
          }
          setShowMonthPicker(false)
        }

        return (
          <div style={{ marginBottom: 24, borderRadius: 20, background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: `1px solid ${C.border}`, overflow: "hidden", position: "relative" }}>

            {/*  رأس: اليوم + زر الشهر/السنة  */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, fontFamily: "Plus Jakarta Sans" }}>
                {isToday ? "اليوم" : currentDate.toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={prevWeek} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>

                {/* زر الشهر/السنة — يفتح الـ picker */}
                <button
                  onClick={() => setShowMonthPicker(s => !s)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${showMonthPicker ? C.accent : "#e2e8f0"}`, background: showMonthPicker ? `${C.accent}10` : "#f8fafc", cursor: "pointer", transition: "all .2s" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: showMonthPicker ? C.accent : "#475569" }}>{monthLabel}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={showMonthPicker ? C.accent : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "transform .2s", transform: showMonthPicker ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                <button onClick={nextWeek} disabled={!canGoNext} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: canGoNext ? "#f1f5f9" : "transparent", cursor: canGoNext ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={canGoNext ? "#64748b" : "#cbd5e1"} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>

            {/*  Month/Year Picker Dropdown  */}
            {showMonthPicker && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 14px 10px", background: "#fafbfc" }}>

                {/* اختيار السنة */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 7, letterSpacing: ".5px" }}>السنة</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {years.map(y => {
                      const isCur = y === pickerYear
                      const isFut = y > currentYear
                      return (
                        <button key={y} disabled={isFut} onClick={() => selectMonthYear(pickerMonth, y)} style={{
                          padding: "6px 14px", borderRadius: 20, border: "none", cursor: isFut ? "default" : "pointer",
                          background: isCur ? C.accent : "#f1f5f9",
                          color: isCur ? "#fff" : isFut ? "#cbd5e1" : "#475569",
                          fontSize: 13, fontWeight: isCur ? 700 : 500,
                          fontFamily: "'Nunito', sans-serif",
                          boxShadow: isCur ? `0 2px 8px ${C.accent}40` : "none",
                          transition: "all .15s",
                        }}>
                          {y}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* اختيار الشهر */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 7, letterSpacing: ".5px" }}>الشهر</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                    {monthsAr.map((mn, idx) => {
                      const isCur  = idx === pickerMonth && pickerYear === currentDate.getFullYear()
                      const isFut  = new Date(pickerYear, idx, 1) > today
                      return (
                        <button key={idx} disabled={isFut} onClick={() => selectMonthYear(idx, pickerYear)} style={{
                          padding: "8px 4px", borderRadius: 12, border: "none", cursor: isFut ? "default" : "pointer",
                          background: isCur ? C.accent : "#f1f5f9",
                          color: isCur ? "#fff" : isFut ? "#cbd5e1" : "#475569",
                          fontSize: 12, fontWeight: isCur ? 700 : 500,
                          fontFamily: "Plus Jakarta Sans",
                          boxShadow: isCur ? `0 2px 8px ${C.accent}40` : "none",
                          transition: "all .15s",
                        }}>
                          {mn}
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>
            )}

            {/*  شريط الأيام السبعة  */}
            <div style={{ display: "flex", gap: 6, padding: "0 12px 16px", justifyContent: "space-between" }}>
              {days.map((d, i) => {
                const isSel    = d.toDateString() === selStr
                const isT      = d.toDateString() === todayStr
                const isFuture = d > today
                const dayNum   = d.getDay()
                return (
                  <button
                    key={i}
                    onClick={() => !isFuture && setCurrentDate(new Date(d))}
                    disabled={isFuture}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "10px 0 8px",
                      borderRadius: 14,
                      border: "none",
                      cursor: isFuture ? "default" : "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      fontFamily: "Plus Jakarta Sans",
                      transition: "all .18s",
                      // المحدد: تدرج أخضر مع ظل
                      background: isSel
                        ? `linear-gradient(160deg, #05c27c 0%, #00a66a 100%)`
                        : isT
                        ? "rgba(5,194,124,0.08)"
                        : "#f8fafc",
                      boxShadow: isSel ? "0 4px 16px rgba(5,194,124,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
                      border: isT && !isSel ? `1.5px solid ${C.accent}40` : "1.5px solid transparent",
                      opacity: isFuture ? 0.3 : 1,
                    }}
                  >
                    {/* رقم اليوم */}
                    <span style={{
                      fontSize: 18, fontWeight: 800,
                      fontFamily: "'Nunito', sans-serif",
                      color: isSel ? "#fff" : isFuture ? "#94a3b8" : C.text,
                      lineHeight: 1,
                    }}>
                      {d.getDate()}
                    </span>
                    {/* اسم اليوم */}
                    <span style={{
                      fontSize: 9, fontWeight: isSel ? 700 : 500,
                      color: isSel ? "rgba(255,255,255,0.85)" : "#94a3b8",
                      letterSpacing: 0,
                    }}>
                      {dayNamesAr[dayNum]}
                    </span>
                  </button>
                )
              })}
            </div>

          </div>
        )
      })()}

      <Card style={{ marginBottom: 16 }}>
        <h4 style={{ color: C.accent, marginBottom: 20, fontSize: 14, fontWeight: 700 }}>الأعراض العامة</h4>
        <SliderRow label="الصداع" k="headache_level" />
        <SliderRow label="التعب" k="fatigue_level" />
        <SliderRow label="الغثيان" k="nausea_level" />
        <ToggleChip k="shortness_of_breath" label="صعوبة التنفس" color={C.red} />
        <ToggleChip k="dizziness" label="دوار" color={C.yellow} />
        <ToggleChip k="chest_pain" label="ألم في الصدر" color={C.red} />
      </Card>

      {user?.gender === "female" && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isPregnant ? 20 : 0 }}>
            <h4 style={{ color: C.pink, fontSize: 14, fontWeight: 700 }}>أعراض الحمل</h4>
            <div onClick={() => setIsPregnant(!isPregnant)} style={{ width: 46, height: 24, borderRadius: 12, background: isPregnant ? C.pink : C.border, position: "relative", cursor: "pointer", transition: "all .3s" }}>
              <div style={{ position: "absolute", top: 3, left: isPregnant ? 25 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all .3s" }} />
            </div>
          </div>
          {isPregnant && (
            <>
              <SliderRow label="التورم" k="swelling_level" />
              <ToggleChip k="blurred_vision" label="تشوش الرؤية" color={C.pink} />
              <ToggleChip k="upper_abdominal_pain" label="ألم أعلى البطن" color={C.pink} />
              <ToggleChip k="light_sensitivity" label="حساسية للضوء" color={C.pink} />
            </>
          )}
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <h4 style={{ color: C.accent, marginBottom: 16, fontSize: 14, fontWeight: 700 }}>النوم والترطيب</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div><label>ساعات النوم</label><input type="number" step=".5" value={form.sleep_hours} onChange={e => up("sleep_hours", e.target.value)} placeholder="7.5" /></div>
          <div><label>الماء (لتر)</label><input type="number" step=".1" value={form.water_intake_liters} onChange={e => up("water_intake_liters", e.target.value)} placeholder="2.0" /></div>
        </div>
        <label>المزاج</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {[["great","سعيد"],["good","جيد"],["okay","عادي"],["bad","سيء"],["terrible","صعب"]].map(([v,l]) => (
            <div key={v} onClick={() => up("mood", v)} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: 12, cursor: "pointer", fontSize: 11, fontWeight: 600, border: `2px solid ${form.mood === v ? C.accent : C.border}`, background: form.mood === v ? `rgba(0,184,148,.1)` : "#fff", transition: "all .2s", color: form.mood === v ? C.accent : C.muted }}>{l}</div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <label>ملاحظات إضافية</label>
        <textarea value={form.notes} onChange={e => up("notes", e.target.value)} rows={3} placeholder="أي شيء تريد إضافته..." style={{ resize: "none" }} />
      </Card>

      {saved && (
        <div style={{ background: "rgba(0,184,148,.08)", border: "1px solid #00b894", borderRadius: 12, padding: 14, color: C.green, textAlign: "center", fontWeight: 600, marginBottom: 16 }}>
          تم حفظ الأعراض بنجاح
        </div>
      )}

      <Btn onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ الأعراض"}</Btn>
      </div>{/* end white sheet */}
    </div>
  )
}

// Alerts Page
function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiCall("/alerts/").then(data => { setAlerts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const markRead = async (id) => {
    await apiCall(`/alerts/${id}/read`, { method: "PUT" })
    setAlerts(a => a.map(al => al.id === id ? { ...al, is_read: true } : al))
  }

  const severityColors = { emergency: C.red, critical: C.orange, warning: C.yellow, info: C.green }
  const severityLabels = { emergency: "طارئ", critical: "حرج", warning: "تحذير", info: "معلومة" }

  return (
    <div className="slide-up" style={{ padding: "0 0 100px" }}>
      <div style={{ background: C.headerGrad, padding: "28px 20px 50px" }}>
        <h2 style={{ fontSize: 22, color: "#fff", fontFamily: "Syne", fontWeight: 800 }}>التنبيهات</h2>
      </div>
      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "16px 16px 0" }}>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>جاري التحميل...</div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 56, height: 56, borderRadius: 20, background: "#f0f4f8", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div style={{ color: C.muted }}>لا توجد تنبيهات</div>
        </div>
      ) : alerts.map(a => (
        <div key={a.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, cursor: a.is_read ? "default" : "pointer" }}
          onClick={() => !a.is_read && markRead(a.id)}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: severityColors[a.severity], marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: severityColors[a.severity], fontSize: 14 }}>{a.title}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge color={severityColors[a.severity]}>{severityLabels[a.severity]}</Badge>
                  {!a.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{new Date(a.created_at).toLocaleString("ar-SA")}</div>
            </div>
          </div>
        </div>
      ))}
      </div>{/* end white sheet */}
    </div>
  )
}

// Settings Page
function SettingsPage({ setPage }) {
  const { user, setUser, logout } = useAuth()
  const [profile, setProfile] = useState(user?.health_profile || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const up = (k, v) => setProfile(p => ({ ...p, [k]: v }))

  const connectWithings = async () => {
    const data = await apiCall("/auth/withings/connect")
    if (data.auth_url) window.open(data.auth_url, "_blank")
  }

  const save = async () => {
    setSaving(true)
    const allowed = [
      "is_pregnant","pregnancy_week","pregnancy_start_date","pre_pregnancy_weight",
      "has_kidney_disease","on_dialysis","dry_weight_kg","dialysis_days",
      "has_diabetes","diabetes_type","has_hypertension","has_heart_disease",
      "target_weight","activity_level","medications","has_health_goal",
    ]
    const payload = Object.fromEntries(Object.entries(profile).filter(([k]) => allowed.includes(k)))
    const data = await apiCall("/users/me/health-profile", { method: "PUT", body: JSON.stringify(payload) })
    if (data.profile) { const me = await apiCall("/users/me"); setUser(me); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  const Toggle = ({ k, label, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 14, color: C.text }}>{label}</span>
      <div onClick={() => up(k, !profile[k])} style={{ width: 46, height: 24, borderRadius: 12, background: profile[k] ? (color || C.accent) : C.border, position: "relative", cursor: "pointer", transition: "all .3s" }}>
        <div style={{ position: "absolute", top: 3, left: profile[k] ? 25 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all .3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  )

  return (
    <div className="slide-up" style={{ padding: "0 0 100px" }}>
      <div style={{ background: C.headerGrad, padding: "28px 20px 50px" }}>
        <h2 style={{ fontSize: 22, color: "#fff", fontFamily: "Syne", fontWeight: 800, marginBottom: 2 }}>الإعدادات</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>الملف الصحي والإعدادات</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", marginTop: -24, padding: "16px 16px 0" }}>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, color: C.text }}>ميزان Withings</div>
            <div style={{ fontSize: 12, color: user?.withings_connected ? C.green : C.muted }}>{user?.withings_connected ? "مربوط" : "غير مربوط"}</div>
          </div>
          <Btn onClick={connectWithings} style={{ width: "auto", padding: "10px 18px", fontSize: 13 }}>ربط</Btn>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h4 style={{ color: C.accent, marginBottom: 16, fontSize: 14, fontWeight: 700 }}>الحالات الطبية</h4>
        <Toggle k="has_kidney_disease" label="أمراض الكلى" />
        <Toggle k="on_dialysis" label="غسيل الكلى" />
        <Toggle k="has_diabetes" label="السكري" color={C.yellow} />
        <Toggle k="has_hypertension" label="ارتفاع ضغط الدم" color={C.red} />
        <Toggle k="has_heart_disease" label="أمراض القلب" color={C.red} />
        {profile.on_dialysis && (
          <div style={{ marginTop: 14 }}>
            <label>الوزن الجاف (كغ)</label>
            <input type="number" step=".1" value={profile.dry_weight_kg || ""} onChange={e => up("dry_weight_kg", e.target.value ? parseFloat(e.target.value) : null)} placeholder="70.0" />
          </div>
        )}

        {/*  زر الأعراض الصحية الجانبية  */}
        <div
          onClick={() => setPage("weightcauses")}
          style={{
            marginTop: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 14, cursor: "pointer",
            background: "linear-gradient(135deg, rgba(124,111,247,0.08), rgba(5,194,124,0.08))",
            border: "1.5px solid rgba(124,111,247,0.25)",
            transition: "all .2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>أعراض صحية جانبية</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>أسباب تغير الوزن المفاجئ وتفعيل الأعراض</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" transform="scale(-1,1) translate(-24,0)"/></svg>
        </div>
      </Card>

      {user?.gender === "female" && (
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ color: C.pink, marginBottom: 16, fontSize: 14, fontWeight: 700 }}>وضع الحمل</h4>
          <Toggle k="is_pregnant" label="أنا حامل" color={C.pink} />
          {profile.is_pregnant && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label>أسبوع الحمل</label><input type="number" min="1" max="42" value={profile.pregnancy_week || ""} onChange={e => up("pregnancy_week", e.target.value ? parseInt(e.target.value) : null)} placeholder="20" /></div>
              <div><label>تاريخ آخر دورة</label><input type="date" value={profile.pregnancy_start_date?.split("T")[0] || ""} onChange={e => up("pregnancy_start_date", e.target.value)} /></div>
              <div><label>الوزن قبل الحمل (كغ)</label><input type="number" step=".1" value={profile.pre_pregnancy_weight || ""} onChange={e => up("pre_pregnancy_weight", e.target.value ? parseFloat(e.target.value) : null)} placeholder="65" /></div>
            </div>
          )}
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: profile.has_health_goal ? 16 : 0 }}>
          <div>
            <h4 style={{ color: C.accent, fontSize: 14, fontWeight: 700 }}>الهدف الصحي</h4>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>تفعيل لتتبع هدفك الصحي</p>
          </div>
          <div onClick={() => up("has_health_goal", !profile.has_health_goal)} style={{ width: 46, height: 24, borderRadius: 12, background: profile.has_health_goal ? C.accent : C.border, position: "relative", cursor: "pointer", transition: "all .3s" }}>
            <div style={{ position: "absolute", top: 3, left: profile.has_health_goal ? 25 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all .3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
        {profile.has_health_goal && (
          <>
            <div><label>الوزن المستهدف (كغ)</label><input type="number" step=".1" value={profile.target_weight || ""} onChange={e => up("target_weight", e.target.value ? parseFloat(e.target.value) : null)} placeholder="65" /></div>
            <div style={{ marginTop: 12 }}>
              <label>مستوى النشاط</label>
              <select value={profile.activity_level || "moderate"} onChange={e => up("activity_level", e.target.value)}>
                <option value="sedentary">خامل</option>
                <option value="light">خفيف</option>
                <option value="moderate">متوسط</option>
                <option value="active">نشيط</option>
                <option value="very_active">نشيط جداً</option>
              </select>
            </div>
          </>
        )}
      </Card>

      <ReminderSection />

      {saved && <div style={{ background: "rgba(0,184,148,.08)", border: "1px solid #00b894", borderRadius: 12, padding: 14, color: C.green, textAlign: "center", fontWeight: 600, marginBottom: 16 }}>تم الحفظ بنجاح</div>}

      <Btn onClick={save} disabled={saving} style={{ marginBottom: 12 }}>{saving ? "جاري..." : "حفظ الإعدادات"}</Btn>

      <Btn variant="danger" onClick={logout}>تسجيل الخروج</Btn>
      </div>{/* end white sheet */}
    </div>
  )
}

// صفحة استقرار الوزن المستقلة
function StabilityPage({ onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    apiCall("/users/me/dashboard").then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.accent}`, borderTopColor:"transparent", animation:"spin 1s linear infinite" }} />
    </div>
  )

  const ws = data?.weight_stats
  const profile = data?.health_profile

  return (
    <WeightStabilityCard
      weekly={ws?.weekly}
      monthly={ws?.monthly}
      isKidney={profile?.has_kidney_disease}
      isPregnant={profile?.is_pregnant}
      onBack={onBack}
    />
  )
}

// Main App


//  صفحة تحليل الجسم 
function BodyAnalysisPage({ onBack }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiCall("/users/me/dashboard").then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const m = data?.latest_measurement

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", flexDirection:"column", gap:12 }}>
      <div style={{ width:48, height:48, borderRadius:16, background:`linear-gradient(135deg,${C.purple},${C.blue})`, animation:"pulse 2s infinite" }} />
      <div style={{ color:C.muted, fontSize:14 }}>جاري التحميل...</div>
    </div>
  )
  if (!m) return (
    <div className="slide-up" style={{ padding: "20px 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ width:38, height:38, borderRadius:12, background:"#fff", border:`1px solid ${C.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ fontSize: 20, color: C.text }}>تحليل الجسم</h2>
      </div>
      <Card style={{ textAlign: "center", padding: 48 }}>
        
        <p style={{ color: C.muted, fontSize: 14 }}>لا توجد بيانات كافية بعد</p>
      </Card>
    </div>
  )

  return (
    <div className="slide-up" style={{ padding: "0 0 100px" }}>

      {/*  رأس الصفحة  */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, background: "#fff", border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h2 style={{ fontSize: 20, color: C.text, lineHeight: 1 }}>تحليل الجسم</h2>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
              آخر قياس: {new Date(m.measured_at).toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/*  ملخص سريع — 4 أرقام  */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "الدهون",   value: m.fat_ratio?.toFixed(1),     unit: "%",  color: C.orange },
            { label: "الماء",    value: m.water_ratio?.toFixed(1),    unit: "%",  color: C.blue   },
            { label: "العضلات",  value: m.muscle_mass_kg?.toFixed(1), unit: "كغ", color: C.green  },
            { label: "العظام",   value: m.bone_mass_kg?.toFixed(1),   unit: "كغ", color: "#a78bfa"},
          ].filter(s => s.value).map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "14px 10px", textAlign: "center", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ position: "relative", height: 3, borderRadius: 2, background: C.border, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${Math.min(100, parseFloat(s.value))}%`, background: C.accent, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Nunito',sans-serif", color: s.color, lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: 10, color: C.muted, fontFamily: "Plus Jakarta Sans", fontWeight: 500 }}> {s.unit}</span>
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/*  تكوين الجسم — دونات  */}
        {m.fat_ratio && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>
              تكوين الجسم
            </div>
            <DonutChart fat={m.fat_ratio} water={m.water_ratio} muscle={m.muscle_mass_kg} bone={m.bone_mass_kg} weight={m.weight_kg} />
          </Card>
        )}

        {/*  مؤشر كتلة الجسم  */}
        {m.bmi && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>
              مؤشر كتلة الجسم (BMI)
            </div>
            <BMIGauge bmi={m.bmi} />
          </Card>
        )}

        {/*  مقارنة بالمعدل الطبيعي  */}
        {(m.fat_ratio || m.water_ratio || m.heart_rate) && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>
              مقارنة بالمعدل الطبيعي
            </div>
            <MetricBar label="نسبة الدهون"  value={m.fat_ratio}   min={user?.gender==="female"?20:10} max={user?.gender==="female"?32:20} unit="%" color={C.orange} />
            <MetricBar label="نسبة الماء"   value={m.water_ratio} min={user?.gender==="female"?50:60} max={user?.gender==="female"?60:65} unit="%" color={C.blue} />
            {m.heart_rate && <MetricBar label="معدل القلب" value={m.heart_rate} min={60} max={100} unit="نبضة/د" color={C.red} />}
            {m.muscle_mass_kg && m.weight_kg && (
              <MetricBar label="العضلات" value={+((m.muscle_mass_kg/m.weight_kg)*100).toFixed(1)}
                min={user?.gender==="female"?30:40} max={user?.gender==="female"?40:50} unit="%" color={C.green} />
            )}
          </Card>
        )}



      </div>
    </div>
  )
}

//  Push Notification Helper 
async function requestPushPermission() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null
  const perm = await Notification.requestPermission()
  if (perm !== "granted") return null
  return perm
}

function scheduleLocalReminder(timeStr, enabled) {
  // نستخدم localStorage لحفظ الإعداد وsetInterval للتحقق
  if (!enabled || !timeStr) { localStorage.removeItem("etizan_reminder"); return }
  localStorage.setItem("etizan_reminder", JSON.stringify({ time: timeStr, enabled }))
}

function checkDailyReminder() {
  try {
    const saved = localStorage.getItem("etizan_reminder")
    if (!saved) return
    const { time, enabled } = JSON.parse(saved)
    if (!enabled || !time) return
    const lastShown = localStorage.getItem("etizan_reminder_last")
    const today = new Date().toDateString()
    if (lastShown === today) return
    const [h, m] = time.split(":").map(Number)
    const now = new Date()
    if (now.getHours() === h && now.getMinutes() >= m) {
      const msgs = [
        "صباح الخير — وقت الوزن الصباحي — قبل الأكل وبعد الحمام",
        "لا تنسَ وزنك الصباحي — الثبات هو المفتاح",
        "الوزن الدقيق يبدأ بصباح منتظم ",
        "خطوة صغيرة كل صباح = صحة أفضل على المدى البعيد ",
        "استيقظت بعزم! وزنك الصباحي ينتظرك ⏰",
        "قياس واحد في اليوم يجعل طبيبك سعيداً ",
        "صحتك أمانة — تابعها كل صباح ",
      ]
      const msg = msgs[new Date().getDay() % msgs.length]
      if (Notification.permission === "granted") {
        new Notification("اتزان — تذكير صباحي", { body: msg, icon: "/Etizan-logo.png" })
      }
      localStorage.setItem("etizan_reminder_last", today)
    }
  } catch(e) {}
}

//  شاشة جلسة الغسيل 
function DialysisPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [marked, setMarked] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduledDates, setScheduledDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem("etizan_dialysis_schedule") || "[]") } catch { return [] }
  })
  const [newDate, setNewDate] = useState("")

  const addScheduledDate = () => {
    if (!newDate) return
    const updated = [...new Set([...scheduledDates, newDate])].sort()
    setScheduledDates(updated)
    localStorage.setItem("etizan_dialysis_schedule", JSON.stringify(updated))
    setNewDate("")
  }
  const removeScheduledDate = (d) => {
    const updated = scheduledDates.filter(x => x !== d)
    setScheduledDates(updated)
    localStorage.setItem("etizan_dialysis_schedule", JSON.stringify(updated))
  }

  const load = () => {
    setLoading(true)
    apiCall("/users/me/dialysis-session").then(d => { setData(d); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const markDone = async () => {
    setMarking(true)
    await apiCall("/users/me/dialysis-session/mark-done", { method: "POST" })
    setMarked(true); setMarking(false)
    setTimeout(() => { setMarked(false); load() }, 2000)
  }

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", flexDirection:"column", gap:12 }}>
      <div style={{ width:48, height:48, borderRadius:16, background:"linear-gradient(135deg,#ef4444,#f97316)", animation:"pulse 2s infinite" }} />
      <div style={{ color:C.muted, fontSize:14 }}>جاري التحميل...</div>
    </div>
  )

  if (!data?.on_dialysis) return (
    <div className="slide-up" style={{ padding:"20px 16px 100px" }}>
      <h2 style={{ marginBottom:4, fontSize:22, color:C.text }}>جلسة الغسيل</h2>
      <Card style={{ textAlign:"center", padding:48, marginTop:20 }}>
        <div style={{ fontSize:48, marginBottom:12 }}></div>
        <h3 style={{ color:C.text, marginBottom:8 }}>غير مفعّل</h3>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>
          فعّل "غسيل الكلى" من الإعدادات وأدخل وزنك الجاف لتظهر هذه الشاشة
        </p>
      </Card>
    </div>
  )

  const dangerColors = { safe:"#05c27c", warning:"#f97316", danger:"#ef4444", low:"#2196f3" }
  const dangerBgs    = { safe:"rgba(5,194,124,.05)", warning:"rgba(249,115,22,.05)", danger:"rgba(239,68,68,.06)", low:"rgba(33,150,243,.05)" }
  const dangerBorders= { safe:"rgba(5,194,124,.25)", warning:"rgba(249,115,22,.25)", danger:"rgba(239,68,68,.3)", low:"rgba(33,150,243,.25)" }
  const dc = dangerColors[data.danger_level] || C.muted
  const fluidPct = data.fluid_pct ?? 0
  const safeMax = 3 // 3% حد أقصى للعرض
  const barPct = Math.min(100, (fluidPct / safeMax) * 100)

  const dayLabels = {
    Monday:"الاثنين", Tuesday:"الثلاثاء", Wednesday:"الأربعاء", Thursday:"الخميس",
    Friday:"الجمعة", Saturday:"السبت", Sunday:"الأحد",
    "الاثنين":"الاثنين","الثلاثاء":"الثلاثاء","الأربعاء":"الأربعاء","الخميس":"الخميس",
    "الجمعة":"الجمعة","السبت":"السبت","الأحد":"الأحد"
  }

  return (
    <div className="slide-up" style={{ padding:"0 0 100px" }}>
      {/* Header */}
      <div style={{ background: C.headerGrad, padding:"28px 20px 50px" }}>
        <h2 style={{ fontSize:22, color:"#fff", fontFamily:"Syne", fontWeight:800, marginBottom:2 }}>جلسة الغسيل</h2>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)" }}>متابعة السوائل بين الجلسات</div>
      </div>
      <div style={{ background:"#fff", borderRadius:"28px 28px 0 0", marginTop:-24, padding:"16px 16px 0" }}>

        {/*  بطاقة الحالة الرئيسية  */}
        <Card style={{ marginBottom:14, border:`1px solid ${C.border}`, background:"#fff", padding:0, overflow:"hidden" }}>
          {/* شريط علوي بألوان الأمان */}
          <div style={{ height:4, background:"linear-gradient(90deg, #05c27c 0%, #05c27c 66%, #f97316 80%, #94a3b8 100%)", width:"100%", opacity:.5 }} />
          <div style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>السوائل المتراكمة</div>
                <div style={{ fontSize:40, fontWeight:900, fontFamily:"'Nunito',sans-serif", color:dc, lineHeight:1 }}>
                  {data.fluid_accumulated_kg != null ? `+${data.fluid_accumulated_kg.toFixed(1)}` : "—"}
                  <span style={{ fontSize:16, color:C.muted, fontFamily:"Plus Jakarta Sans", fontWeight:500 }}> كغ</span>
                </div>
                {data.fluid_pct != null && (
                  <div style={{ fontSize:13, color:dc, fontWeight:600, marginTop:4 }}>{data.fluid_pct.toFixed(1)}% من وزنك الجاف</div>
                )}
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>وزنك الجاف</div>
                <div style={{ fontSize:22, fontWeight:800, color:C.purple, fontFamily:"'Nunito',sans-serif" }}>{data.dry_weight_kg}</div>
                <div style={{ fontSize:11, color:C.muted }}>كغ</div>
              </div>
            </div>

            {/* شريط السوائل */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginBottom:8 }}>
                <span style={{ color:"#64748b" }}>خطر (+3%)</span>
                <span style={{ color:"#f97316" }}>تحذير (2–3%)</span>
                <span style={{ color:"#05c27c", fontWeight:600 }}>آمن (أقل من 2%)</span>
                <span>0 كغ</span>
              </div>
              {/* الشريط — direction:ltr دائماً حتى يعمل left بشكل صحيح */}
              <div style={{ position:"relative", height:18, borderRadius:9, direction:"ltr" }}>
                {/* خلفية */}
                <div style={{ position:"absolute", inset:0, background:"#f1f5f9", borderRadius:9 }} />
                {/* نطاق آمن — اليمين (0-66%) */}
                <div style={{ position:"absolute", top:0, right:0, width:"66%", height:"100%", background:"rgba(5,194,124,0.15)", borderRadius:"0 9px 9px 0" }} />
                {/* نطاق تحذير */}
                <div style={{ position:"absolute", top:0, right:"66%", width:"14%", height:"100%", background:"rgba(249,115,22,0.12)" }} />
                {/* نطاق خطر — اليسار */}
                <div style={{ position:"absolute", top:0, right:"80%", width:"20%", height:"100%", background:"rgba(100,116,139,0.08)", borderRadius:"9px 0 0 9px" }} />
                {/* خطوط الفصل */}
                <div style={{ position:"absolute", top:"15%", right:"66%", width:1.5, height:"70%", background:"rgba(249,115,22,.4)", borderRadius:1 }} />
                <div style={{ position:"absolute", top:"15%", right:"80%", width:1.5, height:"70%", background:"rgba(100,116,139,.3)", borderRadius:1 }} />
                {/* الشريط يمتد من اليمين */}
                <div style={{
                  position:"absolute", top:3, right:3,
                  width:`calc(${barPct}% - 6px)`, height:"calc(100% - 6px)",
                  background:dc, borderRadius:6,
                  boxShadow:`0 1px 6px ${dc}50`,
                  transition:"width 1.2s cubic-bezier(0.34,1.56,0.64,1)",
                  minWidth:0,
                }} />
                {/* دائرة المؤشر — تتحرك من اليمين */}
                <div style={{
                  position:"absolute", top:"50%",
                  right:`calc(${barPct}% - 10px)`,
                  transform:"translateY(-50%)",
                  width:20, height:20, borderRadius:"50%",
                  background:"#fff", border:`2.5px solid ${dc}`,
                  boxShadow:`0 2px 8px ${dc}60`,
                  transition:"right 1.2s cubic-bezier(0.34,1.56,0.64,1)",
                  zIndex:2,
                  display:"flex", alignItems:"center", justifyContent:"center"
                }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:dc }} />
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.muted, marginTop:5, direction:"rtl" }}>
                <span>0%</span>
                <span style={{ color:"#05c27c" }}>2%</span>
                <span style={{ color:"#f97316" }}>3%</span>
                <span>+3%</span>
              </div>
            </div>

            {/* رسالة الحالة */}
            {data.danger_msg && (
              <div style={{ fontSize:13, color:dc, fontWeight:600, lineHeight:1.6, padding:"10px 14px", background:`${dc}10`, borderRadius:10, border:`1px solid ${dc}30` }}>
                {data.danger_level === "danger" ? "" : data.danger_level === "warning" ? "" : ""}
                {data.danger_msg}
              </div>
            )}
          </div>
        </Card>

        {/*  مقارنة الوزن الحالي vs الجاف  */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <Card style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>الوزن الحالي</div>
            <div style={{ fontSize:28, fontWeight:900, fontFamily:"'Nunito',sans-serif", color:C.accent, lineHeight:1 }}>
              {data.current_weight_kg?.toFixed(1) ?? "—"}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>كغ</div>
            {data.last_measured_at && (
              <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>
                {new Date(data.last_measured_at).toLocaleDateString("ar-SA")}
              </div>
            )}
          </Card>
          <Card style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>الوزن الجاف المستهدف</div>
            <div style={{ fontSize:28, fontWeight:900, fontFamily:"'Nunito',sans-serif", color:C.purple, lineHeight:1 }}>
              {data.dry_weight_kg?.toFixed(1) ?? "—"}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>كغ</div>
            <div style={{ fontSize:10, color:C.purple, marginTop:6, fontWeight:600 }}>وزنك بعد الجلسة</div>
          </Card>
        </div>

        {/*  الجلسة القادمة  */}
        {(() => {
          // أولوية: الجلسات المجدولة يدوياً، ثم بيانات API
          const today = new Date(); today.setHours(0,0,0,0)
          const nextManual = scheduledDates
            .filter(d => new Date(d) >= today)
            .sort()[0]
          const nextDate = nextManual || data.next_session_date
          const daysUntil = nextDate
            ? Math.round((new Date(nextDate) - today) / 86400000)
            : data.days_until_session
          return (
            <Card style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>الجلسة القادمة</div>
                  {nextDate ? (
                    <div>
                      <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>
                        {new Date(nextDate).toLocaleDateString("ar-SA", { weekday:"long", day:"numeric", month:"long" })}
                      </div>
                      {nextManual && (
                        <div style={{ fontSize:11, color:C.accent, marginTop:2 }}>من جدولك الشخصي</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:C.muted }}>لم تُحدَّد أيام الغسيل — أضف من جدول أدناه</div>
                  )}
                </div>
                {daysUntil != null && (
                  <div style={{ textAlign:"center", background: daysUntil <= 1 ? "rgba(239,68,68,.08)" : "rgba(5,194,124,.08)", borderRadius:14, padding:"10px 16px", border:`1px solid ${daysUntil <= 1 ? "#ef444440":"#05c27c40"}` }}>
                    <div style={{ fontSize:24, fontWeight:900, fontFamily:"'Nunito',sans-serif", color: daysUntil <= 1 ? C.red : C.accent, lineHeight:1 }}>
                      {daysUntil === 0 ? "اليوم" : daysUntil}
                    </div>
                    {daysUntil !== 0 && <div style={{ fontSize:10, color:C.muted }}>يوم متبقي</div>}
                  </div>
                )}
              </div>
              {data.dialysis_days?.length > 0 && (
                <div style={{ display:"flex", gap:6, marginTop:12, flexWrap:"wrap" }}>
                  {data.dialysis_days.map(d => (
                    <span key={d} style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:C.accent+"15", color:C.accent, fontWeight:600, border:`1px solid ${C.accent}30` }}>
                      {dayLabels[d] || d}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )
        })()}

        {/*  جدول الجلسات القادمة  */}
        <Card style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: showScheduler ? 14 : 0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:"rgba(46,196,163,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>جدول الجلسات القادمة</div>
            </div>
            <button onClick={() => setShowScheduler(s=>!s)} style={{
              background: showScheduler ? C.accent : "rgba(46,196,163,0.1)",
              color: showScheduler ? "#fff" : C.accent,
              border:"none", borderRadius:10, padding:"6px 14px",
              fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Plus Jakarta Sans"
            }}>{showScheduler ? "إخفاء" : "تعديل"}</button>
          </div>

          {showScheduler && (
            <div>
              {/* إضافة تاريخ جديد */}
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ flex:1, fontSize:13, padding:"10px 12px", borderRadius:10 }}
                />
                <button onClick={addScheduledDate} style={{
                  background:C.accent, color:"#fff", border:"none", borderRadius:10,
                  padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Plus Jakarta Sans",
                  whiteSpace:"nowrap"
                }}>+ إضافة</button>
              </div>

              {/* قائمة الجلسات المجدولة */}
              {scheduledDates.length === 0 ? (
                <div style={{ textAlign:"center", padding:"16px 0", color:C.muted, fontSize:13 }}>لم تُضَف جلسات بعد</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {scheduledDates.map(d => {
                    const date = new Date(d)
                    const today = new Date(); today.setHours(0,0,0,0)
                    const diff = Math.round((date - today) / 86400000)
                    const isPast = diff < 0
                    return (
                      <div key={d} style={{
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                        padding:"10px 14px", borderRadius:12,
                        background: isPast ? "#f8fafc" : "rgba(46,196,163,0.06)",
                        border: `1px solid ${isPast ? C.border : C.accent+"30"}`,
                        opacity: isPast ? .6 : 1
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background: isPast ? C.muted : C.accent, flexShrink:0 }}/>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>
                              {date.toLocaleDateString("ar-SA", { weekday:"long", day:"numeric", month:"long" })}
                            </div>
                            <div style={{ fontSize:11, color: isPast ? C.muted : C.accent, marginTop:1 }}>
                              {isPast ? "مضت" : diff === 0 ? "اليوم" : `بعد ${diff} يوم`}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeScheduledDate(d)} style={{
                          background:"rgba(231,76,60,0.08)", border:"none", borderRadius:8,
                          width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ملخص مضغوط عندما المجدول مخفي */}
          {!showScheduler && scheduledDates.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
              {scheduledDates.slice(0,4).filter(d => new Date(d) >= new Date()).map(d => (
                <span key={d} style={{ fontSize:11, padding:"4px 10px", borderRadius:20, background:"rgba(46,196,163,0.1)", color:C.accent, fontWeight:600 }}>
                  {new Date(d).toLocaleDateString("ar-SA", { day:"numeric", month:"short" })}
                </span>
              ))}
              {scheduledDates.filter(d => new Date(d) >= new Date()).length > 4 && (
                <span style={{ fontSize:11, padding:"4px 10px", borderRadius:20, background:C.border, color:C.muted }}>+{scheduledDates.filter(d => new Date(d) >= new Date()).length - 4}</span>
              )}
            </div>
          )}
        </Card>

        {/*  تاريخ القياسات (آخر 7 أيام)  */}
        {data.history?.length > 1 && (
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:14 }}>السوائل خلال الأيام الأخيرة</div>
            <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:80 }}>
              {data.history.slice(-7).map((h, i) => {
                const fkg = h.fluid_kg ?? 0
                const maxFluid = 4
                const barH = Math.max(8, Math.min(72, (Math.abs(fkg) / maxFluid) * 72))
                const col = fkg >= 3 ? "#ef4444" : fkg >= 2 ? "#f97316" : fkg >= 0 ? "#05c27c" : "#2196f3"
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ fontSize:9, color:col, fontWeight:700 }}>{fkg > 0 ? `+${fkg.toFixed(1)}` : fkg.toFixed(1)}</div>
                    <div style={{ width:"100%", height:barH, borderRadius:4, background:col, opacity:.8, minHeight:6, transition:"height .5s" }} />
                    <div style={{ fontSize:8, color:C.muted }}>
                      {new Date(h.measured_at).toLocaleDateString("ar-SA", { day:"numeric", month:"numeric" })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:8 }}>السوائل المتراكمة (كغ) مقارنةً بالوزن الجاف</div>
          </Card>
        )}

        {/*  تسجيل إتمام الجلسة  */}
        {marked ? (
          <div style={{ background:"rgba(5,194,124,.08)", border:"1px solid #05c27c40", borderRadius:14, padding:16, textAlign:"center", color:C.green, fontWeight:700, marginBottom:14 }}>
            تم تسجيل جلسة الغسيل بنجاح
          </div>
        ) : (
          <Btn onClick={markDone} disabled={marking} style={{ background:`linear-gradient(135deg,#ef4444,#f97316)`, boxShadow:"0 4px 15px rgba(239,68,68,0.3)" }}>
            {marking ? "جاري التسجيل..." : "أنهيت جلسة الغسيل اليوم"}
          </Btn>
        )}

        {/*  تعليمات مهمة  */}
        <Card style={{ marginTop:14, background:"linear-gradient(135deg,rgba(33,150,243,.04),rgba(5,194,124,.04))", border:"1px solid rgba(33,150,243,.15)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.blue, marginBottom:8 }}> نصائح لقياس دقيق</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.9 }}>
            - قِس وزنك <strong style={{ color:C.text }}>صباحاً قبل الأكل</strong> وبعد الحمام<br/>
            - استخدم نفس الميزان في نفس الوقت يومياً<br/>
            - إذا تجاوزت <strong style={{ color:"#ef4444" }}>3% من وزنك الجاف</strong>، اتصل بمركز الغسيل<br/>
            - سجّل جلستك بعد كل غسيل للمتابعة الدقيقة
          </div>
        </Card>
      </div>
    </div>
  )
}

//  التذكير الصباحي (ضمن الإعدادات) 
function ReminderSection() {
  const [time, setTime] = useState(localStorage.getItem("etizan_reminder_time") || "07:00")
  const [enabled, setEnabled] = useState(localStorage.getItem("etizan_reminder_enabled") === "true")
  const [perm, setPerm] = useState(Notification?.permission || "default")
  const [saved, setSaved] = useState(false)

  const requestPerm = async () => {
    const result = await requestPushPermission()
    if (result) setPerm("granted")
  }

  const save = async () => {
    localStorage.setItem("etizan_reminder_time", time)
    localStorage.setItem("etizan_reminder_enabled", enabled ? "true" : "false")
    scheduleLocalReminder(time, enabled)
    await apiCall("/users/me/reminder", { method:"PUT", body: JSON.stringify({ reminder_time: time, reminder_enabled: enabled }) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: enabled ? 16 : 0 }}>
        <div>
          <h4 style={{ color:C.accent, fontSize:14, fontWeight:700 }}>التذكير الصباحي</h4>
          <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>تذكير يومي لقياس وزنك الصباحي</p>
        </div>
        <div onClick={() => setEnabled(e => !e)} style={{ width:46, height:24, borderRadius:12, background:enabled ? C.accent : C.border, position:"relative", cursor:"pointer", transition:"all .3s" }}>
          <div style={{ position:"absolute", top:3, left:enabled ? 25 : 3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"all .3s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
      </div>

      {enabled && (
        <>
          <div style={{ marginBottom:14 }}>
            <label>وقت التذكير</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ fontSize:20, fontWeight:700, fontFamily:"'Nunito',sans-serif", textAlign:"center", color:C.accent }} />
          </div>

          {perm !== "granted" && (
            <div style={{ background:"rgba(255,193,7,.08)", border:"1px solid rgba(255,193,7,.3)", borderRadius:12, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#b45309" }}>اسمح للإشعارات لتلقي التذكير</span>
              <button onClick={requestPerm} style={{ fontSize:11, fontWeight:700, color:"#fff", background:"#f59e0b", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"Plus Jakarta Sans" }}>
                السماح
              </button>
            </div>
          )}

          {saved && <div style={{ color:C.green, fontSize:12, fontWeight:600, textAlign:"center", marginBottom:8 }}>تم حفظ التذكير</div>}
          <Btn onClick={save}>حفظ التذكير</Btn>
        </>
      )}
    </Card>
  )
}

//  أعراض صحية جانبية — أسباب تغير الوزن المفاجئ 
function WeightCausesPage({ onBack }) {
  const storageKey = "etizan_weight_causes_active"
  const [activeConditions, setActiveConditions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}") } catch { return {} }
  })

  const toggle = (id) => {
    setActiveConditions(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  const conditions = [
    {
      id: "thyroid",
      title: "الغدة الدرقية",
      subtitle: "قصور أو فرط نشاط الغدة الدرقية",
      color: "#7c6ff7",
      desc: "قصور الغدة الدرقية يُبطئ الأيض ويسبب زيادة تدريجية في الوزن مع التعب وجفاف الجلد والإحساس بالبرد. فرط نشاطها بالمقابل يرفع معدل الأيض ويؤدي لفقدان الوزن غير المبرر مع الرعشة والتعرق.",
      warning: null,
      medications: null,
    },
    {
      id: "gi",
      title: "أمراض الجهاز الهضمي",
      subtitle: "سوء الامتصاص واضطرابات الهضم",
      color: "#0891b2",
      desc: "الداء الزلاقي (السيلياك)، مرض كرون، أو متلازمة القولون العصبي تُعيق امتصاص المغذيات وتسبب فقدان الوزن غير المبرر. الانتفاخ المزمن أو الاحتباس قد يضيف وزناً ظاهرياً غير حقيقي.",
      warning: null,
      medications: null,
    },
    {
      id: "heart",
      title: "قصور القلب",
      subtitle: "احتباس السوائل بسبب ضعف ضخ القلب",
      color: "#dc2626",
      desc: "عندما يضعف القلب عن ضخ الدم بكفاءة، تحتجز الكلى السوائل في الأنسجة مما يسبب ارتفاعاً مفاجئاً في الوزن مصحوباً بتورم في الساقين وضيق تنفس.",
      warning: "ارتفاع أكثر من 2 كغ خلال يومين مع ضيق التنفس يستوجب مراجعة الطبيب فوراً",
      medications: null,
    },
    {
      id: "pcos",
      title: "التكيسات",
      subtitle: "متلازمة تكيس المبايض واضطرابات هرمونية",
      color: "#db2777",
      desc: "تكيس المبايض يُحدث مقاومة للإنسولين ويرفع مستوى الأندروجين، مما يؤدي لتراكم الدهون خاصةً في منطقة البطن وصعوبة ملحوظة في خسارة الوزن رغم اتباع الحمية.",
      warning: null,
      medications: null,
    },
    {
      id: "medications",
      title: "الأدوية",
      subtitle: "هل تتناول أدوية من أعراضها زيادة الوزن؟",
      color: "#059669",
      desc: "عدد من الأدوية الشائعة تُحفّز الشهية أو تسبب احتباس السوائل أو تُبطئ الأيض، مما يؤدي لزيادة ملحوظة في الوزن.",
      warning: null,
      medications: [
        "مضادات الاكتئاب (مثل أميتريبتيلين، باروكستين)",
        "الكورتيزون ومشتقاته",
        "أدوية السكري (الأنسولين، سلفونيل يوريا)",
        "بعض أدوية ضغط الدم (بيتا بلوكرز)",
        "مضادات الذهان وبعض مثبتات المزاج",
        "بعض الفيتامينات والمكملات الغذائية المحفّزة للشهية",
      ],
    },
  ]

  const activeCount = conditions.filter(c => activeConditions[c.id]).length

  return (
    <div className="slide-up" style={{ padding:"0 0 40px", direction:"rtl", minHeight:"100vh", background:C.bg }}>

      {/* رأس الصفحة */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"16px 16px 14px", position:"sticky", top:0, zIndex:10, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onBack} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div style={{ flex:1 }}>
            <h2 style={{ fontSize:17, fontWeight:800, color:C.text, margin:0 }}>أعراض صحية جانبية</h2>
            <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>فعّل الحالات التي تنطبق عليك</p>
          </div>
          {activeCount > 0 && (
            <div style={{ background:`linear-gradient(135deg,${C.accent},${C.purple})`, color:"#fff", fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>
              {activeCount} مفعّل
            </div>
          )}
        </div>
      </div>

      <div style={{ padding:"16px 16px 0" }}>

        {/* وصف الصفحة */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
          <p style={{ fontSize:12, color:"#475569", lineHeight:1.85, margin:0 }}>
            بعض الحالات الصحية تؤثر بشكل مباشر على الوزن بصورة مفاجئة أو مستمرة. فعّل الحالات التي تعاني منها لتحسين دقة تحليل وزنك.
          </p>
        </div>

        {/* قائمة الحالات */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {conditions.map(cond => {
            const isActive = !!activeConditions[cond.id]
            return (
              <div key={cond.id} style={{ background:"#fff", border:isActive ? `1.5px solid ${cond.color}45` : `1px solid ${C.border}`, borderRadius:14, overflow:"hidden", transition:"all .25s" }}>

                {/* شريط لوني علوي */}
                <div style={{ height:3, background:isActive ? cond.color : `${cond.color}20`, transition:"background .3s" }} />

                <div style={{ padding:"14px 14px 12px" }}>

                  {/* رأس البطاقة */}
                  <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom: isActive ? 12 : 0 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:isActive ? cond.color : C.text, transition:"color .3s", marginBottom:3 }}>{cond.title}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{cond.subtitle}</div>
                    </div>
                    {/* مفتاح التفعيل */}
                    <div onClick={() => toggle(cond.id)} style={{ width:46, height:24, borderRadius:12, background:isActive ? cond.color : C.border, position:"relative", cursor:"pointer", transition:"all .3s", flexShrink:0 }}>
                      <div style={{ position:"absolute", top:3, left:isActive?25:3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"all .3s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
                    </div>
                  </div>

                  {/* التفاصيل — تظهر عند التفعيل */}
                  {isActive && (
                    <div style={{ borderTop:`1px solid ${cond.color}15`, paddingTop:12 }}>

                      <p style={{ fontSize:12, color:"#475569", lineHeight:1.9, margin:"0 0 10px" }}>{cond.desc}</p>

                      {/* قائمة الأدوية */}
                      {cond.medications && (
                        <div style={{ background:`${cond.color}05`, border:`1px solid ${cond.color}18`, borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:cond.color, marginBottom:8 }}>أمثلة على هذه الأدوية</div>
                          {cond.medications.map((med, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom: i < cond.medications.length - 1 ? 6 : 0 }}>
                              <div style={{ width:4, height:4, borderRadius:"50%", background:"#94a3b8", flexShrink:0, marginTop:6 }} />
                              <span style={{ fontSize:12, color:"#475569", lineHeight:1.7 }}>{med}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* التحذير */}
                      {cond.warning && (
                        <div style={{ background:"rgba(220,38,38,0.04)", border:"1px solid rgba(220,38,38,0.15)", borderRadius:10, padding:"9px 12px", marginBottom:10 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#991b1b", marginBottom:3 }}>تنبيه طبي</div>
                          <span style={{ fontSize:11, color:"#b91c1c", lineHeight:1.7 }}>{cond.warning}</span>
                        </div>
                      )}

                      {/* حالة التفعيل */}
                      <div style={{ padding:"7px 10px", borderRadius:8, background:`${cond.color}06`, border:`1px solid ${cond.color}18` }}>
                        <span style={{ fontSize:11, fontWeight:600, color:cond.color }}>سيُؤخذ بالاعتبار في تحليل وزنك</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* تنبيه طبي */}
        <div style={{ marginTop:14, padding:"11px 14px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:12 }}>
          <p style={{ fontSize:11, color:"#64748b", lineHeight:1.75, margin:0 }}>
            هذه المعلومات للتوعية فقط. استشر طبيبك دائماً عند أي تغير مفاجئ في وزنك.
          </p>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState("dashboard")
  const [authMode, setAuthMode] = useState("splash")

  //  كل الـ hooks يجب أن تكون هنا قبل أي return 
  const isDialysis = user?.health_profile?.on_dialysis


  useEffect(() => {
    if (!user) return
    checkDailyReminder()
    const interval = setInterval(checkDailyReminder, 60000)
    return () => clearInterval(interval)
  }, [user])

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: C.splashGrad }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: C.accent, margin: "0 auto 12px", animation: "pulse 2s infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="2" fill="white" stroke="none"/></svg>
        </div>
        <div style={{ color: C.muted, marginTop: 12, fontSize: 14, fontWeight: 600 }}>جاري التحميل...</div>
      </div>
    </div>
  )

  if (!user) return authMode === "login"
    ? <LoginPage onSwitch={() => setAuthMode("register")} />
    : authMode === "register"
    ? <RegisterPage onSwitch={() => setAuthMode("login")} />
    : <SplashScreen onLogin={() => setAuthMode("login")} onRegister={() => setAuthMode("register")} />

  const tabs = [
    { id: "dashboard", Icon: ICONS.home, label: "الرئيسية" },
    ...(isDialysis ? [{ id: "dialysis", Icon: ICONS.kidney, label: "الغسيل" }] : []),
    { id: "symptoms", Icon: ICONS.contract, label: "الأعراض" },
    { id: "alerts", Icon: ICONS.notification, label: "التنبيهات" },
    { id: "settings", Icon: ICONS.setting, label: "الإعدادات" },
  ]

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", minHeight: "100vh", background: C.bg, overflowX: "hidden" }}>
      <div>
        {page === "dashboard" && <Dashboard setPage={setPage} />}
        {page === "history"   && <HistoryPage onBack={() => setPage("dashboard")} />}
        {page === "body"      && <BodyAnalysisPage onBack={() => setPage("dashboard")} />}
        {page === "dialysis"  && <DialysisPage />}
        {page === "symptoms" && <SymptomsPage />}
        {page === "weightcauses" && <WeightCausesPage onBack={() => setPage("settings")} />}
        {page === "alerts" && <AlertsPage />}
        {page === "settings" && <SettingsPage setPage={setPage} />}
        {page === "stability" && <StabilityPage onBack={() => setPage("dashboard")} />}
      </div>

      {/* Bottom Tab Bar */}
      {page !== "weightcauses" && page !== "stability" && (
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "#ffffff",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        zIndex: 100,
        boxShadow: "0 -2px 16px rgba(0,0,0,0.07)",
      }}>
        {tabs.map(tab => {
          const active = page === tab.id
          return (
            <button key={tab.id} onClick={() => setPage(tab.id)} style={{
              flex: 1, padding: "10px 4px 6px", border: "none", background: "none",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              fontFamily: "Plus Jakarta Sans", transition: "all .2s",
            }}>
              {/* active pill background */}
              <div style={{ width: 44, height: 30, borderRadius: 10, background: active ? "rgba(46,196,163,0.12)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                <tab.Icon color={active ? C.accent : "#b0c4be"} />
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? C.accent : "#b0c4be", transition: "all .2s" }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <>
      <style>{css}</style>
      <AuthProvider><AppContent /></AuthProvider>
    </>
  )
}