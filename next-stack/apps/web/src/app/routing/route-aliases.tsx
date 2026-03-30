import { Navigate, useParams } from 'react-router-dom';
import { authStorage } from '@/features/auth/storage';

export function RootEntryRedirect() {
  const user = authStorage.getUser();
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/store" replace />;
}

export function StoreCategoryAliasRedirect() {
  const { slug = '' } = useParams();
  const category = slug.trim();
  return <Navigate to={category ? `/store?category=${encodeURIComponent(category)}` : '/store'} replace />;
}

export function LegacyProductAliasRedirect() {
  const { slug = '' } = useParams();
  return <Navigate to={slug ? `/store/${encodeURIComponent(slug)}` : '/store'} replace />;
}

export function LegacyResetPasswordAliasRedirect() {
  const { token = '' } = useParams();
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  return <Navigate to={`/auth/reset-password${qs}`} replace />;
}

export function LegacyOrdersAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/orders/${encodeURIComponent(id)}` : '/orders'} replace />;
}

export function LegacyRepairsAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/repairs/${encodeURIComponent(id)}` : '/repairs'} replace />;
}

export function LegacyAdminOrdersAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/orders/${encodeURIComponent(id)}` : '/admin/orders'} replace />;
}

export function LegacyAdminOrderPrintAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/orders/${encodeURIComponent(id)}/print` : '/admin/orders'} replace />;
}

export function LegacyAdminOrderTicketAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/orders/${encodeURIComponent(id)}/ticket` : '/admin/orders'} replace />;
}

export function LegacyAdminRepairsAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/repairs/${encodeURIComponent(id)}` : '/admin/repairs'} replace />;
}

export function LegacyAdminRepairCreateAliasRedirect() {
  return <Navigate to="/admin/repairs/create" replace />;
}

export function LegacyAdminRepairPrintAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/repairs/${encodeURIComponent(id)}/print` : '/admin/repairs'} replace />;
}

export function LegacyAdminRepairTicketAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/repairs/${encodeURIComponent(id)}/ticket` : '/admin/repairs'} replace />;
}

export function AdminProductEditAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/productos/${encodeURIComponent(id)}/editar` : '/admin/productos'} replace />;
}

export function AdminProductCreateAliasRedirect() {
  return <Navigate to="/admin/productos/crear" replace />;
}

export function AdminProductLabelAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/productos/${encodeURIComponent(id)}/etiqueta` : '/admin/productos'} replace />;
}

export function LegacyAdminPricingEditAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/precios/${encodeURIComponent(id)}/editar` : '/admin/precios'} replace />;
}

export function ApiAuthAliasRedirect() {
  const { '*': rest = '' } = useParams();
  const path = `/${rest}`.replace(/\/+/g, '/');
  if (path === '/login') return <Navigate to="/auth/login" replace />;
  if (path === '/register') return <Navigate to="/auth/register" replace />;
  if (path === '/forgot-password') return <Navigate to="/auth/forgot-password" replace />;
  if (path === '/reset-password') return <Navigate to="/auth/reset-password" replace />;
  if (path === '/verify-email') return <Navigate to="/auth/verify-email" replace />;
  return <Navigate to="/auth/login" replace />;
}
