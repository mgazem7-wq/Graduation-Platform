// ============================================================
// Team Members Module - Demo + Supabase
// ============================================================
// Data Model for teamMembers inside a project:
// project.teamLeader = { userId, name, studentId, email, role: 'leader' }
// project.teamMembers = [{ userId, name, studentId, email, role: 'member' }, ...]
// project.teamSize = 1..5
//
// Backward compatible: old projects without teamMembers are treated as solo projects.
// ============================================================

/**
 * Get all team members for a project (leader + members).
 * Returns array of { userId, name, studentId, email, role }
 * Always includes leader as first entry.
 */
function getProjectTeam(project) {
  if (!project) return [];

  // Build leader entry
  const leader = project.teamLeader || {
    userId: project.student_id || null,
    name: project.student?.full_name || 'غير محدد',
    studentId: project.leader_student_id || '',
    email: project.leader_email || '',
    role: 'leader'
  };

  const members = (project.teamMembers || []).map(m => ({ ...m, role: 'member' }));
  return [{ ...leader, role: 'leader' }, ...members];
}

/**
 * Check if a user is the Team Leader of a project.
 * userId: the logged-in user's id
 */
function isTeamLeader(project, userId) {
  if (!project || !userId) return false;
  // Primary check: student_id (Supabase) or teamLeader.userId (demo)
  if (project.student_id === userId) return true;
  if (project.teamLeader?.userId === userId) return true;
  return false;
}

/**
 * Check if a user is a member of a project (leader OR member).
 */
function isTeamMember(project, userId) {
  if (!project || !userId) return false;
  if (isTeamLeader(project, userId)) return true;
  return (project.teamMembers || []).some(m => m.userId === userId);
}

/**
 * Get user's role in a project.
 * Returns 'leader' | 'member' | null
 */
function getUserProjectRole(project, userId) {
  if (!project || !userId) return null;
  if (isTeamLeader(project, userId)) return 'leader';
  if (isTeamMember(project, userId)) return 'member';
  return null;
}

/**
 * Get team size (including leader).
 */
function getTeamSize(project) {
  if (!project) return 0;
  return 1 + (project.teamMembers || []).length;
}

/**
 * Render the team panel HTML (for project-detail and evaluate pages).
 * @param {Object} project - project object with teamLeader and teamMembers
 * @param {boolean} compact - if true, renders compact version
 */
function renderTeamPanel(project, compact = false) {
  const team = getProjectTeam(project);
  if (!team.length) return '';

  const memberHtml = team.map((m, idx) => {
    const isLeader = m.role === 'leader';
    const initials = (m.name || '?').split(' ').map(n => n[0]).join('').substring(0, 2);
    const roleLabel = isLeader
      ? `<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;">👑 قائد الفريق</span>`
      : `<span style="background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:20px;font-size:0.72rem;">عضو فريق</span>`;

    if (compact) {
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f1f5f9;${idx === team.length - 1 ? 'border-bottom:none;' : ''}">
          <div style="width:32px;height:32px;border-radius:50%;background:${isLeader ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e5e7eb'};color:${isLeader ? '#fff' : '#6b7280'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;flex-shrink:0;">${initials}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:0.875rem;color:#0f172a;">${m.name || 'غير محدد'}</div>
            ${m.studentId ? `<div style="font-size:0.75rem;color:#94a3b8;">${m.studentId}</div>` : ''}
          </div>
          ${roleLabel}
        </div>`;
    }

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:${isLeader ? 'linear-gradient(135deg,#eff6ff,#f5f3ff)' : '#f9fafb'};border-radius:10px;border:1px solid ${isLeader ? '#bfdbfe' : '#e5e7eb'};">
        <div style="width:44px;height:44px;border-radius:50%;background:${isLeader ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e5e7eb'};color:${isLeader ? '#fff' : '#6b7280'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;">${initials}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;color:#0f172a;">${m.name || 'غير محدد'}</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px;">
            ${roleLabel}
            ${m.studentId ? `<span style="font-size:0.78rem;color:#64748b;">الرقم: ${m.studentId}</span>` : ''}
            ${m.email ? `<span style="font-size:0.78rem;color:#64748b;">${m.email}</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  const teamSize = team.length;
  const headerHtml = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div style="font-weight:700;font-size:0.95rem;color:#0f172a;display:flex;align-items:center;gap:6px;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
        فريق المشروع
      </div>
      <span style="background:#e0e7ff;color:#3730a3;padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;">${teamSize} ${teamSize === 1 ? 'عضو' : 'أعضاء'}</span>
    </div>`;

  return `<div>${headerHtml}<div style="display:flex;flex-direction:column;gap:${compact ? '0' : '10px'};">${memberHtml}</div></div>`;
}

/**
 * Validate a new member before adding to the team.
 * @param {Array} currentTeam - array of existing members (including leader if checking)
 * @param {Object} newMember - { name, studentId, email }
 * @param {Object} leaderInfo - { name, studentId, email }
 * @returns {string|null} error message or null if valid
 */
function validateNewMember(currentTeam, newMember, leaderInfo) {
  const { name, studentId, email } = newMember;

  if (!name || !name.trim()) return 'الاسم مطلوب.';
  if (!studentId || !studentId.trim()) return 'الرقم الجامعي مطلوب.';
  if (!email || !email.trim()) return 'البريد الإلكتروني مطلوب.';

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'صيغة البريد الإلكتروني غير صحيحة.';

  // Check against leader
  if (leaderInfo) {
    if (leaderInfo.studentId && leaderInfo.studentId.trim() === studentId.trim()) {
      return 'لا يمكن إضافة قائد الفريق كعضو مرة أخرى.';
    }
    if (leaderInfo.email && leaderInfo.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      return 'لا يمكن إضافة قائد الفريق كعضو مرة أخرى.';
    }
  }

  // Check duplicates in existing team
  for (const m of currentTeam) {
    if (m.studentId && m.studentId.trim() === studentId.trim()) {
      return 'الرقم الجامعي موجود بالفعل في الفريق.';
    }
    if (m.email && m.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      return 'البريد الإلكتروني موجود بالفعل في الفريق.';
    }
  }

  return null;
}

/**
 * Get projects where a user is a team member (for dashboard).
 * Works with LocalStorage demo data.
 */
function getProjectsForUser(allProjects, userId, userFullName) {
  return allProjects.filter(p => {
    // Leader check
    if (p.student_id === userId) return true;
    if (p.teamLeader?.userId === userId) return true;
    // Name-based check for demo mode
    if (p.student?.full_name === userFullName) return true;
    if (p.teamLeader?.name === userFullName) return true;
    // Members check
    if ((p.teamMembers || []).some(m => m.userId === userId || m.name === userFullName)) return true;
    return false;
  });
}

/**
 * Demo: Save a project to LocalStorage with full team data.
 */
function saveDemoProject(projectData) {
  const projects = LS.get('gp_projects', []);
  const idx = projects.findIndex(p => p.id === projectData.id);
  if (idx >= 0) {
    projects[idx] = { ...projects[idx], ...projectData };
  } else {
    projects.unshift(projectData);
  }
  LS.set('gp_projects', projects);
  return projectData;
}

/**
 * Demo: Get a single project by ID.
 */
function getDemoProject(projectId) {
  const projects = LS.get('gp_projects', []);
  return projects.find(p => p.id === projectId) || null;
}

/**
 * Demo: Get demo evaluations for a project.
 */
function getDemoEvaluations(projectId) {
  const evals = LS.get('gp_evaluations', []);
  return evals.filter(e => e.project_id === projectId);
}

/**
 * Demo: Save evaluation.
 */
function saveDemoEvaluation(evalData) {
  const evals = LS.get('gp_evaluations', []);
  const idx = evals.findIndex(e => e.project_id === evalData.project_id && e.evaluator_id === evalData.evaluator_id);
  if (idx >= 0) {
    evals[idx] = { ...evals[idx], ...evalData, updated_at: new Date().toISOString() };
  } else {
    evals.unshift({ ...evalData, id: 'eval-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  LS.set('gp_evaluations', evals);
}

/**
 * Demo: Get status history for a project.
 */
function getDemoHistory(projectId) {
  const history = LS.get('gp_status_history', []);
  return history.filter(h => h.project_id === projectId).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
}

/**
 * Demo: Add status history entry.
 */
function addDemoHistory(projectId, newStatus, changedBy, note) {
  const history = LS.get('gp_status_history', []);
  history.unshift({
    id: 'hist-' + Date.now(),
    project_id: projectId,
    new_status: newStatus,
    changed: { full_name: changedBy },
    note: note || null,
    changed_at: new Date().toISOString()
  });
  LS.set('gp_status_history', history);
}

// Expose globally
window.getProjectTeam = getProjectTeam;
window.isTeamLeader = isTeamLeader;
window.isTeamMember = isTeamMember;
window.getUserProjectRole = getUserProjectRole;
window.getTeamSize = getTeamSize;
window.renderTeamPanel = renderTeamPanel;
window.validateNewMember = validateNewMember;
window.getProjectsForUser = getProjectsForUser;
window.saveDemoProject = saveDemoProject;
window.getDemoProject = getDemoProject;
window.getDemoEvaluations = getDemoEvaluations;
window.saveDemoEvaluation = saveDemoEvaluation;
window.getDemoHistory = getDemoHistory;
window.addDemoHistory = addDemoHistory;
