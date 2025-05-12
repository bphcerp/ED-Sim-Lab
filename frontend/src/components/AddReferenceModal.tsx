import { Modal, Label, FileInput, Button } from 'flowbite-react';
import React, { useState } from 'react';
import { toastWarn } from '../toasts';

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

const AddReferenceModal: React.FC<AddReferenceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit(file);
      setFile(null);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Add Reference</Modal.Header>
      <Modal.Body>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <Label htmlFor="referenceDocument" value="Reference Document (PDF only)" />
            <FileInput
              required
              id="referenceDocument"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.type !== 'application/pdf') {
                  toastWarn('Please upload a PDF file.');
                  e.target.value = ''; // Reset the input
                  return;
                }

                const maxSizeInMB = 10;
                if (file.size > maxSizeInMB * 1024 * 1024) {
                  toastWarn(`File size exceeds ${maxSizeInMB} MB.`);
                  e.target.value = ''; // Reset the input
                  return;
                }

                setFile(file);
              }}
              accept="application/pdf"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              color="gray"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" color="blue">
              Submit
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default AddReferenceModal;