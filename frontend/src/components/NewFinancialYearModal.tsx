import { FunctionComponent } from "react";
import { Modal } from "flowbite-react";

interface NewFinancialYearModalProps {
    isOpen: boolean;
    onClose : () => void
}

const NewFinancialYearModal: FunctionComponent<NewFinancialYearModalProps> = ({ isOpen, onClose }) => {

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>New Financial Year Started</Modal.Header>
            <Modal.Body>
                <p>
                    The new financial year has started. Please contact the developers to reset the data.
                    (The automated reset is in development)
                </p>
            </Modal.Body>
        </Modal>
    );
};

export default NewFinancialYearModal;