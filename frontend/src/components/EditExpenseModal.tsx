import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import AddCategoryModal from './AddCategoryModal';
import { Category, EditExpenseData, Expense, Member } from '../types';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSubmit: (expenseData: EditExpenseData) => Promise<void>;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ 
  isOpen, 
  onClose, 
  expense,
  onSubmit 
}) => {
  const [expenseReason, setExpenseReason] = useState('');
  const [category, setCategory] = useState('');
  const [members, setMembers] = useState<Array<Member>>([]);
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [amount, setAmount] = useState<number | string>('');
  const [paidBy, setPaidBy] = useState<string | undefined>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && expense) {
      setExpenseReason(expense.expenseReason);
      setCategory(expense.category._id);
      setAmount(expense.amount);
      setPaidBy(expense.paidBy?._id);
      fetchCategories();
      fetchMembers()
    }
  }, [isOpen, expense]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
        credentials: "include"
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toastError("Error fetching categories");
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

  const handleAddCategory = async (name: string): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message);
      }

      toastSuccess('Category added');
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toastError((error as Error).message);
    }
  };

  const handleSubmit = async () => {
    if (!expenseReason || !category || !amount ) return;

    setLoading(true);
    try {
      await onSubmit({
        expenseReason,
        category,
        amount: Number(amount),
        paidBy
      });
      onClose();
    } catch (error) {
      toastError('Error updating expense');
      console.error('Error updating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Edit Expense</Modal.Header>
      <Modal.Body>
        <AddCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={handleAddCategory}
        />
        <AddCategoryModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          onAddCategory={handleAddCategory}
        />
        <div className="space-y-4">
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
          <div className='flex flex-col'>
            <Label htmlFor="category" value="Category" />
            <div className='flex w-full justify-center items-center space-x-4'>
              <div className='grow'>
                <Select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="mt-1"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Button 
                  color="blue" 
                  className='rounded-md' 
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  Add Category
                </Button>
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
          <div>
            <Label htmlFor="paidBy" value="Paid By" />
            <div className="flex">
              <Select
                id="paidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                required
                className="mt-1 grow"
              >
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          color="blue" 
          onClick={handleSubmit} 
          disabled={loading || !expenseReason || !category || !amount}
          isProcessing={loading}
        >
          {loading ? 'Updating...' : 'Update Expense'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditExpenseModal;