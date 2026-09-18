import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const image = (name: string) => `/images/${name}.svg`;

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.inventoryItem.deleteMany();

  const burgers = await prisma.category.create({ data: { name: 'Burgers' } });
  const pizza = await prisma.category.create({ data: { name: 'Pizza' } });
  const drinks = await prisma.category.create({ data: { name: 'Drinks' } });
  const desserts = await prisma.category.create({ data: { name: 'Desserts' } });
  const sides = await prisma.category.create({ data: { name: 'Sides' } });

  const cheeseburger = await prisma.menuItem.create({
    data: { name: 'Cheeseburger', description: 'Classic beef patty with cheddar cheese', price: 8.99, categoryId: burgers.id, image: image('cheeseburger') }
  });
  const chickenBurger = await prisma.menuItem.create({
    data: { name: 'Chicken Burger', description: 'Grilled chicken breast with lettuce', price: 9.49, categoryId: burgers.id, image: image('chickenburger') }
  });
  const baconBurger = await prisma.menuItem.create({
    data: { name: 'Bacon Burger', description: 'Smoky bacon double patty', price: 11.49, categoryId: burgers.id, image: image('chickenburger') }
  });
  const margherita = await prisma.menuItem.create({
    data: { name: 'Margherita Pizza', description: 'Tomato, mozzarella & basil', price: 12.99, categoryId: pizza.id, image: image('margherita') }
  });
  const pepperoni = await prisma.menuItem.create({
    data: { name: 'Pepperoni Pizza', description: 'Classic pepperoni with extra cheese', price: 14.99, categoryId: pizza.id, image: image('pepperoni') }
  });
  const hawaiian = await prisma.menuItem.create({
    data: { name: 'Hawaiian Pizza', description: 'Ham and pineapple classic', price: 13.99, categoryId: pizza.id, image: image('margherita') }
  });
  const fries = await prisma.menuItem.create({
    data: { name: 'French Fries', description: 'Crispy golden fries with sea salt', price: 4.99, categoryId: sides.id, image: image('fries') }
  });
  const onionRings = await prisma.menuItem.create({
    data: { name: 'Onion Rings', description: 'Crispy battered onion rings', price: 5.49, categoryId: sides.id, image: image('fries') }
  });
  const coke = await prisma.menuItem.create({
    data: { name: 'Coke', description: 'Refreshing cola served cold', price: 2.99, categoryId: drinks.id, image: image('coke') }
  });
  const orangeJuice = await prisma.menuItem.create({
    data: { name: 'Orange Juice', description: 'Freshly squeezed orange juice', price: 3.99, categoryId: drinks.id, image: image('coke') }
  });
  const icedCoffee = await prisma.menuItem.create({
    data: { name: 'Iced Coffee', description: 'Cold brew with milk and ice', price: 4.49, categoryId: drinks.id, image: image('icedcoffee') }
  });
  const chocolateCake = await prisma.menuItem.create({
    data: { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 6.99, categoryId: desserts.id, image: image('chocolatecake') }
  });
  const cheesecake = await prisma.menuItem.create({
    data: { name: 'New York Cheesecake', description: 'Creamy classic cheesecake', price: 7.49, categoryId: desserts.id, image: image('chocolatecake') }
  });

  const tables: { id: string; number: number }[] = [];
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.table.create({
      data: { number: i, seats: i <= 4 ? 4 : i <= 7 ? 6 : 8, status: 'available' }
    });
    tables.push({ id: table.id, number: i });
  }

  const tableById = async (number: number) => tables.find((t) => t.number === number)!.id;

  const TAX = 0.08;
  let number = 1024;

  async function createOrder(status: string, daysAgo: number, items: { menuItemId: string; quantity: number }[], tableNumber?: number) {
    let subtotal = 0;
    const lines = [];
    for (const it of items) {
      const menuItem =
        it.menuItemId === cheeseburger.id ? cheeseburger :
        it.menuItemId === chickenBurger.id ? chickenBurger :
        it.menuItemId === baconBurger.id ? baconBurger :
        it.menuItemId === margherita.id ? margherita :
        it.menuItemId === pepperoni.id ? pepperoni :
        it.menuItemId === hawaiian.id ? hawaiian :
        it.menuItemId === fries.id ? fries :
        it.menuItemId === onionRings.id ? onionRings :
        it.menuItemId === coke.id ? coke :
        it.menuItemId === orangeJuice.id ? orangeJuice :
        it.menuItemId === icedCoffee.id ? icedCoffee :
        it.menuItemId === chocolateCake.id ? chocolateCake : cheesecake;
      const lineTotal = menuItem.price * it.quantity;
      subtotal += lineTotal;
      lines.push({ menuItemId: menuItem.id, quantity: it.quantity, price: menuItem.price });
    }
    const tax = subtotal * TAX;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    createdAt.setHours(11 + (number % 9), (number * 13) % 60, 0, 0);
    const order = await prisma.order.create({
      data: {
        orderNumber: `#${number++}`,
        tableId: tableNumber ? await tableById(tableNumber) : null,
        status,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round((subtotal + tax) * 100) / 100,
        createdAt,
        items: { create: lines },
      },
    });
    return order;
  }

  const o1024 = await createOrder('preparing', 0, [
    { menuItemId: cheeseburger.id, quantity: 2 },
    { menuItemId: fries.id, quantity: 1 },
    { menuItemId: coke.id, quantity: 1 },
  ], 2);

  await createOrder('pending', 0, [
    { menuItemId: margherita.id, quantity: 1 },
    { menuItemId: icedCoffee.id, quantity: 2 },
  ]);

  const o1026 = await createOrder('ready', 0, [
    { menuItemId: pepperoni.id, quantity: 1 },
    { menuItemId: chickenBurger.id, quantity: 1 },
    { menuItemId: chocolateCake.id, quantity: 1 },
  ], 4);

  await createOrder('pending', 0, [
    { menuItemId: hawaiian.id, quantity: 1 },
    { menuItemId: onionRings.id, quantity: 1 },
    { menuItemId: orangeJuice.id, quantity: 1 },
  ], 1);

  await createOrder('completed', 0, [
    { menuItemId: baconBurger.id, quantity: 1 },
    { menuItemId: fries.id, quantity: 2 },
    { menuItemId: coke.id, quantity: 2 },
  ], 3);

  await createOrder('completed', 0, [
    { menuItemId: cheeseburger.id, quantity: 1 },
    { menuItemId: margherita.id, quantity: 1 },
    { menuItemId: cheesecake.id, quantity: 1 },
  ], 5);

  await createOrder('completed', 1, [
    { menuItemId: pepperoni.id, quantity: 2 },
    { menuItemId: icedCoffee.id, quantity: 2 },
    { menuItemId: fries.id, quantity: 1 },
  ], 7);

  await createOrder('completed', 1, [
    { menuItemId: chickenBurger.id, quantity: 2 },
    { menuItemId: coke.id, quantity: 3 },
  ], 6);

  await createOrder('completed', 2, [
    { menuItemId: margherita.id, quantity: 2 },
    { menuItemId: cheesecake.id, quantity: 2 },
    { menuItemId: orangeJuice.id, quantity: 2 },
  ], 8);

  await createOrder('completed', 2, [
    { menuItemId: hawaiian.id, quantity: 1 },
    { menuItemId: onionRings.id, quantity: 2 },
    { menuItemId: coke.id, quantity: 2 },
  ]);

  await createOrder('completed', 3, [
    { menuItemId: cheeseburger.id, quantity: 3 },
    { menuItemId: fries.id, quantity: 3 },
    { menuItemId: chocolateCake.id, quantity: 2 },
  ], 9);

  await createOrder('completed', 3, [
    { menuItemId: baconBurger.id, quantity: 2 },
    { menuItemId: icedCoffee.id, quantity: 3 },
  ], 10);

  await createOrder('completed', 4, [
    { menuItemId: pepperoni.id, quantity: 1 },
    { menuItemId: cheeseburger.id, quantity: 1 },
    { menuItemId: orangeJuice.id, quantity: 2 },
  ]);

  await createOrder('completed', 4, [
    { menuItemId: margherita.id, quantity: 2 },
    { menuItemId: fries.id, quantity: 1 },
    { menuItemId: coke.id, quantity: 2 },
  ]);

  await createOrder('completed', 5, [
    { menuItemId: chickenBurger.id, quantity: 2 },
    { menuItemId: pepperoni.id, quantity: 1 },
    { menuItemId: chocolateCake.id, quantity: 1 },
  ]);

  await createOrder('completed', 6, [
    { menuItemId: cheeseburger.id, quantity: 2 },
    { menuItemId: margherita.id, quantity: 1 },
    { menuItemId: coke.id, quantity: 3 },
  ]);

  await prisma.table.update({ where: { id: await tableById(2) }, data: { status: 'occupied', orderId: o1024.id } });
  await prisma.table.update({ where: { id: await tableById(4) }, data: { status: 'occupied', orderId: o1026.id } });
  await prisma.table.update({ where: { id: await tableById(6) }, data: { status: 'reserved', orderId: null } });

  await prisma.inventoryItem.createMany({
    data: [
      { name: 'Chicken Breast', category: 'Meat', stock: 45, unit: 'kg', minStock: 10 },
      { name: 'Beef Patty', category: 'Meat', stock: 18, unit: 'kg', minStock: 10 },
      { name: 'Tomatoes', category: 'Vegetables', stock: 30, unit: 'kg', minStock: 8 },
      { name: 'Lettuce', category: 'Vegetables', stock: 5, unit: 'kg', minStock: 8 },
      { name: 'Onions', category: 'Vegetables', stock: 15, unit: 'kg', minStock: 5 },
      { name: 'Cheese', category: 'Dairy', stock: 25, unit: 'kg', minStock: 10 },
      { name: 'Buns', category: 'Bakery', stock: 50, unit: 'pcs', minStock: 20 },
      { name: 'Coke', category: 'Beverages', stock: 120, unit: 'bottles', minStock: 30 },
      { name: 'Pizza Dough', category: 'Bakery', stock: 12, unit: 'pcs', minStock: 15 },
      { name: 'Coffee Beans', category: 'Beverages', stock: 8, unit: 'kg', minStock: 5 },
    ]
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });