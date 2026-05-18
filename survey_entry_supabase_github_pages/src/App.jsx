import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ╔════════════════════════════════════════════════════════════════╗
// ║  LANGUAGE STRINGS — Replace values to switch language         ║
// ║  Only replace the text after the colon, keep the keys as-is  ║
// ╚════════════════════════════════════════════════════════════════╝
const L = {
  appTitle: "问卷录入系统",
  appSubtitle: "2026年经济学院硕博学生就业认知与能力培育抽样问卷调查",
  login: "登录",
  username: "用户名",
  password: "密码",
  loginError: "用户名或密码错误",
  logout: "退出登录",
  dashboard: "我的录入记录",
  addNew: "+ 新增问卷录入",
  noEntries: "暂无录入记录。点击上方按钮开始录入问卷。",
  view: "查看",
  edit: "编辑",
  del: "删除",
  delConfirm: "确认删除这份录入记录吗？此操作不可撤销。",
  allComplete: "✓ 我已完成全部录入",
  allCompleteConfirm: "确认你已经录入完分配给你的所有纸质问卷了吗？管理员将看到该状态。",
  completedMsg: "✓ 你已标记全部录入完成。",
  flagHaphazard: "疑似乱填",
  flagIllegible: "字迹模糊 / 难以辨认",
  qualityLabel: "录入质量标记",
  qualityHint: "请在录完整张问卷后，根据纸质问卷整体情况进行判断。",
  surveyForm: "问卷录入表",
  entryId: "问卷编号",
  save: "保存",
  saving: "保存中...",
  cancel: "取消",
  back: "← 返回",
  submitEntry: "提交本份问卷",
  required: "必填",
  selectRank: "排序",
  rankPlaceholder: "—",
  otherSpecify: "其他（请填写）：",
  pleaseSelect: "请先完成所有必填题目。",
  autoSaveEnabled: "首次编辑后将自动保存为草稿。",
  autoSaving: "正在自动保存草稿...",
  autoSaved: "草稿已自动保存于",
  autoSaveFailed: "草稿自动保存失败，请检查网络后继续。",
  part1: "（一）基础信息",
  part2: "（二）就业感知",
  part3: "（三）能力培育",
  part4: "（四）学校学院角色",
  partExtra: "联系方式与访谈意愿（非必填）",
  emailLabel: "联系邮箱（非必填）",
  interviewLabel: "是否愿意参与后续访谈（非必填）",
  yes: "是",
  no: "否",
  adminDashboard: "管理员后台",
  clerkStatus: "录入员状态",
  complete: "已完成",
  inProgress: "进行中",
  entries: "份记录",
  exportAll: "导出全部数据（CSV）",
  exportJSON: "导出全部数据（JSON）",
  noData: "暂无数据。",
  viewEntries: "查看",
  hideEntries: "隐藏",
  notifications: "通知",
  noNotifications: "暂无通知。",
  notifComplete: "已标记全部录入完成",
  clearNotif: "清除",
  email: "邮箱",
  administrator: "管理员",
  recorder: "录入员",
  loading: "加载中...",
  loadingProfile: "正在加载用户信息...",
  loggingIn: "正在登录...",
  creating: "创建中...",
  refresh: "刷新",
  total: "总计",
  submitted: "已提交",
  drafts: "草稿",
  submittedStatus: "已提交",
  draftStatus: "草稿",
  flagged: "已标记",
  updated: "更新于",
  entry: "问卷",
  status: "状态",
  quality: "质量",
  action: "操作",
  internalNotes: "内部备注",
  internalNotesPlaceholder: "可填写字迹、缺失答案或特殊情况说明",
  adminDesc: "所有数据均从 Supabase 读取。普通录入员只能访问自己的记录；管理员账号可以查看并导出全部记录。",
  configMissingTitle: "缺少 Supabase 配置",
  configMissingBody: "请在本地 .env 文件或 GitHub repository secrets 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后再部署。",
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
  page: { background: T.pageBg, color: T.textPrimary, minHeight: "100vh", fontFamily: "'Noto Serif SC', 'Songti SC', 'SimSun', serif" },
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
  { id:"q1", section:1, label:"1. 你目前在读的学历层次为？", type:"single",
    opts:["学术型硕士","专业型硕士","博士研究生"] },
  { id:"q2", section:1, label:"2. 你目前的年级为？", type:"single",
    opts:["一年级","二年级","三年级","四年及以上"] },
  { id:"q3", section:1, label:"3. 你的专业大类为？", type:"single",
    opts:[
      "经济系（政治经济学、西方经济学、经济史、经济思想史）",
      "计量与数量经济学系（计量经济学、数量经济学）",
      "国际经济系（世界经济、国际贸易、发展经济学、国际商务）",
      "数字经济（数字经济、企业经济学）"
    ] },
  { id:"q4", section:1, label:"4. 你的性别为？", type:"single",
    opts:["男性","女性"] },
  { id:"q5", section:1, label:"5. 你对未来就业道路的考虑目前最主要倾向于以下哪种或哪几种方向？（多选题，请选择1-3项）", type:"multi", min:1, max:3,
    opts:[
      "高校及科研院所",
      "党政机关与事业单位",
      "央国企（含国有金融机构）",
      "民营、外资与其他企业",
      "自主创业与灵活就业",
    ],
    exclusive:"我尚未明确未来发展的道路方向（互斥项）" },
  { id:"q6", section:1, label:"6. 对你而言，选择工作会优先看重以下哪几项因素？请选择3项，并按重要度依次排序（如：1=最重要）。", type:"rank", count:3,
    opts:[
      "薪资与福利",
      "工作稳定性",
      "职业发展空间",
      "工作与生活平衡",
      "岗位能否发挥经济学专业能力",
      "工作内容是否能锻炼能力、接触前沿领域",
      "个人兴趣与价值观匹配",
    ],
    hasOther:true },
  { id:"q7a", section:2, label:"7(a) AI冲击影响了我对未来职业方向的判断。", type:"conditional",
    branch1Label: "无显著影响，或职业路径转向并非由AI引发",
    branch2Label: "有较大影响，我原先考虑的职业方向为：",
    branch2Opts:[
      "高校及科研院所",
      "政府机关与事业单位",
      "央国企（含国有金融机构）",
      "民营、外资与其他企业",
      "自主创业与灵活就业",
    ] },
  { id:"q7b", section:2, label:"7(b) 我认为AI会改变经济学相关工作的具体内容和完成方式。", type:"single",
    opts:["非常同意","较同意","中立或不确定","不太同意","非常不同意"] },
  { id:"q7c", section:2, label:"7(c) 面对AI带来的变化，我能大致判断哪些能力在未来职业发展中会更重要。", type:"single",
    opts:["能完全判断","能大体判断","有些能判断","不太能判断","几乎不能判断"] },
  { id:"q8", section:2, label:"8. 在当下就业环境中，如果你感到压力或不确定感，主要来源是什么？（多选题，请选择1-3项）", type:"multi", min:1, max:3,
    opts:[
      "整体就业机会和回报预期不明朗",
      "不清楚未来真正需要哪些能力",
      "知道自己的能力弱项但很难针对性补足提升",
      "担心学校所学内容与实际工作内容存在脱节",
      "AI等技术变化削弱了对自身比较优势的信心",
      "缺少可以深入交流的同伴和获得支持的环境",
      "同辈竞争或家庭期待带来压力",
      "无法获得可靠的信息来源和职业经验参照",
      "时间和精力被多重任务挤压",
    ],
    exclusive:"我目前没有明显的焦虑感（互斥项）",
    hasOther:true },
  { id:"q9", section:2, label:"9. 面对上述变化或不确定性，你已经采取了哪些行动？（多选题，请至少选择1项）", type:"multi", min:1, max:99,
    opts:[
      "有意识地关注宏观经济走势、政策导向与国家战略",
      "夯实经济学专业基础与自身所需能力",
      "主动学习AI工具或相关技能，追踪国内外科技动态",
      "争取实习、项目或能接触真实业务的机会",
      "与同学、老师、校友等联络并交流类似话题",
      "重新审视职业规划，及时跟踪就业动态和行业信息",
    ],
    exclusive:"尚未采取特别有针对性的行动，或仅限于被动接收相关信息（互斥项）",
    hasOther:true },
  { id:"q10", section:2.5, label:"10. 以下哪种描述最符合你目前使用AI工具的情况？", type:"single",
    opts:[
      "我深度使用AI，并会主动积极探索新的使用方式",
      "我经常在学术任务中使用AI，辅助写作、代码等",
      "我有时使用AI，用于翻译、查询、闲聊等简单场景",
      "我很少或不使用AI工具"
    ] },
  { id:"q11", section:2.5, label:"11. 在接触AI工具后，你实际参与下列学习环节的频率是否发生了变化？请在符合的情况上打钩或画圈。", type:"matrix",
    rows:[
      "（a）认真阅读长难文本",
      "（b）提出问题或形成想法",
      "（c）整理思路并写清楚观点",
      "（d）核查信息和推理流程是否可靠",
      "（e）长时间专注推进较难任务"
    ],
    cols:["变多了","基本没变","变少了","很少使用AI"] },
  { id:"q12", section:2.5, label:"12. 针对你Q5选择的未来职业方向，你认为下面哪些方面的能力最重要？请选择其中3项，并依重要性排序。", type:"rank", count:3,
    opts:[
      "理解国家宏观政策导向和行业变化",
      "扎实的经济学基础知识和理论思考框架",
      "善于发现有价值的问题切入口并形成思路",
      "能够辨别评估信息质量，擅长综合统筹判断",
      "有较好的数据直觉，且能借助工具开展分析",
      "善于表达沟通（书面、口语）与协作推进任务",
      "能合理安排时间精力，调整自身状态，持续学习",
    ],
    hasOther:true },
  { id:"q13", section:2.5, label:"13. 对于上述你选择为第1重要的能力，你认为对其的掌握程度为？", type:"single",
    opts:[
      "已经比较成熟，能够较好地理解或运用",
      "有一定基础，但还不够稳定或深入",
      "知道它很重要，但缺乏系统的训练和积累",
      "不仅不熟练，也不太清楚应该如何提升"
    ] },
  { id:"q14", section:2.5, label:"14. 对于上述你选择为第1重要的能力，你认为其主要通过以下哪种途径形成？（多选题，请选择1-3项）", type:"multi", min:1, max:3,
    opts:[
      "课内老师教授与课程作业",
      "科研训练与论文/报告的撰写过程",
      "实习、社会实践或接触实际工作任务的经历",
      "与老师、同学或前辈的交流、讨论和反馈",
      "自己长期的自发探索与积累",
    ],
    exclusive:"我目前对这项能力的形成途径还不太清楚（互斥项）",
    hasOther:true },
  { id:"q15", section:3, label:"15. 你是否参与或了解过以下学校学院的就业指导资源？请在符合的情况上打钩或画圈。", type:"matrix",
    rows:[
      "（a）学校学院举办的双选会、宣讲会",
      "（b）学校学院的一对一咨询",
      "（c）学校学院举办的就业指导、行业分享讲座",
      "（d）学校智慧职业发展中心平台模拟面试和简历修改",
      "（e）通过学院联系校友进行咨询",
      "（f）企业参访活动"
    ],
    cols:["参与多次","参与一次","听说但未参与","从未听说"] },
  { id:"q16", section:3, label:"16. 面向就业，你认为学校学院目前在哪些方面最需要额外的行动？（多选题，请选择1-3项）", type:"multi", min:1, max:3,
    opts:[
      "信息支持（更及时清楚地提供关于就业形势、行业变化、岗位要求、新兴技术对相关职业影响等信息）",
      "知识支持（在课程、讲座或训练中补充与未来职业相关的专业知识、政策与行业理解等内容）",
      "引导支持（帮助学生把个人兴趣、能力基础与未来去向联系起来，形成更清晰的职业发展思路）",
      "项目支持（提供更接近真实工作、研究或类似情境的训练实践项目，让学生在完成具体任务中形成能力）",
      "环境支持（营造更开放的师生讨论、同伴交流、校友经验分享和互助氛围，使学生获得反馈和启发）",
      "时间与空间支持（为学生留出更多自主规划、探索、试错、实习或跨学科学习的弹性时间）",
    ],
    hasOther:true },
];

