const prisma = require('../../config/db');

let isInitialized = false;

const BASELINE_NOTIFICATIONS = [
  // Admin
  {
    id: 'notif-adm-1',
    role: 'admin',
    type: 'critical',
    category: 'Security Alert',
    title: 'Security Configuration Verified',
    message: 'Audit Log: Security configuration verified. Zero permission violations.',
    path: '/audit-logs',
    actionText: 'Inspect Logs',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-adm-2',
    role: 'admin',
    type: 'info',
    category: 'Cloud Database',
    title: 'Cloud Database Connected',
    message: 'Supabase PostgreSQL connected successfully. Factory tables live.',
    path: '/dashboard',
    actionText: 'System Status',
    status: 'active',
    isRead: false
  },

  // Owner
  {
    id: 'notif-own-1',
    role: 'owner',
    type: 'critical',
    category: 'Executive Approval',
    title: 'Purchase Authorization',
    message: 'Purchase Order Authorization: PO #3031 (₹3,20,000) awaits Owner sign-off.',
    path: '/owner/approvals',
    actionText: 'Review Approvals',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-own-2',
    role: 'owner',
    type: 'warning',
    category: 'Treasury & Bills',
    title: 'Vendor Invoices Due',
    message: 'Vendor Invoices: 18 vendor payments due this week totaling ₹43,86,350.',
    path: '/owner/financials',
    actionText: 'View Financials',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-own-3',
    role: 'owner',
    type: 'info',
    category: 'Revenue Performance',
    title: 'Sales Performance',
    message: 'Sales Target: Monthly gross revenue achieved at 108% of target.',
    path: '/owner/sales',
    actionText: 'View Sales',
    status: 'active',
    isRead: true
  },

  // Purchase
  {
    id: 'notif-pur-1',
    role: 'purchase',
    type: 'critical',
    category: 'Low Stock Demand',
    title: 'Oak Wood Sheets Critical',
    message: 'Low Stock: Oak Wood Sheets falls below safety threshold (15 units remaining).',
    path: '/purchase/procurement',
    actionText: 'Create PO',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-pur-2',
    role: 'purchase',
    type: 'warning',
    category: 'Delayed Inbound',
    title: 'Steel Screws PO Delayed',
    message: 'Delayed Shipment: PO #3029 for Steel Screws delayed by 2 days in transit.',
    path: '/purchase/orders',
    actionText: 'Manage PO',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-pur-3',
    role: 'purchase',
    type: 'info',
    category: 'Vendor Bills',
    title: 'Three-Way Match Verification',
    message: 'Vendor Bill: Bill #VB-901 awaiting three-way matching verification.',
    path: '/purchase/vendor-bills',
    actionText: 'Inspect Bill',
    status: 'active',
    isRead: true
  },
  {
    id: 'notif-pur-4',
    role: 'purchase',
    type: 'info',
    category: 'Supplier Relations',
    title: 'Supplier Onboarded',
    message: 'New Supplier: National Glass & Mirror onboarded with Net-30 terms.',
    path: '/purchase/vendors',
    actionText: 'View Vendor',
    status: 'active',
    isRead: true
  },

  // Manufacturing
  {
    id: 'notif-mfg-1',
    role: 'manufacturing',
    type: 'critical',
    category: 'Delayed MO',
    title: 'Delayed Production Order',
    message: 'Delayed MO: Manufacturing Order #2041 delayed at Painting center.',
    path: '/manufacturing/orders',
    actionText: 'Inspect MO',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-mfg-2',
    role: 'manufacturing',
    type: 'warning',
    category: 'Work Center Alert',
    title: 'High Capacity Alert',
    message: 'High Capacity: Assembly Line #2 reached 94% scheduled utilization.',
    path: '/manufacturing/work-centers',
    actionText: 'Inspect Load',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-mfg-3',
    role: 'manufacturing',
    type: 'warning',
    category: 'Inv Consumption',
    title: 'Material Draw Request',
    message: 'Material Draw: Work Order #302 requires additional raw steel brackets.',
    path: '/manufacturing/consumption',
    actionText: 'Check Stock',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-mfg-4',
    role: 'manufacturing',
    type: 'info',
    category: 'Engineering BOM',
    title: 'BOM Revision Released',
    message: 'BOM Revision: Executive Oak Desk BOM v2.4 finalized for mass production.',
    path: '/manufacturing/bom',
    actionText: 'View BOM',
    status: 'active',
    isRead: true
  },

  // Sales
  {
    id: 'notif-sal-1',
    role: 'sales',
    type: 'critical',
    category: 'Delayed Order',
    title: 'Sales Order Delayed',
    message: 'Delayed Order: Sales Order #1038 delayed due to packing center bottleneck.',
    path: '/sales/orders',
    actionText: 'Manage Order',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-sal-2',
    role: 'sales',
    type: 'warning',
    category: 'Quotations Pending',
    title: 'Client Quote Sign-off',
    message: 'Quote Follow-up: 3 client quotations awaiting customer contract sign-off.',
    path: '/sales/quotations',
    actionText: 'Inspect Quotes',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-sal-3',
    role: 'sales',
    type: 'info',
    category: 'Ready for Dispatch',
    title: 'Order Dispatch Ready',
    message: 'Dispatch Ready: Sales Order #1042 packaged and staged for carrier pickup.',
    path: '/sales/deliveries',
    actionText: 'View Deliveries',
    status: 'active',
    isRead: true
  },

  // Inventory
  {
    id: 'notif-inv-1',
    role: 'inventory',
    type: 'critical',
    category: 'Low Stock Alert',
    title: 'Low Stock Reorder Trigger',
    message: 'Safety Threshold: 14 inventory SKUs below minimum reorder points.',
    path: '/inventory/alerts',
    actionText: 'View Alerts',
    status: 'active',
    isRead: false
  },
  {
    id: 'notif-inv-2',
    role: 'inventory',
    type: 'warning',
    category: 'Transfer Order',
    title: 'Inter-facility Transfer',
    message: 'Stock In-Transit: Transfer #TR-802 awaiting receipt at Central Bay.',
    path: '/inventory/transfers',
    actionText: 'View Transfers',
    status: 'active',
    isRead: false
  }
];

