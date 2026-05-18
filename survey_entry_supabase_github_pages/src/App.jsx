import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ╔════════════════════════════════════════════════════════════════╗
// ║  LANGUAGE STRINGS — Replace values to switch language         ║
// ║  Only replace the text after the colon, keep the keys as-is  ║
// ╚════════════════════════════════════════════════════════════════╝
const L = {
  appTitle: "Survey Data Entry System",
  appSubtitle: "Employment Perceptions & Capacity Development — 2026",
  login: "Log In",
  username: "Username",
  password: "Password",
  loginError: "Invalid username or password",
  logout: "Log Out",
  dashboard: "My Entries",
  addNew: "+ New Survey Entry",
  noEntries: "No entries yet. Click the button above to start entering survey data.",
  view: "View",
  edit: "Edit",
  del: "Delete",
  delConfirm: "Delete this entry? This cannot be undone.",
  allComplete: "✓ Mark All Entries Complete",
  allCompleteConfirm: "Confirm that ALL your assigned surveys have been entered? The administrator will be notified.",
  completedMsg: "✓ You have marked all entries as complete.",
  flagHaphazard: "Suspected haphazard filling",
  flagIllegible: "Illegible handwriting/notes",
  qualityLabel: "Quality Assessment",
  surveyForm: "Survey Entry Form",
  entryId: "Entry ID",
  save: "Save Entry",
  saving: "Saving...",
  cancel: "Cancel",
  required: "Required",
  selectRank: "Rank",
  rankPlaceholder: "—",
  otherSpecify: "Other (please specify):",
  pleaseSelect: "Please complete all required fields before saving.",
  part1: "(I) Basic Information",
  part2: "(II) Employment Perceptions",
  part3: "(III) Capacity Development",
  part4: "(IV) Role of the University/School",
  partExtra: "Contact Information",
  emailLabel: "Email address (optional)",
  interviewLabel: "Willing to participate in follow-up interview?",
  yes: "Yes",
  no: "No",
  adminDashboard: "Administrator Dashboard",
  clerkStatus: "Clerk Status",
  complete: "Complete",
  inProgress: "In Progress",
  entries: "entries",
  exportAll: "Export All Data (CSV)",
  exportJSON: "Export All Data (JSON)",
  noData: "No data submitted yet.",
  viewEntries: "View",
  hideEntries: "Hide",
  notifications: "Notifications",
  noNotifications: "No notifications yet.",
  notifComplete: "has marked all entries as complete",
  clearNotif: "Clear",
};

// ╔════════════════════════════════════════════════════════════════╗
// ║  THEME — Warm cream-paper palette                             ║
// ╚════════════════════════════════════════════════════════════════╝
const T = {
  pageBg: "#FAF7F2",
  cardBg: "#FFFDF9",
  cardBorder: "#E8E0D4",
  cardShadow: "0 1px 3px rgba(140,120,90,0.06)",
  headerBg: "#F5F0E8",
  headerBorder: "#DDD5C8",
  textPrimary: "#3D3529",
  textSecondary: "#7A6E5D",
  textMuted: "#A89F90",
  accent: "#B8784E",
  accentHover: "#A06840",
  accentLight: "#F5EDE5",
  accentBorder: "#D4A574",
  selectedBg: "#F0E8DC",
  selectedBorder: "#C9B8A0",
  greenBg: "#EEF3E6",
  greenBorder: "#C2D4A8",
  greenText: "#4A6630",
  amberBg: "#FBF3E4",
  amberBorder: "#E4CFA4",
  amberText: "#8A6D30",
  redBg: "#F9EDEA",
  redBorder: "#E4C4BA",
  redText: "#8A4030",
  inputBg: "#FFFEF9",
  inputBorder: "#DDD5C8",
  inputFocus: "#C9A87C",
};

const css = {
  page: { background: T.pageBg, color: T.textPrimary, minHeight: "100vh", fontFamily: "'Newsreader', 'Georgia', 'Palatino', serif" },
  card: { background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, boxShadow: T.cardShadow },
  sectionHead: { color: T.textPrimary, borderBottom: `2px solid ${T.accentBorder}`, background: `${T.headerBg}ee`, backdropFilter: "blur(8px)" },
  btn: { background: T.accent, color: "#FFFDF9", borderRadius: 10, fontWeight: 600, border: "none", cursor: "pointer", transition: "background 0.2s" },
  btnSec: { background: T.headerBg, color: T.textSecondary, borderRadius: 10, fontWeight: 600, border: `1px solid ${T.headerBorder}`, cursor: "pointer", transition: "background 0.2s" },
  input: { background: T.inputBg, border: `1.5px solid ${T.inputBorder}`, borderRadius: 10, outline: "none", fontFamily: "inherit" },
};

