import { ColumnDef } from "@tanstack/react-table";
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import TableCustom from "../components/TableCustom";
import { Inputs } from "../types";
import AddAdminEntryModal from "../components/AddAdminEntryModal";
import DeleteAdminEntryModal from "../components/DeleteAdminEntryModal";
import { toastError, toastSuccess } from "../toasts";
import EditMemberModal from "../components/EditMemberModal";

const AdminPage: React.FC = () => {
    const [columns, setColumns] = useState<ColumnDef<any, any>[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [itemtoEdit, setItemToEdit] = useState<any | null>(null);

    const { register, handleSubmit, watch } = useForm<Inputs>();

    const onSubmit: SubmitHandler<Inputs> = async ({ selectedConfig }) => {
        const fetchPath =
            selectedConfig === "Category"
                ? "/category"
                : selectedConfig === "Student"
                    ? "/member?type=student"
                    : selectedConfig === "Faculty"
                        ? "/member/?type=faculty"
                        : "/user";

        const res = await (await fetch(`${import.meta.env.VITE_BACKEND_URL}${fetchPath}`, {
            credentials: "include",
        }));

        if (res.ok) {
            const data = await res.json()
            setData(data);
            setColumns(generateColumns(data[0]));
        }
        else {
            toastError((await res.json()).message ?? "Something went wrong")
        }
    };

    useEffect(() => {
        setData([]);
    }, [watch("selectedConfig")]);

    const handleModalSubmit: SubmitHandler<any> = async (formData) => {
        const selectedConfig = watch("selectedConfig");
        const fetchPath =
            selectedConfig === "Category"
                ? "/category"
                : selectedConfig === "Student"
                    ? "/member?type=student"
                    : selectedConfig === "Faculty"
                        ? "/member/?type=faculty"
                        : "/user";

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${fetchPath}`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (res.ok){
            toastSuccess(`${selectedConfig} added!`)
            handleSubmit(onSubmit)()
        }
        else {
            toastError((await res.json()).message ?? "Something went wrong")
            return
        }

        setIsModalOpen(false);
    };

    const generateColumns = <T extends object>(data: T): ColumnDef<T, any>[] => {
        return [
            ...Object.keys(data)
                .filter((key) => key !== "_id" && key !== "type" && key != "__v")
                .map((key) => ({
                    id: key,
                    accessorKey: key as keyof T,
                    header: key.replace(/_/g, " "),
                    enableColumnFilter: key.includes("name"),
                })),
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex space-x-2">
                        {["Student", "Faculty"].includes(watch("selectedConfig")) ? (
                            <Button color="blue" onClick={() => handleEdit(row.original)}>
                                Edit
                            </Button>
                        ) : (
                            <></>
                        )}
                        <Button color="failure" onClick={() => handleDelete(row.original)}>
                            Delete
                        </Button>
                    </div>
                ),
            },
        ];
    };

    const handleEdit = (rowData: any) => {
        setItemToEdit(rowData);
        setIsEditModalOpen(true);
    };

    const handleDelete = (rowData: any) => {
        setItemToDelete(rowData);
        setIsDeleteModalOpen(true);
    };

    const handleEditConfirm = async (formData: any) => {
        const selectedConfig = watch("selectedConfig");
      
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/member/${itemtoEdit._id}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({...formData,type : selectedConfig.toLowerCase()}),
        });
      
        if (res.ok) {
          toastSuccess(`${selectedConfig} updated!`);
          handleSubmit(onSubmit)();
        } else {
          toastError((await res.json()).message ?? "Something went wrong");
        }

        setIsEditModalOpen(false)
      }

    const handleDeleteConfirm = async () => {
        const selectedConfig = watch("selectedConfig");
        const fetchPath =
            selectedConfig === "Category"
                ? `/category/${itemToDelete._id}`
                : selectedConfig === "Student" || selectedConfig === "Faculty"
                    ? `/member/${itemToDelete._id}`
                    : `/user/${itemToDelete._id}`;

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${fetchPath}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (res.ok){
            toastSuccess(`${selectedConfig} deleted!`)
            handleSubmit(onSubmit)()
        }
        else {
            toastError((await res.json()).message ?? "Something went wrong")
            return
        }

        setIsDeleteModalOpen(false);
        setData(data.filter((item) => item._id !== itemToDelete._id));
    };

    return (
        <div className="flex flex-col w-full p-4 space-y-4">
            <AddAdminEntryModal
                selectedConfig={watch("selectedConfig")}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
            />
            <DeleteAdminEntryModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteConfirm}
                itemName={watch("selectedConfig")}
            />
            <EditMemberModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditConfirm}
                selectedConfig={watch("selectedConfig")}
                member={itemtoEdit}
            />
            <span className="text-2xl font-bold">Admin Configuration</span>
            <div className="flex justify-between">
                <form className="flex space-x-2" onSubmit={handleSubmit(onSubmit)}>
                    <select defaultValue="" {...register("selectedConfig")} required>
                        <option value="" disabled>
                            Select Configuration
                        </option>
                        <option>Category</option>
                        <option>Student</option>
                        <option>Faculty</option>
                        <option>User</option>
                    </select>

                    <Button type="submit" color="blue">
                        Get
                    </Button>
                </form>
                {watch("selectedConfig") && (
                    <Button onClick={() => setIsModalOpen(true)} color="blue">
                        Add {watch("selectedConfig")}
                    </Button>
                )}
            </div>
            <div className="flex flex-col items-center shadow-md bg-gray-100 rounded-md">
                {columns ? (
                    <TableCustom data={data} columns={columns} />
                ) : (
                    <span className="text-2xl">No Config Selected.</span>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
