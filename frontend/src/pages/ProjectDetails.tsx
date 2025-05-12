import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { toastError, toastSuccess, toastWarn } from "../toasts";
import ReimbursementModal from "../components/ReimbursementModal";
import { InstituteExpense, Project, Reimbursement } from "../types";
import { Button, Textarea } from "flowbite-react";
import OverrideConfirmation from "../components/OverrideConfirmation";
import { calculateNumberOfYears, formatCurrency, formatDate, getCurrentIndex } from "../helper";
import { CarryDetailsModal } from "../components/CarryDetailsModal";
import CarryConfirmationModal from "../components/CarryConfirmationModal";
import EditProjectModal from "../components/EditProjectModal";

const ProjectDetails = () => {
    const { id } = useParams();
    const [projectData, setProjectData] = useState<Project>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reimbursements, setReimbursements] = useState<Array<Reimbursement>>([]);
    const [instituteExpenses, setInstituteExpenses] = useState<Array<InstituteExpense>>([]);
    const [expenseData, setExpenseData] = useState<{ [key: string]: number }>()
    const [currentYear, setCurrentYear] = useState(0)
    const [isProjectOver, setIsProjectOver] = useState(false)
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
    const [info, setInfo] = useState<{ head?: string, index?: number, all?: boolean }>()
    const [label, setLabel] = useState<string>()
    const [resetOverride, setResetOverride] = useState(false)
    const [yearFlag, setYearFlag] = useState<boolean | null>(null)
    const [showHead, setShowHead] = useState(false)
    const [isCarryModalOpen, setIsCarryModalOpen] = useState(false)
    const [isCarryDetailsModalOpen, setIsCarryDetailsModalOpen] = useState(false)
    const [carryYear, setCarryYear] = useState<number | null>(null)
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [note, setNote] = useState('')

    const targetColumnRef = useRef<HTMLTableCellElement | null>(null);

    const getProjectTotal = () => {
        return Object.values(projectData!.project_heads)
            .map((arr) => arr[currentYear] || 0)
            .reduce((sum, value) => sum + value, 0);
    }

    const getExpenseTotal = () => {
        return Object.values(expenseData!).reduce((sum, value) => sum + value, 0);
    }

    const getCarryTotal = () => {
        return currentYear ? Object.values(projectData!.carry_forward).reduce((sum, arr) => sum + (arr[currentYear - 1] || 0), 0) : 0
    }

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                setProjectData(data)
                setNote(data.note)
                const curr = getCurrentIndex(data)
                if (curr >= 0) {
                    setCurrentYear(curr)
                    setIsProjectOver(false)
                }
                else setIsProjectOver(true)
            })
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });

        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}/total-expenses`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => setExpenseData(data))
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    }

    useEffect(() => {
        fetchProjectData()
    }, [id]);

    useEffect(() => {
        if (projectData && targetColumnRef.current) {
            targetColumnRef.current.scrollIntoView({
                block: 'nearest',
                inline: 'start'
            })
        }
    }, [projectData, targetColumnRef])

    useEffect(() => {
        if (isProjectOver) toastWarn("Project's end date has been crossed!")
    }, [isProjectOver])

    const openEditModal = (project: Project) => {
        setProjectToEdit(project);
        setIsEditModalOpen(true);
    };

    const fetchReimbursements = async ({ head, index, all }: { head?: string, index?: number, all?: boolean }) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/reimburse/${projectData!._id}/?head=${head}&index=${index}&all=${all}`,
                { credentials: "include" }
            );
            const data = await response.json();
            setInfo({ head, index, all })
            setLabel(` ${head ?? ""}${all ? projectData?.funding_agency : ""}${index !== undefined ? ` ${projectData?.project_type === "invoice" ? "Installment" : 'Year'} ${index + 1}` : ""}`)
            setYearFlag(index ? null : projectData?.project_type !== 'invoice')
            setShowHead(head ? false : true)
            setReimbursements(data.reimbursements);
            setInstituteExpenses(data.instituteExpenses)
            setIsModalOpen(true);
        } catch (error) {
            toastError("Error fetching reimbursements");
            console.error(error);
        }
    };

    const handleExport = async () => {
        try {

            const { head, index, all } = info!

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/reimburse/${projectData!._id}/?exportData=true&head=${head}&index=${index}&all=${all}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch the Excel file');
            }

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${projectData?.project_id}-${projectData?.funding_agency}${head ? ` ${head}` : ""}${index !== undefined ? projectData?.project_type === 'invoice' ? " Installment " : " Year " : ""}${index !== undefined ? index + 1 : ""} Expense Data.xlsx`;
            link.click();

        } catch (error) {
            toastError("Error exporting reimbursement data");
            console.error(error);
        }
    };

    const handleCarryForward = async (carryData: { [key: string]: number }) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project/${projectData!._id}/carry`,
                {
                    credentials: "include",
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ carryData })
                }
            );

            if (response.ok) {
                fetchProjectData()
                toastSuccess("Amount carried forward sucessfully!")
            }
            else {
                const message = (await response.json()).message
                toastError(message ?? "Something went wrong!")
                console.error(message)
                return
            }

            setIsOverrideModalOpen(false)
        } catch (error) {
            toastError("Something went wrong");
            console.error(error);
        }
    };

    const handleOverride = async (selectedIndex?: number) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project/${projectData!._id}/override`,
                {
                    credentials: "include",
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ selectedIndex })
                }
            );

            const res = (await response.json())

            if (response.ok) {
                fetchProjectData()
                if (res.warn) toastWarn(res.message ?? "Override Reset Sucessfully!")
                else toastSuccess(res.message ?? "Override Reset Sucessfully!")
            }
            else {
                toastError(res.message ?? "Something went wrong!")
                console.error(res.message)
            }

            setIsOverrideModalOpen(false)
        } catch (error) {
            toastError("Something went wrong");
            console.error(error);
        }
    };

    const handleOverrideReset = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project/${projectData!._id}/override`,
                {
                    credentials: "include",
                    method: "DELETE",
                }
            );

            const res = (await response.json())

            if (response.ok) {
                fetchProjectData()
                if (res.warn) toastWarn(res.message ?? "Override Reset Sucessfully!")
                else toastSuccess(res.message ?? "Override Reset Sucessfully!")
            }
            else {
                toastError(res.message ?? "Something went wrong!")
                console.error(res.message)
            }

            setResetOverride(false)
            setIsOverrideModalOpen(false)
        } catch (error) {
            toastError("Something went wrong");
            console.error(error);
        }
    };

    const handleSaveProject = async (updatedProject: Project) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project/${updatedProject._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(updatedProject),
                }
            );
            if (!response.ok) {
                throw new Error("Failed to update project");
            }
            toastSuccess("Project updated successfully");
            fetchProjectData()
        } catch (error) {
            toastError("Error updating project");
            console.error("Error updating project:", error);
        }
    };

    return (
        <>
            {projectData && (
                <div className="relative flex flex-col space-y-6 w-full mx-4">
                    <EditProjectModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        project={projectToEdit}
                        onSave={handleSaveProject}
                    />
                    <OverrideConfirmation
                        isOpen={isOverrideModalOpen}
                        label={projectData.project_type === "yearly" ? "year" : "invoice"}
                        reset={resetOverride}
                        max={projectData.project_type === "yearly" ? calculateNumberOfYears(new Date(projectData.start_date!), new Date(projectData.end_date!)) : projectData.installments!.length}
                        onClose={() => {
                            setIsOverrideModalOpen(false)
                            setResetOverride(false)
                        }}
                        onConfirm={!resetOverride ? handleOverride : handleOverrideReset}
                    />

                    <div className="absolute top-5 right-0 flex space-x-4">
                        {<Button color="failure" onClick={() => setIsOverrideModalOpen(true)}>{`Override Current ${projectData.project_type === "invoice" ? "Installment" : "Year"}`}</Button>}

                        {projectData.override ? <Button color="failure" onClick={() => {
                            setIsOverrideModalOpen(true)
                            setResetOverride(true)
                        }}>Revert Override</Button> : <></>}
                    </div>

                    <span className="text-4xl font-bold text-center mt-5 text-gray-800">
                        {projectData.funding_agency}
                    </span>

                    <div className="relative flex justify-center">
                        <div className="absolute top-7 left-0"><Button onClick={() => openEditModal(projectData)} color='blue' size="md">Edit Project</Button></div>
                        <div className="flex justify-between w-1/3">
                            <span className="text-lg text-center mt-5 text-gray-800">
                                Project ID : {projectData.project_id}
                            </span>
                            <span className="text-lg text-center mt-5 text-gray-800">
                                Project Title : {projectData.project_title}
                            </span>
                        </div>
                    </div>


                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                            <div className="flex justify-between mb-2">
                                <div className="flex space-x-2 items-center w-fit">
                                    <span className="text-2xl font-semibold text-gray-70">Project Data</span>
                                    <span className="">(Click on the amount to view the reimbursements)</span>
                                </div>
                                <button
                                    className="text-blue-600 text-lg hover:underline"
                                    onClick={() => fetchReimbursements({ all: true })}>
                                    View All Reimbursements
                                </button>
                            </div>
                            <div className="overflow-x-auto scroll-smooth">
                                {Object.keys(projectData.project_heads).length ? <table className="bg-white min-w-full shadow-md rounded-lg">
                                    <thead className="bg-gray-200">
                                        <tr className="bg-inherit">
                                            <th className="py-3 px-6 sticky left-0 bg-inherit text-center text-gray-800 font-semibold">
                                                Head
                                            </th>
                                            {Array.from({
                                                length: Math.max(
                                                    ...Object.values(projectData.project_heads).map(
                                                        (arr) => arr.length
                                                    )
                                                ),
                                            }).map((_, i) => (
                                                <th
                                                    key={i}
                                                    {...(!isProjectOver && currentYear === i ? { ref: targetColumnRef } : {})}
                                                    className={`py-3 px-6 text-center bg-inherit text-gray-600 ${!isProjectOver && currentYear === i ? "text-red-600" : "   "}`}
                                                >
                                                    <div className="flex flex-col space-y-2">
                                                        <button
                                                            className="text-blue-600 text-lg hover:underline"
                                                            onClick={() => fetchReimbursements({ index: i, all: true })}>
                                                            {projectData.project_type === "invoice" ? "Installment" : "Year"} {i + 1}
                                                        </button>
                                                        {projectData.project_type === "invoice" ? <span>{formatDate(projectData.installments![i].start_date)} - {formatDate(projectData.installments![i].end_date)}</span> : <></>}
                                                        <div className="flex justify-center items-center space-x-4">
                                                            <Link target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline text-sm" to={`accounts/pdfviewer?index=${i}`}>Show SA</Link>
                                                            {(i < Math.max(
                                                                ...Object.values(projectData.project_heads).map(
                                                                    (arr) => arr.length
                                                                )) - 1) ? <button onClick={() => {
                                                                    setIsCarryDetailsModalOpen(true)
                                                                    setCarryYear(i + 1)
                                                                }} className="underline text-sm text-green-500 hover:text-green-600">Show Carry</button> : <></>}
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(projectData.project_heads).map(
                                            ([head, allocations], index) => (
                                                <tr key={index} className="border-t bg-inherit">
                                                    <td className="py-3 px-6 bg-white sticky left-0 text-gray-800 text-center font-medium">
                                                        <button
                                                            className="text-blue-600 hover:underline"
                                                            onClick={() => fetchReimbursements({ head })}>
                                                            {head}
                                                        </button>
                                                    </td>
                                                    {allocations.map((amount, i) => (
                                                        <td
                                                            key={i}
                                                            className={`py-3 px-6 text-center ${!isProjectOver && currentYear === i ? "text-red-600" : "text-blue-600"}`}
                                                        >
                                                            <button
                                                                className="hover:underline"
                                                                onClick={() => fetchReimbursements({ head, index: i })}>
                                                                {formatCurrency(amount)}
                                                            </button>
                                                        </td>
                                                    ))}
                                                    {allocations.length <
                                                        Math.max(
                                                            ...Object.values(projectData.project_heads).map(
                                                                (arr) => arr.length
                                                            )
                                                        ) &&
                                                        Array.from({
                                                            length:
                                                                Math.max(
                                                                    ...Object.values(projectData.project_heads).map(
                                                                        (arr) => arr.length
                                                                    )
                                                                ) - allocations.length,
                                                        }).map((_, i) => (
                                                            <td
                                                                key={i}
                                                                className={`py-3 text-center text-gray-600 ${!isProjectOver && currentYear === i ? "text-red-600" : "   "}`}
                                                            >
                                                                N/A
                                                            </td>
                                                        ))}
                                                    <td className="py-3 px-6 text-gray-800 text-center font-medium">
                                                        {formatCurrency(allocations.reduce((acc, allocation) => acc + allocation, 0))}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table> : <div className="flex items-center justify-center text-2xl bg-gray-200 w-full h-56 rounded-lg ">
                                    <span>No project heads added yet.</span>
                                </div>}
                            </div>
                        </div>

                        <div className="flex flex-col space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-blue-100 p-6 rounded-lg shadow-md text-center">
                                    <p className="text-md font-semibold">Total Amount</p>
                                    <p className="text-2xl font-bold mt-2 text-blue-800">
                                        {formatCurrency(projectData.total_amount)}
                                    </p>
                                </div>

                                <div className="bg-green-100 p-6 rounded-lg shadow-md text-center">
                                    <p className="text-md font-semibold">Project Duration</p>
                                    <div className="flex justify-between mt-2">
                                        <div>
                                            <span className="font-medium text-gray-700">Start:</span>
                                            <p className="text-sm">
                                                {projectData.start_date
                                                    ? new Date(projectData.start_date).toLocaleDateString(
                                                        "en-IN"
                                                    )
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">End:</span>
                                            <p className="text-sm">
                                                {projectData.end_date
                                                    ? new Date(projectData.end_date).toLocaleDateString(
                                                        "en-IN"
                                                    )
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="piDetails flex flex-col space-y-3 p-4 font-semibold w-full bg-gray-100 rounded-md shadow-md">
                                <div className="flex items-center">
                                    <span className="inline-block w-20 text-gray-700">PIs:</span>
                                    <span className="text-gray-900">
                                        {projectData.pis.map(pi => pi.name).join(", ")}
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    <span className="inline-block w-20 text-gray-700">Co-PIs:</span>
                                    <span className="text-gray-900">
                                        {projectData.copis.map(coPi => coPi.name).join(", ")}
                                    </span>
                                </div>
                            </div>
                            <div className="noteContainer h-44 flex flex-col space-y-2">
                                <Textarea className="h-full resize-none text-lg" value={note} onChange={(e) => setNote(e.target.value)} />
                                { note !== projectData.note && <div className="flex justify-end">
                                    <Button color="success" onClick={() => handleSaveProject({
                                        ...projectData,
                                        note
                                    })}>Save</Button>
                                </div> }
                            </div>
                        </div>
                    </div>


                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-semibold text-gray-700">Current ( {projectData.project_type === "yearly" ? "Year" : "Installment"} {currentYear + 1} ) Expense Sheet</span>
                            {!isProjectOver && ((projectData.project_type === 'invoice' ? (currentYear + 1 === projectData.installments!.length) : (currentYear + 1 === calculateNumberOfYears(new Date(projectData.start_date!), new Date(projectData.end_date!)))) ? <></> : <Button onClick={() => setIsCarryModalOpen(true)} size="sm" color="failure" >Carry Forward</Button>)}
                        </div>
                        <Link target="_blank" rel="noopener noreferrer" to={`accounts/pdfviewer?index=${currentYear}`}><Button color='success'>View SA</Button></Link>
                    </div>
                    <div className="flex pb-8">
                        {!isProjectOver ? <table className="min-w-full bg-white shadow-md rounded-lg mt-2">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Head</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Total Initial Amount</th>
                                    {currentYear ? <><th className="py-3 px-6 text-center text-gray-800 font-semibold">Carry Forward</th>
                                        <th className="py-3 px-6 text-center text-gray-800 font-semibold">Total Current Amount</th></> : <></>}
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Expenses</th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(projectData.project_heads).map(([head, allocations], index) => {
                                    return <tr key={index} className="border-t">
                                        <td className="py-3 px-6 text-gray-800 text-center font-medium">
                                            {head}
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {formatCurrency(allocations[currentYear])}
                                        </td>
                                        {currentYear ? <><td className="py-3 px-6 text-center text-gray-600">
                                            {formatCurrency(projectData.carry_forward[head][currentYear - 1])}
                                        </td>
                                            <td className="py-3 px-6 text-center text-gray-600">
                                                {formatCurrency(allocations[currentYear] + projectData.carry_forward[head][currentYear - 1])}
                                            </td></> : <></>}
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            <button
                                                className="text-blue-600 hover:underline"
                                                onClick={() => fetchReimbursements({ head, index: currentYear })}>
                                                {expenseData ? formatCurrency(expenseData[head] ?? 0) : "Loading"}
                                            </button>
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {expenseData ? formatCurrency(allocations[currentYear] + (currentYear ? projectData.carry_forward[head][currentYear - 1] : 0) - (expenseData[head] ?? 0)) : "Loading"}
                                        </td>
                                    </tr>
                                })}
                                <tr className="border-t bg-gray-100 font-semibold">
                                    <td className="py-3 px-6 text-gray-800 text-center">Total</td>
                                    <td className="py-3 px-6 text-center">
                                        {formatCurrency(getProjectTotal())}
                                    </td>
                                    {currentYear ? <><td className="py-3 px-6 text-gray-800 text-center">{formatCurrency(getCarryTotal())}</td>
                                        <td className="py-3 px-6 text-gray-800 text-center">{formatCurrency(getProjectTotal() + getCarryTotal())}</td></> : <></>}
                                    <td className="py-3 px-6 text-center">
                                        {expenseData ? formatCurrency(getExpenseTotal()) : "Loading"}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        {expenseData ? formatCurrency(getProjectTotal() + getCarryTotal() - getExpenseTotal()) : "Loading"}
                                    </td>
                                </tr>
                            </tbody>
                        </table> : <div className="flex items-center justify-center text-2xl bg-gray-200 w-full h-56 rounded-lg ">
                            <span>Project's end date has been crossed.</span>
                        </div>}
                    </div>
                </div>
            )}

            <ReimbursementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                label={label!}
                showHead={showHead}
                handleExport={handleExport}
                reimbursements={reimbursements}
                instituteExpenses={instituteExpenses}
                yearFlag={yearFlag}
            />

            {projectData && expenseData && isCarryModalOpen && <CarryConfirmationModal
                projectHeads={projectData?.project_heads}
                expenseData={expenseData}
                carryData={projectData.carry_forward}
                currentIndex={getCurrentIndex(projectData)}
                isOpen={isCarryModalOpen}
                onClose={() => setIsCarryModalOpen(false)}
                onSubmit={handleCarryForward}
            />}

            {id && projectData && expenseData && isCarryDetailsModalOpen && <CarryDetailsModal
                projectId={id}
                projectHeads={projectData.project_heads}
                formerYear={carryYear!}
                carryData={projectData.carry_forward}
                isOpen={isCarryDetailsModalOpen}
                onClose={() => {
                    setIsCarryDetailsModalOpen(false)
                    setCarryYear(null)
                }}
            />}
        </>
    );
};

export default ProjectDetails;