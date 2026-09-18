import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status as string;
    }
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { menuItem: true } }, table: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { tableId, items } = req.body;
    const orderCount = await prisma.order.count();
    const orderNumber = `#${1024 + orderCount}`;

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (menuItem) {
        const itemTotal = menuItem.price * item.quantity;
        subtotal += itemTotal;
        orderItems.push({ menuItemId: item.menuItemId, quantity: item.quantity, price: menuItem.price });
      }
    }
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId: tableId || null,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        items: { create: orderItems },
      },
      include: { items: { include: { menuItem: true } }, table: true },
    });

    if (tableId) {
      await prisma.table.update({ where: { id: tableId }, data: { status: 'occupied', orderId: order.id } });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: { include: { menuItem: true } }, table: true },
    });

    if (status === 'completed' && order.tableId) {
      await prisma.table.update({ where: { id: order.tableId }, data: { status: 'available', orderId: null } });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
