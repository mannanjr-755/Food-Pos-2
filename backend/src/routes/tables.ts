import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { number, seats } = req.body;
    const table = await prisma.table.create({ data: { number: parseInt(number), seats: parseInt(seats) || 4 } });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, orderId } = req.body;
    const table = await prisma.table.update({ where: { id: req.params.id }, data: { status, orderId } });
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table' });
  }
});

export default router;
