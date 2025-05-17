import { RiDeleteBin6Line, RiEdit2Line } from 'react-icons/ri';
import { FunctionComponent, useEffect, useState } from 'react';
import TableCustom from '../components/TableCustom';
import { toastError, toastSuccess } from '../toasts';
import { InstituteExpense } from '../types';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router';
import AddExpenseModal from '../components/AddExpenseModal';

export const InstituteExpensesPage: FunctionComponent = () => {

    const [expenses, setExpenses] = useState<InstituteExpense[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<InstituteExpense | null>(null);

    const openEditModal = (expense: InstituteExpense) => {
        setSelectedExpense(expense);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (expense: InstituteExpense) => {
        setSelectedExpense(expense);
        setIsDeleteModalOpen(true);
    };

    const columnHelper = createColumnHelper<InstituteExpense>()

    const columns = [
        columnHelper.accessor('createdAt', {
            header: 'Created At',
            cell: (info) =>
                info.getValue()
                    ? new Date(info.getValue()).toLocaleDateString('en-IN')
                    : 'N/A',
            enableColumnFilter: false
        }),
        columnHelper.accessor('updatedAt', {
            header: 'Updated At',
            cell: (info) =>
                info.getValue()
                    ? new Date(info.getValue()).toLocaleDateString('en-IN')
                    : 'N/A',
            enableColumnFilter: false
        }),
        columnHelper.accessor('expenseReason', {
            header: 'Expense Reason',
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('category.name', {
            header: 'Category',
            cell: (info) => info.getValue(),
            meta: {
                filterType: 'dropdown'
            }
        }),
        columnHelper.accessor((row) => `${row.project.funding_agency}-${row.project.project_title}`, {
            header: 'Project',
            cell: ({ getValue, row }) => <Link className='hover:underline text-blue-600'
                to={`/project/${row.original.project._id}`}
                target="_blank"
                rel="noopener noreferrer">
                {getValue()}
            </Link>
        }),
        columnHelper.accessor('projectHead', {
            header: 'Project Head',
            cell: (info) => info.getValue(),
            meta: {
                filterType: 'dropdown'
            }
        }),
        columnHelper.accessor('amount', {
            header: 'Amount',
            cell: (info) =>
                info.getValue().toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }),
            enableColumnFilter: false
        }),
        columnHelper.accessor('overheadPercentage', {
            header: 'Overhead %',
            cell: (info) => info.getValue() ? `${info.getValue()}%` : 'NA',
            enableColumnFilter: false
        }),
        columnHelper.accessor("referenceURL", {
            header: "Reference",
            cell: ({ getValue }) => getValue() ? <Link target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" to={getValue()!}>View</Link> : "-",
            enableColumnFilter: false,
            enableSorting: false,
        }),
        columnHelper.accessor(() => "Actions", {
            header: "Actions",
            cell: ({ row }) =>
                <div className="flex justify-center divide-x-2">
                    {<button
                        className="w-10 flex justify-center hover:cursor-pointer"
                        onClick={() => openEditModal(row.original)}
                    >
                        <RiEdit2Line color="blue" />
                    </button>}
                    <button
                        className="w-10 flex justify-center hover:cursor-pointer"
                        onClick={() => openDeleteModal(row.original)}
                    >
                        <RiDeleteBin6Line color="red" />
                    </button>
                </div>
            ,
            enableColumnFilter: false,
            enableSorting: false
        })
    ]

    const handleEditExpense = async (updatedExpense: Partial<InstituteExpense>) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/${selectedExpense?._id}?type=Institute`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedExpense),
                credentials: "include"
            });

            if (!response.ok) throw new Error('Failed to update expense');
            fetchExpenses();
            toastSuccess('Expense updated successfully');
        } catch (error) {
            toastError('Error updating expense');
            console.error('Error updating expense:', error);
        }
    };

    const handleDeleteExpense = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/${selectedExpense?._id}?type=Institute`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to delete expense');
            fetchExpenses();
            toastSuccess('Expense deleted successfully');
        } catch (error) {
            toastError('Error deleting expense');
            console.error('Error deleting expense:', error);
        }
    };

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense?type=Institute`, { credentials: "include" });
            const data = await response.json();
            setExpenses(data);
        } catch (error) {
            toastError("Error fetching expenses");
            console.error('Error fetching expenses:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    return (
        <>
            {selectedExpense && <AddExpenseModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                edit="Institute"
                editData={selectedExpense}
                onSubmit={handleEditExpense}
            />}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteExpense}
                item={selectedExpense?.expenseReason || ""}
            />
            <TableCustom
                data={expenses}
                columns={columns}
            />
        </>
    );
};