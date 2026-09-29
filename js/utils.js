/**
 * Utility functions for the Graduation Platform
 */

// Format date to Arabic locale
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Map project status to Arabic display text
const statusMap = {
  'draft': 'مسودة',
  'under_review': 'قيد المراجعة',
  'approved': 'مقبول',
  'rejected': 'مرفوض',
  'in_progress': 'قيد التنفيذ',
  'awaiting_jury': 'بانتظار التحكيم',
  'needs_revision': 'بحاجة لتعديل',
  'completed': 'مكتمل'
};

function getStatusText(status) {
  return statusMap[status] || status;
}

// Map roles to Arabic display text
const roleMap = {
  'student': 'طالب',
  'supervisor': 'مشرف',
  'jury': 'لجنة تحكيم',
  'admin': 'مدير'
};

function getRoleText(role) {
  return roleMap[role] || role;
}

// Toast Notification System
function showToast(message, type = 'info') {
  // Check if toast container exists, create if not
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon based on type
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-message">${message}</div>
    <div class="toast-close" onclick="this.parentElement.remove()">&times;</div>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 5000);
}

// Export functions to window object
window.utils = {
  formatDate,
  getStatusText,
  getRoleText,
  showToast
};

// Also expose individually for direct use
window.formatDate = formatDate;
window.getStatusText = getStatusText;
window.getRoleText = getRoleText;
window.showToast = showToast;
