// ============================================================
// Projects Module - Demo + Supabase
// ============================================================

let currentView = 'grid';
let allProjectsData = [];

async function initProjectsPage() {
  // Populate specialization filter with platform specializations
  if (typeof populateSpecFilter === 'function') {
    populateSpecFilter(document.getElementById('filter-spec'));
  }
  setupFilters();
  await fetchAndRenderProjects();
}

function setupFilters() {
  const s = document.getElementById('filter-search');
  const st = document.getElementById('filter-status');
  const sp = document.getElementById('filter-spec');
  const sy = document.getElementById('filter-year');
  
  [s, st, sp, sy].forEach(el => {
    if (el) el.addEventListener('change', fetchAndRenderProjects);
  });
  if (s) s.addEventListener('keyup', e => { if (e.key === 'Enter') fetchAndRenderProjects(); });

  const btnGrid = document.getElementById('view-grid');
  const btnList = document.getElementById('view-list');

  if (btnGrid) {
    btnGrid.addEventListener('click', () => {
      currentView = 'grid';
      btnGrid.classList.add('active');
      if (btnList) btnList.classList.remove('active');
      renderData(allProjectsData);
    });
  }
  if (btnList) {
    btnList.addEventListener('click', () => {
      currentView = 'list';
      btnList.classList.add('active');
      if (btnGrid) btnGrid.classList.remove('active');
      renderData(allProjectsData);
    });
  }
}

// Load projects list with filters
async function loadProjects(filters = {}) {
  const auth = await getCurrentUser();
  if (!auth) return { data: [], count: 0 };

  if (IS_DEMO_MODE) {
    let data = LS.get('gp_projects', []);
    
    // Role filtering
    if (auth.profile.role === 'student') {
      const myProjects = data.filter(p => p.student?.full_name === auth.profile.full_name || p.student_id === auth.user.id);
      data = myProjects.length > 0 ? myProjects : data.slice(0, 3);
    } else if (auth.profile.role === 'supervisor') {
      const myProjects = data.filter(p => p.supervisor?.full_name === auth.profile.full_name || p.supervisor_id === auth.user.id);
      data = myProjects.length > 0 ? myProjects : data;
    }
    
    // Apply filters
    if (filters.status) data = data.filter(p => p.status === filters.status);
    if (filters.specialization) data = data.filter(p => p.specialization === filters.specialization);
    if (filters.year) data = data.filter(p => String(p.academic_year) === String(filters.year));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.abstract?.toLowerCase().includes(q) ||
        p.specialization?.toLowerCase().includes(q)
      );
    }
    
    return { data, count: data.length };
  }

  // Supabase mode
  let query = supabaseClient.from('projects').select(`
    *,
    student:profiles!student_id(full_name),
    supervisor:profiles!supervisor_id(full_name)
  `, { count: 'exact' });

  if (auth.profile.role === 'student') query = query.eq('student_id', auth.user.id);
  else if (auth.profile.role === 'supervisor') query = query.eq('supervisor_id', auth.user.id);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.specialization) query = query.eq('specialization', filters.specialization);
  if (filters.year) query = query.eq('academic_year', filters.year);
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,abstract.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });
  const { data, count, error } = await query;
  if (error) { console.error('Error fetching projects:', error); return { data: [], count: 0 }; }
  return { data, count };
}

async function fetchAndRenderProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-container p-8 text-center"><div class="loading-spinner mb-4"></div><p class="text-muted">جارٍ تحميل المشاريع...</p></div>';

  const filters = {
    search: document.getElementById('filter-search')?.value,
    status: document.getElementById('filter-status')?.value,
    specialization: document.getElementById('filter-spec')?.value,
    year: document.getElementById('filter-year')?.value
  };

  const result = await loadProjects(filters);
  allProjectsData = result.data;
  renderData(allProjectsData);
}

