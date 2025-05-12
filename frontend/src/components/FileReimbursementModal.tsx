import React, { useEffect, useState } from 'react';
import { Modal, Button, Select, TextInput, FileInput, Label } from 'flowbite-react';
import { toastError, toastWarn } from '../toasts';
import { Expense, Project } from '../types';

interface FileReimbursementModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExpenses: Expense[];
    onFileReimbursement: (formData: any) => Promise<void>;
}

const FileReimbursementModal: React.FC<FileReimbursementModalProps> = ({
    isOpen,
    onClose,
    selectedExpenses,
    onFileReimbursement,
}) => {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    // Form states
    const [reimbursementTitle, setReimbursementTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedProjectHead, setSelectedProjectHead] = useState('');
    const [referenceDocument, setReferenceDocument] = useState<File | null>(null);

    const totalExpenseAmount = selectedExpenses.reduce((acc, obj) => acc + obj.amount, 0);

    useEffect(() => {
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

        if (isOpen) fetchProjects();
    }, [isOpen]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const expenseIds = selectedExpenses.map((expense) => expense._id);

        if (!selectedProject || !selectedProjectHead || !referenceDocument) {
            toastWarn('Please fill out all fields.');
            return;
        }

        setLoading(true);

        try {
            await onFileReimbursement({
                reimbursementTitle,
                description,
                selectedProject,
                selectedProjectHead,
                referenceDocument,
                expenseIds,
                totalAmount: totalExpenseAmount,
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
        setReferenceDocument(null);
    };

    useEffect(() => {
        if (!isOpen) {
            resetModalData();
        }
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>File for Reimbursement</Modal.Header>
            <Modal.Body>
                <form onSubmit={onSubmit}>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Selected Expenses:</h3>
                            {selectedExpenses.map((expense) => (
                                !expense.reimbursedID && (
                                    <div key={expense._id} className="flex justify-between">
                                        <span>{expense.expenseReason} - {expense.amount.toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        })}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>
                        <TextInput
                            value={reimbursementTitle}
                            onChange={(e) => setReimbursementTitle(e.target.value)}
                            placeholder="Enter reimbursement title"
                            required
                        />
                        <TextInput
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter reimbursement description"
                        />
                        <Select
                            value={selectedProject}
                            onChange={(e) => {
                                setSelectedProject(e.target.value)
                                setSelectedProjectHead("")
                            }}
                            required
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
                                required
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
                                {!projects.find((p) => p._id === selectedProject)?.negative_heads.includes(selectedProjectHead) &&
                                    (projects.find((p) => p._id === selectedProject)!.project_heads[selectedProjectHead][0] <
                                        totalExpenseAmount) ? (
                                    <p className="text-red-500">
                                        Selected head cannot cover the total expenses of {totalExpenseAmount.toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        })}.
                                    </p>
                                ) : null}
                            </div>
                        )}
                        <div>
                            <Label htmlFor="referenceDocument" value="Reference Document (PDF only)" />
                            <FileInput
                                id="referenceDocument"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (file.type !== 'application/pdf') {
                                        toastWarn('Please upload a PDF file.');
                                        e.target.value = ''; // Reset the input
                                        return;
                                    }

                                    const maxSizeInMB = 10;
                                    if (file.size > maxSizeInMB * 1024 * 1024) {
                                        toastWarn(`File size exceeds ${maxSizeInMB} MB.`);
                                        e.target.value = ''; // Reset the input
                                        return;
                                    }

                                    setReferenceDocument(file);
                                }}
                                accept="application/pdf"
                            />
                        </div>
                    </div>
                    <div className='flex mt-5 space-x-5'>
                        <Button type="button" onClick={onClose} disabled={loading} color="failure">
                            Cancel
                        </Button>
                        <Button type="submit" color="blue" disabled={selectedProject && selectedProjectHead && !projects.find((p) => p._id === selectedProject)?.negative_heads.includes(selectedProjectHead) &&
                                    (projects.find((p) => p._id === selectedProject)!.project_heads[selectedProjectHead][0] <
                                        totalExpenseAmount) || loading}>
                            {loading ? 'Submitting...' : 'Submit Reimbursement'}
                        </Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default FileReimbursementModal;