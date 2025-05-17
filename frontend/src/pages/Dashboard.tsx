import { FunctionComponent, useEffect, useState } from "react";
import ProjectList from "../components/ProjectList";
import { Button } from "flowbite-react";
import { AddProjectModal } from "../components/AddProjectModal";
import { toastError } from "../toasts";
import { Link } from "react-router";

const DashBoard: FunctionComponent = () => {
    const [grandTotal, setGrandTotal] = useState(0);
    const [totalDue, setTotalDue] = useState(0);
    const [totalUnsettled, setTotalUnsettled] = useState(0);
    const [openModal, setOpenModal] = useState(false);

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/stats`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    setGrandTotal(data.grand_total);
                    setTotalDue(data.total_due)
                    setTotalUnsettled(data.total_unsettled)
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    };

    useEffect(() => {
        fetchProjectData();
    }, [openModal]);

    return (
        <div className="flex flex-col p-4 space-y-4 w-full mx-auto h-full">
            <AddProjectModal openModal={openModal} setOpenModal={setOpenModal} />

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg shadow-md text-center">
                    <p className="text-md font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold mt-2 text-blue-800">
                        {grandTotal.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                        })}
                    </p>
                </div>
                <div className="grid grid-cols-2 space-x-2">
                    <div className="bg-red-100 p-4 rounded-lg shadow-md text-center">
                        <p className="text-md font-semibold mb-2">Total Reimbursement Due</p>
                        <Link to="/reimbursements" className="text-2xl hover:underline font-bold text-red-800">
                            {totalDue.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                            })}
                        </Link>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg shadow-md text-center">
                        <p className="text-md font-semibold mb-2">Total Unsettled Amount</p>
                        <Link to="/expenses/member-wise" className="text-2xl hover:underline font-bold text-red-800">
                            {totalUnsettled.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                            })}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex justify-end w-full">
                <Button
                    onClick={() => setOpenModal((prev) => !prev)}
                    color="blue"
                    className="rounded-lg px-3 py-2 shadow-lg"
                >
                    Add Project
                </Button>
            </div>

            <ProjectList key={openModal ? "true" : "false"} />
        </div>
    );
};

export default DashBoard;