/**
 * Initializes the persistent tables for notifications and advisor resolutions.
 * Runs idempotently on backend startup using CREATE TABLE IF NOT EXISTS.
 */
async function initStore() {
  if (isInitialized) return;
  try {
    // 1. Create app_notifications table with VARCHAR user_id to prevent UUID casting errors
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS app_notifications (
        id VARCHAR(120) PRIMARY KEY,
        user_id VARCHAR(100),
        role VARCHAR(50) NOT NULL,
        type VARCHAR(30) NOT NULL,
        category VARCHAR(100) NOT NULL,
        title VARCHAR(255),
        message TEXT NOT NULL,
        path VARCHAR(255),
        action_text VARCHAR(100),
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        status VARCHAR(30) DEFAULT 'active',
        is_read BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Ensure user_id column accommodates varchar
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE app_notifications ALTER COLUMN user_id TYPE VARCHAR(100);
      `);
    } catch (e) {}

    // 2. Create indices for fast lookup & filtering
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_notifs_role_created ON app_notifications (role, created_at DESC);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_notifs_status ON app_notifications (status);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_notifs_entity ON app_notifications (entity_type, entity_id);
    `);

    // 3. Create advisor_resolutions table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS advisor_resolutions (
        id VARCHAR(120) PRIMARY KEY,
        recommendation_key VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL,
        user_id VARCHAR(100),
        action_type VARCHAR(50),
        resolved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_advisor_res_key_role ON advisor_resolutions (recommendation_key, role);
    `);

    // 4. Seed baseline role notifications
    for (const b of BASELINE_NOTIFICATIONS) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO app_notifications (
            id, role, type, category, title, message, path, action_text, status, is_read, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, b.id, b.role, b.type, b.category, b.title, b.message, b.path, b.actionText, b.status, b.isRead);
      } catch (err) {}
    }

    isInitialized = true;
    console.log('✅ Notification & Advisor store verified in PostgreSQL with baseline alerts seeded');
  } catch (err) {
    console.error('⚠️ Could not initialize notification store tables:', err.message);
  }
}

/**
 * Synchronizes real-time generated operational alerts into persistent records.
 * Avoids duplicates, preserves read/dismissed/completed states.
 */
async function syncLiveAlerts(role, user, liveAlerts = []) {
  await initStore();
  const normalizedRole = (role || 'admin').toLowerCase().trim();
  const userIdStr = user?.id ? String(user.id) : null;

  for (const alert of liveAlerts) {
    try {
      const existing = await prisma.$queryRawUnsafe(
        `SELECT id, status, is_read FROM app_notifications WHERE id = $1 LIMIT 1`,
        alert.id
      );

      if (!existing || existing.length === 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO app_notifications (
            id, user_id, role, type, category, title, message, path, action_text,
            entity_type, entity_id, status, is_read, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', false, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING`,
          alert.id,
          userIdStr,
          normalizedRole,
          alert.type || 'info',
          alert.category || 'System',
          alert.title || alert.category || 'Notification',
          alert.message || '',
          alert.path || '/dashboard',
          alert.actionText || 'View',
          alert.entityType || null,
          alert.entityId ? String(alert.entityId) : null
        );
      }
    } catch (e) {
      console.warn(`⚠️ Failed to sync notification ${alert.id}:`, e.message);
    }
  }
}

