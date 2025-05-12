import React from 'react';
import { Modal } from 'flowbite-react';

interface DescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type : "project" | "expense" | "reimbursement"
    description: string;
}

const DescriptionModal: React.FC<DescriptionModalProps> = ({ isOpen, onClose, type, description }) => {
    return (
        <Modal show={isOpen} onClose={onClose} size="md">
            <Modal.Header>Description for {type}</Modal.Header>
            <Modal.Body>
                <p>{description}</p>
            </Modal.Body>
        </Modal>
    );
};

export default DescriptionModal;
