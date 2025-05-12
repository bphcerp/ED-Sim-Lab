import { FunctionComponent } from "react";
import { Outlet, Link, useLocation } from "react-router";

const ExpensesLayout: FunctionComponent = () => {
    const location = useLocation();
    const isMembersView = location.pathname.includes("/member-wise");
    const isInstituteExpenseView = location.pathname.includes("expenses/institute")

    return (
        <div className="flex flex-col w-full space-y-2 p-2">
            <div className="flex items-center space-x-4 text-lg">
                <Link className="mt-2 hover:underline text-blue-600" to={isMembersView ? "/expenses" : "/expenses/member-wise"}>
                    {isMembersView ? "Show All Expenses" : "Show Members View"}
                </Link>
                <Link className="mt-2 hover:underline text-blue-600" to={isInstituteExpenseView ? "/expenses" : "/expenses/institute"}>
                    {isInstituteExpenseView ? "Show All Expenses" : "Show Institute Expenses"}
                </Link>
            </div>
            <Outlet />
        </div>
    );
};

export default ExpensesLayout;