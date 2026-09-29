// ============================================================
// Dashboard - Stats & Charts (Demo + Supabase)
// ============================================================

// Load dashboard stats
async function loadStats(userId, role) {
  try {
    let projects = [];

    if (IS_DEMO_MODE) {
      const allProjects = LS.get('gp_projects', []);
      if (role === 'student') {
        // Use team-aware filter
        projects = typeof getProjectsForUser === 'function'
          ? getProjectsForUser(allProjects, userId, window._currentProfile?.full_name)
          : allProjects.filter(p => p.student?.full_name === window._currentProfile?.full_name || p.student_id === userId);
        if (projects.length === 0) projects = allProjects.slice(0, 2);
      } else if (role === 'supervisor') {
        projects = allProjects.filter(p => p.supervisor?.full_name === window._currentProfile?.full_name || p.supervisor_id === userId);
        if (projects.length === 0) projects = allProjects;
      } else {
        projects = allProjects;
      }
    } else {
      let query = supabaseClient.from('projects').select('status, specialization');
      if (role === 'student') {
        // Both as leader and as project_member
        const { data: memberProjects } = await supabaseClient.from('project_members').select('project_id').eq('student_id', userId);
        const memberIds = (memberProjects || []).map(m => m.project_id);
        query = supabaseClient.from('projects').select('status, specialization').or(`student_id.eq.${userId}${memberIds.length ? `,id.in.(${memberIds.join(',')})` : ''}`);
      } else if (role === 'supervisor') query = query.eq('supervisor_id', userId);
      const { data, error } = await query;
      if (error) throw error;
      projects = data || [];
    }

    const counts = { total: projects.length, progress: 0, jury: 0, completed: 0 };
    const statusCounts = {};
    const specCounts = {};

    projects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      if (p.status === 'in_progress') counts.progress++;
      if (p.status === 'awaiting_jury') counts.jury++;
      if (p.status === 'completed') counts.completed++;
      const s = p.specialization || 'غير محدد';
      specCounts[s] = (specCounts[s] || 0) + 1;
    });

    animateNumber('stat-total', counts.total);
    animateNumber('stat-progress', counts.progress);
    animateNumber('stat-jury', counts.jury);
    animateNumber('stat-completed', counts.completed);

    renderStatusChart(statusCounts);
    renderSpecChart(specCounts);

  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

function animateNumber(id, end) {
  const el = document.getElementById(id);
  if (!el) return;
  if (end === 0) { el.innerText = '0'; return; }
  let start = 0;
  const duration = 800;
  const stepTime = Math.max(10, Math.floor(duration / end));
  const timer = setInterval(() => {
    start++;
    el.innerText = start;
    if (start >= end) { clearInterval(timer); el.innerText = end; }
  }, stepTime);
}

// Render status doughnut chart
function renderStatusChart(statusCounts) {
  const ctx = document.getElementById('status-chart');
  if (!ctx) return;
  
  const labelsMap = {
    'draft': 'مسودة', 'under_review': 'قيد المراجعة', 'approved': 'مقبول',
    'rejected': 'مرفوض', 'in_progress': 'قيد التنفيذ', 'awaiting_jury': 'بانتظار التحكيم',
    'needs_revision': 'بحاجة لتعديل', 'completed': 'مكتمل'
  };
  const colorsMap = {
    'draft': '#64748B', 'under_review': '#0369A1', 'approved': '#15803D',
    'rejected': '#DC2626', 'in_progress': '#D97706', 'awaiting_jury': '#7E22CE',
    'needs_revision': '#EA580C', 'completed': '#0F766E'
  };

  const labels = [], data = [], bgColors = [];
  for (const [status, count] of Object.entries(statusCounts)) {
    if (count > 0) {
      labels.push(labelsMap[status] || status);
      data.push(count);
      bgColors.push(colorsMap[status] || '#CBD5E1');
    }
  }
  if (data.length === 0) { labels.push('لا توجد بيانات'); data.push(1); bgColors.push('#E2E8F0'); }

  // Destroy previous chart if exists
  if (window._statusChart) window._statusChart.destroy();
  window._statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Readex Pro', size: 12 }, padding: 16 } }
      }
    }
  });
}

// Render specialization bar chart
function renderSpecChart(specCounts) {
  const ctx = document.getElementById('spec-chart');
  if (!ctx) return;
  
  const sorted = Object.entries(specCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const labels = sorted.map(i => i[0]);
  const data = sorted.map(i => i[1]);

  if (window._specChart) window._specChart.destroy();
  window._specChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'عدد المشاريع',
        data,
        backgroundColor: ['#2563eb', '#0ea5e9', '#7c3aed', '#16a34a', '#d97706', '#dc2626'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Readex Pro' } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { font: { family: 'Readex Pro', size: 11 } }, grid: { display: false } }
      }
    }
  });
}