/**
 * Fetch active notifications (unread, read, unresolved) within the last 48 hours.
 * Excludes dismissed and completed notifications.
 */
async function getActiveNotifications(role, user) {
  await initStore();
  const normalizedRole = (role || 'admin').toLowerCase().trim();

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, type, category, title, message, path, action_text AS "actionText", 
              status, is_read AS "isRead", created_at AS "createdAt", completed_at AS "completedAt"
       FROM app_notifications
       WHERE (role = $1 OR role = 'all')
         AND status IN ('active', 'read')
         AND created_at >= NOW() - INTERVAL '48 HOURS'
       ORDER BY created_at DESC
       LIMIT 50`,
      normalizedRole
    );

    return rows.map(r => ({
      ...r,
      time: formatRelativeTime(r.createdAt)
    }));
  } catch (err) {
    console.error('Error in getActiveNotifications:', err);
    return [];
  }
}

/**
 * Fetch notification history (all statuses: active, read, dismissed, completed) within the last 48 hours.
 */
async function getNotificationHistory(role, user) {
  await initStore();
  const normalizedRole = (role || 'admin').toLowerCase().trim();

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, type, category, title, message, path, action_text AS "actionText", 
              status, is_read AS "isRead", created_at AS "createdAt", completed_at AS "completedAt",
              updated_at AS "updatedAt"
       FROM app_notifications
       WHERE (role = $1 OR role = 'all')
         AND created_at >= NOW() - INTERVAL '48 HOURS'
       ORDER BY created_at DESC
       LIMIT 100`,
      normalizedRole
    );

    return rows.map(r => ({
      ...r,
      time: formatRelativeTime(r.createdAt),
      formattedTimestamp: new Date(r.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    }));
  } catch (err) {
    console.error('Error in getNotificationHistory:', err);
    return [];
  }
}

/**
 * Mark a specific notification as read.
 */
async function markRead(id, user, notifData = null) {
  await initStore();
  const normalizedRole = (user?.role || notifData?.role || 'admin').toLowerCase().trim();
  try {
    const existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM app_notifications WHERE id = $1 LIMIT 1`,
      id
    );

    if (existing && existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE app_notifications 
         SET is_read = true, status = CASE WHEN status = 'active' THEN 'read' ELSE status END, updated_at = NOW()
         WHERE id = $1`,
        id
      );
    } else if (notifData) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO app_notifications (
          id, role, type, category, title, message, path, action_text,
          status, is_read, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'read', true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET is_read = true, status = 'read', updated_at = NOW()`,
        id,
        normalizedRole,
        notifData.type || 'info',
        notifData.category || 'System',
        notifData.title || notifData.category || 'Notification',
        notifData.message || '',
        notifData.path || '/dashboard',
        notifData.actionText || 'View'
      );
    }
    return true;
  } catch (err) {
    console.error(`Failed to mark notification ${id} as read:`, err);
    return false;
  }
}

/**
 * Mark all active notifications as read for this role/user.
 */
async function markAllRead(role, user) {
  await initStore();
  const normalizedRole = (role || 'admin').toLowerCase().trim();

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE app_notifications 
       SET is_read = true, status = 'read', updated_at = NOW()
       WHERE (role = $1 OR role = 'all')
         AND status = 'active'
         AND created_at >= NOW() - INTERVAL '48 HOURS'`,
      normalizedRole
    );
    return true;
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
    return false;
  }
}

