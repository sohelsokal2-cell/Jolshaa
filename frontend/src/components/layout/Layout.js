import TopNavbar from './TopNavbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import BottomNav from './BottomNav';

const Layout = ({ children, showSidebar = true }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0b1326' }}>
      {/* Ambient background glow blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }}
        />
      </div>

      <TopNavbar />

      <div className="relative z-10 max-w-[1920px] mx-auto flex pt-14">
        {showSidebar && <LeftSidebar />}

        <main className={`flex-1 min-w-0 ${showSidebar ? 'lg:ml-0' : ''}`}>
          <div
            className={`mx-auto ${
              showSidebar
                ? 'max-w-[680px] px-4 py-4 pb-20 lg:pb-4'
                : 'max-w-4xl px-4 py-4 pb-20 lg:pb-4'
            }`}
          >
            {children}
          </div>
        </main>

        {showSidebar && <RightSidebar />}
      </div>

      <BottomNav />
    </div>
  );
};

export default Layout;
