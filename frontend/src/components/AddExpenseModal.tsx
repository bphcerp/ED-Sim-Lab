import { Button, Modal, Label, TextInput, Select, FileInput, Textarea, ToggleSwitch, Radio } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess, toastWarn } from '../toasts';
import AddCategoryModal from './AddCategoryModal';
import { Category, Expense, InstituteExpense, Member, Project } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: Function;
  edit?: 'Normal' | 'Institute';
  editData?: Expense | InstituteExpense
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSubmit, edit, editData }) => {
  const [expenseReason, setExpenseReason] = useState(editData?.expenseReason ?? '');
  const [category, setCategory] = useState(editData?.category._id ?? '');
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [amount, setAmount] = useState<number | string>(editData?.amount ?? '');
  const [paidBy, setPaidBy] = useState((editData as Expense)?.paidBy?._id ?? '');
  const [members, setMembers] = useState<Array<Member>>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [description, setDescription] = useState<string>((editData as Expense)?.description ?? '');
  const [expenseType, setExpenseType] = useState<'Normal' | 'Institute'>(edit ?? 'Normal');
  const [paymentType, setPaymentType] = useState<'Direct' | 'Indirect'>((editData as Expense)?.directExpense ? 'Direct' : 'Indirect');
  const [directPaymentAcc, setDirectPaymentAcc] = useState<'Current' | 'Savings'>();
  const [selectedProject, setSelectedProject] = useState((editData as InstituteExpense)?.project._id ?? '');
  const [selectedProjectHead, setSelectedProjectHead] = useState((editData as InstituteExpense)?.projectHead ?? '');
  const [overheadPercentage, setOverheadPercentage] = useState<number | string>((editData as InstituteExpense)?.overheadPercentage ?? '');
  const [referenceDocument, setReferenceDocument] = useState<File | null>(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toastError('Error fetching categories');
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/member?type=student`, {
        credentials: 'include',
      });
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      toastError('Error fetching members');
      console.error('Error fetching members:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/project?balance=true`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      toastError('Error fetching projects');
      console.error('Error fetching projects:', error);
    }
  };

  const handleAddCategory = async (name: string): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message);
      }
      fetchCategories();
      toastSuccess('Category added');
    } catch (error) {
      console.error('Error adding category:', error);
      toastError((error as Error).message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchMembers();
      if (expenseType === 'Institute') {
        fetchProjects();
      }
    }
  }, [isOpen, expenseType]);

  const handleSubmit = () => {
    if (expenseReason && category && amount && ((expenseType === 'Normal' && paymentType == 'Indirect') ? paidBy : true && (expenseType === 'Institute' && !!selectedProject && !!selectedProjectHead))) {
      const expenseData: any = { expenseReason, category, amount: Number(amount), ...((expenseType === 'Normal' && paymentType == 'Indirect') ? { paidBy } : {}), description, referenceDocument, type: expenseType };
      if (expenseType === 'Institute') {
        expenseData.projectId = selectedProject;
        expenseData.projectHead = selectedProjectHead;
        expenseData.overheadPercentage = Number(overheadPercentage);
      }
      if (paymentType === 'Direct') {
        expenseData.paidDirectWith = directPaymentAcc
      }
      onSubmit(expenseData);
      onClose();
    }
    else toastWarn("Please enter all details!")
  };

  return (
    <Modal size="4xl" show={isOpen} onClose={onClose}>
      <Modal.Header>{ !edit ? "Add New": "Edit" } Expense</Modal.Header>
      <Modal.Body>
        <AddCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={handleAddCategory}
        />
        <div className='flex justify-end items-center space-x-2'>
          <Label className='text-lg'>{expenseType}</Label>
          <ToggleSwitch disabled={!!edit} color='blue' checked={expenseType === 'Institute'} onChange={checked => setExpenseType(checked ? 'Institute' : 'Normal')} />
        </div>
        <div className="relative space-y-4">
          <div>
            <Label htmlFor="expenseReason" value="Expense Reason" />
            <TextInput
              id="expenseReason"
              value={expenseReason}
              onChange={(e) => setExpenseReason(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className="flex flex-col">
              <Label htmlFor="category" value="Category" />
              <div className="flex w-full justify-center items-center space-x-4">
                <div className="grow">
                  <Select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="mt-1"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Button color="blue" className="rounded-md" onClick={() => setIsCategoryModalOpen(true)}>Add
                    Category</Button>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="amount" value="Amount" />
              <TextInput
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>
          {expenseType === 'Institute' ? (
            <div className='space-y-4'>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project" value="Project" />
                  <Select
                    id="project"
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      setSelectedProjectHead("");
                    }}
                    required
                  >
                    <option value="">Select a Project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.funding_agency}-{project.project_title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  {selectedProject && <><Label htmlFor="projectHead" value="Project Head" />
                    <Select
                      id="projectHead"
                      value={selectedProjectHead}
                      onChange={(e) => setSelectedProjectHead(e.target.value)}
                      required
                    >
                      <option value="">Select a Project Head</option>
                      {Object.entries(
                        projects.find((p) => p._id === selectedProject)?.project_heads || {}
                      ).map(([head, amounts]) => (
                        <option key={head} value={head}>
                          {head} - {amounts[0].toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                          })}
                        </option>
                      ))}
                    </Select></>}
                </div>
              </div>
              {selectedProjectHead && selectedProjectHead.toLowerCase().includes('overhead') && <div>
                <Label htmlFor="overheadPercentage" value="Overhead Percentage" />
                <TextInput
                  id="overheadPercentage"
                  type="number"
                  min={1}
                  max={100}
                  value={overheadPercentage}
                  onChange={(e) => setOverheadPercentage(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>}
            </div>
          ) : <div>
            <div className='flex justify-between items-center mb-1'>
              <Label htmlFor="paidBy" value="Paid By" />
              <div className='flex justify-end items-center space-x-2'>
                <Label>{paymentType}</Label>
                <ToggleSwitch disabled={!!edit} color='blue' checked={paymentType === 'Direct'} onChange={checked => setPaymentType(!checked ? 'Indirect' : 'Direct')} />
              </div>
            </div>
            {paymentType === 'Indirect' ? <div className="flex">
              <Select
                id="paidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                required
                className="mt-1 grow"
              >
                <option value="" disabled>Select Member</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>{member.name}</option>
                ))}
              </Select>
            </div> :
              <div className="flex space-x-2">
                <div className="flex items-center">
                  <Radio
                    id="Current"
                    checked={directPaymentAcc === 'Current'}
                    onChange={(e) => setDirectPaymentAcc(e.target.checked ? 'Current' : 'Savings')}
                    value="Current"
                  />
                  <Label htmlFor="Current" className="ml-2">
                    Current
                  </Label>
                </div>
                <div className="flex items-center">
                  <Radio
                    id="Savings"
                    checked={directPaymentAcc === 'Savings'}
                    onChange={(e) => setDirectPaymentAcc(e.target.checked ? 'Savings' : 'Current')}
                    value="Savings"
                  />
                  <Label htmlFor="Savings" className="ml-2">
                    Savings
                  </Label>
                </div>
              </div>}
          </div>}

          {!edit && <div>
            <Label htmlFor="referenceDocument" value="Reference Document (PDF only)" />
            <FileInput
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

                setReferenceDocument(file);
              }}
              accept="application/pdf"
            />
          </div>}

          <div>
            <Label htmlFor="description" value="Description" />
            <Textarea
              id="description"
              placeholder="Enter expense description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose}>Cancel</Button>
        <Button color="blue" onClick={handleSubmit}>{edit ? "Edit" : "Add"} Expense</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddExpenseModal;