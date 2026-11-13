import mongoose from 'mongoose'
import connectDB from '../connection.js'
import User from '../../modules/users/users.model.js'
import Category from '../../modules/categories/categories.model.js'
import Product from '../../modules/products/products.model.js'
import RestaurantTable from '../../modules/tables/tables.model.js'
import Order from '../../modules/orders/orders.model.js'
import { getSettings } from '../../modules/settings/settings.model.js'
import { createQrOrder } from '../../modules/orders/orders.service.js'

const CATEGORIES = [
  { name: 'Karahi', sortOrder: 1, description: 'Bone-in pieces wok-finished in their own masala.' },
  { name: 'Biryani & Rice', sortOrder: 2, description: 'Dum-cooked biryani, pulao and steamed rice.' },
  { name: 'Fast Food', sortOrder: 3, description: 'Burgers, shawarma, fries and pizza.' },
  { name: 'BBQ & Grilled', sortOrder: 4, description: 'Tikka, boti and seekh kabab off the coal.' },
  { name: 'Drinks & Extras', sortOrder: 5, description: 'Cold drinks, fresh lime, raita and salad.' },
  { name: 'Naan & Roti', sortOrder: 6, description: 'Fresh tandoori bread, baked to order.' },
]

/** name, price, category, description, popular, image file under backend/public/products */
const PRODUCTS = [
  ['Chicken Karahi', 1450, 'Karahi', 'Bone-in chicken simmered in tomato, ginger and green chilli.', true, 'chicken-karahi'],
  ['White Karahi', 1550, 'Karahi', 'Chicken in a cream and black-pepper masala, without tomato.', false, 'white-karahi'],
  ['Achari Karahi', 1650, 'Karahi', 'Chicken cooked with pickling spices for a tangy finish.', false, 'achari-karahi'],
  ['Mutton Karahi', 2400, 'Karahi', 'Bone-in mutton slow-cooked until the masala sets.', true, 'mutton-karahi'],
  ['Beef Karahi', 1800, 'Karahi', 'Beef simmered in a dark, reduced tomato masala.', false, 'beef-karahi'],
  ['Special Koyla Karahi', 2600, 'Karahi', 'House karahi finished over charcoal, with bone marrow.', true, 'koyla-special-karahi'],

  ['Chicken Biryani', 350, 'Biryani & Rice', 'Long-grain rice layered with chicken and whole spices.', true, 'chicken-biryani'],
  ['Beef Biryani', 400, 'Biryani & Rice', 'Dum-cooked rice with spiced beef pieces.', false, 'beef-biryani'],
  ['Special Biryani', 500, 'Biryani & Rice', 'Extra masala, extra meat and a fuller spice blend.', true, 'special-biryani'],
  ['Chicken Pulao', 380, 'Biryani & Rice', 'Rice cooked in chicken stock with whole spices.', false, 'chicken-pulao'],
  ['Steamed Rice', 220, 'Biryani & Rice', 'Plain boiled basmati with cardamom, clove and bay leaf.', false, 'steamed-rice'],

  ['Zinger Burger', 450, 'Fast Food', 'Crispy fried chicken fillet, lettuce and mayonnaise.', true, 'zinger'],
  ['Chicken Burger', 380, 'Fast Food', 'Grilled chicken patty with cheese and sauce.', false, 'chicken-burger'],
  ['Chicken Shawarma', 250, 'Fast Food', 'Shaved chicken, garlic sauce and lettuce in a wrapped roll.', true, 'shawarma'],
  ['Club Sandwich', 420, 'Fast Food', 'Triple-decker chicken sandwich with fries.', false, 'club-sandwich'],
  ['Crispy Chicken (6 pcs)', 700, 'Fast Food', 'Six pieces of deep-fried, spice-coated chicken.', false, 'crispy-chicken'],
  ['French Fries', 250, 'Fast Food', 'Salted, hand-cut and fried to order.', false, 'fries'],
  ['Chicken Pizza', 900, 'Fast Food', 'Thin-base pizza with chicken and mixed peppers.', false, 'pizza'],

  ['Chicken Tikka', 320, 'BBQ & Grilled', 'Marinated chicken thigh char-grilled on a skewer.', true, 'chicken-tikka'],
  ['Seekh Kabab (4 pcs)', 480, 'BBQ & Grilled', 'Minced beef and herbs skewered and grilled over coal.', false, 'seekh-kabab'],
  ['Malai Boti (12 pcs)', 900, 'BBQ & Grilled', 'Cream-marinated chicken bites, mild and smoky.', true, 'malai-boti'],
  ['Chicken Boti (12 pcs)', 850, 'BBQ & Grilled', 'Chicken cubes marinated in chilli and yoghurt.', false, 'chicken-boti'],

  ['Cold Drink (Regular)', 90, 'Drinks & Extras', 'Chilled carbonated drink, bottle straight from the cooler.', false, 'cold-drink'],
  ['Lemon Mint Drink', 180, 'Drinks & Extras', 'Fresh lemon with mint, served over ice.', true, 'lemon-drink'],
  ['Fresh Lime', 140, 'Drinks & Extras', 'Squeezed lime with salt and black salt.', false, 'fresh-lime'],
  ['Mineral Water (Small)', 60, 'Drinks & Extras', 'Sealed bottle of still mineral water.', false, 'mineral-water'],
  ['Raita', 120, 'Drinks & Extras', 'Whipped yoghurt with cucumber, mint and roasted cumin.', false, 'raita'],
  ['Fresh Salad', 150, 'Drinks & Extras', 'Seasonal salad with lemon and black salt.', false, 'salad'],

  ['Naan', 60, 'Naan & Roti', 'Leavened flatbread from the tandoor, with butter.', true, 'naan'],
  ['Roti', 40, 'Naan & Roti', 'Wholewheat flatbread, baked to order.', false, 'roti'],
]

