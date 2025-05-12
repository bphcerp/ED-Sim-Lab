import { Modal, TextInput, Button, ToggleSwitch } from "flowbite-react";
import { FunctionComponent, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Account } from "../types";

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: SubmitHandler<any>;
    accounts: Account[];
}

const TransferModal: FunctionComponent<TransferModalProps> = ({ isOpen, onClose, onSubmit, accounts }) => {
    const { register, handleSubmit, reset, setValue } = useForm<any>();
    const [fullTransfer, setFullTransfer] = useState<Record<string, boolean>>({});

    const handleFormSubmit: SubmitHandler<any> = (formData) => {
        onSubmit(formData);
        reset();
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Transfer Amount</Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {accounts.map((account) => (
                        <div key={account._id} className="border p-4 rounded-lg">
                            <p><strong>Account Type:</strong> {account.type}</p>
                            <p><strong>Transferable Amount:</strong> {account.transferable}</p>
                            <p><strong>Balance:</strong> {account.amount}</p>
                            <ToggleSwitch
                                checked={fullTransfer[account._id] || false}
                                onChange={(checked) => {
                                    setFullTransfer(prev => ({ ...prev, [account._id]: checked }));
                                    setValue(`transferDetails.${account._id}`, checked ? account.transferable : 0);
                                }}
                                label="Transfer Full Amount"
                            />
                            <TextInput
                                type="number"
                                {...register(`transferDetails.${account._id}`, { valueAsNumber: true })}
                                placeholder="Enter transfer amount"
                                disabled={fullTransfer[account._id]}
                            />
                        </div>
                    ))}
                    <Button type="submit" color="blue">Transfer</Button>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default TransferModal;