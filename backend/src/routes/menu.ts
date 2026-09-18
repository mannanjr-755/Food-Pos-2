import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const where: any = {};
    if (category && category !== 'All') {
      where.category = { name: category as string };
    }
    if (search) {
      where.name = { contains: search as string };
    }
    const items = await prisma.menuItem.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id }, include: { category: true } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price, categoryId, image, available } = req.body;
    const item = await prisma.menuItem.create({ data: { name, description, price: parseFloat(price), categoryId, image, available } });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, price, categoryId, image, available } = req.body;
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { name, description, price: parseFloat(price), categoryId, image, available },
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