// Load recent projects table
async function loadRecentProjects(userId, role) {
  try {
    let data = [];

    if (IS_DEMO_MODE) {
      const allProjects = LS.get('gp_projects', []);
      if (role === 'student') {
        data = typeof getProjectsForUser === 'function'
          ? getProjectsForUser(allProjects, userId, window._currentProfile?.full_name)
          : allProjects.filter(p => p.student?.full_name === window._currentProfile?.full_name || p.student_id === userId);
        if (data.length === 0) data = allProjects.slice(0, 3);
      } else if (role === 'supervisor') {
        data = allProjects.filter(p => p.supervisor?.full_name === window._currentProfile?.full_name || p.supervisor_id === userId);
        if (data.length === 0) data = allProjects;
      } else {
        data = allProjects;
      }
      data = data.slice(0, 5);
    } else {
      let query = supabaseClient.from('projects').select(`
        id, title, specialization, status, updated_at,
        student:profiles!student_id(full_name),
        supervisor:profiles!supervisor_id(full_name)
      `).order('updated_at', { ascending: false }).limit(5);
      if (role === 'student') query = query.eq('student_id', userId);
      else if (role === 'supervisor') query = query.eq('supervisor_id', userId);
      const { data: d, error } = await query;
      if (error) throw error;
      data = d || [];
    }

    const tbody = document.getElementById('recent-projects-tbody');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">لا توجد مشاريع حديثة</td></tr>';
      return;
    }

    const statusLabel = s => ({
      'draft': 'مسودة', 'under_review': 'قيد المراجعة', 'approved': 'مقبول',
      'rejected': 'مرفوض', 'in_progress': 'قيد التنفيذ', 'awaiting_jury': 'بانتظار التحكيم',
      'needs_revision': 'بحاجة لتعديل', 'completed': 'مكتمل'
    }[s] || s);

    const badgeClass = s => {
      const map = { 'in_progress': 'progress', 'awaiting_jury': 'jury', 'needs_revision': 'revision', 'under_review': 'review', 'completed': 'completed', 'approved': 'approved', 'rejected': 'rejected', 'draft': 'draft' };
      return `badge badge-${map[s] || s}`;
    };

    tbody.innerHTML = data.map(p => {
      // Determine user's role in this project
      let myRoleBadge = '';
      if (role === 'student') {
        const isLeader = p.student_id === userId ||
          p.teamLeader?.userId === userId ||
          p.teamLeader?.name === window._currentProfile?.full_name ||
          p.student?.full_name === window._currentProfile?.full_name;
        const isMember = !isLeader && (p.teamMembers || []).some(m => m.userId === userId || m.name === window._currentProfile?.full_name);
        myRoleBadge = isLeader
          ? `<span style="background:#dbeafe;color:#1d4ed8;padding:2px 7px;border-radius:12px;font-size:0.7rem;font-weight:700;white-space:nowrap;">👑 قائد</span>`
          : isMember
            ? `<span style="background:#f3f4f6;color:#6b7280;padding:2px 7px;border-radius:12px;font-size:0.7rem;white-space:nowrap;">عضو</span>`
            : '';
      }

      // Team size
      const teamSize = p.teamSize || (1 + (p.teamMembers || []).length);
      const teamLabel = teamSize === 1 ? 'فردي' : `${teamSize} أعضاء`;

      return `<tr>
        <td class="font-semibold">
          <div>${p.title}</div>
          ${myRoleBadge}
        </td>
        <td><span style="font-size:0.8rem;background:#eff6ff;color:#2563eb;padding:3px 8px;border-radius:4px;">${p.specialization || '-'}</span></td>
        <td><span class="${badgeClass(p.status)}">${statusLabel(p.status)}</span></td>
        <td>${p.teamLeader?.name || p.student?.full_name || '-'}</td>
        <td><span style="font-size:0.8rem;color:#64748b;">${teamLabel}</span></td>
        <td>${p.supervisor?.full_name || 'لم يحدد بعد'}</td>
        <td>${new Date(p.updated_at).toLocaleDateString('ar-SA')}</td>
        <td><a href="project-detail.html?id=${p.id}" class="btn btn-ghost btn-sm">عرض</a></td>
      </tr>`;
    }).join('');

  } catch (err) {
    console.error('Error loading recent projects:', err);
  }
}

// Main init
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuth === 'function') {
    const auth = await requireAuth();
    if (!auth) return;

    window._currentProfile = auth.profile;

    if (typeof updateSidebarUser === 'function') updateSidebarUser(auth.profile);
    if (typeof setActiveNavItem === 'function') setActiveNavItem();
    if (typeof initSidebar === 'function') initSidebar();

    // Update welcome message
    const titleEl = document.querySelector('.page-title');
    if (titleEl && auth.profile.full_name) {
      titleEl.textContent = `مرحباً، ${auth.profile.full_name.split(' ')[0]} 👋`;
    }
    
    // Update university/college info
    const subtitleEl = document.querySelector('.page-subtitle');
    if (subtitleEl && auth.profile.university) {
      subtitleEl.textContent = `${auth.profile.university} • ${auth.profile.college || ''} • ${auth.profile.specialization || ''}`;
    }

    if (auth.profile.role === 'student') {
      const act = document.getElementById('student-actions');
      if (act) act.classList.remove('hidden');
    }

    await loadStats(auth.user.id, auth.profile.role);
    await loadRecentProjects(auth.user.id, auth.profile.role);
  }
});
