import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

const AdminLayout = ({ children, activeSection, onSectionChange, isSuperadmin }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <AdminTopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex pt-14">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            onSectionChange(section);
            setSidebarOpen(false);
          }}
          isSuperadmin={isSuperadmin}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 lg:ml-64">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
