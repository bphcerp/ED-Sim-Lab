import React from 'react';
import { Button, Modal } from 'flowbite-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    item: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onDelete, item }) => {
    return (
        <Modal show={isOpen} onClose={onClose} size="md">
            <Modal.Header>Confirm Deletion</Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete "{item}"?</p>
            </Modal.Body>
            <Modal.Footer>
                <Button color="gray" onClick={onClose}>
                    Cancel
                </Button>
                <Button color="failure" onClick={onDelete}>
                    Delete
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteConfirmationModal;
