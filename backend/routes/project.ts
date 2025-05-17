import { Router, Response, Request } from "express";
import { ProjectModel } from "../models/project";
import mongoose from "mongoose";
import { authenticateToken } from "../middleware/authenticateToken";
import { ReimbursementModel } from "../models/reimburse";
import { InstituteExpenseModel } from "../models/expense";

const router: Router = Router();

router.use(authenticateToken);

type Project = mongoose.Document & typeof ProjectModel extends mongoose.Model<infer T> ? T : never;

export const calculateNumberOfYears = (start: Date, end: Date) => {
    const startYear = start.getMonth() < 3 ? start.getFullYear() - 1 : start.getFullYear();
    const endYear = end.getMonth() < 3 ? end.getFullYear() - 1 : end.getFullYear();

    const yearsDiff = endYear - startYear + 1;
    return (yearsDiff >= 1 ? yearsDiff : 0);
};

export const getCurrentIndex = (project: Project, discardOverride: boolean = false) => project.project_type === "invoice" ? getCurrentInstallmentIndex(project, discardOverride) : calculateCurrentYear(project, discardOverride)

const calculateCurrentYear = (data: Project, discardOverride: boolean = false) => {
    if (data.override && !discardOverride) return data.override.index
    const curr = new Date();

    if (curr > new Date(data.end_date!)) {
        return -1
    }

    const start = new Date(data.start_date!);
    let currentYear = curr.getFullYear() - start.getFullYear();

    if (curr.getMonth() >= 3) currentYear++
    if (start.getMonth() >= 3) currentYear--;

    return (currentYear >= 0 ? currentYear : 0);
}

const getCurrentInstallmentIndex = (project: Project, discardOverride: boolean = false): number => {
    if (project.override && !discardOverride) return project.override.index
    const currentDate = new Date();

    for (let i = 0; i < project.installments!.length; i++) {
        const installment = project.installments![i];
        const startDate = new Date(installment.start_date);
        const endDate = new Date(installment.end_date);

        if (currentDate >= startDate && currentDate <= endDate) {
            return i;
        }
    }

    return -1;
}

const getProjectExpenses = async (project: Project, index?: number) => {
    const reimbursementExpenses = await ReimbursementModel.aggregate([
        {
            $match: {
                project: (project as any)._id,
                year_or_installment: index ?? getCurrentIndex(project)
            },
        },
        {
            $group: {
                _id: '$projectHead',
                totalAmountSum: { $sum: '$totalAmount' },
            },
        },
    ]);

    const instituteExpenses = await InstituteExpenseModel.aggregate([
        {
            $match: {
                project: (project as any)._id,
                year_or_installment: index ?? getCurrentIndex(project)
            },
        },
        {
            $group: {
                _id: '$projectHead',
                totalAmountSum: { $sum: '$amount' },
            },
        },
    ]);

    const project_head_expenses = reimbursementExpenses.reduce((acc, { _id, totalAmountSum }) => {
        acc[_id] = totalAmountSum;
        return acc;
    }, {});

    instituteExpenses.map(({ _id, totalAmountSum }) => {
        project_head_expenses[_id] = (project_head_expenses[_id] ?? 0) + totalAmountSum;
    })


    return project_head_expenses
}

router.get('/:id/total-expenses', async (req: Request, res: Response) => {
    const { id } = req.params
    const { index, projectData } = req.query

    if (!id) {
        res.status(400).send({ message: 'Project ID is required and should be a single value' });
        return;
    }

    try {

        const project = await ProjectModel.findById(id).populate('pis copis')

        if (!project) {
            res.status(400).send({ message: 'Invalid project ID' });
            return;
        }

        const project_head_expenses = await getProjectExpenses(project, index ? parseInt(index.toString()) : undefined)

        res.json(projectData ? { project_head_expenses, project } : project_head_expenses);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: `Error occurred: ${(err as Error).message}` });
    }
})


router.post('/', async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const newProject = new ProjectModel(data);

        const savedProject = await newProject.save();
        res.status(201).json(savedProject);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error creating project', error: (error as Error).message });
    }
});

router.post('/:id/carry', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id);
        const { carryData } = req.body

        console.log(carryData)

        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }

        const currentIndex = getCurrentIndex(project)
        const isYearInvalid = project.project_type === 'invoice' ? (currentIndex + 1 === project.installments.length) : (currentIndex + 1 === calculateNumberOfYears(project.start_date!, project.end_date!))

        if (isYearInvalid) {
            res.status(400).send({ message: `Project's last ${project.project_type === 'invoice' ? 'installment' : 'year'}, cannot carry forward` })
            return
        }

        project.carry_forward!.forEach((alloc, head) => {
            let oldCarryArray = project.carry_forward!.get(head)!
            oldCarryArray[getCurrentIndex(project)] = carryData[head]
            project.carry_forward!.set(head, oldCarryArray)
        })

        project.override = {
            type: project.project_type,
            index: getCurrentIndex(project) + 1
        }

        await project.save()
        res.send({ updatedProject: project })
    }
    catch (err) {
        console.error(err)
        res.status(500).send({ message: (err as Error).message })
    }
})

//Enforce Override
router.post('/:id/override', async (req: Request, res: Response) => {

    const { selectedIndex } = req.body

    try {
        const project = await ProjectModel.findById(req.params.id);

        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }

        if (selectedIndex === getCurrentIndex(project)) {
            res.status(409).send({ message: "Override redundant. Already set to that year." })
            return
        }

        const oneYearRevertRelax = (Math.abs(getCurrentIndex(project) - selectedIndex) == 1) && ( Array.from(project.carry_forward!.values()).some(carry => carry[selectedIndex] !== null))

        if (selectedIndex !== -1) {

            // Difference between current index with and without override
            if (Math.abs(getCurrentIndex(project) - selectedIndex) !== 1) {
                const isCarrySet = Array.from(project.carry_forward!.values()).some(carry => carry[selectedIndex] !== null)
                if (isCarrySet) {
                    res.status(403).json({ message: 'Carry already set. Cannot override.' })
                    return
                }
            }
        }

        const isYearInvalid = selectedIndex < 0 || project.project_type === 'invoice' ? (selectedIndex >= project.installments.length) : (selectedIndex >= calculateNumberOfYears(project.start_date!, project.end_date!))

        if (isYearInvalid) {
            res.status(400).send({ message: project.project_type ? "Invalid Installment Number" : "Invalid Year" })
            return
        }

        project.override = {
            type: project.project_type,
            index: req.body.selectedIndex
        }
        await project.save()
        res.send({ warn: oneYearRevertRelax ,message: oneYearRevertRelax ? 'Override Reset Successful!. The current year has already been carry forwarded. Donot make any new expenses.' : 'Override removed successfully.' });
    }
    catch (err) {
        console.error(err)
        res.status(500).send({ message: (err as Error).message })
    }
})

//Revert Override
router.delete('/:id/override', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const project = await ProjectModel.findById(id);

        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }

        const currentIndex = getCurrentIndex(project, true)
        const oneYearRevertRelax = (Math.abs(getCurrentIndex(project) - currentIndex) == 1) && ( Array.from(project.carry_forward!.values()).some(carry => carry[currentIndex] !== null))

        if (currentIndex !== -1) {

            // Difference between current index with and without override
            if (Math.abs(getCurrentIndex(project) - currentIndex) !== 1) {
                const isCarrySet = Array.from(project.carry_forward!.values()).some(carry => carry[currentIndex] !== null)
                if (isCarrySet) {
                    res.status(403).json({ message: 'Carry already set. Cannot override.' })
                    return
                }
            }
        }


        await ProjectModel.updateOne({ _id: id }, { $unset: { override: "" } });

        res.send({ warn: oneYearRevertRelax ,message: oneYearRevertRelax ? 'Override Reset Successful!. The current year has already been carry forwarded. Donot make any new expenses.' : 'Override removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: (err as Error).message });
    }
});



router.put('/:id', async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const parsedInstallments = data.installments && Array.isArray(data.installments) && data.installments.length
            ? typeof data.installments === 'string' ? JSON.parse(data.installments) : data.installements
            : [];

        let updatedProject = await ProjectModel.findById(req.params.id)

        if (!updatedProject) {
            res.status(404).json({ message: 'Project not found' });
        } else {

            updatedProject.installments = parsedInstallments
            Object.entries(data).map(([key,value]) => {
                //@ts-ignore
                updatedProject[key] = value 
            })
    
            await updatedProject.save()

            res.json(updatedProject);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating project', error: (error as Error).message });
    }
});


router.get('/:id', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id)
            .populate({ path: "pis", select: "name" })
            .populate({ path: "copis", select: "name" })

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error: (error as Error).message });
    }
});


router.get('/', async (req: Request, res: Response) => {
    try {
        const { past, balance } = req.query;
        const projects = await ProjectModel.find()
            .populate({ path: "pis", select: "name" })
            .populate({ path: "copis", select: "name" })


        const filteredProjects = past
            ? projects
            : projects.filter(project => getCurrentIndex(project) !== -1);

        if (balance === 'true') {
            const updatedProjects = await Promise.all(filteredProjects.map(async project => {
                const curr = getCurrentIndex(project)

                if (curr !== -1) {
                    const projectHeads = project.project_heads;

                    const project_head_expenses = await getProjectExpenses(project)

                    projectHeads.forEach((allocations, head) => {
                        const allocation = allocations[curr];
                        const headExpense = project_head_expenses[head] || 0;
                        const carryForward = (curr ? project.carry_forward!.get(head)![curr - 1] : 0) ?? 0

                        allocations[curr] = allocation + carryForward - headExpense;
                        projectHeads.set(head, [allocations[curr]])
                    });
                }

                return project;
            }));
            res.send(updatedProjects);
            return;
        }

        res.send(filteredProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Error fetching projects', error });
    }
});

//Delete Project Head
router.delete('/:id/:head', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id).lean();
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
        } else {
            const projectHead = req.params.head;
            const projectHeads = project.project_heads;
            const carryForward = project.carry_forward
            const negativeHeads = project.negative_heads

            if (!projectHeads[projectHead]) {
                res.status(404).json({ message: 'Project head not found' });
                return;
            }

            const projectHeadHasReimbursements = await ReimbursementModel.findOne({ project: project._id, projectHead })
            const projectHeadHasInstituteExpenses = await InstituteExpenseModel.findOne({ project: project._id, projectHead })

            if (projectHeadHasReimbursements || projectHeadHasInstituteExpenses) {
                res.status(409).send({ message: "Cannot delete head, it has expenses filed against. Please delete them and try again." })
                return
            }

            delete projectHeads[projectHead]
            delete carryForward![projectHead]
            

            await ProjectModel.updateOne({ _id: req.params.id }, { project_heads: projectHeads, carry_forward: carryForward, negative_heads: negativeHeads.filter((head: string) => head !== projectHead) });
            res.status(204).json({ message: 'Project head deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project head', error });
    }
});


router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const toBeDeletedProject = await ProjectModel.findById(req.params.id).lean();
        if (!toBeDeletedProject) {
            res.status(404).json({ message: 'Project not found' });
        } else {
            const projectReimbursements = await ReimbursementModel.findOne({ project: toBeDeletedProject!._id })
            const projectInstituteExpenses = await InstituteExpenseModel.findOne({ project: toBeDeletedProject!._id })
            if (projectReimbursements || projectInstituteExpenses) res.status(409).send({ message: "Cannot delete, project has expenses filed against. Please delete them and try again." })
            else {
                await ProjectModel.deleteOne(toBeDeletedProject)
                res.status(204).send()
            };
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error: (error as Error).message });
    }
});

export default router;