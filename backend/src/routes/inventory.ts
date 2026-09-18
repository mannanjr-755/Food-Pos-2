import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.name = { contains: search as string };
    }
    const items = await prisma.inventoryItem.findMany({ where, orderBy: { name: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, stock, unit, minStock } = req.body;
    const item = await prisma.inventoryItem.create({
      data: { name, category, stock: parseInt(stock), unit: unit || 'kg', minStock: parseInt(minStock) || 10 },
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { stock } = req.body;
    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: { stock: parseInt(stock) },
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

export default router;
