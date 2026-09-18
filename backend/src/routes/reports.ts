import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const totalSales = await prisma.order.aggregate({ _sum: { total: true }, where: { status: 'completed' } });
    const totalOrders = await prisma.order.count({ where: { status: 'completed' } });
    const avgOrderValue = totalOrders > 0 ? (totalSales._sum.total || 0) / totalOrders : 0;

    const topSellingItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topItems = await Promise.all(
      topSellingItems.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId }, include: { category: true } });
        return { ...menuItem, sold: item._sum.quantity };
      })
    );

    const orders = await prisma.order.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'asc' },
    });

    const dailySales: Record<string, number> = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + order.total;
    });

    const salesData = Object.entries(dailySales).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    res.json({
      stats: {
        totalSales: totalSales._sum.total || 0,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      topSellingItems: topItems,
      salesData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
