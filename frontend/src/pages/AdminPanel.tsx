import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Search, Settings, FileText, Map, Loader2, FileEdit, Shield } from 'lucide-react';
import { useAdminAuthorization } from '@/hooks/useAdminAuthorization';

// Lazy load admin components for better performance
const GraveManagement = lazy(() => import('../components/admin/GraveManagement'));
const CemeteryLayoutManager = lazy(() => import('../components/admin/CemeteryLayoutManager'));
const GraveSearch = lazy(() => import('../components/GraveSearch'));
const PDFExport = lazy(() => import('../components/admin/PDFExport'));
const AdminGraveTileMap = lazy(() => import('../components/admin/AdminGraveTileMap'));
const SiteContentManager = lazy(() => import('../components/admin/SiteContentManager'));
const ManagerDelegation = lazy(() => import('../components/admin/ManagerDelegation'));

function ComponentLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('graves');
  const { isBoss, isLoading: authLoading } = useAdminAuthorization();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel zarządzania</h1>
        <p className="text-muted-foreground">
          Zarządzanie cmentarzem parafialnym
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full max-w-4xl mx-auto ${isBoss ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <TabsTrigger value="graves" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Groby</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Mapa</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Układ</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Wyszukaj</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            <span className="hidden sm:inline">Treść</span>
          </TabsTrigger>
          {isBoss && (
            <TabsTrigger value="managers" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Managers</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="graves" className="mt-6">
          <Suspense fallback={<ComponentLoader />}>
            <GraveManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <Suspense fallback={<ComponentLoader />}>
            <AdminGraveTileMap />
          </Suspense>
        </TabsContent>

        <TabsContent value="layout" className="mt-6">
          <Suspense fallback={<ComponentLoader />}>
            <CemeteryLayoutManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Suspense fallback={<ComponentLoader />}>
            <GraveSearch isAdmin={true} />
          </Suspense>
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <Suspense fallback={<ComponentLoader />}>
            <PDFExport />
          </Suspense>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Suspense fallback={<ComponentLoader />}>
            <SiteContentManager />
          </Suspense>
        </TabsContent>

        {isBoss && (
          <TabsContent value="managers" className="mt-6">
            <Suspense fallback={<ComponentLoader />}>
              <ManagerDelegation />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
