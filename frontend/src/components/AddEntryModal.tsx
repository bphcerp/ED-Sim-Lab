import { Modal, TextInput, Button, Label, Radio } from "flowbite-react";
import { SubmitHandler, useForm } from "react-hook-form";

interface AddEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: SubmitHandler<any>;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { register, handleSubmit, reset } = useForm<any>();

    const handleFormSubmit: SubmitHandler<any> = (formData) => {
        onSubmit(formData);
        reset();
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Add New Entry</Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="entry-amount">Amount</Label>
                        <TextInput
                            id="entry-amount"
                            type="number"
                            {...register("amount", { valueAsNumber: true })}
                            required
                            placeholder="Amount"
                        />
                    </div>

                    <div>
                        <Label>Transaction Type</Label>
                        <div className="flex space-x-4 mt-2">
                            <label className="flex items-center space-x-2">
                                <Radio
                                    {...register("credited")}
                                    value="true"
                                />
                                <span>Credited</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <Radio
                                    {...register("credited")}
                                    value="false"
                                />
                                <span>Debited</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="entry-remarks">Remarks</Label>
                        <TextInput
                            id="entry-remarks"
                            {...register("remarks")}
                            placeholder="Additional remarks"
                        />
                    </div>

                    <Button type="submit" color="blue">Save</Button>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default AddEntryModal;
