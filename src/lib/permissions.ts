import type { Membership,Permission } from './types';
export function canManage(membership:Membership,permission?:Permission|'owner'){return membership.role==='owner'||(permission!=='owner'&&(!permission||membership.permissions.includes(permission)));}
