const isVendorUser = (user) => user?.role === 'vendor' || (user?.managedCafeIds?.length || 0) > 0;

const canManageCafe = (user, cafe) => {
  if (!user || !cafe) return false;
  const userId = user._id?.toString();
  if (cafe.vendorId?.toString() === userId) return true;
  return (user.managedCafeIds || []).some((id) => id.toString() === cafe._id?.toString());
};

module.exports = { isVendorUser, canManageCafe };
