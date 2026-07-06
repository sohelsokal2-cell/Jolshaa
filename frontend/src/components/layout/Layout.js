import TopNavbar from './TopNavbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import BottomNav from './BottomNav';
import HelpButton from '../HelpButton';

const Layout = ({ children, showSidebar = true }) => {
  return (
    <div className="min-h-screen bg-jolshaa-surface font-sans">
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
      <HelpButton variant="floating" />
    </div>
  );
};

export default Layout;
