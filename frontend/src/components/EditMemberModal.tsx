import { Modal, TextInput, Button, Label } from "flowbite-react";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

interface EditMemberModalProps {
  selectedConfig: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<any>;
  member: any;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ selectedConfig, isOpen, onClose, onSubmit, member }) => {
  const { register, handleSubmit, reset, setValue } = useForm<any>();

  useEffect(() => {
    if (member && isOpen) {
      setValue("name", member.name);
      setValue("institute_id", member.institute_id);
    }
  }, [isOpen, member, setValue]);

  const handleFormSubmit: SubmitHandler<any> = (formData) => {
    onSubmit(formData);
    reset();
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Edit {selectedConfig}</Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {selectedConfig === "Student" || selectedConfig === "Faculty" ? (
            <>
              <Label htmlFor="member-name">Name</Label>
              <TextInput id="member-name" {...register("name")} required />

              <Label htmlFor="member-id">Institute ID</Label>
              <TextInput id="member-id" {...register("institute_id")} required />
            </>
          ) : null}
          <Button type="submit" color="blue">Save</Button>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default EditMemberModal;
