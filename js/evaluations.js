// Helper for Grade Class
function getGradeClass(score) {
    if (score >= 85) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'pass';
    return 'fail';
}

function getGradeLabel(score) {
    if (score >= 85) return 'ممتاز';
    if (score >= 75) return 'جيد جداً';
    if (score >= 65) return 'جيد';
    if (score >= 50) return 'مقبول';
    return 'ضعيف';
}

// Load existing evaluation for current user
async function loadMyEvaluation(projectId) {
  const auth = await getCurrentUser();
  if (!auth) return null;
  
  const { data, error } = await supabaseClient
    .from('evaluations')
    .select('*, evaluator:profiles!evaluations_evaluator_id_fkey(full_name, role)')
    .eq('project_id', projectId)
    .eq('evaluator_id', auth.user.id)
    .maybeSingle();
  
  if (error) console.error(error);
  return data;
}

// Load all evaluations for a project
async function loadProjectEvaluations(projectId) {
  const { data, error } = await supabaseClient
    .from('evaluations')
    .select('*, evaluator:profiles!evaluations_evaluator_id_fkey(full_name, role)')
    .eq('project_id', projectId)
    .order('created_at');
  
  if (error) console.error(error);
  return data || [];
}

// Save or update evaluation
async function saveEvaluation(projectId, scores, comments, isFinal) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error('غير مصادق');
  
  const evaluatorRole = auth.profile.role === 'supervisor' ? 'supervisor' : 'jury';
  const total = scores.methodology + scores.innovation + scores.implementation + scores.presentation;
  
  const payload = {
    project_id: projectId,
    evaluator_id: auth.user.id,
    evaluator_role: evaluatorRole,
    score_methodology: scores.methodology,
    score_innovation: scores.innovation,
    score_implementation: scores.implementation,
    score_presentation: scores.presentation,
    total_score: total,
    comments,
    is_final: isFinal
  };
  
  const { data, error } = await supabaseClient
    .from('evaluations')
    .upsert(payload, { onConflict: 'project_id,evaluator_id' })
    .select()
    .single();
  
  if (error) throw error;
  
  // If final, update project grade
  if (isFinal) {
    const { error: updateError } = await supabaseClient
      .from('projects')
      .update({ final_grade: total, status: 'completed', is_public: true })
      .eq('id', projectId);
    
    if (updateError) throw updateError;
  }
  
  return data;
}

// Render evaluation card HTML
function renderEvaluationCard(evaluation) {
  const gradeClass = getGradeClass(evaluation.total_score || 0);
  const gradeLabel = getGradeLabel(evaluation.total_score || 0);
  
  return `
    <div class="card" style="border: 1px solid #e5e7eb; box-shadow: none;">
        <div class="card-body">
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-3">
                    <div class="avatar" style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #6b7280;">
                        ${evaluation.evaluator?.full_name ? evaluation.evaluator.full_name.charAt(0) : '?'}
                    </div>
                    <div>
                        <div class="font-semibold">${evaluation.evaluator?.full_name || 'مقيم غير معروف'}</div>
                        <div class="text-sm text-muted">
                            <span class="badge ${evaluation.evaluator_role === 'jury' ? 'badge-jury' : 'badge-progress'}">${evaluation.evaluator_role === 'jury' ? 'لجنة تحكيم' : 'مشرف'}</span>
                            ${evaluation.is_final ? '<span class="badge badge-completed" style="margin-right: 4px;">تقييم نهائي</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="score-circle ${gradeClass}" style="width: 60px; height: 60px; border-width: 4px; font-size: 1rem;">
                    <div class="score-value font-bold">${evaluation.total_score || 0}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 0.9rem;">
                <div>
                    <div class="flex justify-between text-muted mb-1"><span>منهجية البحث</span><span>${evaluation.score_methodology}/25</span></div>
                    <div class="score-meter"><div class="score-fill ${getGradeClass(evaluation.score_methodology * 4)}" style="width: ${(evaluation.score_methodology/25)*100}%"></div></div>
                </div>
                <div>
                    <div class="flex justify-between text-muted mb-1"><span>الابتكار</span><span>${evaluation.score_innovation}/25</span></div>
                    <div class="score-meter"><div class="score-fill ${getGradeClass(evaluation.score_innovation * 4)}" style="width: ${(evaluation.score_innovation/25)*100}%"></div></div>
                </div>
                <div>
                    <div class="flex justify-between text-muted mb-1"><span>التنفيذ</span><span>${evaluation.score_implementation}/25</span></div>
                    <div class="score-meter"><div class="score-fill ${getGradeClass(evaluation.score_implementation * 4)}" style="width: ${(evaluation.score_implementation/25)*100}%"></div></div>
                </div>
                <div>
                    <div class="flex justify-between text-muted mb-1"><span>العرض</span><span>${evaluation.score_presentation}/25</span></div>
                    <div class="score-meter"><div class="score-fill ${getGradeClass(evaluation.score_presentation * 4)}" style="width: ${(evaluation.score_presentation/25)*100}%"></div></div>
                </div>
            </div>
            
            <div style="background: #f9fafb; padding: 12px; border-radius: 6px; font-size: 0.95rem; color: #374151;">
                <strong>الملاحظات:</strong>
                <p style="margin-top: 4px; line-height: 1.5; white-space: pre-wrap;">${evaluation.comments || 'لا توجد ملاحظات.'}</p>
            </div>
        </div>
    </div>
  `;
}