// ╔════════════════════════════════════════════════════════════════╗
// ║  QUESTIONNAIRE DEFINITION                                     ║
// ╚════════════════════════════════════════════════════════════════╝
const QUESTIONS = [
  { id:"q1", section:1, label:"1. What is your current degree level?", type:"single",
    opts:["Academic master's student","Professional master's student","Doctoral student"] },
  { id:"q2", section:1, label:"2. What is your current year of study?", type:"single",
    opts:["Year 1","Year 2","Year 3","Year 4 or above"] },
  { id:"q3", section:1, label:"3. What is your broad field of study?", type:"single",
    opts:[
      "Dept. of Economics (Political Economy, Western Economics, Economic History, History of Economic Thought)",
      "Dept. of Econometrics & Quantitative Economics (Econometrics, Quantitative Economics)",
      "Dept. of International Economics (World Economy, International Trade, Development Economics, International Business)",
      "Digital Economy (Digital Economy, Enterprise Economics)"
    ] },
  { id:"q4", section:1, label:"4. What is your gender?", type:"single",
    opts:["Male","Female"] },
  { id:"q5", section:1, label:"5. Which career directions are you mainly inclined to consider? (Select 1–3)", type:"multi", min:1, max:3,
    opts:[
      "Universities and research institutes",
      "Party/government agencies and public institutions",
      "Central/state-owned enterprises, including state-owned financial institutions",
      "Private enterprises, foreign-invested enterprises, and other companies",
      "Entrepreneurship and flexible employment",
    ],
    exclusive:"I have not yet clarified my future development direction" },
  { id:"q6", section:1, label:"6. When choosing a job, which factors would you prioritize? Select 3 and rank by importance.", type:"rank", count:3,
    opts:[
      "Salary and benefits",
      "Job stability",
      "Career development prospects",
      "Work-life balance",
      "Whether the position can use economics-related professional abilities",
      "Whether the work content can help develop abilities and provide exposure to frontier fields",
      "Fit with personal interests and values",
    ],
    hasOther:true },
  { id:"q7a", section:2, label:"7(a) The impact of AI has affected my judgment about my future career direction.", type:"conditional",
    branch1Label: "No significant impact, or my career-path change was not caused by AI",
    branch2Label: "It has had a considerable impact. The career direction I originally considered was:",
    branch2Opts:[
      "Universities and research institutes",
      "Government agencies and public institutions",
      "Central/state-owned enterprises, including state-owned financial institutions",
      "Private enterprises, foreign-invested enterprises, and other companies",
      "Entrepreneurship and flexible employment",
    ] },
  { id:"q7b", section:2, label:"7(b) I think AI will change the concrete content and ways of completing economics-related work.", type:"single",
    opts:["Strongly agree","Somewhat agree","Neutral or uncertain","Somewhat disagree","Strongly disagree"] },
  { id:"q7c", section:2, label:"7(c) Facing the changes brought by AI, I can roughly judge which abilities will become more important.", type:"single",
    opts:["Can judge completely","Can judge generally","Can judge some aspects","Cannot judge very well","Can hardly judge at all"] },
  { id:"q8", section:2, label:"8. If you feel pressure or uncertainty, what are its main sources? (Select 1–3)", type:"multi", min:1, max:3,
    opts:[
      "Overall employment opportunities and expected returns are unclear",
      "Not clear about which abilities will truly be needed in the future",
      "I know my ability weaknesses, but it is difficult to improve them in a targeted way",
      "I worry that what I learn at school is disconnected from actual work content",
      "AI and other technological changes have weakened my confidence in my comparative advantage",
      "Lack of peers with whom I can communicate deeply and lack of supportive environment",
      "Peer competition or family expectations bring pressure",
      "Cannot obtain reliable sources of information and career-experience references",
      "My time and energy are compressed by multiple tasks",
    ],
    exclusive:"I do not currently have obvious anxiety",
    hasOther:true },
  { id:"q9", section:2, label:"9. Facing the above changes, what actions have you already taken? (Select at least 1)", type:"multi", min:1, max:99,
    opts:[
      "I consciously pay attention to macroeconomic trends, policy directions, and national strategies",
      "I consolidate my economics foundation and the abilities I need",
      "I actively learn AI tools or related skills, and follow technological developments",
      "I seek internships, projects, or opportunities to engage with real business/work tasks",
      "I contact and discuss similar topics with classmates, teachers, alumni, and others",
      "I re-examine my career plan and keep track of employment dynamics and industry information",
    ],
    exclusive:"I have not taken especially targeted action, or I have only passively received related information",
    hasOther:true },
  { id:"q10", section:2.5, label:"10. Which description best matches your current use of AI tools?", type:"single",
    opts:[
      "I use AI deeply and actively explore new ways of using it",
      "I often use AI in academic tasks, such as assisting with writing, coding, etc.",
      "I sometimes use AI in simple scenarios such as translation, search, or casual conversation",
      "I rarely use or do not use AI tools"
    ] },
  { id:"q11", section:2.5, label:"11. After coming into contact with AI tools, has the frequency of the following learning activities changed?", type:"matrix",
    rows:[
      "(a) Carefully reading long and difficult texts",
      "(b) Raising questions or forming ideas",
      "(c) Organizing thoughts and clearly writing out viewpoints",
      "(d) Checking whether information and reasoning processes are reliable",
      "(e) Sustaining focus for a long time to advance difficult tasks"
    ],
    cols:["Increased","Basically unchanged","Decreased","Rarely use AI"] },
  { id:"q12", section:2.5, label:"12. For the career direction(s) you selected in Q5, which abilities are most important? Select 3 and rank by importance.", type:"rank", count:3,
    opts:[
      "Understanding national macro-policy directions and industry changes",
      "Solid economics foundation and theoretical thinking framework",
      "Ability to identify valuable entry points for problems and form ideas",
      "Ability to distinguish and evaluate information quality, with strength in integrated judgment",
      "Good data intuition and ability to use tools for analysis",
      "Ability to communicate effectively and collaborate to advance tasks",
      "Ability to arrange time and energy reasonably, adjust state, and continue learning",
    ],
    hasOther:true },
  { id:"q13", section:2.5, label:"13. For the ability you ranked No. 1 above, how would you assess your current mastery?", type:"single",
    opts:[
      "Already relatively mature; I can understand or use it fairly well",
      "I have some foundation, but it is not yet stable or deep enough",
      "I know it is important, but I lack systematic training and accumulation",
      "I am not only unskilled in it, but also not very clear about how to improve it"
    ] },
  { id:"q14", section:2.5, label:"14. For the ability you ranked No. 1, through which pathways is it mainly formed? (Select 1–3)", type:"multi", min:1, max:3,
    opts:[
      "In-class teaching by instructors and course assignments",
      "Research training and the process of writing papers/reports",
      "Internships, social practice, or experience with actual work tasks",
      "Communication, discussion, and feedback with teachers, classmates, or seniors",
      "My own long-term self-directed exploration and accumulation",
    ],
    exclusive:"I am currently not very clear about how this ability is formed",
    hasOther:true },
  { id:"q15", section:3, label:"15. Have you participated in or heard about the following employment-guidance resources?", type:"matrix",
    rows:[
      "(a) Job fairs and employer information sessions organized by the University/School",
      "(b) One-on-one consultation provided by the University/School",
      "(c) Employment guidance and industry-sharing lectures organized by the University/School",
      "(d) Mock interviews and resume revision on the Smart Career Development Center platform",
      "(e) Consulting alumni through connections arranged by the School",
      "(f) Company-visit activities"
    ],
    cols:["Participated multiple times","Participated once","Heard of it but did not participate","Never heard of it"] },
  { id:"q16", section:3, label:"16. For employment-related support, where does the University/School most need additional action? (Select 1–3)", type:"multi", min:1, max:3,
    opts:[
      "Information support (timely and clear information about employment situation, industry changes, etc.)",
      "Knowledge support (supplement career-related professional knowledge through courses, lectures, or training)",
      "Guidance support (help students connect personal interests, ability foundations, and future destinations)",
      "Project support (provide training or practice projects closer to real work or research contexts)",
      "Environmental support (create open atmosphere for teacher-student discussion, peer exchange, alumni sharing)",
      "Time and space support (leave students more flexible time for autonomous planning, exploration, trial and error)",
    ],
    hasOther:true },
];

