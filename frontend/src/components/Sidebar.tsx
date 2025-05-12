import { HiChartPie } from "react-icons/hi";
import { IoCashOutline, IoSettingsOutline } from "react-icons/io5";
import { MdCallReceived, MdWorkOutline, MdAccountCircle, MdOutlineSavings } from "react-icons/md";
import { RiGovernmentLine } from "react-icons/ri";
import { FaBuildingColumns, FaCode } from "react-icons/fa6";
import { BsSafe } from "react-icons/bs";
import { FaDonate } from "react-icons/fa";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState({ account: false, pdAccount: false });

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
    setIsOpen(false);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest("button")) setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen){
      setMenuState({ account: false, pdAccount: false })
    }
  },[isOpen])

  return (
    <div
      className={`fixed z-10 top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-100 text-gray-900 flex flex-col shadow-md transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      <nav className="flex flex-col flex-grow mt-4" onClick={handleLinkClick}>
        <Link to="/dashboard" className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition">
          <HiChartPie size="24" className="mr-3" />
          <span className="text-lg font-semibold">Dashboard</span>
        </Link>
        <Link to="/projects" className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition">
          <MdWorkOutline size="24" className="mr-3" />
          <span className="text-lg font-semibold">Projects</span>
        </Link>
        <Link to="/expenses" className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition">
          <IoCashOutline size="24" className="mr-3" />
          <span className="text-lg font-semibold">Expenses</span>
        </Link>
        <Link to="/reimbursements" className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition">
          <MdCallReceived size="24" className="mr-3" />
          <span className="text-lg font-semibold">Reimbursements</span>
        </Link>
        <div className="w-full max-w-sm mx-auto">
          <button
            onClick={() => setMenuState({ account: !menuState.account, pdAccount: false })}
            className={`flex items-center px-7 py-3 w-full hover:bg-gray-200 ${menuState.account ? "bg-gray-200" : ""} transition-colors duration-200 ease-in-out`}
          >
            <MdAccountCircle size="24" className="mr-3" />
            <span className="text-lg font-semibold">Account</span>
          </button>

          <div
            className={`flex justify-center bg-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${menuState.account ? "h-32" : "h-0"}`}
          >
            <div className="grid grid-rows-2 mb-2">
              <Link to="/account/savings" className="flex items-center px-7 py-3 hover:bg-gray-300 rounded-lg transition">
                <MdOutlineSavings size="24" className="mr-3" />
                <span className="text-lg font-semibold">Savings</span>
              </Link>
              <Link to="/account/current" className="flex items-center px-7 py-3 hover:bg-gray-300 rounded-lg transition">
                <FaBuildingColumns size="24" className="mr-3" />
                <span className="text-lg font-semibold">Current</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="w-full max-w-sm mx-auto">
          <button
            onClick={() => setMenuState({ account: false, pdAccount: !menuState.pdAccount })}
            className={`flex items-center px-7 py-3 w-full hover:bg-gray-200 ${menuState.pdAccount ? "bg-gray-200" : ""} transition-colors duration-200 ease-in-out`}
          >
            <RiGovernmentLine size="24" className="mr-3" />
            <span className="text-lg font-semibold">PD Account</span>
          </button>

          <div
            className={`flex justify-center bg-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${menuState.pdAccount ? "h-32" : "h-0"}`}
          >
            <div className="grid grid-rows-2 mb-2">
              <Link to="/pda" className="flex items-center px-7 py-3 hover:bg-gray-300 rounded-lg transition">
                <FaDonate size="24" className="mr-3" />
                <span className="text-lg font-semibold">Allowance</span>
              </Link>
              <Link to="/pdf" className="flex items-center px-7 py-3 hover:bg-gray-300 rounded-lg transition">
                <BsSafe size="24" className="mr-3" />
                <span className="text-lg font-semibold">Fund</span>
              </Link>
            </div>
          </div>
        </div>
        <Link to="/admin" className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition">
          <IoSettingsOutline size="24" className="mr-3" />
          <span className="text-lg font-semibold">Admin</span>
        </Link>
        <Link to="/developers" className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition">
          <FaCode size="24" className="mr-3" />
          <span className="text-lg font-semibold">Developer Info</span>
        </Link>
      </nav>
      <div className="px-4 py-3 border-t border-gray-300">
        <button
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default SidebarComponent;
