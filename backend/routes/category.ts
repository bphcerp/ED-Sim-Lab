import express, { Request, Response } from 'express';
import { CategoryModel } from '../models/category';
import { authenticateToken } from '../middleware/authenticateToken';
import { ExpenseModel } from '../models/expense';

const router = express.Router();

router.use(authenticateToken);

// GET /api/categories - Fetch categories
router.get('/', async (req: Request, res: Response) => {
    try {
        const categories = await CategoryModel.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories: ' + (error as Error).message });
    }
});

// POST /api/categories - Create a new category
router.post('/', async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        res.status(400).json({ message: 'Name are required' });
        return;
    }

    try {
        const existingCategory = await CategoryModel.findOne({ name });

        if (existingCategory) {
            res.status(400).json({ message: 'Category already exists' });
            return;
        }

        const newCategory = new CategoryModel({ name });
        await newCategory.save();

        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error : (error as Error).message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const categoryId = req.params.id;
        const associatedExpenses = await ExpenseModel.find({ category: categoryId });

        if (associatedExpenses.length > 0) {
            res.status(400).json({ message: 'Category is associated with existing expenses and cannot be deleted' });
            return
        }

        const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            res.status(404).json({ message: 'Category not found' });
            return
        }

        res.status(200).json({ message: 'Category deleted successfully', deletedCategory });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category: ' + (error as Error).message });
    }
});


export default router;
