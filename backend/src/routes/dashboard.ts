import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const totalSales = await prisma.order.aggregate({ _sum: { total: true }, where: { status: 'completed' } });
    const totalOrders = await prisma.order.count();
    const completedOrders = await prisma.order.count({ where: { status: 'completed' } });
    const avgOrderValue = completedOrders > 0 ? (totalSales._sum.total || 0) / completedOrders : 0;
    const totalProfit = (totalSales._sum.total || 0) * 0.52;

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

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { menuItem: true } }, table: true },
    });

    res.json({
      stats: {
        totalSales: totalSales._sum.total || 0,
        totalOrders,
        avgOrderValue,
        totalProfit,
      },
      topSellingItems: topItems,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
