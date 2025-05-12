import { Button, Modal, Label, Radio } from 'flowbite-react';
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toastError } from '../toasts';
import { Expense } from '../types';

interface SettleExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExpenses: Expense[];
    onSettle: (ids: string[], type: 'Current' | 'Savings',  remarks: string, totalAmount: number) => void;
}

const SettleExpenseModal: React.FC<SettleExpenseModalProps> = ({
    isOpen,
    onClose,
    selectedExpenses,
    onSettle,
}) => {
    const { register, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            settledStatus: null,
            remarks: '',
        },
    });

    const settledStatus = watch('settledStatus');

    // Calculate total amount of selected expenses
    const totalAmount = useMemo(() => {
        return selectedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [selectedExpenses]);

    const onSubmit = (data: { settledStatus: 'Current' | 'Savings' | null; remarks: string }) => {
        if (data.settledStatus) {
            const ids = selectedExpenses.map((expense) => expense._id);
            onSettle(ids, data.settledStatus, data.remarks, totalAmount);
            onClose();
            reset();
        } else {
            toastError('Please select a settled status');
        }
    };

    useEffect(() => {
        if (!isOpen) reset()
    }, [isOpen, onClose]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Settle Expense</Modal.Header>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Selected Expenses</h3>
                        <ul>
                            {selectedExpenses.map((expense) => (
                                <li key={expense._id} className="mb-2">
                                    {expense.expenseReason} -{' '}
                                    {expense.amount.toLocaleString('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                    })}{' '}
                                    - {expense.paidBy!.name}
                                </li>
                            ))}
                        </ul>
                        <div className="text-lg font-semibold mt-4">
                            Total Amount: {totalAmount.toLocaleString('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                            })}
                        </div>
                        <div className="mt-4">
                            <Label>Settled Status</Label>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center">
                                    <Radio
                                        id="Current"
                                        {...register('settledStatus', { required: true })}
                                        value="Current"
                                    />
                                    <Label htmlFor="Current" className="ml-2">
                                        Current
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <Radio
                                        id="Savings"
                                        {...register('settledStatus', { required: true })}
                                        value="Savings"
                                    />
                                    <Label htmlFor="Savings" className="ml-2">
                                        Savings
                                    </Label>
                                </div>
                            </div>
                        </div>
                        {/* Remarks Input */}
                        <div className="mt-4">
                            <Label htmlFor="remarks" className="block font-semibold mb-2">Remarks</Label>
                            <input
                                type="text"
                                id="remarks"
                                {...register('remarks')}
                                placeholder="Enter any remarks"
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="failure" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button color="blue" type="submit" disabled={!settledStatus}>
                        Settle Expense
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default SettleExpenseModal;