// ╔════════════════════════════════════════════════════════════════╗
// ║  FONTS                                                        ║
// ╚════════════════════════════════════════════════════════════════╝
function FontLoader() {
  return <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />;
}
const sans = "'Source Sans 3', 'Segoe UI', sans-serif";

// ╔════════════════════════════════════════════════════════════════╗
// ║  QUESTION RENDERERS                                           ║
// ╚════════════════════════════════════════════════════════════════╝
function OptLabel({ selected, exclusive, disabled, readOnly, children, onClick }) {
  return (
    <div onClick={(!readOnly && !disabled) ? onClick : undefined}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 14px", borderRadius: 10, cursor: readOnly || disabled ? "default" : "pointer",
        background: selected ? T.selectedBg : "transparent",
        border: `1.5px solid ${selected ? T.selectedBorder : T.cardBorder}`,
        opacity: disabled ? 0.45 : readOnly ? 0.85 : 1,
        transition: "all 0.15s ease",
        borderStyle: exclusive ? "dashed" : "solid",
      }}>
      {children}
    </div>
  );
}

function SingleQ({ q, value, onChange, readOnly }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {q.opts.map((opt, i) => (
        <OptLabel key={i} selected={value === opt} readOnly={readOnly} onClick={() => onChange(opt)}>
          <input type="radio" name={q.id} checked={value === opt} readOnly style={{ marginTop: 2, accentColor: T.accent }} />
          <span style={{ fontSize: 14, lineHeight: 1.55, fontFamily: sans }}>{opt}</span>
        </OptLabel>
      ))}
    </div>
  );
}

