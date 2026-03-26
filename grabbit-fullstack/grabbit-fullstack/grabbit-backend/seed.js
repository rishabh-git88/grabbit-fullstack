const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Cafe = require('./models/Cafe');
const MenuItem = require('./models/MenuItem');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/grabbit');
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany();
  await Cafe.deleteMany();
  await MenuItem.deleteMany();
  console.log('Cleared existing data');

  // Create vendors
  const vendor1 = await User.create({ name: 'Mayuri Vendor', email: 'mayuri@grabbit.com', password: 'password123', role: 'vendor' });
  const vendor2 = await User.create({ name: 'Bistro Vendor', email: 'bistro@grabbit.com', password: 'password123', role: 'vendor' });
  const vendor3 = await User.create({ name: 'AB Dakshin Vendor', email: 'abdakshin@grabbit.com', password: 'password123', role: 'vendor' });

  // Create cafes
  const cafe1 = await Cafe.create({ name: 'Mayuri', description: 'South Indian delicacies and more', location: 'Block A, Ground Floor', isOpen: true, vendorId: vendor1._id });
  const cafe2 = await Cafe.create({ name: 'Bistro', description: 'Fast food and continental cuisine', location: 'Student Center', isOpen: true, vendorId: vendor2._id });
  const cafe3 = await Cafe.create({ name: 'AB Dakshin', description: 'Authentic Andhra meals', location: 'Academic Block B', isOpen: false, vendorId: vendor3._id });

  // Link vendors to cafes
  vendor1.cafeId = cafe1._id; await vendor1.save();
  vendor2.cafeId = cafe2._id; await vendor2.save();
  vendor3.cafeId = cafe3._id; await vendor3.save();

  // Menu items for Mayuri
  await MenuItem.insertMany([
    { cafeId: cafe1._id, name: 'Masala Dosa', price: 45, category: 'Breakfast', isAvailable: true, preparationTime: 10 },
    { cafeId: cafe1._id, name: 'Idli Sambar (4 pcs)', price: 35, category: 'Breakfast', isAvailable: true, preparationTime: 5 },
    { cafeId: cafe1._id, name: 'Vada (2 pcs)', price: 25, category: 'Snacks', isAvailable: true, preparationTime: 8 },
    { cafeId: cafe1._id, name: 'Meals (Full)', price: 80, category: 'Lunch', isAvailable: true, preparationTime: 5 },
    { cafeId: cafe1._id, name: 'Filter Coffee', price: 20, category: 'Beverages', isAvailable: true, preparationTime: 3 },
    { cafeId: cafe1._id, name: 'Upma', price: 30, category: 'Breakfast', isAvailable: false, preparationTime: 7 },
  ]);

  // Menu items for Bistro
  await MenuItem.insertMany([
    { cafeId: cafe2._id, name: 'Veg Burger', price: 60, category: 'Snacks', isAvailable: true, preparationTime: 8 },
    { cafeId: cafe2._id, name: 'Chicken Burger', price: 80, category: 'Snacks', isAvailable: true, preparationTime: 10 },
    { cafeId: cafe2._id, name: 'French Fries', price: 50, category: 'Snacks', isAvailable: true, preparationTime: 7 },
    { cafeId: cafe2._id, name: 'Cold Coffee', price: 55, category: 'Beverages', isAvailable: true, preparationTime: 5 },
    { cafeId: cafe2._id, name: 'Pasta Arrabiata', price: 90, category: 'Lunch', isAvailable: true, preparationTime: 15 },
    { cafeId: cafe2._id, name: 'Brownie', price: 40, category: 'Desserts', isAvailable: true, preparationTime: 2 },
  ]);

  // Menu items for AB Dakshin
  await MenuItem.insertMany([
    { cafeId: cafe3._id, name: 'Andhra Meals', price: 100, category: 'Lunch', isAvailable: true, preparationTime: 5 },
    { cafeId: cafe3._id, name: 'Pesarattu', price: 40, category: 'Breakfast', isAvailable: true, preparationTime: 10 },
    { cafeId: cafe3._id, name: 'Pulihora', price: 50, category: 'Lunch', isAvailable: true, preparationTime: 5 },
    { cafeId: cafe3._id, name: 'Chepala Pulusu', price: 120, category: 'Dinner', isAvailable: true, preparationTime: 20 },
    { cafeId: cafe3._id, name: 'Buttermilk', price: 15, category: 'Beverages', isAvailable: true, preparationTime: 2 },
  ]);

  // Create a student
  await User.create({ name: 'Rahul Student', email: 'rahul@grabbit.com', password: 'password123', role: 'student' });

  console.log('\n✅ Seed complete!');
  console.log('-----------------------------------');
  console.log('Demo Accounts:');
  console.log('  Vendor 1: mayuri@grabbit.com / password123');
  console.log('  Vendor 2: bistro@grabbit.com / password123');
  console.log('  Vendor 3: abdakshin@grabbit.com / password123');
  console.log('  Student:  rahul@grabbit.com / password123');
  console.log('-----------------------------------');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
