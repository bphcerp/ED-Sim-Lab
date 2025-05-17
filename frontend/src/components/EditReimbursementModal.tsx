import React, { useEffect, useState } from 'react';
import { Modal, Button, Select, TextInput, Label } from 'flowbite-react';
import { toastError, toastWarn } from '../toasts';
import { CiSquareMinus } from "react-icons/ci";
import { Project, Expense, Reimbursement } from '../types';

interface EditReimbursementModalProps {
    isOpen: boolean;
    onClose: () => void;
    reimbursement: Reimbursement;
    onEditReimbursement: (formData: any) => Promise<void>;
}

const EditReimbursementModal: React.FC<EditReimbursementModalProps> = ({
    isOpen,
    onClose,
    reimbursement,
    onEditReimbursement,
}) => {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [removedExpenses, setRemovedExpenses] = useState<string[]>([]);

    // Form states
    const [reimbursementTitle, setReimbursementTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedProjectHead, setSelectedProjectHead] = useState('');
    const [referenceURL, setReferenceURL] = useState<string | null>(null);
    const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);

    const fetchProjects = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project?balance=true`,
                { credentials: 'include' }
            );
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            toastError('Error fetching projects');
            console.error('Error fetching projects:', error);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const expenseIds = reimbursement.expenses.map((expense) => expense._id);

        if (!selectedProject || !selectedProjectHead) {
            toastWarn('Please fill out all fields.');
            return;
        }

        setLoading(true);

        try {
            await onEditReimbursement({
                reimbursementTitle,
                description,
                selectedProject,
                selectedProjectHead,
                referenceURL,
                expenseIds: expenseIds.filter(expenseId => !removedExpenses.includes(expenseId)),
                totalAmount: totalExpenseAmount,
                removedExpenses
            });
            onClose();
        } catch (error) {
            toastError('Error filing reimbursement');
            console.error('Error filing reimbursement:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetModalData = () => {
        setReimbursementTitle('');
        setDescription('');
        setSelectedProject('');
        setSelectedProjectHead('');
        setReferenceURL(null);
        setRemovedExpenses([]);
    };

    const handleRemoveExpense = (expense: Expense) => {
        setRemovedExpenses([...removedExpenses, expense._id]);
        setTotalExpenseAmount(totalExpenseAmount - expense.amount);
    };

    useEffect(() => {
        if (!isOpen) {
            resetModalData();
        } else {
            fetchProjects();
            setReimbursementTitle(reimbursement.title);
            setDescription(reimbursement.description);
            setSelectedProject(reimbursement.project._id!);
            setSelectedProjectHead(reimbursement.projectHead);
            setTotalExpenseAmount(reimbursement.expenses.reduce((acc, obj) => acc + obj.amount, 0));
            setReferenceURL(reimbursement.referenceURL ?? '');
        }
    }, [isOpen]);

    return (
        projects.length && isOpen ? (
            <Modal show={isOpen} onClose={onClose}>
                <Modal.Header>Edit Reimbursement</Modal.Header>
                <Modal.Body>
                    <form onSubmit={onSubmit}>
                        <div className="space-y-4">
                            <div className='space-y-2'>
                                <span className="font-semibold text-lg">Selected Expenses:</span>
                                <div className="grid grid-cols-3 gap-4">
                                    {reimbursement.expenses.filter(expense => !removedExpenses.includes(expense._id)).map((expense) => (
                                        <div
                                            key={expense._id}
                                            className="flex items-center space-x-4"
                                        >
                                            <button type='button' onClick={() => handleRemoveExpense(expense)}><CiSquareMinus size={20} color='red' /></button>
                                            <span className="text-center font-bold">{expense.expenseReason}</span>
                                            <span>
                                                {expense.amount.toLocaleString('en-IN', {
                                                    style: 'currency',
                                                    currency: 'INR',
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className='space-x-4'>
                                    <span className='font-semibold'>Total Amount: </span>
                                    <span>{totalExpenseAmount.toLocaleString('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                    })}</span>
                                </div>
                            </div>
                            <TextInput
                                value={reimbursementTitle}
                                onChange={(e) => setReimbursementTitle(e.target.value)}
                                placeholder="Enter reimbursement title"
                                readOnly={reimbursement.paidStatus}
                                title={reimbursement.paidStatus ? "Reimbursement marked as paid, can't edit title." : ""}
                            />
                            <TextInput
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter reimbursement description"
                            />
                            <Select
                                value={selectedProject}
                                onChange={(e) => {
                                    setSelectedProject(e.target.value);
                                    setSelectedProjectHead('');
                                }}
                            >
                                <option value="">Select a Project</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>
                                        {project.funding_agency}
                                    </option>
                                ))}
                            </Select>
                            {selectedProject && (
                                <Select
                                    value={selectedProjectHead}
                                    onChange={(e) => setSelectedProjectHead(e.target.value)}
                                >
                                    <option value="">Select a Project Head</option>
                                    {Object.entries(
                                        projects.find((p) => p._id === selectedProject)?.project_heads || {}
                                    ).map(([head, amounts]) => (
                                        <option key={head} value={head}>
                                            {head} - {amounts[0].toLocaleString('en-IN', {
                                                style: 'currency',
                                                currency: 'INR',
                                            })}
                                        </option>
                                    ))}
                                </Select>
                            )}
                            {selectedProjectHead && (
                                <div>
                                    {selectedProjectHead !== reimbursement.projectHead &&
                                        !projects.find((p) => p._id === selectedProject)?.negative_heads.includes(selectedProjectHead) &&
                                        projects.find((p) => p._id === selectedProject)!.project_heads[selectedProjectHead][0] <
                                        totalExpenseAmount ? (
                                        <p className="text-red-500">
                                            Selected head cannot cover the total expenses of {totalExpenseAmount.toLocaleString('en-IN', {
                                                style: 'currency',
                                                currency: 'INR',
                                            })}.
                                        </p>
                                    ) : null}
                                </div>
                            )}
                            <div>
                                <Label htmlFor="referenceURL" value="Reference Document Link" />
                                <TextInput
                                    id="referenceURL"
                                    value={referenceURL ?? ''}
                                    onChange={(e) => setReferenceURL(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex mt-5 space-x-5">
                            <Button type="button" onClick={onClose} disabled={loading} color="failure">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="blue"
                                disabled={
                                    selectedProject &&
                                    selectedProjectHead &&
                                    selectedProjectHead !== reimbursement.projectHead &&
                                    !projects.find((p) => p._id === selectedProject)?.negative_heads.includes(selectedProjectHead) &&
                                    projects.find((p) => p._id === selectedProject)!.project_heads[selectedProjectHead][0] <
                                    totalExpenseAmount ||
                                    loading
                                }
                            >
                                {loading ? 'Submitting...' : 'Edit Reimbursement'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        ) : <></>
    );
};

export default EditReimbursementModal;