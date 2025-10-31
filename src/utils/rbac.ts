import { UserRole, User } from '@/types';

// Role hierarchy levels
const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.SUPERADMIN]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPERVISOR]: 3,
  [UserRole.USER]: 4,
  [UserRole.AI_AGENT]: 5,
};

const CAN_MANAGE: Record<UserRole, string[]> = {
  [UserRole.SUPERADMIN]: ['admin', 'organizations', 'all'],
  [UserRole.ADMIN]: ['supervisor', 'users', 'organization_settings'],
  [UserRole.SUPERVISOR]: ['users', 'templates', 'broadcasts', 'contacts', 'ai_agents'],
  [UserRole.USER]: ['own_profile', 'own_whatsapp_account'],
  [UserRole.AI_AGENT]: [],
};

const PERMISSIONS_MAP: Record<UserRole, string[]> = {
  [UserRole.SUPERADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
  [UserRole.ADMIN]: ['create', 'read', 'update', 'delete'],
  [UserRole.SUPERVISOR]: ['create', 'read', 'update', 'delete'],
  [UserRole.USER]: ['read', 'update'],
  [UserRole.AI_AGENT]: ['read'],
};

/**
 * Check if user has permission to perform action on resource
 */
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  // Superadmin can do everything
  if (userRole === UserRole.SUPERADMIN) {
    return true;
  }

  // Check if user can manage this resource
  const canManageList = CAN_MANAGE[userRole] || [];
  if (!canManageList.includes(resource) && !canManageList.includes('all')) {
    return false;
  }

  // Check if user has the required action permission
  const permissionsList = PERMISSIONS_MAP[userRole] || [];
  return permissionsList.includes(action);
}

/**
 * Check if user can manage another user based on hierarchy
 */
export function canManageUser(
  currentUser: User,
  targetUser: User
): boolean {
  const currentLevel = ROLE_LEVELS[currentUser.role];
  const targetLevel = ROLE_LEVELS[targetUser.role];

  if (currentLevel === undefined || targetLevel === undefined) {
    return false;
  }

  // Lower level numbers can manage higher numbers
  if (currentLevel > targetLevel) {
    return false;
  }

  // Same level users cannot manage each other (except superadmin)
  if (currentUser.role !== UserRole.SUPERADMIN && currentLevel === targetLevel) {
    return false;
  }

  // Must be in same organization
  if (currentUser.organizationId !== targetUser.organizationId) {
    return false;
  }

  return true;
}

/**
 * Get available actions for a user on a resource
 */
export function getAvailableActions(
  userRole: UserRole,
  resource: string
): string[] {
  const canManageList = CAN_MANAGE[userRole] || [];

  if (!canManageList.includes(resource) && !canManageList.includes('all')) {
    return [];
  }

  return PERMISSIONS_MAP[userRole] || [];
}

/**
 * Check if user can access organization
 */
export function canAccessOrganization(
  user: User,
  organizationId: string
): boolean {
  if (user.role === UserRole.SUPERADMIN) {
    return true;
  }

  return user.organizationId === organizationId;
}

/**
 * Get all manageable roles for current user
 */
export function getManageableRoles(userRole: UserRole): UserRole[] {
  const currentLevel = ROLE_LEVELS[userRole];

  if (currentLevel === undefined) {
    return [];
  }

  return Object.entries(ROLE_LEVELS)
    .filter(([, level]) => level > currentLevel)
    .map(([role]) => role as UserRole);
}

/**
 * Validate role hierarchy for creation
 */
export function isValidRoleAssignment(
  creatorRole: UserRole,
  newUserRole: UserRole
): boolean {
  const creatorLevel = ROLE_LEVELS[creatorRole];
  const targetLevel = ROLE_LEVELS[newUserRole];

  if (creatorLevel === undefined || targetLevel === undefined) {
    return false;
  }

  // Can only create users with higher hierarchy level (lower numbers)
  return creatorLevel < targetLevel;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Super Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.SUPERVISOR]: 'Supervisor',
    [UserRole.USER]: 'User',
    [UserRole.AI_AGENT]: 'AI Agent',
  };

  return displayNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Full access to all organizations and features',
    [UserRole.ADMIN]: 'Manage organization, supervisors, and users',
    [UserRole.SUPERVISOR]: 'Create users, manage templates, and broadcasts',
    [UserRole.USER]: 'Send messages and manage personal WhatsApp account',
    [UserRole.AI_AGENT]: 'Automated AI agent for message handling',
  };

  return descriptions[role] || '';
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_LEVELS[role] || 0;
}
