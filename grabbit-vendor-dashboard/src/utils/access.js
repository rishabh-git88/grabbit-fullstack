export const hasVendorAccess = (user) => user?.role === 'vendor' || (user?.managedCafeIds?.length || 0) > 0;
