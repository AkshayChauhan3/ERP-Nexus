const BASE_URL = 'http://localhost:3000/api';
const getPendingUsers = () => JSON.parse(localStorage.getItem('pending_users') || '[]');
const savePendingUsers = (users) => localStorage.setItem('pending_users', JSON.stringify(users));

const getApprovedUsers = () => {
  const users = localStorage.getItem('approved_users');
  if (!users) {
    const defaultUsers = [
      { id: 'mock-admin-id', name: 'Alexander Sterling', email: 'admin@erp-nexus.local', password: 'admin123', role: 'admin', is_active: true, created_at: new Date().toISOString(), last_login: new Date().toISOString() },
      { id: 'mock-owner-id', name: 'John Owner', email: 'owner@erp-nexus.local', password: 'owner123', role: 'owner', is_active: true, created_at: new Date().toISOString(), last_login: new Date(Date.now() - 3600000).toISOString() },
      { id: 'mock-sales-id', name: 'Sarah Executive', email: 'sales@erp-nexus.local', password: 'sales123', role: 'sales', is_active: true, created_at: new Date().toISOString(), last_login: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'mock-mfg-id', name: 'Rahul Kumar', email: 'mfg@erp-nexus.local', password: 'mfg123', role: 'manufacturing', is_active: true, created_at: new Date().toISOString(), last_login: new Date(Date.now() - 3600000 * 3).toISOString() },
    ];
    localStorage.setItem('approved_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
};
const saveApprovedUsers = (users) => localStorage.setItem('approved_users', JSON.stringify(users));

const getAuditLogs = () => {
  const logs = localStorage.getItem('audit_logs');
  if (!logs) {
    const defaultLogs = [
      { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: 'admin@erp-nexus.local', module: 'Products', action: 'Product Creation', old_value: '-', new_value: 'Product "Oak Dining Table" created with sales price 12000.' },
      { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), user: 'sales@erp-nexus.local', module: 'Sales', action: 'Sales Confirmation', old_value: 'DRAFT', new_value: 'Sales Order SO-1002 Confirmed.' },
      { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), user: 'admin@erp-nexus.local', module: 'Administration', action: 'User Creation', old_value: '-', new_value: 'User "Sarah Executive" created with role "sales".' },
      { id: 'log-4', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), user: 'admin@erp-nexus.local', module: 'Products', action: 'Price Update', old_value: 'cost: 4500, price: 6800', new_value: 'cost: 4500, price: 7200' },
      { id: 'log-5', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), user: 'inventory@erp-nexus.local', module: 'Inventory', action: 'Purchase Receipt', old_value: 'on_hand: 10', new_value: 'on_hand: 50' },
    ];
    localStorage.setItem('audit_logs', JSON.stringify(defaultLogs));
    return defaultLogs;
  }
  return JSON.parse(logs);
};
const addAuditLog = (user, module, action, old_value, new_value) => {
  const logs = getAuditLogs();
  logs.unshift({
    id: `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    user,
    module,
    action,
    old_value: old_value || '-',
    new_value: new_value || '-',
  });
  localStorage.setItem('audit_logs', JSON.stringify(logs));
};

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  const loggedInEmail = authData?.user?.email || 'admin@erp-nexus.local';
  if (authData?.accessToken) {
    headers['Authorization'] = `Bearer ${authData.accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  if (endpoint === '/auth/register-public' && config.method === 'POST') {
    const data = JSON.parse(config.body);
    const pending = getPendingUsers();
    if (pending.some(u => u.email === data.email) || getApprovedUsers().some(u => u.email === data.email)) {
      throw new Error('User with this email already exists.');
    }

    const newUser = {
      id: generateId(),
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      is_active: false,
      created_at: new Date().toISOString(),
    };

    pending.push(newUser);
    savePendingUsers(pending);
    addAuditLog(data.email, 'Administration', 'User Registration Request', '-', `New registration request for "${data.name}" (Role: ${data.role}).`);

    return {
      success: true,
      message: 'Registration request submitted. Pending administrator approval.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    };
  }
  if (endpoint === '/auth/login' && config.method === 'POST') {
    const data = JSON.parse(config.body);
    const approved = getApprovedUsers();
    const userIndex = approved.findIndex(u => u.email === data.email && u.password === data.password);

    if (userIndex !== -1) {
      const matchedUser = approved[userIndex];
      if (!matchedUser.is_active) {
        throw new Error('Account has been deactivated. Please contact your system administrator.');
      }
      
      matchedUser.last_login = new Date().toISOString();
      approved[userIndex] = matchedUser;
      saveApprovedUsers(approved);

      const mockResult = {
        success: true,
        message: 'Login successful',
        accessToken: `mock-access-token-${generateId()}`,
        refreshToken: `mock-refresh-token-${generateId()}`,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          profile_photo: matchedUser.profile_photo || '',
          address: matchedUser.address || '',
          mobile: matchedUser.mobile || ''
        }
      };
      return mockResult;
    }
  }
  if (endpoint === '/users/pending' && config.method === 'GET') {
    return {
      success: true,
      users: getPendingUsers().map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at
      }))
    };
  }
  if (endpoint.startsWith('/users/') && endpoint.endsWith('/approve') && config.method === 'POST') {
    const id = endpoint.split('/')[2];
    const pending = getPendingUsers();
    const approved = getApprovedUsers();
    
    const userIndex = pending.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found or already approved.');
    }

    const approvedUser = { ...pending[userIndex], is_active: true };
    pending.splice(userIndex, 1);
    approved.push(approvedUser);

    savePendingUsers(pending);
    saveApprovedUsers(approved);
    addAuditLog(loggedInEmail, 'Administration', 'Role Modification', 'PENDING', `Registration request approved for "${approvedUser.name}" (Role: ${approvedUser.role}).`);

    return {
      success: true,
      message: 'User approved successfully',
      user: { id: approvedUser.id, name: approvedUser.name, email: approvedUser.email, role: approvedUser.role }
    };
  }
  if (endpoint.startsWith('/users/') && endpoint.endsWith('/reject') && config.method === 'POST') {
    const id = endpoint.split('/')[2];
    const pending = getPendingUsers();
    
    const userIndex = pending.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const user = pending[userIndex];
    pending.splice(userIndex, 1);
    savePendingUsers(pending);
    addAuditLog(loggedInEmail, 'Administration', 'Role Modification', 'PENDING', `Registration request rejected for "${user.name}".`);

    return {
      success: true,
      message: 'User registration request rejected.'
    };
  }
  if (endpoint === '/users' && config.method === 'GET') {
    const approved = getApprovedUsers();
    const pending = getPendingUsers();
    return {
      success: true,
      users: [
        ...approved.map(u => ({ ...u, status: u.is_active ? 'APPROVED' : 'DEACTIVATED' })),
        ...pending.map(u => ({ ...u, status: 'PENDING' }))
      ]
    };
  }
  if (endpoint === '/users' && config.method === 'POST') {
    const data = JSON.parse(config.body);
    const approved = getApprovedUsers();
    
    if (approved.some(u => u.email === data.email) || getPendingUsers().some(u => u.email === data.email)) {
      throw new Error('User with this email already exists.');
    }

    const newUser = {
      id: generateId(),
      name: data.name,
      email: data.email,
      password: data.password || 'welcome123',
      role: data.role,
      is_active: true,
      created_at: new Date().toISOString(),
      last_login: null
    };

    approved.push(newUser);
    saveApprovedUsers(approved);

    addAuditLog(loggedInEmail, 'Administration', 'User Creation', '-', `Created new user "${data.name}" (${data.email}) as role "${data.role}".`);

    return { success: true, user: newUser };
  }
  if (endpoint.startsWith('/users/') && config.method === 'PUT') {
    const id = endpoint.split('/')[2];
    const data = JSON.parse(config.body);
    const approved = getApprovedUsers();
    const pending = getPendingUsers();
    
    let userIndex = approved.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      const old = approved[userIndex];
      const updated = { ...old, name: data.name, email: data.email, role: data.role };
      approved[userIndex] = updated;
      saveApprovedUsers(approved);
      
      addAuditLog(loggedInEmail, 'Administration', 'Role Modification', `name: ${old.name}, role: ${old.role}`, `name: ${updated.name}, role: ${updated.role}`);
      return { success: true, user: updated };
    }

    userIndex = pending.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      const old = pending[userIndex];
      const updated = { ...old, name: data.name, email: data.email, role: data.role };
      pending[userIndex] = updated;
      savePendingUsers(pending);
      
      addAuditLog(loggedInEmail, 'Administration', 'Role Modification', `name: ${old.name}, role: ${old.role}`, `name: ${updated.name}, role: ${updated.role}`);
      return { success: true, user: updated };
    }

    throw new Error('User not found.');
  }
  if (endpoint.startsWith('/users/') && endpoint.endsWith('/toggle') && config.method === 'POST') {
    const id = endpoint.split('/')[2];
    const approved = getApprovedUsers();
    
    const userIndex = approved.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const user = approved[userIndex];
    user.is_active = !user.is_active;
    approved[userIndex] = user;
    saveApprovedUsers(approved);

    addAuditLog(loggedInEmail, 'Administration', 'Role Modification', `is_active: ${!user.is_active}`, `is_active: ${user.is_active}`);

    return { success: true, user };
  }
  if (endpoint.startsWith('/users/') && endpoint.endsWith('/reset-password') && config.method === 'POST') {
    const id = endpoint.split('/')[2];
    const data = JSON.parse(config.body);
    const approved = getApprovedUsers();
    
    const userIndex = approved.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const user = approved[userIndex];
    user.password = data.password;
    approved[userIndex] = user;
    saveApprovedUsers(approved);

    addAuditLog(loggedInEmail, 'Administration', 'Role Modification', 'password_hash_updated', 'password_hash_updated');

    return { success: true, message: 'Password reset successful.' };
  }
  if (endpoint === '/audit-logs' && config.method === 'GET') {
    return {
      success: true,
      logs: getAuditLogs()
    };
  }
  try {
    const response = await fetch(url, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || result.message || `API error (${response.status})`);
    }
    
    return result;
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
