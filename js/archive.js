// ============================================================
// Archive Module - Demo + Supabase
// ============================================================

function getArchiveGradeClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 65) return 'pass';
  return 'fail';
}

// Load public completed projects
async function loadArchiveProjects(filters = {}) {
  if (IS_DEMO_MODE) {
    let data = LS.get('gp_projects', []).filter(p => p.status === 'completed' && p.is_public);
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.abstract?.toLowerCase().includes(q) ||
        (p.keywords || []).some(k => k.toLowerCase().includes(q))
      );
    }
    if (filters.specialization) data = data.filter(p => p.specialization === filters.specialization);
    if (filters.university) data = data.filter(p => p.university === filters.university);
    if (filters.year) data = data.filter(p => String(p.academic_year) === String(filters.year));
    
    if (filters.sort === 'grade') {
      data = data.sort((a, b) => (b.final_grade || 0) - (a.final_grade || 0));
    } else {
      data = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    const pageSize = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.pageSize : 9);
    const page = filters.page || 1;
    const paginated = data.slice((page - 1) * pageSize, page * pageSize);
    return { data: paginated, count: data.length };
  }

  let query = supabaseClient
    .from('projects')
    .select(`
      id, title, title_en, abstract, keywords, specialization, university, college, academic_year, final_grade, created_at,
      profile:profiles!projects_student_id_fkey(full_name),
      supervisor:profiles!projects_supervisor_id_fkey(full_name)
    `, { count: 'exact' })
    .eq('status', 'completed')
    .eq('is_public', true);

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,abstract.ilike.%${filters.search}%,keywords.cs.{${filters.search}}`);
  }
  if (filters.specialization) query = query.eq('specialization', filters.specialization);
  if (filters.university) query = query.eq('university', filters.university);
  if (filters.year) query = query.eq('academic_year', parseInt(filters.year));
  
  if (filters.sort === 'grade') {
    query = query.order('final_grade', { ascending: false, nullsFirst: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  
  const page = filters.page || 1;
  const pageSize = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.pageSize : 9);
  query = query.range((page - 1) * pageSize, page * pageSize - 1);
  
  const { data, count, error } = await query;
  if (error) { console.error(error); return { data: [], count: 0 }; }
  return { data: data || [], count: count || 0 };
}

// Load public PDF files for a project
async function getPublicReport(projectId) {
  if (IS_DEMO_MODE) return null;
  
  const { data, error } = await supabaseClient
    .from('project_files')
    .select('file_url, file_name')
    .eq('project_id', projectId)
    .eq('file_type', 'report')
    .eq('is_public', true)
    .limit(1)
    .maybeSingle();
  if (error) console.error(error);
  return data;
}

// Load archive stats
async function loadArchiveStats() {
  if (IS_DEMO_MODE) {
    const data = LS.get('gp_projects', []).filter(p => p.status === 'completed' && p.is_public);
    const uniCount = new Set(data.map(p => p.university)).size;
    const specCount = new Set(data.map(p => p.specialization)).size;
    return { total: data.length, universities: uniCount, specializations: specCount };
  }

  const { count: total } = await supabaseClient
    .from('projects').select('id', { count: 'exact', head: true })
    .eq('status', 'completed').eq('is_public', true);
  const { data: unis } = await supabaseClient
    .from('projects').select('university').eq('status', 'completed').eq('is_public', true);
  const { data: specs } = await supabaseClient
    .from('projects').select('specialization').eq('status', 'completed').eq('is_public', true);
  
  const uniCount = unis ? new Set(unis.map(p => p.university)).size : 0;
  const specCount = specs ? new Set(specs.map(p => p.specialization)).size : 0;
  return { total: total || 0, universities: uniCount, specializations: specCount };
}

// Render project card for archive
function renderArchiveCard(project, reportUrl) {
  const gradeClass = project.final_grade ? getArchiveGradeClass(project.final_grade) : null;
  const keywordsHtml = (project.keywords || []).slice(0, 3).map(k =>
    `<span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:4px;font-size:0.75rem;">${k}</span>`
  ).join('');
  const gradeColors = { excellent: '#10b981', good: '#0ea5e9', pass: '#f59e0b', fail: '#ef4444' };
  const gradeColor = gradeColors[gradeClass] || '#64748b';

  // Team info (backward compatible with solo projects)
  const leaderName = project.teamLeader?.name || project.student?.full_name || project.profile?.full_name || '€Ì— „Õœœ';
  const members = project.teamMembers || [];
  const teamSize = project.teamSize || (1 + members.length);
  const teamSizeLabel = teamSize === 1 ? '' : `?? ${teamSize} √⁄÷«¡`;
  let teamLine = `<span>?? <strong>${leaderName}</strong></span>`;
  if (members.length > 0) {
    teamLine += members.slice(0, 2).map(m => `<span style="color:#475569;">ï ${m.name}</span>`).join('');
    if (members.length > 2) teamLine += `<span style="color:#94a3b8;">+${members.length - 2} ¬Œ—Ê‰</span>`;
  }

  return `
  <div class="card card-hover archive-card" style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;display:flex;flex-direction:column;">
    <div style="height:4px;background:linear-gradient(90deg,#2563eb,#7c3aed);"></div>
    <div style="padding:24px;flex:1;display:flex;flex-direction:column;">
      <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <span style="background:#eff6ff;color:#2563eb;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;">${project.specialization || '⁄«„'}</span>
        <div style="display:flex;gap:6px;align-items:center;">
          ${teamSizeLabel ? `<span style="background:#f3f0ff;color:#6d28d9;padding:3px 8px;border-radius:12px;font-size:0.72rem;font-weight:600;">${teamSizeLabel}</span>` : ''}
          ${gradeClass ? `<span style="background:${gradeColor}15;color:${gradeColor};padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;">${project.final_grade} / 100</span>` : ''}
        </div>
      </div>
      <h3 style="font-size:1.05rem;font-weight:700;color:#0f172a;margin-bottom:10px;line-height:1.5;">${project.title}</h3>
      <p style="font-size:0.88rem;color:#64748b;line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:14px;flex:1;">${project.abstract || '·« ÌÊÃœ „·Œ’ „ «Õ.'}</p>
      ${keywordsHtml ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">${keywordsHtml}</div>` : ''}
      <div style="padding-top:14px;border-top:1px solid #f1f5f9;">
        <div style="font-size:0.8rem;color:#94a3b8;display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
          <span>??? ${project.university || 'Ã«„⁄… €Ì— „Õœœ…'}</span>
          <span>?? ${project.academic_year || '2026'}</span>
          ${project.supervisor?.full_name ? `<span>??û?? ${project.supervisor.full_name}</span>` : ''}
        </div>
        <div style="font-size:0.8rem;color:#374151;display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">${teamLine}</div>
        <div style="display:flex;gap:8px;">
          <a href="project-detail.html?id=${project.id}&public=true" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;text-align:center;">⁄—÷ «· ›«’Ì·</a>
          ${reportUrl ? `<a href="${reportUrl}" target="_blank" class="btn btn-outline btn-sm btn-icon" title=" Õ„Ì· «· ﬁ—Ì—" style="padding:0 12px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}