const TABLES = [
  { number: 1, label: 'Table 1', seats: 4 },
  { number: 2, label: 'Table 2', seats: 4 },
  { number: 3, label: 'Table 3', seats: 6 },
]

const seed = async ({ force = false, standalone = false } = {}) => {
  await connectDB()
  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      RestaurantTable.deleteMany({}),
      Order.deleteMany({}),
    ])
  }

  let created = false
  if ((await User.countDocuments()) === 0) {
    await User.create([
      { name: 'Owner', email: 'admin@chaskakoyla.local', password: 'password123', role: 'admin' },
      { name: 'Floor Manager', email: 'manager@chaskakoyla.local', password: 'password123', role: 'manager' },
      { name: 'Cashier', email: 'cashier@chaskakoyla.local', password: 'password123', role: 'cashier' },
    ])
    created = true
    console.log('Seeded staff users (admin/manager/cashier @chaskakoyla.local, password123)')
  }

  let cats = await Category.find()
  if (cats.length === 0) {
    cats = await Category.create(CATEGORIES)
    created = true
  }
  const catId = Object.fromEntries(cats.map((c) => [c.name, c._id]))

  if ((await Product.countDocuments()) === 0) {
    await Product.create(PRODUCTS.map(([name, price, cat, description, popular, image], index) => ({
      name, price, sku: `CK-${String(index + 1).padStart(3, '0')}`,
      category: catId[cat], description, popular, sortOrder: index,
      image: `/static/products/${image}.jpg`, available: true, trackStock: false, stock: 0, lowStockThreshold: 0,
    })))
    created = true
    console.log(`Seeded ${PRODUCTS.length} menu items`)
  }

  if ((await RestaurantTable.countDocuments()) === 0) {
    await RestaurantTable.create(TABLES)
    created = true
    console.log(`Seeded ${TABLES.length} floor tables`)
  }

  await getSettings()

  if (process.env.SEED_DEMO_ORDERS === 'true' && (await Order.countDocuments({ channel: 'qr' })) === 0) {
    const products = await Product.find({}, { name: 1 })
    const byName = Object.fromEntries(products.map((p) => [p.name, p]))
    const pick = (name, qty) => ({ productId: byName[name]._id, quantity: qty })
    await createQrOrder({
      tableNumber: 1, sourceRef: 'demo-qr-1',
      customer: { name: 'Ali Khan', phone: '+92 300 1234567' },
      items: [pick('Chicken Karahi', 1), pick('Naan', 3)],
    })
    const second = await createQrOrder({
      tableNumber: 2, sourceRef: 'demo-qr-2',
      customer: { name: 'Sara Ahmed', phone: '+92 321 7654321' },
      items: [pick('Chicken Biryani', 2), pick('Lemon Mint Drink', 2)],
    })
    await createQrOrder({
      tableNumber: 3, sourceRef: 'demo-qr-3',
      customer: { name: 'Hamza R.', phone: '+92 333 2222222' },
      items: [pick('Malai Boti (12 pcs)', 1), pick('Seekh Kabab (4 pcs)', 1)],
    })
    const { acceptOrder } = await import('../../modules/orders/orders.service.js')
    await acceptOrder(second._id, { role: 'admin' })
    created = true
    console.log('Seeded demo QR orders (pending / accepted)')
  }

  console.log(created ? 'Seed complete' : 'Database already seeded — nothing to do')
  if (standalone) await mongoose.disconnect()
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  seed({ force: process.argv.includes('--force'), standalone: true }).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

export default seed
