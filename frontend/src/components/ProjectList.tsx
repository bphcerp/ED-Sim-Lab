import { FunctionComponent, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { Link } from "react-router";
import { MdOutlineDescription } from "react-icons/md";
import DescriptionModal from "./DescriptionModal";
import { createColumnHelper } from '@tanstack/react-table';
import TableCustom from "./TableCustom";
import { Project } from "../types";
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import EditProjectModal from "./EditProjectModal";
import PDFLink from "./PDFLink";
import { getCurrentIndex } from "../helper";

const ProjectList: FunctionComponent = () => {
    const [projectData, setProjectData] = useState<Array<Project>>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [description, setDescription] = useState("");

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/?past=true`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    data = data.map((project: Project) => ({
                        ...project,
                        start_date: project.start_date ? new Date(project.start_date) : null,
                        end_date: project.end_date ? new Date(project.end_date) : null,
                    }));
                    setProjectData(data);
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    };

    useEffect(() => {
        fetchProjectData();
    }, []);

    const columnHelper = createColumnHelper<Project>();
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
        columnHelper.accessor("start_date", {
            header: "Start Date",
            cell: (info) =>
                info.getValue() ? new Date(info.getValue()!).toLocaleDateString("en-IN") : "-",
            enableColumnFilter: false,
        }),
        columnHelper.accessor("end_date", {
            header: "End Date",
            cell: (info) =>
                info.getValue() ? new Date(info.getValue()!).toLocaleDateString("en-IN") : "-",
            enableColumnFilter: false,
        }),
        columnHelper.accessor(
            (row) => row.project_type.charAt(0).toUpperCase() + row.project_type.slice(1),
            {
                header: "Project Type",
                meta: {
                    filterType: "dropdown",
                },
            }
        ),
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
        columnHelper.accessor("total_amount", {
            header: "Granted Amount",
            cell: (info) =>
                info.getValue().toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                }),
            enableColumnFilter: false,
        }),
        columnHelper.accessor("sanction_letter_file_id", {
            header: "Sanction Letter",
            cell: ({ row }) =>
                row.original.sanction_letter_file_id ? (
                    <PDFLink url={`${import.meta.env.VITE_BACKEND_URL}/project/${row.original._id}/sanction_letter`}>View</PDFLink>
                ) : (
                    "-"
                ),
            enableColumnFilter: false,
            enableSorting: false,
        }),
        columnHelper.accessor("description", {
            header: "Description",
            cell: ({ row }) =>
                row.original.description ? (
                    <MdOutlineDescription
                        size="1.75em"
                        onClick={() => {
                            setDescription(row.original.description);
                            setIsDescModalOpen(true);
                        }}
                        className="hover:text-gray-700 cursor-pointer"
                    />
                ) : (
                    "-"
                ),
            enableColumnFilter: false,
            enableSorting: false,
        }),
        columnHelper.accessor(() => "Actions", {
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center divide-x-2">
                    <button
                        className="w-10 flex justify-center hover:cursor-pointer"
                        onClick={() => openEditModal(row.original)}
                    >
                        <RiEdit2Line color="blue" />
                    </button>
                    <button
                        className="w-10 flex justify-center hover:cursor-pointer"
                        onClick={() => openDeleteModal(row.original)}
                    >
                        <RiDeleteBin6Line color="red" />
                    </button>
                </div>
            ),
            enableColumnFilter: false,
            enableSorting: false,
        })
    ];

    const openDeleteModal = (project: Project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setProjectToEdit(project);
        setIsEditModalOpen(true);
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project/${projectToDelete._id}`,
                {
                    credentials: "include",
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error(((await response.json()).message) || "Something went wrong");
            }

            setProjectData(projectData.filter((project) => project._id !== projectToDelete._id));
            toastSuccess("Project deleted successfully");
        } catch (error) {
            toastError((error as Error).message);
            console.error("Error deleting project:", error);
        } finally {
            setIsDeleteModalOpen(false);
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

    return projectData ? (
        <div className="container mx-auto p-4">
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteProject}
                item={ projectToDelete ?`${projectToDelete.funding_agency}-${projectToDelete.project_title}` : ""}
            />
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type="project"
                description={description}
            />
            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={projectToEdit}
                onSave={handleSaveProject}
            />
            <TableCustom data={projectData} columns={columns} />
        </div>
    ) : (
        <div className="text-center text-gray-500">No projects available</div>
    );
};

export default ProjectList;