function renderData(data) {
  const container = document.getElementById('projects-container');
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-state p-12 text-center text-muted"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="#cbd5e1" style="margin:0 auto 16px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg><p>لا توجد مشاريع مطابقة للبحث.</p></div>';
    return;
  }

  if (currentView === 'grid') {
    container.innerHTML = `<div class="projects-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${data.map(p => renderProjectCard(p)).join('')}
    </div>`;
  } else {
    container.innerHTML = renderProjectsTable(data);
  }
}

const STATUS_LABELS = {
  'draft': 'مسودة', 'under_review': 'قيد المراجعة', 'approved': 'مقبول',
  'rejected': 'مرفوض', 'in_progress': 'قيد التنفيذ', 'awaiting_jury': 'بانتظار التحكيم',
  'needs_revision': 'بحاجة لتعديل', 'completed': 'مكتمل'
};

function getBadgeClass(status) {
  const map = { 'in_progress': 'progress', 'awaiting_jury': 'jury', 'needs_revision': 'revision', 'under_review': 'review', 'completed': 'completed', 'approved': 'approved', 'rejected': 'rejected', 'draft': 'draft' };
  return `badge badge-${map[status] || status}`;
}

function renderProjectCard(project) {
  const badgeClass = getBadgeClass(project.status);
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  return `
  <div class="project-card card hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onclick="window.location.href='project-detail.html?id=${project.id}'">
    <div class="project-card-header p-4 border-b">
      <div class="flex justify-between items-start mb-2">
        <h3 class="project-card-title font-semibold text-lg line-clamp-2">${project.title}</h3>
      </div>
      <div class="flex justify-between items-center mt-2">
        <span style="font-size:0.78rem;background:#eff6ff;color:#2563eb;padding:3px 8px;border-radius:4px;font-weight:500;">${project.specialization || 'عام'}</span>
        <span class="${badgeClass}">${statusLabel}</span>
      </div>
    </div>
    <div class="project-card-body p-4 flex-1">
      <p class="project-card-abstract text-sm text-gray-600 line-clamp-3">${project.abstract || 'لا يوجد ملخص'}</p>
    </div>
    <div class="project-card-footer p-4 border-t bg-gray-50 text-xs text-gray-500">
      <div class="flex justify-between mb-1">
        <span>الطالب: ${project.student?.full_name || '-'}</span>
        <span>${new Date(project.created_at).toLocaleDateString('ar-SA')}</span>
      </div>
      <div>المشرف: ${project.supervisor?.full_name || 'لم يحدد بعد'}</div>
      ${project.university ? `<div style="margin-top:6px;color:#6b7280;font-size:0.75rem;">🏛️ ${project.university}</div>` : ''}
    </div>
  </div>`;
}

function renderProjectsTable(data) {
  return `
  <div class="table-wrap card">
    <table class="data-table">
      <thead>
        <tr>
          <th>المشروع</th>
          <th>التخصص</th>
          <th>الحالة</th>
          <th>الطالب / المشرف</th>
          <th>التاريخ</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(p => `
          <tr class="cursor-pointer hover:bg-gray-50" onclick="window.location.href='project-detail.html?id=${p.id}'">
            <td class="font-semibold max-w-xs truncate" title="${p.title}">${p.title}</td>
            <td><span style="font-size:0.78rem;background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:4px;">${p.specialization || '-'}</span></td>
            <td><span class="${getBadgeClass(p.status)}">${STATUS_LABELS[p.status] || p.status}</span></td>
            <td class="text-sm">
              <div class="font-medium">${p.student?.full_name || '-'}</div>
              <div class="text-gray-500 text-xs">${p.supervisor?.full_name || 'بدون مشرف'}</div>
            </td>
            <td class="text-sm text-gray-500">${new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// =================== NEW PROJECT FORM =================== //

let projectMembers = [];
let tags = [];

function initTagsInput(inputId, tagsContainerId, hiddenArrayId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(tagsContainerId);
  const hidden = document.getElementById(hiddenArrayId);
  if (!input || !container) return;

  function updateView() {
    container.querySelectorAll('.tag-chip').forEach(e => e.remove());
    tags.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = 'tag-chip bg-primary/10 text-primary text-xs px-2 py-1 rounded flex items-center gap-1';
      span.innerHTML = `${t} <button type="button" class="text-red-500 hover:text-red-700" onclick="removeTag(${i})">×</button>`;
      container.insertBefore(span, input);
    });
    if (hidden) hidden.value = JSON.stringify(tags);
  }

  window.removeTag = function(idx) { tags.splice(idx, 1); updateView(); };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !tags.includes(val)) { tags.push(val); input.value = ''; updateView(); }
    }
  });
}

