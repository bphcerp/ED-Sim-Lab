import { Button, Modal } from "flowbite-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    itemName: string;
}

const DeleteAdminEntryModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onDelete, itemName }) => {
    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Delete {itemName}</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <p>Are you sure you want to delete this {itemName}?</p>
                    <div className="flex space-x-4">
                        <Button color="failure" onClick={onDelete}>Yes, Delete</Button>
                        <Button color="gray" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default DeleteAdminEntryModal;
