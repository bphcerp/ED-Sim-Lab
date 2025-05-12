import { Modal, TextInput, Button, Label } from "flowbite-react";
import { SubmitHandler, useForm } from "react-hook-form";

interface AddEntryModalProps {
    selectedConfig: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: SubmitHandler<any>;
}

const AddAdminEntryModal: React.FC<AddEntryModalProps> = ({ selectedConfig, isOpen, onClose, onSubmit }) => {
    const { register, handleSubmit, reset } = useForm<any>();

    const handleFormSubmit: SubmitHandler<any> = (formData) => {
        onSubmit(formData);
        reset();
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Add New {selectedConfig}</Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {selectedConfig === "Category" && (
                        <>
                            <Label htmlFor="category-name">Name</Label>
                            <TextInput id="category-name" {...register("name")} required />
                        </>
                    )}
                    {(selectedConfig === "Student" || selectedConfig === "Faculty") ? (
                        <>
                            <Label htmlFor="member-name">Name</Label>
                            <TextInput id="member-name" {...register("name")} required />

                            <Label htmlFor="member-email">Email</Label>
                            <TextInput id="member-id" {...register("institute_id")} required />
                        </>
                    ) : selectedConfig === "User" && (
                        <>
                            <Label htmlFor="user-email">Email</Label>
                            <TextInput id="user-email" {...register("email")} required />
                        </>
                    )}
                    <Button type="submit" color="blue">Save</Button>
                </form>
            </Modal.Body>
        </Modal>

    );
};

export default AddAdminEntryModal;
