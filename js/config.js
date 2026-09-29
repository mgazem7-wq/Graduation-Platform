// ============================================================
// Graduation Platform - Central Configuration & Demo Mode
// ============================================================

// ---- University Hierarchy Data ----
const UNIVERSITY_DATA = {
  'جامعة تعز': {
    colleges: {
      'كلية العلوم الإدارية': [
        'علوم البيانات',
        'المحاسبة',
        'التسويق',
        'الإدارة',
        'العلوم المالية والمصرفية'
      ]
    }
  },
  'جامعة السعيد': {
    colleges: {
      'كلية إدارة الأعمال': [
        'الإدارة',
        'المحاسبة',
        'التسويق',
        'العلوم المالية والمصرفية'
      ],
      'كلية التقنية والمعلومات': [
        'علوم البيانات',
        'هندسة البرمجيات',
        'نظم المعلومات'
      ]
    }
  },
  'جامعة الجند': {
    colleges: {
      'كلية الاقتصاد والعلوم الإدارية': [
        'الإدارة',
        'المحاسبة',
        'العلوم المالية والمصرفية',
        'التسويق'
      ]
    }
  }
};

// All unique specializations across all universities
const ALL_SPECIALIZATIONS = [
  'علوم البيانات',
  'المحاسبة',
  'التسويق',
  'الإدارة',
  'العلوم المالية والمصرفية',
  'هندسة البرمجيات',
  'نظم المعلومات'
];

// ---- Supabase Config ----
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// ---- Demo Mode Detection ----
const IS_DEMO_MODE = (
  SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
  SUPABASE_URL === '' ||
  !SUPABASE_URL
);

// ---- Initialize Supabase Client (Safe) ----
let supabaseClient = null;
if (!IS_DEMO_MODE) {
  try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.warn('[Config] Failed to initialize Supabase client:', e.message);
  }
} else {
  console.info('[Demo Mode] Running on LocalStorage. Configure SUPABASE_URL to connect to real database.');
}

// ---- Demo Data ----
const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    title: 'تحليل البيانات الاقتصادية باستخدام Python وأدوات التعلم الآلي',
    title_en: 'Economic Data Analysis Using Python and Machine Learning Tools',
    abstract: 'يهدف هذا المشروع إلى بناء نموذج تنبؤي لتحليل الاتجاهات الاقتصادية في اليمن باستخدام تقنيات التعلم الآلي ومعالجة البيانات الضخمة. تم جمع وتنظيف بيانات اقتصادية ومالية تمتد لأكثر من عشر سنوات، وتطبيق خوارزميات الانحدار والتصنيف للتنبؤ بالمتغيرات الاقتصادية الرئيسية.',
    keywords: ['Python', 'تعلم آلي', 'تحليل بيانات', 'اقتصاد'],
    specialization: 'علوم البيانات',
    university: 'جامعة تعز',
    college: 'كلية العلوم الإدارية',
    academic_year: 2026,
    status: 'completed',
    is_public: true,
    final_grade: 92,
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    student_id: 'demo-student-001',
    teamLeader: { userId: 'demo-student-001', name: 'أحمد محمد الصلوي', studentId: '20220001', email: 'ahmed@taiz.edu.ye', role: 'leader' },
    teamMembers: [
      { userId: null, name: 'سلمى عبدالله المنيفي', studentId: '20220045', email: 'salma@taiz.edu.ye', role: 'member' },
      { userId: null, name: 'عمر حسن الجابري', studentId: '20220078', email: 'omar@taiz.edu.ye', role: 'member' }
    ],
    teamSize: 3,
    student: { full_name: 'أحمد محمد الصلوي' },
    supervisor: { full_name: 'د. عبدالله العمراني' },
    profile: { full_name: 'أحمد محمد الصلوي' }
  },
  {
    id: 'demo-2',
    title: 'نظام محاسبي إلكتروني لإدارة مالية الشركات الصغيرة والمتوسطة',
    title_en: 'Electronic Accounting System for SME Financial Management',
    abstract: 'تصميم وتطوير نظام محاسبي متكامل يلبي احتياجات الشركات الصغيرة والمتوسطة في اليمن، مع التركيز على سهولة الاستخدام وتوافق المعايير المحاسبية الدولية IFRS. يشمل النظام إدارة الحسابات والفواتير والتقارير المالية الدورية.',
    keywords: ['محاسبة', 'IFRS', 'نظام مالي', 'شركات صغيرة'],
    specialization: 'المحاسبة',
    university: 'جامعة تعز',
    college: 'كلية العلوم الإدارية',
    academic_year: 2026,
    status: 'completed',
    is_public: true,
    final_grade: 88,
    created_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-08-20T10:00:00Z',
    student_id: 'demo-student-002',
    teamLeader: { userId: 'demo-student-002', name: 'فاطمة علي الحميدي', studentId: '20220112', email: 'fatima@taiz.edu.ye', role: 'leader' },
    teamMembers: [],
    teamSize: 1,
    student: { full_name: 'فاطمة علي الحميدي' },
    supervisor: { full_name: 'د. محمد سالم القحطاني' },
    profile: { full_name: 'فاطمة علي الحميدي' }
  },
  {
    id: 'demo-3',
    title: 'دراسة تأثير الخدمات المصرفية الرقمية على رضا العملاء في البنوك اليمنية',
    title_en: 'Impact of Digital Banking on Customer Satisfaction in Yemeni Banks',
    abstract: 'بحث ميداني شامل لقياس مستوى رضا عملاء البنوك اليمنية عن الخدمات المصرفية الرقمية، مع تحديد العوامل المؤثرة في تبني التكنولوجيا المالية FinTech. تم استخدام المنهج الكمي والاستبانة على عينة من 500 عميل في عدة بنوك.',
    keywords: ['مصرفية رقمية', 'رضا العملاء', 'FinTech', 'بنوك يمنية'],
    specialization: 'العلوم المالية والمصرفية',
    university: 'جامعة تعز',
    college: 'كلية العلوم الإدارية',
    academic_year: 2026,
    status: 'in_progress',
    is_public: false,
    final_grade: null,
    created_at: '2026-07-10T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
    student_id: 'demo-student-003',
    teamLeader: { userId: 'demo-student-003', name: 'يوسف ناصر الزهراني', studentId: '20220189', email: 'yousuf@taiz.edu.ye', role: 'leader' },
    teamMembers: [
      { userId: null, name: 'نهى محمد الشميري', studentId: '20220201', email: 'noha@taiz.edu.ye', role: 'member' }
    ],
    teamSize: 2,
    student: { full_name: 'يوسف ناصر الزهراني' },
    supervisor: { full_name: 'د. سامي أحمد البيضاني' },
    profile: { full_name: 'يوسف ناصر الزهراني' }
  },
  {
    id: 'demo-4',
    title: 'استراتيجية التسويق الرقمي لتعزيز المنتجات اليمنية في الأسواق الخليجية',
    title_en: 'Digital Marketing Strategy for Promoting Yemeni Products in Gulf Markets',
    abstract: 'تهدف الدراسة إلى بناء إطار استراتيجي متكامل للتسويق الرقمي يمكّن المنتجين اليمنيين من الوصول إلى الأسواق الخليجية عبر منصات التجارة الإلكترونية ووسائل التواصل الاجتماعي. تشمل الدراسة تحليل المنافسين وتحديد الفرص السوقية.',
    keywords: ['تسويق رقمي', 'تجارة إلكترونية', 'أسواق خليجية', 'منتجات يمنية'],
    specialization: 'التسويق',
    university: 'جامعة تعز',
    college: 'كلية العلوم الإدارية',
    academic_year: 2026,
    status: 'awaiting_jury',
    is_public: false,
    final_grade: null,
    created_at: '2026-04-05T10:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
    student_id: 'demo-student-004',
    teamLeader: { userId: 'demo-student-004', name: 'مريم عبدالرحمن الشمري', studentId: '20220267', email: 'maryam@taiz.edu.ye', role: 'leader' },
    teamMembers: [
      { userId: null, name: 'كريم سعيد المقطري', studentId: '20220289', email: 'karim@taiz.edu.ye', role: 'member' },
      { userId: null, name: 'هند فيصل الجابري', studentId: '20220301', email: 'hind@taiz.edu.ye', role: 'member' }
    ],
    teamSize: 3,
    student: { full_name: 'مريم عبدالرحمن الشمري' },
    supervisor: { full_name: 'د. خالد عمر الوهابي' },
    profile: { full_name: 'مريم عبدالرحمن الشمري' }
  },
  {
    id: 'demo-5',
    title: 'أثر القيادة التحويلية على الأداء المؤسسي في المنظمات الحكومية اليمنية',
    title_en: 'Effect of Transformational Leadership on Institutional Performance in Yemeni Government Organizations',
    abstract: 'تناقش هذه الدراسة العلاقة بين أسلوب القيادة التحويلية ومستوى الأداء المؤسسي في عينة من الوزارات والهيئات الحكومية اليمنية. تم اعتماد نموذج Bass & Avolio للقيادة التحويلية، وقياس مؤشرات الأداء باستخدام بطاقة الأداء المتوازن BSC.',
    keywords: ['قيادة تحويلية', 'أداء مؤسسي', 'إدارة', 'BSC'],
    specialization: 'الإدارة',
    university: 'جامعة تعز',
    college: 'كلية العلوم الإدارية',
    academic_year: 2025,
    status: 'completed',
    is_public: true,
    final_grade: 85,
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2026-05-15T10:00:00Z',
    student_id: 'demo-student-005',
    teamLeader: { userId: 'demo-student-005', name: 'خالد إبراهيم المقطري', studentId: '20210045', email: 'khaled@taiz.edu.ye', role: 'leader' },
    teamMembers: [],
    teamSize: 1,
    student: { full_name: 'خالد إبراهيم المقطري' },
    supervisor: { full_name: 'د. وليد حسن الشرعبي' },
    profile: { full_name: 'خالد إبراهيم المقطري' }
  },
  {
    id: 'demo-6',
    title: 'نموذج تنبؤي لمخاطر الائتمان المصرفي في بيئة الأزمات الاقتصادية',
    title_en: 'Predictive Model for Banking Credit Risk in Economic Crisis Environments',
    abstract: 'يطرح هذا البحث نموذجاً قياسياً لتقييم مخاطر الائتمان في البنوك التجارية خلال فترات الأزمات الاقتصادية، مستعيناً ببيانات البنوك اليمنية خلال الفترة 2015-2025. يجمع النموذج بين أساليب التحليل المالي الكلاسيكية والخوارزميات الحديثة.',
    keywords: ['مخاطر ائتمان', 'بنوك تجارية', 'أزمات اقتصادية', 'نمذجة'],
    specialization: 'العلوم المالية والمصرفية',
    university: 'جامعة تعز',
    college: 'كلية العلوم الإدارية',
    academic_year: 2025,
    status: 'completed',
    is_public: true,
    final_grade: 90,
    created_at: '2025-10-15T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z',
    student_id: 'demo-student-006',
    teamLeader: { userId: 'demo-student-006', name: 'نور الدين سعيد الأصبحي', studentId: '20210112', email: 'noureddine@taiz.edu.ye', role: 'leader' },
    teamMembers: [
      { userId: null, name: 'ريم عبدالله الحضرمي', studentId: '20210134', email: 'reem@taiz.edu.ye', role: 'member' }
    ],
    teamSize: 2,
    student: { full_name: 'نور الدين سعيد الأصبحي' },
    supervisor: { full_name: 'د. محمد سالم القحطاني' },
    profile: { full_name: 'نور الدين سعيد الأصبحي' }
  }
];

// Demo users
const DEMO_USERS = {
  student: {
    id: 'demo-student-001',
    email: 'student@demo.taiz.edu.ye',
    profile: {
      id: 'demo-student-001',
      full_name: 'أحمد محمد الصلوي',
      role: 'student',
      university: 'جامعة تعز',
      college: 'كلية العلوم الإدارية',
      specialization: 'علوم البيانات',
      student_id: '20220001',
    }
  },
  supervisor: {
    id: 'demo-supervisor-001',
    email: 'supervisor@demo.taiz.edu.ye',
    profile: {
      id: 'demo-supervisor-001',
      full_name: 'د. عبدالله العمراني',
      role: 'supervisor',
      university: 'جامعة تعز',
      college: 'كلية العلوم الإدارية',
      specialization: 'علوم البيانات',
      department: 'قسم علوم البيانات والذكاء الاصطناعي',
    }
  }
};

// ---- LocalStorage Helpers ----
const LS = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(key); } catch {}
  }
};

// Initialize demo data if empty
function initDemoData() {
  if (!LS.get('gp_projects')) {
    LS.set('gp_projects', DEMO_PROJECTS);
  }
}

// Expose everything globally
window.UNIVERSITY_DATA = UNIVERSITY_DATA;
window.ALL_SPECIALIZATIONS = ALL_SPECIALIZATIONS;
window.IS_DEMO_MODE = IS_DEMO_MODE;
window.supabaseClient = supabaseClient;
window.DEMO_PROJECTS = DEMO_PROJECTS;
window.DEMO_USERS = DEMO_USERS;
window.LS = LS;
window.initDemoData = initDemoData;
window.APP_CONFIG = { pageSize: 9 };