// Real-time score calculation
function initScoreCalculation() {
  const inputs = ['score-methodology', 'score-innovation', 'score-implementation', 'score-presentation'];
  
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      const total = inputs.reduce((sum, inputId) => {
        return sum + (parseInt(document.getElementById(inputId)?.value) || 0);
      }, 0);
      updateScoreDisplay(total);
      updateScoreBars();
    });
  });
}

function updateScoreDisplay(total) {
  const el = document.getElementById('total-score-display');
  const labelEl = document.getElementById('grade-label');
  const circleEl = document.getElementById('score-circle');
  if (!el) return;
  el.textContent = total;
  if (labelEl) labelEl.textContent = getGradeLabel(total);
  if (circleEl) {
    circleEl.className = `score-circle ${getGradeClass(total)}`;
  }
}

function updateScoreBars() {
  ['methodology', 'innovation', 'implementation', 'presentation'].forEach(key => {
    const input = document.getElementById(`score-${key}`);
    const bar = document.getElementById(`bar-${key}`);
    if (input && bar) {
      const val = parseInt(input.value) || 0;
      const pct = (val / 25) * 100;
      bar.style.width = pct + '%';
      const gradeClass = getGradeClass(val * 4); // Scale 25 to 100 for color
      bar.className = `score-fill ${gradeClass}`;
    }
  });
}

// Status change function (used in project-detail.html)
async function changeProjectStatus(projectId, newStatus, note) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error('غير مصادق');
  
  const { error } = await supabaseClient
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId);
  
  if (error) throw error;
  
  // Add note to status_history
  await supabaseClient.from('status_history').insert({
    project_id: projectId,
    old_status: null, // can be derived from prior state, skipped for simplicity
    new_status: newStatus,
    changed_by: auth.user.id,
    note: note || null
  });
}

// Upload file to Supabase Storage
async function uploadProjectFile(projectId, file, fileType, isPublic = false) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error('غير مصادق');
  
  const bucket = isPublic && fileType === 'report' ? 'public-reports' : 'project-files';
  const path = `${projectId}/${Date.now()}_${file.name}`;
  
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  
  if (uploadError) throw uploadError;
  
  const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  
  const { data, error } = await supabaseClient.from('project_files').insert({
    project_id: projectId,
    file_name: file.name,
    file_url: urlData.publicUrl,
    file_size: file.size,
    file_type: fileType,
    mime_type: file.type || 'application/octet-stream',
    uploaded_by: auth.user.id,
    is_public: isPublic,
  }).select().single();
  
  if (error) throw error;
  return data;
}

// Expose globals
window.loadMyEvaluation = loadMyEvaluation;
window.loadProjectEvaluations = loadProjectEvaluations;
window.saveEvaluation = saveEvaluation;
window.renderEvaluationCard = renderEvaluationCard;
window.initScoreCalculation = initScoreCalculation;
window.updateScoreDisplay = updateScoreDisplay;
window.updateScoreBars = updateScoreBars;
window.changeProjectStatus = changeProjectStatus;
window.uploadProjectFile = uploadProjectFile;
