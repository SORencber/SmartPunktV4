export function isAdmin(user: any) {
  return user?.role === 'admin';
}

export function hasPermission(user: any, module: string, action: string) {
  if (isAdmin(user)) return true;
  if (!user?.permissions) return false;
  const mod = user.permissions.find((p: any) => p.module === module);
  return mod ? mod.actions.includes(action) : false;
} 