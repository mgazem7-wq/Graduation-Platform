// ============================================================
// Graduation Platform - Authentication Module (Demo + Supabase)
// ============================================================

// Get current authenticated user with their profile
async function getCurrentUser() {
  // Demo Mode
  if (IS_DEMO_MODE) {
    const userData = LS.get('gp_current_user');
    if (!userData) return null;
    return { user: { id: userData.id, email: userData.email }, profile: userData.profile };
  }
  // Supabase Mode
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) return null;
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { user, profile };
  } catch {
    return null;
  }
}

// Require authentication. Redirects to index.html if not logged in.
async function requireAuth(allowedRoles = []) {
  const auth = await getCurrentUser();
  if (!auth) {
    window.location.href = 'index.html';
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.profile?.role)) {
    window.location.href = 'dashboard.html';
    return null;
  }
  return auth;
}

// Redirect logged-in users away from auth pages
async function redirectIfLoggedIn() {
  const auth = await getCurrentUser();
  if (auth) {
    window.location.href = 'dashboard.html';
  }
}

// Login
async function login(email, password) {
  if (IS_DEMO_MODE) {
    // Allow any login in demo mode with generic credentials
    const demoUser = Object.values(DEMO_USERS).find(u => u.email === email) || DEMO_USERS.student;
    LS.set('gp_current_user', { id: demoUser.id, email: demoUser.email, profile: demoUser.profile });
    return demoUser;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Quick Demo Login
function quickDemoLogin(role) {
  const demoUser = DEMO_USERS[role] || DEMO_USERS.student;
  LS.set('gp_current_user', { id: demoUser.id, email: demoUser.email, profile: demoUser.profile });
  window.location.href = 'dashboard.html';
}

// Register
async function register(formData) {
  if (IS_DEMO_MODE) {
    const userId = 'demo-user-' + Date.now();
    const newUser = {
      id: userId,
      email: formData.email,
      profile: {
        id: userId,
        full_name: formData.full_name,
        role: formData.role,
        university: formData.university,
        college: formData.college,
        specialization: formData.specialization,
        student_id: formData.student_id || null,
        department: formData.department || null,
      }
    };
    LS.set('gp_current_user', newUser);
    // Save to users list
    const users = LS.get('gp_users', []);
    users.push(newUser);
    LS.set('gp_users', users);
    return newUser;
  }
  
  const { data, error } = await supabaseClient.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.full_name,
        role: formData.role
      }
    }
  });
  if (error) throw error;
  
  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: data.user.id,
        full_name: formData.full_name,
        role: formData.role,
        university: formData.university,
        college: formData.college,
        specialization: formData.specialization,
        student_id: formData.student_id || null,
        department: formData.department || null,
      });
    if (profileError) console.error('Profile update error:', profileError);
  }
  return data;
}

// Logout
async function logout() {
  if (IS_DEMO_MODE) {
    LS.remove('gp_current_user');
    window.location.href = 'index.html';
    return;
  }
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

// Redirect after login based on role
function redirectByRole(role) {
  window.location.href = 'dashboard.html';
}

// Update sidebar user info
function updateSidebarUser(profile) {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const headerNameEl = document.getElementById('header-user-name');
  const headerAvatarEl = document.getElementById('header-avatar');
  
  if (nameEl) nameEl.textContent = profile.full_name || 'مستخدم';
  if (roleEl) roleEl.textContent = getRoleLabel(profile.role) || 'مستخدم';
  if (headerNameEl) headerNameEl.textContent = profile.full_name || 'مستخدم';
  if (avatarEl) avatarEl.textContent = getInitials(profile.full_name);
  if (headerAvatarEl) headerAvatarEl.textContent = getInitials(profile.full_name);
  
  sessionStorage.setItem('userProfile', JSON.stringify(profile));

  // Show demo badge if in demo mode
  if (IS_DEMO_MODE) {
    const existingBadge = document.getElementById('demo-mode-badge');
    if (!existingBadge) {
      const badge = document.createElement('div');
      badge.id = 'demo-mode-badge';
      badge.style.cssText = 'position:fixed;bottom:16px;left:16px;background:#f59e0b;color:#fff;padding:6px 14px;border-radius:20px;font-size:0.75rem;font-weight:700;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
      badge.innerHTML = '🧪 وضع تجريبي';
      document.body.appendChild(badge);
    }
  }
}

// Helper for initials
function getInitials(name) {
  if (!name) return 'م';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

// Helper for role label
function getRoleLabel(role) {
  const labels = {
    'student': 'طالب',
    'supervisor': 'مشرف أكاديمي',
    'jury': 'لجنة مناقشة',
    'admin': 'مدير النظام'
  };
  return labels[role] || role;
}

// Get cached profile (faster)
function getCachedProfile() {
  try {
    return JSON.parse(sessionStorage.getItem('userProfile') || 'null');
  } catch { return null; }
}

// Get my projects (for student)
async function getMyProjects() {
  const auth = await getCurrentUser();
  if (!auth) return [];
  
  if (IS_DEMO_MODE) {
    const projects = LS.get('gp_projects', []);
    return projects.filter(p => p.student_id === auth.user.id || p.student?.full_name === auth.profile.full_name);
  }
  
  const { data, error } = await supabaseClient
    .from('projects')
    .select(`*, profiles!projects_student_id_fkey(full_name), supervisor:profiles!projects_supervisor_id_fkey(full_name)`)
    .eq('student_id', auth.user.id)
    .order('updated_at', { ascending: false });
  
  if (error) { console.error(error); return []; }
  return data || [];
}

// Get supervised projects (for supervisor)
async function getMySupervisedProjects() {
  const auth = await getCurrentUser();
  if (!auth) return [];
  
  if (IS_DEMO_MODE) {
    const projects = LS.get('gp_projects', []);
    return projects.filter(p => p.supervisor_id === auth.user.id || p.supervisor?.full_name === auth.profile.full_name);
  }
  
  const { data, error } = await supabaseClient
    .from('projects')
    .select(`*, profiles!projects_student_id_fkey(full_name)`)
    .eq('supervisor_id', auth.user.id)
    .order('updated_at', { ascending: false });
  
  if (error) { console.error(error); return []; }
  return data || [];
}

// Load unread notifications count
async function loadNotificationCount() {
  if (IS_DEMO_MODE) return 0;
  
  const auth = await getCurrentUser();
  if (!auth) return 0;
  
  const { count } = await supabaseClient
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .eq('is_read', false);
  
  const badge = document.getElementById('notif-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  return count;
}

// Active nav item
function setActiveNavItem() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const href = item.getAttribute('href');
    if (href && currentPage && href.includes(currentPage.split('.')[0])) {
      item.classList.add('active');
    }
  });
}

// Init sidebar toggle for mobile
function initSidebar() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (mobileBtn) {
    mobileBtn.style.display = '';
    mobileBtn.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// Expose globally
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.redirectIfLoggedIn = redirectIfLoggedIn;
window.login = login;
window.quickDemoLogin = quickDemoLogin;
window.register = register;
window.logout = logout;
window.redirectByRole = redirectByRole;
window.updateSidebarUser = updateSidebarUser;
window.getCachedProfile = getCachedProfile;
window.getMyProjects = getMyProjects;
window.getMySupervisedProjects = getMySupervisedProjects;
window.loadNotificationCount = loadNotificationCount;
window.setActiveNavItem = setActiveNavItem;
window.initSidebar = initSidebar;
window.getRoleLabel = getRoleLabel;
window.getInitials = getInitials;
