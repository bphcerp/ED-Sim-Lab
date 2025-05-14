import { FunctionComponent, useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { RxHamburgerMenu, RxCross2 } from "react-icons/rx";
import SidebarComponent from "../components/Sidebar";
import NewFinancialYearModal from "../components/NewFinancialYearModal";
import OutsideClickHandler from "react-outside-click-handler";

const Layout: FunctionComponent = () => {
  const [isSideBarOpen, setISSideBarOpen] = useState(false);
  const [isReset, setIsReset] = useState(false)
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
      method: "POST",
      credentials: "include",
    })
    .finally(() => navigate("/login"))
    .catch((e) => console.error(e))
  }

  useEffect(() => {
    setIsReset(new Date().getMonth() === 3 && new Date().getDate() === 1)
  },[])

  return (
    <div className="flex flex-col w-screen h-screen">
      <NewFinancialYearModal isOpen={isReset} onClose={() => setIsReset(false)}/>
      <OutsideClickHandler onOutsideClick={() => setISSideBarOpen(false)}><SidebarComponent isOpen={isSideBarOpen} setIsOpen={setISSideBarOpen} /></OutsideClickHandler>
      <div className="header relative shrink-0 shadow-lg z-10 flex w-full h-14 px-4 bg-gray-100 items-center justify-between">
        <div className="flex items-center space-x-3">
          {isSideBarOpen ? (
            <RxCross2
              className="hover:cursor-pointer"
              onClick={() => setISSideBarOpen(false)}
              size="30px"
            />
          ) : (
            <RxHamburgerMenu
              className="hover:cursor-pointer"
              onClick={() => setISSideBarOpen(true)}
              size="30px"
            />
          )}
          <Link to="/" className="flex items-center">
            <span className="text-xl tracking-widest text-gray-600">Nano Scale Device Lab</span>
          </Link>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 hover:shadow-md transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex w-screen grow overflow-y-auto p-2">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
