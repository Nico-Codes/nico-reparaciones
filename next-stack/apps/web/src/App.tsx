import { Route, Routes, Link } from 'react-router-dom';
import { Wrench, ShoppingCart, ShieldCheck } from 'lucide-react';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminMailTemplatesPage } from '@/features/admin/AdminMailTemplatesPage';
import { AdminSettingsPage } from '@/features/admin/AdminSettingsPage';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { AdminWhatsappPage } from '@/features/admin/AdminWhatsappPage';
import { AdminHelpFaqPage } from '@/features/admin/AdminHelpFaqPage';
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
import { MyOrdersPage } from '@/features/orders/MyOrdersPage';
import { OrderDetailPage } from '@/features/orders/OrderDetailPage';
import { AdminRepairsPage } from '@/features/repairs/AdminRepairsPage';
import { MyRepairsPage } from '@/features/repairs/MyRepairsPage';
import { PublicRepairLookupPage } from '@/features/repairs/PublicRepairLookupPage';
import { RepairDetailPage } from '@/features/repairs/RepairDetailPage';
import { StorePage } from '@/features/store/StorePage';
import { StoreProductDetailPage } from '@/features/store/StoreProductDetailPage';
import { HelpPage } from '@/features/help/HelpPage';

function HomePage() {
  const cartCount = useCartCount();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="font-black tracking-tight">
            Nico<span className="text-sky-600">Reparaciones</span> <span className="text-zinc-400">Next</span>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/">Inicio</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/store">Tienda</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/reparacion">Consulta reparación</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/cart">Carrito{cartCount ? ` (${cartCount})` : ''}</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/orders">Mis pedidos</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/repairs">Mis reparaciones</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/help">Ayuda</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin">Admin</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/orders">Admin pedidos</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/products">Admin productos</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/users">Admin usuarios</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/settings">Config</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/mail-templates">Mails</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/whatsapp">WhatsApp</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/help">Ayuda Admin</Link>
            <Link className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100" to="/admin/device-catalog">Catalogo dispositivos</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
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
              Base inicial del proyecto nueva creada en paralelo para migrar modulos sin perder trazabilidad.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link to="/store">Ver Tienda Next</Link></Button>
              <Button variant="secondary" asChild><Link to="/admin">Ver Admin Next</Link></Button>
              <Button variant="outline" asChild><Link to="/repairs">Mis reparaciones</Link></Button>
              <Button variant="outline" asChild><Link to="/auth/login">Probar Auth</Link></Button>
              <Button variant="outline" asChild><Link to="/auth/bootstrap-admin">Bootstrap Admin</Link></Button>
              <Button variant="outline" asChild><Link to="/cart">Ver carrito{cartCount ? ` (${cartCount})` : ''}</Link></Button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><ShoppingCart className="h-5 w-5" /></div>
            <h2 className="text-lg font-black">Tienda</h2>
            <p className="mt-1 text-sm text-zinc-600">Catalogo, filtros, carrito y checkout migrables a SPA con API REST.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Wrench className="h-5 w-5" /></div>
            <h2 className="text-lg font-black">Reparaciones</h2>
            <p className="mt-1 text-sm text-zinc-600">Flujo principal del negocio. Se migrara por modulos con tests y contratos.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck className="h-5 w-5" /></div>
            <h2 className="text-lg font-black">Admin</h2>
            <p className="mt-1 text-sm text-zinc-600">Panel con base para UI moderna usando shadcn/ui, sin sobrecargar la experiencia.</p>
          </div>
        </section>

        <section className="mt-8">
          <AuthStatusCard />
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/bootstrap-admin" element={<BootstrapAdminPage />} />
      <Route path="/store" element={<StorePage />} />
      <Route path="/store/:slug" element={<StoreProductDetailPage />} />
      <Route path="/reparacion" element={<PublicRepairLookupPage />} />
      <Route path="/repair-lookup" element={<PublicRepairLookupPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
      <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
      <Route path="/admin/orders" element={<RequireAdmin><AdminOrdersPage /></RequireAdmin>} />
      <Route path="/admin/products" element={<RequireAdmin><AdminProductsPage /></RequireAdmin>} />
      <Route path="/admin/users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
      <Route path="/admin/settings" element={<RequireAdmin><AdminSettingsPage /></RequireAdmin>} />
      <Route path="/admin/mail-templates" element={<RequireAdmin><AdminMailTemplatesPage /></RequireAdmin>} />
      <Route path="/admin/whatsapp" element={<RequireAdmin><AdminWhatsappPage /></RequireAdmin>} />
      <Route path="/admin/help" element={<RequireAdmin><AdminHelpFaqPage /></RequireAdmin>} />
      <Route path="/repairs" element={<RequireAuth><MyRepairsPage /></RequireAuth>} />
      <Route path="/repairs/:id" element={<RequireAuth><RepairDetailPage /></RequireAuth>} />
      <Route path="/admin/repairs" element={<RequireAdmin><AdminRepairsPage /></RequireAdmin>} />
      <Route path="/admin/device-catalog" element={<RequireAdmin><AdminDeviceCatalogPage /></RequireAdmin>} />
      <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
    </Routes>
  );
}