// Auto-init demo data
if (IS_DEMO_MODE) {
  initDemoData();
}

// ---- Hierarchy Helper Functions ----

/**
 * Populate a university <select> element
 */
function populateUniversitySelect(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">اختر الجامعة...</option>';
  Object.keys(UNIVERSITY_DATA).forEach(uni => {
    selectEl.innerHTML += `<option value="${uni}">${uni}</option>`;
  });
}

/**
 * Populate a college <select> based on selected university
 */
function populateCollegeSelect(selectEl, university) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">اختر الكلية...</option>';
  if (!university || !UNIVERSITY_DATA[university]) {
    selectEl.disabled = true;
    return;
  }
  const colleges = Object.keys(UNIVERSITY_DATA[university].colleges);
  colleges.forEach(col => {
    selectEl.innerHTML += `<option value="${col}">${col}</option>`;
  });
  selectEl.disabled = false;
}

/**
 * Populate a specialization <select> based on selected university+college
 */
function populateSpecializationSelect(selectEl, university, college) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">اختر التخصص...</option>';
  if (!university || !college || !UNIVERSITY_DATA[university]?.colleges[college]) {
    selectEl.disabled = true;
    return;
  }
  const specs = UNIVERSITY_DATA[university].colleges[college];
  specs.forEach(spec => {
    selectEl.innerHTML += `<option value="${spec}">${spec}</option>`;
  });
  selectEl.disabled = false;
}

/**
 * Wire up cascading university→college→specialization dropdowns
 * @param {string} uniId - university select element id
 * @param {string} colId - college select element id
 * @param {string} specId - specialization select element id
 */
function wireHierarchySelects(uniId, colId, specId) {
  const uniEl = document.getElementById(uniId);
  const colEl = document.getElementById(colId);
  const specEl = document.getElementById(specId);

  if (uniEl) {
    populateUniversitySelect(uniEl);
    uniEl.addEventListener('change', () => {
      populateCollegeSelect(colEl, uniEl.value);
      if (specEl) { specEl.innerHTML = '<option value="">اختر التخصص...</option>'; specEl.disabled = true; }
    });
  }
  if (colEl) {
    colEl.addEventListener('change', () => {
      populateSpecializationSelect(specEl, uniEl?.value, colEl.value);
    });
  }
}

/**
 * Populate specialization-only filter with all known specializations
 */
function populateSpecFilter(selectEl) {
  if (!selectEl) return;
  const firstOpt = selectEl.options[0]?.outerHTML || '<option value="">جميع التخصصات</option>';
  selectEl.innerHTML = firstOpt;
  ALL_SPECIALIZATIONS.forEach(spec => {
    selectEl.innerHTML += `<option value="${spec}">${spec}</option>`;
  });
}

window.populateUniversitySelect = populateUniversitySelect;
window.populateCollegeSelect = populateCollegeSelect;
window.populateSpecializationSelect = populateSpecializationSelect;
window.wireHierarchySelects = wireHierarchySelects;
window.populateSpecFilter = populateSpecFilter;
