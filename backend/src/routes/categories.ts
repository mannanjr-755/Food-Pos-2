import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
