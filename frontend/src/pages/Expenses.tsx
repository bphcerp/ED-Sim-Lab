import { Button } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess, toastWarn } from '../toasts';
import AddExpenseModal from '../components/AddExpenseModal';
import { MdOutlineDescription } from "react-icons/md";
import SettleExpenseModal from '../components/SettleExpenseModal';
import FileReimbursementModal from '../components/FileReimbursementModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditExpenseModal from '../components/EditExpenseModal';
import DescriptionModal from '../components/DescriptionModal';
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import { createColumnHelper } from '@tanstack/react-table';
import TableCustom from '../components/TableCustom';
import { EditExpenseData, Expense } from '../types';
import PDFLink from '../components/PDFLink';
import { useNavigate } from 'react-router';

const ExpensesPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Array<Expense>>([]);
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [isFileReimbursementModalOpen, setIsFileReimbursementModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [description, setDescription] = useState("")
    const navigate = useNavigate()

    const columnHelper = createColumnHelper<Expense>();

    const columns = [
        columnHelper.accessor('createdAt', {
            header: 'Created On',
            cell: info => new Date(info.getValue()).toLocaleDateString('en-IN'),
            enableColumnFilter: false
        }),
        columnHelper.accessor('updatedAt', {
            header: 'Updated On',
            cell: info => new Date(info.getValue()).toLocaleDateString('en-IN'),
            enableColumnFilter: false
        }),
        columnHelper.accessor('expenseReason', {
            header: 'Reason',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('category.name', {
            header: 'Category',
            cell: info => info.getValue(),
            meta: {
                filterType: "multiselect"
            }
        }),
        columnHelper.accessor('amount', {
            header: 'Amount',
            cell: info => info.getValue().toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            enableColumnFilter: false
        }),
        columnHelper.accessor((row) => row.paidBy?.name ?? 'Direct', {
            header: 'Paid By',
            cell: info => info.getValue(),
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor(row => row.settled ? row.settled.type : "Not Settled", {
            header: 'Settled',
            cell: info => (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${info.getValue() === 'Current' ? 'bg-blue-100 text-blue-800' :
                    info.getValue() === 'Savings' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                    } shadow-sm`}>
                    {info.getValue() ?? 'Not Settled'}
                </span>
            ),
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor(row => row.reimbursedID ? row.reimbursedID.paidStatus ? "Filed and Reimbursed" : "Only Filed" : "Not Filed", {
            header: 'Reimbursement',
            cell: info => {
                const reimbursedID = info.row.original.reimbursedID;
                return (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${!reimbursedID ? 'bg-red-100 text-red-800' :
                        reimbursedID.paidStatus ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                        } shadow-sm`}>
                        {!reimbursedID ? 'Not Filed' : reimbursedID.title}
                    </span>
                );
            },
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor((row) => row.reimbursedID && row.reimbursedID.paidStatus && row.settled?.type === "Savings" ? (
            "Yes"
        ) : (
            "No"
        ), {
            header: "Appropriation",
            cell: ({ getValue }) => (
                <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${(getValue() == "Yes") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        } shadow-sm`}
                >
                    {getValue()}
                </span>
            ),
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor('description', {
            header: "Description",
            cell: ({ row }) => <div className='flex justify-center'>
                {row.original.description ? (
                    <MdOutlineDescription
                        size="1.75em"
                        onClick={() => {
                            setDescription(row.original.description);
                            setIsDescModalOpen(true);
                        }}
                        className="hover:text-gray-700 cursor-pointer"
                    />
                ) : "-"}
            </div>,
            enableColumnFilter: false,
            enableSorting: false
        }),
        columnHelper.accessor("reference_id", {
            header: "Reference",
            cell: ({ row }) => row.original.reference_id ? <PDFLink url={`${import.meta.env.VITE_BACKEND_URL}/expense/${row.original._id}/reference?type=Normal`}>View</PDFLink> : "-",
            enableColumnFilter: false,
            enableSorting: false,
        }),
        columnHelper.accessor(() => "Actions", {
            header: "Actions",
            cell: ({ row }) =>
                <div className="flex justify-center divide-x-2">
                    {!row.original.reimbursedID && <button
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
    ];

    const handleEditExpense = async (expenseData: EditExpenseData) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/expense/${selectedExpense?._id}`,
                {
                    method: 'PATCH',
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(expenseData),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update expense');
            }

            fetchExpenses()
            setIsEditModalOpen(false);
            setSelectedExpense(null);
            toastSuccess('Expense updated successfully');
        } catch (error) {
            toastError('Error updating expense');
            console.error('Error updating expense:', error);
        }
    };

    const openEditModal = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsEditModalOpen(true);
    };

    const handleFileReimbursement = async (formData: any) => {
        try {
            const { expenseIds, selectedProject, selectedProjectHead, totalAmount, reimbursementTitle, description, referenceDocument } = formData;

            const data = new FormData();
            data.append('expenseIds', JSON.stringify(expenseIds));
            data.append('projectId', selectedProject);
            data.append('projectHead', selectedProjectHead);
            data.append('totalAmount', totalAmount.toString());
            data.append('title', reimbursementTitle);
            data.append('description', description);

            if (referenceDocument) {
                data.append('referenceDocument', referenceDocument);
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse`, {
                method: 'POST',
                credentials: 'include',
                body: data,
            });

            if (!response.ok) {
                throw new Error('Failed to file reimbursement');
            }

            toastSuccess('Reimbursement filed successfully');
            fetchExpenses();
        } catch (error) {
            toastError('Error filing reimbursement');
            console.error('Error filing reimbursement:', error);
        }
    };


    const handleSettleExpenses = async (ids: string[], type: 'Current' | 'Savings', remarks: string, amount: number) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/settle`, {
                method: 'PATCH',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids, type, remarks, amount }),
            });

            if (!response.ok) {
                throw new Error('Failed to settle expenses');
            }

            fetchExpenses();
            toastSuccess('Expenses settled successfully');
        } catch (error) {
            toastError('Error settling expenses');
            console.error('Error settling expenses:', error);
        }
    };

    const handleAddExpense = async (newExpense: any) => {
        try {
            const formData = new FormData();
            formData.append('expenseReason', newExpense.expenseReason);
            formData.append('category', newExpense.category);
            formData.append('amount', newExpense.amount.toString());
            formData.append('description', newExpense.description);
            formData.append('type', newExpense.type);

            if (newExpense.referenceDocument) {
                formData.append('referenceDocument', newExpense.referenceDocument);
            }

            if (newExpense.type === 'Institute') {
                formData.append('project', newExpense.projectId);
                formData.append('projectHead', newExpense.projectHead);
                formData.append('overheadPercentage', newExpense.overheadPercentage.toString());
            } else {
                if (newExpense.paymentType === 'Indirect') {
                    formData.append('paidBy', newExpense.paidBy);
                } else if (newExpense.paymentType === 'Direct') {
                    formData.append('paidDirectWith', newExpense.paidDirectWith);
                }
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to add expense');
            }

            if (newExpense.type !== 'Institute') fetchExpenses();
            else navigate('institute')
            toastSuccess('Expense added successfully');
        } catch (error) {
            toastError('Error adding expense');
            console.error('Error adding expense:', error);
        }
    };

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense`, { credentials: "include" });
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


    const handleDeleteExpense = async () => {
        if (!expenseToDelete) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/${expenseToDelete._id}`, {
                credentials: "include",
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error((await response.json()).message ?? 'Failed to delete expense');
            }

            fetchExpenses()
            toastSuccess('Expense deleted successfully');
        } catch (error) {
            toastError((error as Error).message);
            console.error('Error deleting expense:', error);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const openDeleteModal = (expense: Expense) => {
        setExpenseToDelete(expense);
        setIsDeleteModalOpen(true);
    };

    return expenses ? (
        <div className="flex flex-col">
            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddExpense}
            />
            <SettleExpenseModal
                isOpen={isSettleModalOpen}
                onClose={() => setIsSettleModalOpen(false)}
                selectedExpenses={expenses.filter(expense => selectedExpenses.has(expense._id) && expense.paidBy !== undefined)}
                onSettle={handleSettleExpenses}
            />
            <FileReimbursementModal
                isOpen={isFileReimbursementModalOpen}
                onClose={() => setIsFileReimbursementModalOpen(false)}
                selectedExpenses={expenses.filter(expense => selectedExpenses.has(expense._id))}
                onFileReimbursement={handleFileReimbursement}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteExpense}
                item={expenseToDelete?.expenseReason || ""}
            />
            <EditExpenseModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedExpense(null);
                }}
                expense={selectedExpense}
                onSubmit={handleEditExpense}
            />
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type='expense'
                description={description}
            />
            <div className='flex justify-between'>
                <span className="text-2xl font-bold mb-4">Expenses</span>
                <div className='flex justify-center items-end mb-4 space-x-4'>
                    <div className="bg-gray-100 p-3 rounded-lg shadow-md flex items-center space-x-4">
                        <h2 className="font-semibold text-gray-700 mr-4">Legend:</h2>
                        <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 bg-yellow-300 rounded-full"></span>
                            <span className="text-sm text-gray-700">Filed, Pending Reimbursement</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                            <span className="text-sm text-gray-700">Filed, Reimbursed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                            <span className="text-sm text-gray-700">Not Filed</span>
                        </div>
                    </div>
                    <div className='flex space-x-2'>
                        <Button color="blue" className='rounded-md' onClick={() => { setIsModalOpen(true) }}>Add Expense</Button>
                        {selectedExpenses.size > 0 ?
                            <div className='flex space-x-2'>
                                <Button color="gray" size="md" className='rounded-md' onClick={() => {
                                    const eligibleExpenses = expenses.filter(expense => selectedExpenses.has(expense._id)).filter((expense) => (expense.paidBy && !expense.settled && !expense.reimbursedID?.paidStatus));
                                    if (eligibleExpenses.length === 0) {
                                        toastWarn('No eligible expenses for settling');
                                        return
                                    }
                                    setIsSettleModalOpen(true)
                                }}>{"Settle Expense" + (selectedExpenses.size > 1 ? "s" : "")}</Button>
                                <Button color="gray" size="md" className='rounded-md' onClick={() => {
                                    const eligibleExpenses = expenses.filter(expense => selectedExpenses.has(expense._id)).filter((expense) => (!expense.reimbursedID));
                                    if (eligibleExpenses.length === 0) {
                                        toastWarn('No eligible expenses for filing');
                                        return
                                    }
                                    setIsFileReimbursementModalOpen(true)
                                }}>File for Reimbursement</Button>
                            </div> : <></>
                        }
                    </div>
                </div>
            </div>
            <TableCustom data={expenses} columns={columns} setSelected={(selectedExpenses: Array<Expense>) => {
                setSelectedExpenses(new Set(selectedExpenses.map(expense => expense._id)))
            }} initialState={{
                sorting: [
                    {
                        id: 'updatedAt',
                        desc: true
                    }
                ]
            }} />
        </div>
    ) : <div>
        No Expenses to show
    </div>;
};

export default ExpensesPage;