function nextStep(step) {
  if (step === 2) {
    const title = document.getElementById('p-title')?.value;
    const abs = document.getElementById('p-abstract')?.value;
    if (!title || abs.length < 100) { alert('الرجاء تعبئة العنوان والملخص (100 حرف على الأقل)'); return; }
  }
  if (step === 3) {
    if (!document.getElementById('p-university')?.value || !document.getElementById('p-college')?.value || !document.getElementById('p-specialization')?.value) {
      alert('الرجاء اختيار الجامعة والكلية والتخصص'); return;
    }
  }
  if (step === 4) updateReview();

  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('step-' + step)?.classList.remove('hidden');

  const items = document.querySelectorAll('.step-item');
  items.forEach((item, idx) => {
    const circle = item.querySelector('.step-circle');
    if (!circle) return;
    if (idx < step - 1) {
      circle.style.background = 'var(--color-primary)';
      circle.style.color = '#fff';
    } else if (idx === step - 1) {
      circle.style.background = 'var(--color-primary)';
      circle.style.color = '#fff';
    } else {
      circle.style.background = '#d1d5db';
      circle.style.color = '#fff';
    }
  });
}

function prevStep(step) {
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('step-' + step)?.classList.remove('hidden');
}

// University change handler for new project form
function onProjectUniversityChange() {
  const uni = document.getElementById('p-university')?.value;
  populateCollegeSelect(document.getElementById('p-college'), uni);
  const specEl = document.getElementById('p-specialization');
  if (specEl) { specEl.innerHTML = '<option value="">اختر التخصص...</option>'; specEl.disabled = true; }
  
  // Load supervisors if Supabase
  if (!IS_DEMO_MODE && uni) {
    onUniversityChange();
  } else if (IS_DEMO_MODE && uni) {
    // Demo supervisors
    const supSelect = document.getElementById('p-supervisor');
    if (supSelect) {
      supSelect.innerHTML = '<option value="">بدون مشرف مبدئياً</option><option value="demo-supervisor-001">د. عبدالله العمراني (علوم البيانات)</option><option value="demo-supervisor-002">د. محمد سالم القحطاني (المحاسبة)</option>';
    }
  }
}

async function onUniversityChange() {
  const uni = document.getElementById('p-university')?.value;
  const supSelect = document.getElementById('p-supervisor');
  if (!supSelect) return;
  supSelect.innerHTML = '<option value="">جارٍ التحميل...</option>';
  if (!uni) { supSelect.innerHTML = '<option value="">اختر المشرف...</option>'; return; }
  
  const { data } = await supabaseClient
    .from('profiles')
    .select('id, full_name, specialization')
    .eq('role', 'supervisor')
    .eq('university', uni);
    
  supSelect.innerHTML = '<option value="">بدون مشرف مبدئياً</option>';
  if (data) {
    data.forEach(s => { supSelect.innerHTML += `<option value="${s.id}">${s.full_name} (${s.specialization || 'عام'})</option>`; });
  }
}