// ╔════════════════════════════════════════════════════════════════╗
// ║  FONTS                                                        ║
// ╚════════════════════════════════════════════════════════════════╝
function FontLoader() {
  return <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />;
}
const sans = "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', 'Segoe UI', sans-serif";

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
        {q.min === q.max ? `请选择 ${q.min} 项` : q.max < 10 ? `请选择 ${q.min}–${q.max} 项` : `请至少选择 ${q.min} 项`}
        {selected.length > 0 && ` · 已选择 ${selected.length} 项`}
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
  const allOpts = [...q.opts, ...(q.hasOther && otherText ? [`其他：${otherText}`] : [])];
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
    }}>{submitted ? L.submittedStatus : L.draftStatus}</span>
  );
}

function ConfigWarning() {
  return (
    <div style={css.page}>
      <FontLoader />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <div style={{ ...css.card, padding: 24 }}>
          <h1 style={{ marginTop: 0, fontSize: 22 }}>{L.configMissingTitle}</h1>
          <p style={{ fontFamily: sans, lineHeight: 1.6 }}>{L.configMissingBody}</p>
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
        setAutoSaveMsg(L.autoSaving);
        await onAutoSave(entry.dbId, payload);
        setAutoSaveMsg(`${L.autoSaved} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      } catch (e) {
        setAutoSaveMsg(L.autoSaveFailed);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [payload, readOnly, entry?.dbId, onAutoSave]);

  const validate = () => {
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (q.type === "single" && !a) return `请填写：${q.label.substring(0,80)}...`;
      if (q.type === "multi" && (!a || a.length < q.min)) return `请填写：${q.label.substring(0,80)}...`;
      if (q.type === "rank" && Object.keys(a || {}).length < q.count) return `请完成排序：${q.label.substring(0,80)}...`;
      if (q.type === "matrix" && Object.keys(a || {}).length < q.rows.length) return `请填写所有小项：${q.label.substring(0,80)}...`;
      if (q.type === "conditional" && (!a || !a.branch)) return `请填写：${q.label.substring(0,80)}...`;
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
          {!readOnly && <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted, fontFamily: sans }}>{autoSaveMsg || L.autoSaveEnabled}</div>}
        </div>
        {readOnly && (
          <button onClick={onCancel} style={{ ...css.btnSec, padding: "10px 18px", fontSize: 14, fontFamily: sans }}>
            {L.back}
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, color: T.redText, fontSize: 14, fontFamily: sans }}>
          {error}
        </div>
      )}



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

      <div style={{ ...css.card, background: T.amberBg, borderColor: T.amberBorder, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.amberText, marginTop: 0, marginBottom: 6 }}>{L.qualityLabel}</p>
        <p style={{ fontSize: 12, color: T.amberText, marginTop: 0, marginBottom: 12, fontFamily: sans }}>{L.qualityHint}</p>
        {[[flagHaph, setFlagHaph, L.flagHaphazard],[flagIlleg, setFlagIlleg, L.flagIllegible]].map(([val, setVal, label], i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: readOnly ? "default" : "pointer" }}>
            <input type="checkbox" checked={val} onChange={e => setVal(e.target.checked)} disabled={readOnly}
              style={{ width: 18, height: 18, accentColor: "#C08030" }} />
            <span style={{ fontSize: 14, color: T.amberText, fontFamily: sans }}>⚠ {label}</span>
          </label>
        ))}
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.amberText, fontFamily: sans }}>{L.internalNotes}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={readOnly}
            placeholder={L.internalNotesPlaceholder}
            style={{ ...css.input, display: "block", width: "100%", minHeight: 62, padding: "10px 12px", fontSize: 13, marginTop: 6, fontFamily: sans, boxSizing: "border-box", resize: "vertical" }} />
        </div>
      </div>

      {!readOnly && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{ ...css.btn, padding: "14px 36px", fontSize: 15, opacity: saving ? 0.6 : 1, boxShadow: "0 4px 16px rgba(184,120,78,0.2)", fontFamily: sans }}>
            {saving ? L.saving : L.submitEntry}
          </button>
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
      .order("entry_num", { ascending: false });
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
    setRows(prev => [data, ...prev]);
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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: T.textMuted, fontFamily: sans }}>加载中...</div>;
  if (mode === "edit" && currentEntry) return <SurveyForm entry={currentEntry} clerkName={profile.display_name || profile.recorder_code} onSave={saveEntry} onAutoSave={autoSave} onCancel={() => { setMode("list"); setEditId(null); load(); }} />;
  if (mode === "view" && currentEntry) return <SurveyForm entry={currentEntry} clerkName={profile.display_name || profile.recorder_code} readOnlyMode onCancel={() => { setMode("list"); setEditId(null); }} />;

  const allSubmitted = entries.length > 0 && entries.every(e => e.status === "submitted");

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.textPrimary }}>{L.dashboard}</h2>
          <p style={{ margin: "4px 0 0", fontFamily: sans, fontSize: 13, color: T.textMuted }}>录入员：{profile.display_name || profile.recorder_code}</p>
        </div>
        <button onClick={createNewEntry} disabled={busy} style={{ ...css.btn, padding: "10px 22px", fontSize: 14, fontFamily: sans, opacity: busy ? 0.6 : 1 }}>{busy ? "创建中..." : L.addNew}</button>
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
                  <span style={{ fontSize: 11, padding: "2px 8px", background: T.amberBg, color: T.amberText, borderRadius: 20, fontWeight: 600, fontFamily: sans }}>已标记</span>
                )}
                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: sans }}>更新于：{e.updatedAt ? new Date(e.updatedAt).toLocaleString() : "—"}</span>
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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: T.textMuted, fontFamily: sans }}>加载中...</div>;
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
      <p style={{ margin: "0 0 20px", fontFamily: sans, color: T.textMuted, fontSize: 13 }}>{L.adminDesc}</p>
      {error && <div style={{ marginBottom: 16, padding: 12, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, color: T.redText, fontFamily: sans }}>{error}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, alignItems: "center" }}>
        <button onClick={() => exportData("csv")} style={{ ...css.btn, padding: "10px 22px", fontSize: 14, fontFamily: sans }}>{L.exportAll}</button>
        <button onClick={() => exportData("json")} style={{ ...css.btnSec, padding: "10px 22px", fontSize: 14, fontFamily: sans }}>{L.exportJSON}</button>
        <button onClick={load} style={{ ...css.btnSec, padding: "10px 22px", fontSize: 14, fontFamily: sans }}>刷新</button>
        <span style={{ fontSize: 13, color: T.textMuted, marginLeft: 8, fontFamily: sans }}>{totalEntries} {L.total} · {submittedCount} {L.submitted} · {totalEntries - submittedCount} {L.drafts}</span>
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
              <div style={{ marginTop: 6, fontSize: 13, color: T.textSecondary, fontFamily: sans }}>{list.length} {L.entries} · {submitted} {L.submitted}</div>
            </div>
          );
        })}
      </div>

      <div style={{ ...css.card, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: sans, fontSize: 13 }}>
          <thead style={{ background: T.headerBg }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>问卷</th>
              <th style={{ textAlign: "left", padding: 12 }}>录入员</th>
              <th style={{ textAlign: "left", padding: 12 }}>状态</th>
              <th style={{ textAlign: "left", padding: 12 }}>更新于</th>
              <th style={{ textAlign: "left", padding: 12 }}>质量</th>
              <th style={{ textAlign: "right", padding: 12 }}>操作</th>
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
                <td style={{ padding: 12 }}>{(e.flagHaphazard || e.flagIllegible) ? L.flagged : "—"}</td>
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
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: sans }}>邮箱</label>
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
              {loading ? "正在登录..." : L.login}
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
      catch (e) { setError(`无法加载用户信息：${e.message}`); }
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
    catch (e) { setError(`登录成功，但没有找到该用户对应的 profiles 记录。请在 public.profiles 中添加该用户。详情：${e.message}`); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (!isSupabaseConfigured) return <ConfigWarning />;
  if (loading) return <div style={css.page}><FontLoader /><div style={{ padding: 60, textAlign: "center", fontFamily: sans, color: T.textMuted }}>加载中...</div></div>;
  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (error) return <div style={css.page}><FontLoader /><div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}><div style={{ ...css.card, padding: 24, color: T.redText, fontFamily: sans }}>{error}<br/><br/><button onClick={logout} style={{ ...css.btnSec, padding: "10px 18px", fontFamily: sans }}>{L.logout}</button></div></div></div>;
  if (!profile) return <div style={css.page}><FontLoader /><div style={{ padding: 60, textAlign: "center", fontFamily: sans, color: T.textMuted }}>正在加载用户信息...</div></div>;

  const isAdmin = profile.role === "admin";
  return (
    <div style={css.page}>
      <FontLoader />
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.cardBorder}`, boxShadow: "0 1px 4px rgba(140,120,90,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: T.textPrimary }}>{L.appTitle}</h1>
            <p style={{ fontSize: 12, margin: 0, color: T.textMuted, fontFamily: sans }}>{isAdmin ? L.administrator : `${L.recorder}：${profile.display_name || profile.recorder_code}`}</p>
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