/**
 * Dismiss a notification (removes from active dropdown, retains in 48h history).
 */
async function dismissNotification(id, user, notifData = null) {
  await initStore();
  const normalizedRole = (user?.role || notifData?.role || 'admin').toLowerCase().trim();
  try {
    const existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM app_notifications WHERE id = $1 LIMIT 1`,
      id
    );

    if (existing && existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE app_notifications 
         SET status = 'dismissed', is_read = true, updated_at = NOW()
         WHERE id = $1`,
        id
      );
    } else if (notifData) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO app_notifications (
          id, role, type, category, title, message, path, action_text,
          status, is_read, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'dismissed', true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'dismissed', is_read = true, updated_at = NOW()`,
        id,
        normalizedRole,
        notifData.type || 'info',
        notifData.category || 'System',
        notifData.title || notifData.category || 'Notification',
        notifData.message || '',
        notifData.path || '/dashboard',
        notifData.actionText || 'View'
      );
    }
    return true;
  } catch (err) {
    console.error(`Failed to dismiss notification ${id}:`, err);
    return false;
  }
}

/**
 * Mark a notification as completed when its task is finished.
 */
async function completeNotification(id, user) {
  await initStore();
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE app_notifications 
       SET status = 'completed', is_read = true, completed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      id
    );
    return true;
  } catch (err) {
    console.error(`Failed to complete notification ${id}:`, err);
    return false;
  }
}

/**
 * Automatically complete notifications tied to a specific entity
 * (e.g. when a PO is created for a product, or a MO is completed).
 */
async function resolveByEntity(entityType, entityId) {
  if (!entityType || !entityId) return;
  await initStore();
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE app_notifications 
       SET status = 'completed', is_read = true, completed_at = NOW(), updated_at = NOW()
       WHERE entity_type = $1 AND entity_id = $2 AND status != 'completed'`,
      entityType,
      String(entityId)
    );
  } catch (err) {
    console.warn(`Failed to resolve notifications for ${entityType}:${entityId}:`, err.message);
  }
}

/**
 * Record an EN Advisor recommendation as resolved.
 */
async function resolveAdvisorRecommendation(key, role, user, actionType = 'COMPLETED') {
  await initStore();
  const normalizedRole = (role || 'admin').toLowerCase().trim();
  const userId = user?.id ? String(user.id) : null;
  const resolutionId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO advisor_resolutions (id, recommendation_key, role, user_id, action_type, resolved_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      resolutionId,
      key,
      normalizedRole,
      userId,
      actionType
    );
    return true;
  } catch (err) {
    console.error(`Failed to resolve advisor recommendation ${key}:`, err);
    return false;
  }
}

/**
 * Check if an EN Advisor recommendation has already been resolved.
 */
async function isAdvisorRecommendationResolved(key, role) {
  await initStore();
  const normalizedRole = (role || 'admin').toLowerCase().trim();

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id FROM advisor_resolutions 
       WHERE recommendation_key = $1 AND role = $2
         AND resolved_at >= NOW() - INTERVAL '48 HOURS'
       LIMIT 1`,
      key,
      normalizedRole
    );
    return Array.isArray(rows) && rows.length > 0;
  } catch (err) {
    console.error(`Error checking advisor resolution for ${key}:`, err);
    return false;
  }
}

/**
 * Format relative time strings (e.g., '10m ago', '2h ago', '1d ago', 'Just now')
 */
function formatRelativeTime(date) {
  if (!date) return 'Recently';
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 2) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

module.exports = {
  initStore,
  syncLiveAlerts,
  getActiveNotifications,
  getNotificationHistory,
  markRead,
  markAllRead,
  dismissNotification,
  completeNotification,
  resolveByEntity,
  resolveAdvisorRecommendation,
  isAdvisorRecommendationResolved
};