async function addMember() {
  const search = document.getElementById('member-search')?.value.trim();
  if (!search) return;
  if (projectMembers.length >= 3) { alert('لا يمكن إضافة أكثر من 3 أعضاء إضافيين.'); return; }

  if (IS_DEMO_MODE) {
    const fakeMember = { id: 'demo-member-' + Date.now(), full_name: search, student_id: '202200XX' };
    projectMembers.push(fakeMember);
    renderMembers();
    document.getElementById('member-search').value = '';
    return;
  }
  
  const { data } = await supabaseClient
    .from('profiles').select('id, full_name, student_id').eq('role', 'student')
    .or(`student_id.eq.${search},full_name.ilike.%${search}%`).limit(1).single();
    
  if (data) {
    if (projectMembers.find(m => m.id === data.id)) { alert('الطالب مضاف مسبقاً'); return; }
    projectMembers.push(data);
    renderMembers();
    document.getElementById('member-search').value = '';
  } else {
    alert('لم يتم العثور على طالب مطابق');
  }
}

function renderMembers() {
  const tbody = document.getElementById('members-list');
  if (!tbody) return;
  const leaderRow = document.getElementById('leader-row')?.outerHTML || '';
  let html = leaderRow;
  projectMembers.forEach((m, idx) => {
    html += `<tr><td>${m.full_name}</td><td>${m.student_id || '-'}</td><td>عضو</td><td><button type="button" class="text-red-500" onclick="removeMember(${idx})">إزالة</button></td></tr>`;
  });
  tbody.innerHTML = html;
}

window.removeMember = function(idx) { projectMembers.splice(idx, 1); renderMembers(); };

function updateReview() {
  const get = id => document.getElementById(id)?.value || '-';
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  
  set('rev-title', get('p-title'));
  set('rev-uni', get('p-university') + ' - ' + get('p-college'));
  set('rev-spec', get('p-specialization'));
  const supSelect = document.getElementById('p-supervisor');
  set('rev-sup', supSelect?.options[supSelect.selectedIndex]?.text || '-');
  set('rev-abs', get('p-abstract'));
}

// Create new project
async function submitProject() {
  const btn = document.getElementById('btn-submit');
  if (btn) { btn.disabled = true; btn.innerText = 'جارٍ الإرسال...'; }

  try {
    const auth = await getCurrentUser();
    if (!auth) throw new Error("غير مسجل الدخول");

    const projectData = {
      id: IS_DEMO_MODE ? ('proj-' + Date.now()) : undefined,
      title: document.getElementById('p-title')?.value,
      title_en: document.getElementById('p-title-en')?.value,
      abstract: document.getElementById('p-abstract')?.value,
      keywords: tags,
      specialization: document.getElementById('p-specialization')?.value,
      university: document.getElementById('p-university')?.value,
      college: document.getElementById('p-college')?.value,
      supervisor_id: document.getElementById('p-supervisor')?.value || null,
      student_id: auth.user.id,
      status: 'draft',
      academic_year: new Date().getFullYear(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student: { full_name: auth.profile.full_name },
      supervisor: { full_name: '' }
    };

    if (IS_DEMO_MODE) {
      const projects = LS.get('gp_projects', []);
      projects.unshift(projectData);
      LS.set('gp_projects', projects);
      window.location.href = `project-detail.html?id=${projectData.id}`;
      return;
    }

    const { data, error } = await supabaseClient.from('projects').insert(projectData).select().single();
    if (error) throw error;

    if (projectMembers.length > 0) {
      await supabaseClient.from('project_members').insert(
        projectMembers.map(m => ({ project_id: data.id, student_id: m.id, role: 'member' }))
      );
    }
    await supabaseClient.from('status_history').insert({
      project_id: data.id, new_status: 'draft',
      changed_by: auth.user.id, note: 'تم إنشاء المشروع كمسودة'
    });
    window.location.href = `project-detail.html?id=${data.id}`;

  } catch (err) {
    console.error('Error creating project:', err);
    alert('حدث خطأ أثناء إنشاء المشروع: ' + err.message);
    if (btn) { btn.disabled = false; btn.innerText = 'إنشاء المشروع'; }
  }
}

window.onProjectUniversityChange = onProjectUniversityChange;
window.onUniversityChange = onUniversityChange;
window.addMember = addMember;
window.submitProject = submitProject;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.initTagsInput = initTagsInput;