function MultiQ({ q, value, onChange, otherText, onOtherChange, readOnly }) {
  const selected = value || [];
  const isExcl = selected.includes(q.exclusive);
  const toggle = (opt) => {
    if (readOnly) return;
    if (opt === q.exclusive) { onChange(selected.includes(opt) ? [] : [opt]); return; }
    let next = selected.filter(s => s !== q.exclusive);
    if (next.includes(opt)) next = next.filter(s => s !== opt);
    else if (next.length < q.max) next = [...next, opt];
    onChange(next);
  };
  const allOpts = [...q.opts, ...(q.exclusive ? [q.exclusive] : [])];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 12, color: T.textMuted, fontFamily: sans, margin: 0 }}>
        {q.min === q.max ? `Select exactly ${q.min}` : q.max < 10 ? `Select ${q.min}–${q.max}` : `Select at least ${q.min}`}
        {selected.length > 0 && ` · ${selected.length} selected`}
      </p>
      {allOpts.map((opt, i) => {
        const isSel = selected.includes(opt);
        const dis = !isSel && ((isExcl && opt !== q.exclusive) || (selected.length >= q.max && !isExcl));
        return (
          <OptLabel key={i} selected={isSel} exclusive={opt === q.exclusive} disabled={dis} readOnly={readOnly} onClick={() => toggle(opt)}>
            <input type="checkbox" checked={isSel} readOnly style={{ marginTop: 2, accentColor: T.accent }} />
            <span style={{ fontSize: 14, lineHeight: 1.55, fontFamily: sans }}>{opt}</span>
          </OptLabel>
        );
      })}
      {q.hasOther && !isExcl && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.cardBorder}` }}>
          <span style={{ fontSize: 13, color: T.textSecondary, flexShrink: 0, fontFamily: sans }}>{L.otherSpecify}</span>
          <input type="text" value={otherText || ""} onChange={e => onOtherChange(e.target.value)} disabled={readOnly}
            style={{ flex: 1, fontSize: 14, border: "none", borderBottom: `1px solid ${T.inputBorder}`, outline: "none",
              background: "transparent", fontFamily: sans, padding: "2px 0", minWidth: 0 }} placeholder="..." />
        </div>
      )}
    </div>
  );
}

function RankQ({ q, value, onChange, otherText, onOtherChange, readOnly }) {
  const ranks = value || {};
  const setRank = (pos, opt) => {
    if (readOnly) return;
    const next = { ...ranks };
    for (const p of Object.keys(next)) { if (next[p] === opt) delete next[p]; }
    if (opt) next[pos] = opt; else delete next[pos];
    onChange(next);
  };
  const usedOpts = Object.values(ranks);
  const allOpts = [...q.opts, ...(q.hasOther && otherText ? [`Other: ${otherText}`] : [])];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {q.hasOther && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.cardBorder}`, marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: T.textSecondary, flexShrink: 0, fontFamily: sans }}>{L.otherSpecify}</span>
          <input type="text" value={otherText || ""} onChange={e => onOtherChange(e.target.value)} disabled={readOnly}
            style={{ flex: 1, fontSize: 14, border: "none", borderBottom: `1px solid ${T.inputBorder}`, outline: "none",
              background: "transparent", fontFamily: sans, padding: "2px 0", minWidth: 0 }} placeholder="..." />
        </div>
      )}
      {[1,2,3].map(pos => (
        <div key={pos} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, fontFamily: sans, flexShrink: 0,
            background: ranks[pos] ? T.accent : T.headerBg, color: ranks[pos] ? "#FFFDF9" : T.textMuted,
          }}>{pos}</span>
          <select value={ranks[pos] || ""} onChange={e => setRank(pos, e.target.value)} disabled={readOnly}
            style={{ flex: 1, fontSize: 14, padding: "10px 14px", borderRadius: 10, fontFamily: sans, minWidth: 0,
              border: `1.5px solid ${T.inputBorder}`, background: T.inputBg, outline: "none", color: T.textPrimary }}>
            <option value="">{L.rankPlaceholder}</option>
            {allOpts.map((opt, i) => (
              <option key={i} value={opt} disabled={usedOpts.includes(opt) && ranks[pos] !== opt}>{opt}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function MatrixQ({ q, value, onChange, readOnly }) {
  const data = value || {};
  const set = (row, col) => { if (!readOnly) onChange({ ...data, [row]: col }); };
  return (
    <div style={{ overflowX: "auto", margin: "0 -8px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520, fontFamily: sans, fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, color: T.textSecondary, width: "40%" }}></th>
            {q.cols.map((c, i) => (
              <th key={i} style={{ padding: "8px 6px", fontWeight: 600, color: T.textSecondary, textAlign: "center", fontSize: 12, lineHeight: 1.3 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? T.headerBg : "transparent" }}>
              <td style={{ padding: "10px", fontSize: 13, lineHeight: 1.4 }}>{row}</td>
              {q.cols.map((col, ci) => (
                <td key={ci} style={{ padding: "8px", textAlign: "center" }}>
                  <input type="radio" name={`${q.id}_${ri}`} checked={data[row] === col}
                    onChange={() => set(row, col)} style={{ accentColor: T.accent }} disabled={readOnly} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConditionalQ({ q, value, onChange, readOnly }) {
  const data = value || { branch: null, selections: [] };
  const setBranch = (b) => {
    if (readOnly) return;
    onChange({ branch: b, selections: b === "impact" ? (data.selections || []) : [] });
  };
  const toggleSel = (opt) => {
    if (readOnly) return;
    const sel = data.selections || [];
    onChange({ branch: "impact", selections: sel.includes(opt) ? sel.filter(s => s !== opt) : [...sel, opt] });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <OptLabel selected={data.branch === "no_impact"} readOnly={readOnly} onClick={() => setBranch("no_impact")}>
        <input type="radio" name={q.id} checked={data.branch === "no_impact"} readOnly style={{ marginTop: 2, accentColor: T.accent }} />
        <span style={{ fontSize: 14, lineHeight: 1.55, fontFamily: sans }}>{q.branch1Label}</span>
      </OptLabel>
      <OptLabel selected={data.branch === "impact"} readOnly={readOnly} onClick={() => setBranch("impact")}>
        <input type="radio" name={q.id} checked={data.branch === "impact"} readOnly style={{ marginTop: 2, accentColor: T.accent }} />
        <span style={{ fontSize: 14, lineHeight: 1.55, fontFamily: sans }}>{q.branch2Label}</span>
      </OptLabel>
      {data.branch === "impact" && (
        <div style={{ marginLeft: 28, paddingLeft: 16, borderLeft: `2px solid ${T.accentBorder}`, display: "flex", flexDirection: "column", gap: 6 }}>
          {q.branch2Opts.map((opt, i) => (
            <OptLabel key={i} selected={(data.selections||[]).includes(opt)} readOnly={readOnly} onClick={() => toggleSel(opt)}>
              <input type="checkbox" checked={(data.selections||[]).includes(opt)} readOnly style={{ marginTop: 2, accentColor: T.accent }} />
              <span style={{ fontSize: 14, lineHeight: 1.55, fontFamily: sans }}>{opt}</span>
            </OptLabel>
          ))}
        </div>
      )}
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  SUPABASE HELPERS                                             ║
// ╚════════════════════════════════════════════════════════════════╝
function pad3(n) { return String(n || 0).padStart(3, "0"); }

function dbToEntry(row) {
  return {
    dbId: row.id,
    userId: row.user_id,
    recorderCode: row.recorder_code,
    num: row.entry_num,
    paperNo: row.paper_no || `${row.recorder_code || "X"}-${pad3(row.entry_num)}`,
    status: row.status || "draft",
    answers: row.answers || {},
    others: row.others || {},
    email: row.email || "",
    interview: row.interview || "",
    flagHaphazard: !!row.flag_haphazard,
    flagIllegible: !!row.flag_illegible,
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function entryPatch(data, status) {
  return {
    answers: data.answers || {},
    others: data.others || {},
    email: data.email || "",
    interview: data.interview || "",
    flag_haphazard: !!data.flagHaphazard,
    flag_illegible: !!data.flagIllegible,
    notes: data.notes || "",
    status: status || data.status || "draft",
  };
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ status }) {
  const submitted = status === "submitted";
  return (
    <span style={{
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 20,
      fontWeight: 700,
      fontFamily: sans,
      background: submitted ? T.greenBg : T.amberBg,
      color: submitted ? T.greenText : T.amberText,
      border: `1px solid ${submitted ? T.greenBorder : T.amberBorder}`,
    }}>{submitted ? "Submitted" : "Draft"}</span>
  );
}

function ConfigWarning() {
  return (
    <div style={css.page}>
      <FontLoader />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <div style={{ ...css.card, padding: 24 }}>
          <h1 style={{ marginTop: 0, fontSize: 22 }}>Supabase configuration is missing</h1>
          <p style={{ fontFamily: sans, lineHeight: 1.6 }}>Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your local <code>.env</code> file or in GitHub repository secrets before deployment.</p>
        </div>
      </div>
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  SURVEY FORM                                                  ║
// ╚════════════════════════════════════════════════════════════════╝
const SECTIONS = [
  { num: 1, label: L.part1 },
  { num: 2, label: L.part2 },
  { num: 2.5, label: L.part3 },
  { num: 3, label: L.part4 },
];

function SurveyForm({ entry, clerkName, onSave, onAutoSave, onCancel, readOnlyMode }) {
  const [answers, setAnswers] = useState(entry?.answers || {});
  const [others, setOthers] = useState(entry?.others || {});
  const [email, setEmail] = useState(entry?.email || "");
  const [interview, setInterview] = useState(entry?.interview || "");
  const [flagHaph, setFlagHaph] = useState(entry?.flagHaphazard || false);
  const [flagIlleg, setFlagIlleg] = useState(entry?.flagIllegible || false);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState("");
  const topRef = useRef(null);
  const didMount = useRef(false);
  const readOnly = readOnlyMode;

  const payload = useMemo(() => ({ answers, others, email, interview, flagHaphazard: flagHaph, flagIllegible: flagIlleg, notes }), [answers, others, email, interview, flagHaph, flagIlleg, notes]);

  const setA = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }));
  const setO = (id, val) => setOthers(prev => ({ ...prev, [id]: val }));

  useEffect(() => {
    if (readOnly || !entry?.dbId || !onAutoSave) return;
    if (!didMount.current) { didMount.current = true; return; }
    const timer = setTimeout(async () => {
      try {
        setAutoSaveMsg("Saving draft...");
        await onAutoSave(entry.dbId, payload);
        setAutoSaveMsg(`Draft saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      } catch (e) {
        setAutoSaveMsg("Draft auto-save failed. Please click Save Draft.");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [payload, readOnly, entry?.dbId, onAutoSave]);

  const validate = () => {
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (q.type === "single" && !a) return `Please answer: ${q.label.substring(0,80)}...`;
      if (q.type === "multi" && (!a || a.length < q.min)) return `Please answer: ${q.label.substring(0,80)}...`;
      if (q.type === "rank" && Object.keys(a || {}).length < q.count) return `Please complete all rankings: ${q.label.substring(0,80)}...`;
      if (q.type === "matrix" && Object.keys(a || {}).length < q.rows.length) return `Please answer all rows: ${q.label.substring(0,80)}...`;
      if (q.type === "conditional" && (!a || !a.branch)) return `Please answer: ${q.label.substring(0,80)}...`;
    }
    return "";
  };

  const handleDraft = async () => {
    setSaving(true);
    setError("");
    await onSave(payload, "draft");
    setSaving(false);
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setError("");
    setSaving(true);
    await onSave(payload, "submitted");
    setSaving(false);
  };

  return (
    <div ref={topRef} style={{ maxWidth: 740, margin: "0 auto" }}>
      <div style={{ ...css.card, padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, fontFamily: sans }}>{L.entryId}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary }}>{entry?.paperNo || `${clerkName}-${pad3(entry?.num)}`}</span>
            <StatusPill status={entry?.status || "draft"} />
          </div>
          {!readOnly && <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted, fontFamily: sans }}>{autoSaveMsg || "Draft auto-save is enabled after the first edit."}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!readOnly && (
            <>
              <button onClick={handleDraft} disabled={saving}
                style={{ ...css.btnSec, padding: "10px 18px", fontSize: 14, opacity: saving ? 0.6 : 1, fontFamily: sans }}>
                {saving ? L.saving : "Save Draft"}
              </button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ ...css.btn, padding: "10px 18px", fontSize: 14, opacity: saving ? 0.6 : 1, fontFamily: sans }}>
                {saving ? L.saving : "Save & Mark Complete"}
              </button>
            </>
          )}
          <button onClick={onCancel} style={{ ...css.btnSec, padding: "10px 18px", fontSize: 14, fontFamily: sans }}>
            {readOnly ? "← Back" : L.cancel}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, color: T.redText, fontSize: 14, fontFamily: sans }}>
          {error}
        </div>
      )}

      <div style={{ ...css.card, background: T.amberBg, borderColor: T.amberBorder, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.amberText, marginTop: 0, marginBottom: 12 }}>{L.qualityLabel}</p>
        {[[flagHaph, setFlagHaph, L.flagHaphazard],[flagIlleg, setFlagIlleg, L.flagIllegible]].map(([val, setVal, label], i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: readOnly ? "default" : "pointer" }}>
            <input type="checkbox" checked={val} onChange={e => setVal(e.target.checked)} disabled={readOnly}
              style={{ width: 18, height: 18, accentColor: "#C08030" }} />
            <span style={{ fontSize: 14, color: T.amberText, fontFamily: sans }}>⚠ {label}</span>
          </label>
        ))}
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.amberText, fontFamily: sans }}>Internal notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={readOnly}
            placeholder="Optional note about handwriting, missing answers, or special cases"
            style={{ ...css.input, display: "block", width: "100%", minHeight: 62, padding: "10px 12px", fontSize: 13, marginTop: 6, fontFamily: sans, boxSizing: "border-box", resize: "vertical" }} />
        </div>
      </div>

      {SECTIONS.map(sec => (
        <div key={sec.num} style={{ marginBottom: 32 }}>
          <h2 style={{ ...css.sectionHead, fontSize: 16, fontWeight: 700, margin: 0, padding: "12px 4px", marginBottom: 16, position: "sticky", top: 49, zIndex: 10 }}>
            {sec.label}
          </h2>
          {QUESTIONS.filter(q => q.section === sec.num).map(q => (
            <div key={q.id} style={{ ...css.card, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, marginTop: 0, marginBottom: 14, lineHeight: 1.6 }}>{q.label}</p>
              {q.type === "single" && <SingleQ q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} readOnly={readOnly} />}
              {q.type === "multi" && <MultiQ q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} otherText={others[q.id]} onOtherChange={v => setO(q.id, v)} readOnly={readOnly} />}
              {q.type === "rank" && <RankQ q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} otherText={others[q.id]} onOtherChange={v => setO(q.id, v)} readOnly={readOnly} />}
              {q.type === "matrix" && <MatrixQ q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} readOnly={readOnly} />}
              {q.type === "conditional" && <ConditionalQ q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} readOnly={readOnly} />}
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ ...css.sectionHead, fontSize: 16, fontWeight: 700, margin: 0, padding: "12px 4px", marginBottom: 16 }}>{L.partExtra}</h2>
        <div style={{ ...css.card, padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{L.emailLabel}</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} disabled={readOnly}
              style={{ ...css.input, display: "block", width: "100%", padding: "10px 14px", fontSize: 14, marginTop: 6, fontFamily: sans, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{L.interviewLabel}</label>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {[L.yes, L.no].map(opt => (
                <OptLabel key={opt} selected={interview === opt} readOnly={readOnly} onClick={() => setInterview(opt)}>
                  <input type="radio" name="interview" checked={interview === opt} readOnly style={{ accentColor: T.accent }} />
                  <span style={{ fontSize: 14, fontFamily: sans }}>{opt}</span>
                </OptLabel>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
          <button onClick={handleDraft} disabled={saving}
            style={{ ...css.btnSec, padding: "14px 28px", fontSize: 15, opacity: saving ? 0.6 : 1, fontFamily: sans }}>
            {saving ? L.saving : "Save Draft"}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ ...css.btn, padding: "14px 28px", fontSize: 15, opacity: saving ? 0.6 : 1, boxShadow: "0 4px 16px rgba(184,120,78,0.2)", fontFamily: sans }}>
            {saving ? L.saving : "Save & Mark Complete"}
          </button>
          <button onClick={onCancel} style={{ ...css.btnSec, padding: "14px 28px", fontSize: 15, fontFamily: sans }}>{L.cancel}</button>
        </div>
      )}
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  CLERK DASHBOARD                                              ║
// ╚════════════════════════════════════════════════════════════════╝
function ClerkDashboard({ profile }) {
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("list");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const entries = useMemo(() => rows.map(dbToEntry), [rows]);
  const currentEntry = entries.find(e => e.dbId === editId);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("survey_entries")
      .select("*")
      .eq("user_id", profile.id)
      .order("entry_num", { ascending: true });
    if (error) setError(error.message);
    setRows(data || []);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const createNewEntry = async () => {
    setBusy(true);
    setError("");
    const nextNum = entries.reduce((m, e) => Math.max(m, e.num || 0), 0) + 1;
    const paperNo = `${profile.recorder_code}-${pad3(nextNum)}`;
    const { data, error } = await supabase
      .from("survey_entries")
      .insert({
        user_id: profile.id,
        recorder_code: profile.recorder_code,
        entry_num: nextNum,
        paper_no: paperNo,
        status: "draft",
        answers: {},
        others: {},
      })
      .select("*")
      .single();
    setBusy(false);
    if (error) { setError(error.message); return; }
    setRows(prev => [...prev, data]);
    setEditId(data.id);
    setMode("edit");
  };

  const updateEntry = useCallback(async (entry, data, status = "draft") => {
    const { data: updated, error } = await supabase
      .from("survey_entries")
      .update(entryPatch(data, status))
      .eq("id", entry.dbId)
      .select("*")
      .single();
    if (error) throw error;
    setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
    return updated;
  }, []);

  const saveEntry = async (payload, status) => {
    if (!currentEntry) return;
    try {
      setBusy(true);
      await updateEntry(currentEntry, payload, status);
      setMode("list");
      setEditId(null);
    } catch (e) {
      setError(e.message || String(e));
      alert(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const autoSave = useCallback(async (entryId, payload) => {
    const { data: updated, error } = await supabase
      .from("survey_entries")
      .update(entryPatch(payload, "draft"))
      .eq("id", entryId)
      .select("*")
      .single();
    if (error) throw error;
    setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, []);

  const deleteEntry = async (entry) => {
    if (!confirm(L.delConfirm)) return;
    const { error } = await supabase.from("survey_entries").delete().eq("id", entry.dbId);
    if (error) { setError(error.message); return; }
    setRows(prev => prev.filter(r => r.id !== entry.dbId));
  };

  const markAllComplete = async () => {
    if (!confirm(L.allCompleteConfirm)) return;
    const { error } = await supabase
      .from("survey_entries")
      .update({ status: "submitted" })
      .eq("user_id", profile.id);
    if (error) { setError(error.message); return; }
    await load();
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: T.textMuted, fontFamily: sans }}>Loading...</div>;
  if (mode === "edit" && currentEntry) return <SurveyForm entry={currentEntry} clerkName={profile.display_name || profile.recorder_code} onSave={saveEntry} onAutoSave={autoSave} onCancel={() => { setMode("list"); setEditId(null); load(); }} />;
  if (mode === "view" && currentEntry) return <SurveyForm entry={currentEntry} clerkName={profile.display_name || profile.recorder_code} readOnlyMode onCancel={() => { setMode("list"); setEditId(null); }} />;

  const allSubmitted = entries.length > 0 && entries.every(e => e.status === "submitted");

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.textPrimary }}>{L.dashboard}</h2>
          <p style={{ margin: "4px 0 0", fontFamily: sans, fontSize: 13, color: T.textMuted }}>Recorder: {profile.display_name || profile.recorder_code}</p>
        </div>
        <button onClick={createNewEntry} disabled={busy} style={{ ...css.btn, padding: "10px 22px", fontSize: 14, fontFamily: sans, opacity: busy ? 0.6 : 1 }}>{busy ? "Creating..." : L.addNew}</button>
      </div>
      {error && <div style={{ marginBottom: 16, padding: 12, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, color: T.redText, fontFamily: sans }}>{error}</div>}
      {entries.length === 0 ? (
        <div style={{ ...css.card, padding: "48px 24px", textAlign: "center", color: T.textMuted, borderStyle: "dashed", fontSize: 14, fontFamily: sans }}>
          {L.noEntries}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map(e => (
            <div key={e.dbId} style={{ ...css.card, padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: sans }}>{e.paperNo}</span>
                <StatusPill status={e.status} />
                {(e.flagHaphazard || e.flagIllegible) && (
                  <span style={{ fontSize: 11, padding: "2px 8px", background: T.amberBg, color: T.amberText, borderRadius: 20, fontWeight: 600, fontFamily: sans }}>Flagged</span>
                )}
                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: sans }}>Updated: {e.updatedAt ? new Date(e.updatedAt).toLocaleString() : "—"}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setEditId(e.dbId); setMode("view"); }} style={{ ...css.btnSec, padding: "6px 14px", fontSize: 12, fontFamily: sans }}>{L.view}</button>
                <button onClick={() => { setEditId(e.dbId); setMode("edit"); }} style={{ ...css.btnSec, padding: "6px 14px", fontSize: 12, fontFamily: sans, background: T.accentLight, color: T.accent, borderColor: T.accentBorder }}>{L.edit}</button>
                <button onClick={() => deleteEntry(e)} style={{ ...css.btnSec, padding: "6px 14px", fontSize: 12, fontFamily: sans, background: T.redBg, color: T.redText, borderColor: T.redBorder }}>{L.del}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && !allSubmitted && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button onClick={markAllComplete}
            style={{ padding: "14px 28px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", fontFamily: sans, background: "#5A7F4A", color: "#FFFDF9", boxShadow: "0 4px 16px rgba(90,127,74,0.2)" }}>
            {L.allComplete}
          </button>
        </div>
      )}
      {allSubmitted && (
        <div style={{ marginTop: 32, padding: 20, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 12, textAlign: "center", color: T.greenText, fontWeight: 600, fontSize: 14, fontFamily: sans }}>
          {L.completedMsg}
        </div>
      )}
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  ADMIN DASHBOARD                                              ║
// ╚════════════════════════════════════════════════════════════════╝
function flattenEntry(entry) {
  const row = {
    entry_id: entry.paperNo,
    recorder_code: entry.recorderCode || "",
    status: entry.status || "",
    flag_haphazard: entry.flagHaphazard ? "Yes" : "No",
    flag_illegible: entry.flagIllegible ? "Yes" : "No",
    notes: entry.notes || "",
    created: entry.createdAt || "",
    updated: entry.updatedAt || "",
  };
  for (const q of QUESTIONS) {
    const a = entry.answers?.[q.id];
    if (q.type === "single") row[q.id] = a || "";
    else if (q.type === "multi") row[q.id] = (a || []).join("; ");
    else if (q.type === "rank") {
      const r = a || {};
      row[`${q.id}_rank1`] = r[1] || "";
      row[`${q.id}_rank2`] = r[2] || "";
      row[`${q.id}_rank3`] = r[3] || "";
    }
    else if (q.type === "matrix") {
      const m = a || {};
      q.rows.forEach((r, i) => { row[`${q.id}_${String.fromCharCode(97+i)}`] = m[r] || ""; });
    }
    else if (q.type === "conditional") {
      const d = a || {};
      row[`${q.id}_branch`] = d.branch || "";
      row[`${q.id}_selections`] = (d.selections || []).join("; ");
    }
    if (entry.others?.[q.id]) row[`${q.id}_other`] = entry.others[q.id];
  }
  row.email = entry.email || "";
  row.interview = entry.interview || "";
  return row;
}

function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewId, setViewId] = useState(null);

  const entries = useMemo(() => rows.map(dbToEntry), [rows]);
  const viewEntry = entries.find(e => e.dbId === viewId);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [{ data: entryData, error: entryErr }, { data: profileData, error: profileErr }] = await Promise.all([
      supabase.from("survey_entries").select("*").order("recorder_code", { ascending: true }).order("entry_num", { ascending: true }),
      supabase.from("profiles").select("id, recorder_code, display_name, role").order("recorder_code", { ascending: true }),
    ]);
    if (entryErr) setError(entryErr.message);
    else if (profileErr) setError(profileErr.message);
    setRows(entryData || []);
    setProfiles(profileData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportData = (format) => {
    const flattened = entries.map(flattenEntry);
    if (flattened.length === 0) return alert(L.noData);
    if (format === "json") {
      downloadBlob(new Blob([JSON.stringify(flattened, null, 2)], { type: "application/json" }), "survey_data_export.json");
      return;
    }
    const headers = Array.from(new Set(flattened.flatMap(r => Object.keys(r))));
    const csv = [headers.map(csvEscape).join(","), ...flattened.map(r => headers.map(h => csvEscape(r[h])).join(","))].join("\n");
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), "survey_data_export.csv");
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: T.textMuted, fontFamily: sans }}>Loading...</div>;
  if (viewEntry) return <SurveyForm entry={viewEntry} clerkName={viewEntry.recorderCode} readOnlyMode onCancel={() => setViewId(null)} />;

  const byRecorder = entries.reduce((acc, e) => {
    const k = e.recorderCode || "Unknown";
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {});
  const clerkProfiles = profiles.filter(p => p.role === "clerk");
  const totalEntries = entries.length;
  const submittedCount = entries.filter(e => e.status === "submitted").length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0", color: T.textPrimary }}>{L.adminDashboard}</h2>
      <p style={{ margin: "0 0 20px", fontFamily: sans, color: T.textMuted, fontSize: 13 }}>All data are loaded from Supabase. Clerks can only access their own entries; this admin account can view and export all entries.</p>
      {error && <div style={{ marginBottom: 16, padding: 12, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, color: T.redText, fontFamily: sans }}>{error}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, alignItems: "center" }}>
        <button onClick={() => exportData("csv")} style={{ ...css.btn, padding: "10px 22px", fontSize: 14, fontFamily: sans }}>{L.exportAll}</button>
        <button onClick={() => exportData("json")} style={{ ...css.btnSec, padding: "10px 22px", fontSize: 14, fontFamily: sans }}>{L.exportJSON}</button>
        <button onClick={load} style={{ ...css.btnSec, padding: "10px 22px", fontSize: 14, fontFamily: sans }}>Refresh</button>
        <span style={{ fontSize: 13, color: T.textMuted, marginLeft: 8, fontFamily: sans }}>{totalEntries} total · {submittedCount} submitted · {totalEntries - submittedCount} drafts</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 24 }}>
        {clerkProfiles.map(p => {
          const list = byRecorder[p.recorder_code] || [];
          const submitted = list.filter(e => e.status === "submitted").length;
          return (
            <div key={p.id} style={{ ...css.card, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ fontFamily: sans }}>{p.display_name || p.recorder_code}</strong>
                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: sans }}>{p.recorder_code}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: T.textSecondary, fontFamily: sans }}>{list.length} entries · {submitted} submitted</div>
            </div>
          );
        })}
      </div>

      <div style={{ ...css.card, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: sans, fontSize: 13 }}>
          <thead style={{ background: T.headerBg }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>Entry</th>
              <th style={{ textAlign: "left", padding: 12 }}>Recorder</th>
              <th style={{ textAlign: "left", padding: 12 }}>Status</th>
              <th style={{ textAlign: "left", padding: 12 }}>Updated</th>
              <th style={{ textAlign: "left", padding: 12 }}>Quality</th>
              <th style={{ textAlign: "right", padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 28, textAlign: "center", color: T.textMuted }}>{L.noData}</td></tr>
            ) : entries.map(e => (
              <tr key={e.dbId} style={{ borderTop: `1px solid ${T.cardBorder}` }}>
                <td style={{ padding: 12, fontWeight: 700 }}>{e.paperNo}</td>
                <td style={{ padding: 12 }}>{e.recorderCode}</td>
                <td style={{ padding: 12 }}><StatusPill status={e.status} /></td>
                <td style={{ padding: 12, color: T.textMuted }}>{e.updatedAt ? new Date(e.updatedAt).toLocaleString() : "—"}</td>
                <td style={{ padding: 12 }}>{(e.flagHaphazard || e.flagIllegible) ? "Flagged" : "—"}</td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button onClick={() => setViewId(e.dbId)} style={{ ...css.btnSec, padding: "6px 12px", fontSize: 12, fontFamily: sans }}>{L.view}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  AUTH                                                        ║
// ╚════════════════════════════════════════════════════════════════╝
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    onLogin(data.session);
  };

  return (
    <div style={css.page}>
      <FontLoader />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ ...css.card, width: "100%", maxWidth: 380, padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", background: `linear-gradient(135deg, ${T.accent}, #9A6840)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(184,120,78,0.3)", color: "#FFFDF9", fontSize: 24, fontWeight: 800, fontFamily: sans }}>S</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, margin: "0 0 4px 0" }}>{L.appTitle}</h1>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0, fontFamily: sans }}>{L.appSubtitle}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: sans }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
                style={{ ...css.input, display: "block", width: "100%", padding: "12px 14px", fontSize: 15, marginTop: 6, fontFamily: sans, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: sans }}>{L.password}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
                style={{ ...css.input, display: "block", width: "100%", padding: "12px 14px", fontSize: 15, marginTop: 6, fontFamily: sans, boxSizing: "border-box" }} />
            </div>
            {error && <p style={{ fontSize: 13, color: T.redText, textAlign: "center", margin: 0, fontFamily: sans }}>{error}</p>}
            <button onClick={submit} disabled={loading}
              style={{ ...css.btn, width: "100%", padding: "14px", fontSize: 15, marginTop: 4, fontFamily: sans, opacity: loading ? 0.6 : 1, boxShadow: "0 4px 16px rgba(184,120,78,0.25)" }}>
              {loading ? "Logging in..." : L.login}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, recorder_code, display_name, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  MAIN APP                                                     ║
// ╚════════════════════════════════════════════════════════════════╝
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSession = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    setError("");
    const { data } = await supabase.auth.getSession();
    const nextSession = data.session;
    setSession(nextSession || null);
    if (nextSession?.user?.id) {
      try { setProfile(await fetchProfile(nextSession.user.id)); }
      catch (e) { setError(`Could not load profile: ${e.message}`); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
    if (!isSupabaseConfigured) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadSession]);

  const handleLogin = async (nextSession) => {
    setSession(nextSession);
    try { setProfile(await fetchProfile(nextSession.user.id)); }
    catch (e) { setError(`Login succeeded, but no profile was found for this user. Please add a row in public.profiles. Details: ${e.message}`); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (!isSupabaseConfigured) return <ConfigWarning />;
  if (loading) return <div style={css.page}><FontLoader /><div style={{ padding: 60, textAlign: "center", fontFamily: sans, color: T.textMuted }}>Loading...</div></div>;
  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (error) return <div style={css.page}><FontLoader /><div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}><div style={{ ...css.card, padding: 24, color: T.redText, fontFamily: sans }}>{error}<br/><br/><button onClick={logout} style={{ ...css.btnSec, padding: "10px 18px", fontFamily: sans }}>{L.logout}</button></div></div></div>;
  if (!profile) return <div style={css.page}><FontLoader /><div style={{ padding: 60, textAlign: "center", fontFamily: sans, color: T.textMuted }}>Loading profile...</div></div>;

  const isAdmin = profile.role === "admin";
  return (
    <div style={css.page}>
      <FontLoader />
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.cardBorder}`, boxShadow: "0 1px 4px rgba(140,120,90,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: T.textPrimary }}>{L.appTitle}</h1>
            <p style={{ fontSize: 12, margin: 0, color: T.textMuted, fontFamily: sans }}>{isAdmin ? "Administrator" : `Recorder: ${profile.display_name || profile.recorder_code}`}</p>
          </div>
          <button onClick={logout} style={{ ...css.btnSec, padding: "8px 16px", fontSize: 12, fontFamily: sans }}>{L.logout}</button>
        </div>
      </div>
      <div style={{ padding: "20px 16px 64px" }}>
        {isAdmin ? <AdminDashboard /> : <ClerkDashboard profile={profile} />}
      </div>
    </div>
  );
}
