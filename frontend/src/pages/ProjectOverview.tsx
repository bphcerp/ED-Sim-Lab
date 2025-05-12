import { FunctionComponent, useEffect, useState } from "react";
import { toastError } from "../toasts";
import { MdOutlineDescription } from "react-icons/md";
import DescriptionModal from "../components/DescriptionModal";

import { createColumnHelper } from '@tanstack/react-table'
import TableCustom from "../components/TableCustom";
import { Link } from "react-router";
import { InstituteExpense, Project, Reimbursement } from "../types";
import { getCurrentIndex } from "../helper";
import ReimbursementModal from "../components/ReimbursementModal";

const ProjectList: FunctionComponent = () => {

    const getUniqueProjectHeads = (projects: Project[] | null): string[] => {
        if (!projects) return [];
        const headsSet = new Set<string>();

        projects.forEach((project) => {
            Object.keys(project.project_heads).forEach((head) => headsSet.add(head));
        });

        return Array.from(headsSet);
    };

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project?past=true&balance=true`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    data = data.map((project: Project) => ({
                        ...project,
                        start_date: project.start_date
                            ? new Date(project.start_date)
                            : null,
                        end_date: project.end_date
                            ? new Date(project.end_date)
                            : null,
                    }));
                    setProjectData(data);
                    setUniqueHeads(getUniqueProjectHeads(data))
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    }

    useEffect(() => {
        fetchProjectData()
    }, [])

    const fetchReimbursements = async ({ project, head }: { project: Project, head?: string }) => {
        try {

            const index = getCurrentIndex(project)

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/reimburse/${project!._id}/?head=${head}&index=${index}`,
                { credentials: "include" }
            );
            const data = await response.json();
            setInfo({ project, head })
            setLabel(` ${project.funding_agency} ${head ?? ""}${index !== undefined ? ` ${project.project_type === "invoice" ? "Installment" : 'Year'} ${index + 1}` : ""}`)
            setYearFlag(index ? null : project.project_type !== 'invoice')
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

            const { head, project } = info!

            const index = getCurrentIndex(project)

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/reimburse/${project._id}/?exportData=true&head=${head}&index=${index}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch the Excel file');
            }

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${project.funding_agency}${head ? ` ${head}` : ""}${index !== undefined ? project.project_type === 'invoice' ? " Installment " : " Year " : ""}${index !== undefined ? index + 1 : ""} Expense Data.xlsx`;
            link.click();

        } catch (error) {
            toastError("Error exporting reimbursement data");
            console.error(error);
        }
    };

    const [info, setInfo] = useState<{ project: Project, head?: string }>()
    const [label, setLabel] = useState<string>()
    const [yearFlag, setYearFlag] = useState<boolean | null>(null)
    const [showHead, setShowHead] = useState(false)
    const [reimbursements, setReimbursements] = useState<Array<Reimbursement>>([]);
    const [instituteExpenses, setInstituteExpenses] = useState<Array<InstituteExpense>>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [uniqueHeads, setUniqueHeads] = useState<Array<string>>([])
    const [projectData, setProjectData] = useState<Array<Project>>([]);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [description, setDescription] = useState("")
    const columnHelper = createColumnHelper<Project>()
    const columns = [
        columnHelper.accessor("project_id", {
            header: "Project ID",
            enableColumnFilter: true,
        }),
        columnHelper.accessor("funding_agency", {
            header: "Funding Agency",
            cell: (info) => (
                <Link className="hover:underline text-blue-600" to={`/project/${info.row.original._id}`}>
                    {info.getValue()}
                </Link>
            ),
            enableColumnFilter: true,
        }),
        columnHelper.accessor("project_title", {
            header: "Project Title",
            enableColumnFilter: true,
        }),
        columnHelper.accessor('start_date', {
            header: "Start Date",
            cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleDateString("en-IN") : "-",
            enableColumnFilter: false
        }),
        columnHelper.accessor('end_date', {
            header: "End Date",
            cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleDateString("en-IN") : "-",
            enableColumnFilter: false
        }),
        columnHelper.accessor(row => row.project_type.charAt(0).toUpperCase() + row.project_type.slice(1), {
            header: "Project Type",
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor(row => getCurrentIndex(row) >= 0 ? "Ongoing" : "Ended", {
            header: 'Status',
            cell: info => {
                return <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${info.getValue() === "Ongoing" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        } shadow-sm`}
                >
                    {info.getValue()}
                </span>
            },
            meta: {
                filterType: "dropdown"
            },
        }),
        columnHelper.accessor('total_amount', {
            header: "Granted Amount",
            cell: info => getCurrentIndex(info.row.original) !== -1 ? <button className='text-blue-600 hover:underline'
                onClick={() => fetchReimbursements({ project: info.row.original })}>{(info.row.original.total_amount ?? 0).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                })}</button> : (info.row.original.total_amount ?? 0).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                }),
            enableColumnFilter: false
        }),
        columnHelper.group({
            header: "Project Heads (Remaining)",
            columns: uniqueHeads.map(head => (
                columnHelper.accessor(row => `${row.funding_agency}_${head}`, {
                    header: head,
                    cell: info => (getCurrentIndex(info.row.original) === -1 ? "Project Ended" : <button className={info.row.original.project_heads[head] !== undefined ? `text-blue-600 hover:underline` : ''}
                        onClick={() => fetchReimbursements({ project: info.row.original, head })}>{(info.row.original.project_heads[head] ?? 0).toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                        })}</button>),
                    enableColumnFilter: false,
                    meta: {
                        truncateLength: 15
                    }
                })
            ))
        }),
        columnHelper.accessor('description', {
            header: "Description",
            cell: ({ row }) => row.original.description ? (
                <MdOutlineDescription
                    size="1.75em"
                    onClick={() => {
                        setDescription(row.original.description);
                        setIsDescModalOpen(true);
                    }}
                    className="hover:text-gray-700 cursor-pointer"
                />
            ) : "-",
            enableColumnFilter: false,
            enableSorting: false
        })
    ];


    return projectData ? (
        <div className="flex flex-col w-full p-4">
            <h1 className="text-2xl font-bold mb-4">Projects Overview</h1>
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type='project'
                description={description}
            />
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
            <TableCustom data={projectData} columns={columns} initialState={{
                sorting: [
                    {
                        id: 'Status',
                        desc: true
                    }
                ]
            }} />
        </div>
    ) : (
        <div className="text-center text-gray-500">No projects available</div>
    );
};

export default ProjectList;
