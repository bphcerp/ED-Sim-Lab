import React from 'react';
import { useForm } from 'react-hook-form';

interface SettleMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettle: (settlementType: string, remarks: string) => void;
}

const SettleMemberModal: React.FC<SettleMemberModalProps> = ({ isOpen, onClose, onSettle }) => {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            settlementType: 'Current',
            remarks: '',
        },
    });

    const onSubmit = (data: { settlementType: string; remarks: string }) => {
        onSettle(data.settlementType, data.remarks);
        onClose();
        reset();
    };

    return isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-80">
                <h2 className="text-lg font-bold mb-4">Settle Expense</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4 flex justify-between">
                        <label>
                            <input
                                type="radio"
                                value="Current"
                                {...register("settlementType")}
                                className="mr-2"
                            />
                            Current
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="Savings"
                                {...register("settlementType")}
                                className="mr-2"
                            />
                            Savings
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold mb-2">Remarks</label>
                        <input
                            type="text"
                            {...register("remarks")}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="Add remarks (optional)"
                        />
                    </div>
                    <div className="flex justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Settle
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                reset();
                            }}
                            className="text-gray-600 hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettleMemberModal;
