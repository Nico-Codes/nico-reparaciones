import { Route, Routes, Link, Navigate, useParams } from 'react-router-dom';
import { Wrench, ShoppingCart, ShieldCheck } from 'lucide-react';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminMailTemplatesPage } from '@/features/admin/AdminMailTemplatesPage';
import { AdminSettingsPage } from '@/features/admin/AdminSettingsPage';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { AdminWhatsappPage } from '@/features/admin/AdminWhatsappPage';
import { AdminHelpFaqPage } from '@/features/admin/AdminHelpFaqPage';
import { AdminAlertsPage } from '@/features/admin/AdminAlertsPage';
import { Button } from '@/components/ui/button';
import { AuthStatusCard } from '@/features/auth/AuthStatusCard';
import { BootstrapAdminPage } from '@/features/auth/BootstrapAdminPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { RequireAdmin } from '@/features/auth/RequireAdmin';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';
import { CartPage } from '@/features/cart/CartPage';
import { AdminProductsPage } from '@/features/catalogAdmin/AdminProductsPage';
import { AdminDeviceCatalogPage } from '@/features/deviceCatalog/AdminDeviceCatalogPage';
import { useCartCount } from '@/features/cart/useCart';
import { CheckoutPage } from '@/features/orders/CheckoutPage';
import { AdminOrdersPage } from '@/features/orders/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/features/orders/AdminOrderDetailPage';
import { AdminOrderPrintPage } from '@/features/orders/AdminOrderPrintPage';
import { AdminOrderTicketPage } from '@/features/orders/AdminOrderTicketPage';
import { MyOrdersPage } from '@/features/orders/MyOrdersPage';
import { OrderDetailPage } from '@/features/orders/OrderDetailPage';
import { AdminRepairsPage } from '@/features/repairs/AdminRepairsPage';
import { MyRepairsPage } from '@/features/repairs/MyRepairsPage';
import { PublicRepairLookupPage } from '@/features/repairs/PublicRepairLookupPage';
import { RepairDetailPage } from '@/features/repairs/RepairDetailPage';
import { StorePage } from '@/features/store/StorePage';
import { StoreProductDetailPage } from '@/features/store/StoreProductDetailPage';
import { HelpPage } from '@/features/help/HelpPage';
import { AppShell } from '@/layouts/AppShell';
import { GlobalVisualEnhancements } from '@/components/GlobalVisualEnhancements';

function HomePage() {
  const cartCount = useCartCount();
  return (
    <div className="text-zinc-900">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            Migracion total en progreso
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            Nuevo stack: React + NestJS + Prisma + PostgreSQL
          </h1>
          <p className="mt-3 text-sm text-sky-50 md:text-base">
            Base nueva en React/Nest con modulos del negocio ya migrados y QA automatizado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link to="/store">Ver Tienda</Link></Button>
            <Button variant="secondary" asChild><Link to="/admin">Ver Admin</Link></Button>
            <Button variant="outline" asChild><Link to="/repairs">Mis reparaciones</Link></Button>
            <Button variant="outline" asChild><Link to="/auth/login">Probar Auth</Link></Button>
            <Button variant="outline" asChild><Link to="/cart">Ver carrito{cartCount ? ` (${cartCount})` : ''}</Link></Button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><ShoppingCart className="h-5 w-5" /></div>
          <h2 className="text-lg font-black">Tienda</h2>
          <p className="mt-1 text-sm text-zinc-600">Catalogo, filtros, carrito y checkout sobre API REST.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Wrench className="h-5 w-5" /></div>
          <h2 className="text-lg font-black">Reparaciones</h2>
          <p className="mt-1 text-sm text-zinc-600">Flujo de cliente y admin con pricing y trazabilidad de cambios.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck className="h-5 w-5" /></div>
          <h2 className="text-lg font-black">Admin</h2>
          <p className="mt-1 text-sm text-zinc-600">Panel con pedidos, productos, usuarios, ayuda, mails y WhatsApp.</p>
        </div>
      </section>

      <section className="mt-8">
        <AuthStatusCard />
      </section>
    </div>
  );
}

function withShell(element: React.ReactNode) {
  return <AppShell>{element}</AppShell>;
}

function StoreCategoryAliasRedirect() {
  const { slug = '' } = useParams();
  const category = slug.trim();
  return <Navigate to={category ? `/store?category=${encodeURIComponent(category)}` : '/store'} replace />;
}

export default function App() {
  return (
    <>
      <GlobalVisualEnhancements />
      <Routes>
        <Route path="/" element={withShell(<HomePage />)} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-email" element={withShell(<VerifyEmailPage />)} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/bootstrap-admin" element={<BootstrapAdminPage />} />
        <Route path="/store" element={withShell(<StorePage />)} />
        <Route path="/store/category/:slug" element={withShell(<StoreCategoryAliasRedirect />)} />
        <Route path="/store/:slug" element={withShell(<StoreProductDetailPage />)} />
        <Route path="/reparacion" element={withShell(<PublicRepairLookupPage />)} />
        <Route path="/repair-lookup" element={withShell(<PublicRepairLookupPage />)} />
        <Route path="/help" element={withShell(<HelpPage />)} />
        <Route path="/cart" element={withShell(<CartPage />)} />
        <Route path="/checkout" element={<RequireAuth>{withShell(<CheckoutPage />)}</RequireAuth>} />
        <Route path="/orders" element={<RequireAuth>{withShell(<MyOrdersPage />)}</RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth>{withShell(<OrderDetailPage />)}</RequireAuth>} />
        <Route path="/repairs" element={<RequireAuth>{withShell(<MyRepairsPage />)}</RequireAuth>} />
        <Route path="/repairs/:id" element={<RequireAuth>{withShell(<RepairDetailPage />)}</RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin>{withShell(<AdminDashboardPage />)}</RequireAdmin>} />
        <Route path="/admin/alertas" element={<RequireAdmin>{withShell(<AdminAlertsPage />)}</RequireAdmin>} />
        <Route path="/admin/alerts" element={<RequireAdmin><Navigate to="/admin/alertas" replace /></RequireAdmin>} />
        <Route path="/admin/orders" element={<RequireAdmin>{withShell(<AdminOrdersPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id" element={<RequireAdmin>{withShell(<AdminOrderDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id/print" element={<RequireAdmin><AdminOrderPrintPage /></RequireAdmin>} />
        <Route path="/admin/orders/:id/ticket" element={<RequireAdmin><AdminOrderTicketPage /></RequireAdmin>} />
        <Route path="/admin/products" element={<RequireAdmin>{withShell(<AdminProductsPage />)}</RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin>{withShell(<AdminUsersPage />)}</RequireAdmin>} />
        <Route path="/admin/settings" element={<RequireAdmin>{withShell(<AdminSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/mail-templates" element={<RequireAdmin>{withShell(<AdminMailTemplatesPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapp" element={<RequireAdmin>{withShell(<AdminWhatsappPage />)}</RequireAdmin>} />
        <Route path="/admin/help" element={<RequireAdmin>{withShell(<AdminHelpFaqPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs" element={<RequireAdmin>{withShell(<AdminRepairsPage />)}</RequireAdmin>} />
        <Route path="/admin/device-catalog" element={<RequireAdmin>{withShell(<AdminDeviceCatalogPage />)}</RequireAdmin>} />
      </Routes>
    </>
  );
}
