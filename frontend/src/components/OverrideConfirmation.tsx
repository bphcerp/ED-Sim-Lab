import React, { FormEvent, useState } from "react";
import { Modal, Button, Label, TextInput } from "flowbite-react";

interface OverrideConfirmationProps {
    max: number;
    label: "year" | "invoice";
    isOpen: boolean;
    reset : boolean
    onClose: () => void;
    onConfirm: (selectedValue?: number) => void;
}

const OverrideConfirmation: React.FC<OverrideConfirmationProps> = ({
    max,
    label,
    isOpen,
    onClose,
    reset,
    onConfirm,
}) => {
    const [selectedValue, setSelectedValue] = useState<number>();

    const handleConfirm = (e: FormEvent) => {
        e.preventDefault()
        if (!reset) onConfirm(selectedValue! - 1); //for 0-based indexing
        else onConfirm()
        onClose();
        setSelectedValue(undefined)
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Override Confirmation</Modal.Header>
            <Modal.Body>
                <form onSubmit={handleConfirm} className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure to {reset?"reset the override?":`override the ${label}`}?
                    </p>
                    {!reset?<div>
                        <Label htmlFor="selectedValue" value={`Select a ${label}`} />
                        <TextInput
                            id="selectedValue"
                            type="number"
                            min={1}
                            max={max}
                            placeholder={`Enter a ${label} between 1 and ${max}.`}
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(Number(e.target.value))}
                            required
                        />
                    </div>:<></>}
                    <div className="flex space-x-4">
                        <Button type="submit" color="failure">Confirm {reset?"Reset":""} Override</Button>
                        <Button color="gray" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default OverrideConfirmation;