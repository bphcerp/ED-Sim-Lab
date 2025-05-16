import { Button, Modal, Label, TextInput, Checkbox } from 'flowbite-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Project, Member } from "../types";  // Ensure Member type is correctly imported
import { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import { RiDeleteBin6Line } from 'react-icons/ri';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onSave: (updatedProject: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project, onSave }) => {
    const { register, handleSubmit, watch, setValue, reset, control } = useForm<Project>({
        defaultValues: {
            funding_agency: project?.funding_agency || '',
            total_amount: project?.total_amount || 0,
            project_heads: project?.project_heads || {},
            pis: project?.pis || [],
            copis: project?.copis || [],
            negative_heads: project?.negative_heads || [],
            project_id: project?.project_id || '',
            project_title: project?.project_title || ''
        }
    });

    const { fields: pisFields, append: appendPi, remove: removePi } = useFieldArray({
        control,
        name: 'pis'
    });

    const { fields: copisFields, append: appendCopi, remove: removeCopi } = useFieldArray({
        control,
        name: 'copis'
    });

    const [faculties, setFaculties] = useState<Array<Member>>([]);
    const [selectedPi, setSelectedPi] = useState<string | null>(null);  // Track selected PI for button click
    const [selectedCopi, setSelectedCopi] = useState<string | null>(null); // Track selected Co-PI for button click
    const [newHeadName, setNewHeadName] = useState<string>(''); // State to track the new head name

    const fetchFaculties = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/member?type=faculty`, {
                credentials: 'include',
            });
            const data = await response.json();
            setFaculties(data);
        } catch (error) {
            toastError('Error fetching members');
            console.error('Error fetching members:', error);
        }
    };

    useEffect(() => {
        if (project) {
            reset(project);
        }
        fetchFaculties();
    }, [project, reset]);

    const onSubmit = (submittedProject: Project) => {
        console.log(submittedProject)
        onSave(submittedProject);
        reset()
        onClose();
    };

    // Handle Add PI button click
    const handleAddPi = () => {
        const selectedPiMember = faculties.find(faculty => faculty._id === selectedPi);
        if (selectedPiMember) {
            appendPi(selectedPiMember);
            setSelectedPi(null);  // Reset selection after adding
        }
    };

    // Handle Add Co-PI button click
    const handleAddCopi = () => {
        const selectedCoPiMember = faculties.find(faculty => faculty._id === selectedCopi);
        if (selectedCoPiMember) {
            appendCopi(selectedCoPiMember);
            setSelectedCopi(null);  // Reset selection after adding
        }
    };

    const calculateNumberOfYears = (startDate: Date | string, endDate: Date | string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);


      const startYear = start.getMonth() < 3 ? start.getFullYear() - 1 : start.getFullYear();
      const endYear = end.getMonth() < 3 ? end.getFullYear() - 1 : end.getFullYear();

      const yearsDiff = endYear - startYear + 1;
      return (yearsDiff >= 1 ? yearsDiff : 0);
    }
  };

    const handleAddHead = () => {
        if (newHeadName.trim() === '') {
            toastError('Head name cannot be empty');
            return;
        }

        // Add the new head to the project_heads object
        setValue(`project_heads.${newHeadName}`, new Array(project?.project_type === 'yearly' ? calculateNumberOfYears(project!.start_date,project!.end_date) : project!.installments!.length).fill(0)); // Initialize with 5 installments of 0
        setNewHeadName(''); // Reset the input field
    };

    const handleHeadDelete = async (headName: string) => {

        // Delete head added before saving
        if (!project?.project_heads[headName]) {
            const updatedHeads = { ...watch('project_heads') };
            delete updatedHeads[headName];

            setValue(`project_heads`, updatedHeads);
            setValue(`negative_heads`, watch('negative_heads')?.filter(negativeHead => negativeHead !== headName));
            return
        }

        // Deletes the head from the project by sending a DELETE request to /:id/:head

        await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${project!._id}/${headName}`, {
            method: 'DELETE',
            credentials: 'include',
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error((await response.json()).message || 'Something went wrong');
                }
                // Remove the head from the form state

                const updatedHeads = { ...watch('project_heads') };
                delete updatedHeads[headName];

                setValue(`project_heads`, updatedHeads);
                setValue(`negative_heads`, watch('negative_heads')?.filter(negativeHead => negativeHead !== headName));

                toastSuccess('Head deleted successfully');
            })
            .catch((error) => {
                toastError((error as Error).message);
                console.error('Error deleting head:', error);
            });
    }


    return (
        <Modal show={isOpen} onClose={() => {
            reset()
            onClose()
        }} size="4xl">
            <Modal.Header>
                <h2 className="text-lg font-semibold">Edit Project</h2>
            </Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        {/* Project ID Field */}
                        <div>
                            <Label htmlFor="projectId" value="Project ID" />
                            <TextInput
                                id="projectId"
                                {...register("project_id", { required: true })}
                                placeholder="Enter project ID"
                                className="mt-1"
                            />
                        </div>

                        {/* Project Title Field */}
                        <div>
                            <Label htmlFor="projectTitle" value="Project Title" />
                            <TextInput
                                id="projectTitle"
                                {...register("project_title", { required: true })}
                                placeholder="Enter project title"
                                className="mt-1"
                            />
                        </div>

                        {/* Funding Agency Field */}
                        <div>
                            <Label htmlFor="fundingAgency" value="Funding Agency" />
                            <TextInput
                                id="fundingAgency"
                                {...register("funding_agency", { required: true })}
                                placeholder="Enter Funding Agency"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-md font-medium text-gray-700">Project Heads</h3>
                            <div className="flex items-center space-x-2">
                                <TextInput
                                    value={newHeadName}
                                    onChange={(e) => setNewHeadName(e.target.value)}
                                    placeholder="Enter new head name"
                                    className="mt-1"
                                />
                                <Button disabled={!newHeadName.length} size="sm" color="blue" onClick={handleAddHead}>
                                    Add Head
                                </Button>
                            </div>
                        </div>
                        {Object.entries(watch('project_heads') || {}).map(([headName, amounts], index) => (
                            <div key={index} className="space-y-2">
                                <div className='flex justify-between items-center'>
                                    <div className="flex items-center space-x-2">
                                        <Label value={headName} className="text-sm font-semibold text-gray-600" />
                                        <Checkbox
                                            id={`${headName}_neg_checkbox`}
                                            checked={watch('negative_heads')?.includes(headName)}
                                            onChange={() => {
                                                if (watch('negative_heads')?.includes(headName)) {
                                                    setValue('negative_heads', watch('negative_heads')?.filter(negativeHead => negativeHead !== headName));
                                                } else {
                                                    setValue('negative_heads', [...watch('negative_heads'), headName]);
                                                }
                                            }}
                                        />
                                        <Label value="Allow Negative Values" htmlFor={`${headName}_neg_checkbox`} />
                                    </div>
                                    <div>
                                        <button
                                            color="failure"
                                            onClick={() => handleHeadDelete(headName)}
                                            type="button"
                                        >
                                            <RiDeleteBin6Line color='red' />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {amounts.map((amount, i) => (
                                        <TextInput
                                            key={i}
                                            type="number"
                                            defaultValue={amount}
                                            {...register(`project_heads.${headName}.${i}`, { valueAsNumber: true })}
                                            placeholder={`Installment ${i + 1}`}
                                            className="mt-1"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Amount Field */}
                    <div>
                        <Label htmlFor="totalAmount" value="Total Amount" />
                        <TextInput
                            id="totalAmount"
                            type="number"
                            value={Object.values(watch('project_heads')).reduce((sum, alloc) => {
                                const headSum = alloc.reduce((sum, val) => {
                                    sum += val
                                    return sum
                                }, 0)
                                sum += headSum
                                return sum
                            }, 0)}
                            readOnly
                            className="mt-1"
                        />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <h3 className="text-md font-medium text-gray-700">Principal Investigators (PIs)</h3>
                        <div className="flex justify-between">
                            <div>
                                <Label htmlFor="pi" value="Add Principal Investigators (PIs)" />
                                <div className="flex items-center space-x-3">
                                    <select
                                        id="pi"
                                        value={selectedPi || ''}
                                        onChange={(e) => setSelectedPi(e.target.value)}
                                        className="border p-2 rounded"
                                    >
                                        <option value="">Select PI</option>
                                        {faculties.map((faculty) => (
                                            <option value={faculty._id} key={faculty._id}>
                                                {faculty.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button onClick={handleAddPi} color="blue" disabled={!selectedPi} size="sm">
                                        Add PI
                                    </Button>
                                </div>
                                {pisFields.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-bold">PIs:</h4>
                                        <ul>
                                            {pisFields.map((pi, idx) => (
                                                <li key={pi.id} className="flex justify-between">
                                                    <span>{pi.name}</span>
                                                    <Button
                                                        color="failure"
                                                        onClick={() => removePi(idx)}
                                                        type="button"
                                                        size="xs"
                                                    >
                                                        Delete
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label value="Add Co-Principal Investigators (Co-PIs)" />
                                <div className="flex items-center space-x-3">
                                    <select
                                        value={selectedCopi || ''}
                                        onChange={(e) => setSelectedCopi(e.target.value)}
                                        className="border p-2 rounded"
                                    >
                                        <option value="">Select Co-PI</option>
                                        {faculties.map((faculty) => (
                                            <option value={faculty._id} key={faculty._id}>
                                                {faculty.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button onClick={handleAddCopi} color="blue" disabled={!selectedCopi} size="sm">
                                        Add Co-PI
                                    </Button>
                                </div>
                                {copisFields.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-bold">Co-PIs:</h4>
                                        <ul>
                                            {copisFields.map((copi, idx) => (
                                                <li key={copi.id} className="flex justify-between">
                                                    <span>{copi.name}</span>
                                                    <Button
                                                        color="failure"
                                                        onClick={() => removeCopi(idx)}
                                                        type="button"
                                                        size="xs"
                                                    >
                                                        Delete
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} color="gray">
                    Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit(onSubmit)} className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditProjectModal;