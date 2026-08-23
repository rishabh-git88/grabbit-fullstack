const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');

const toRecommendation = (item, orderCount = 0, rating = null) => ({
  _id: item._id,
  name: item.name,
  description: item.description,
  price: item.price,
  category: item.category,
  preparationTime: item.preparationTime,
  orderCount,
  ...(rating ? rating : {}),
});

const getCafeRecommendations = async (cafeId) => {
  const objectId = new mongoose.Types.ObjectId(cafeId);
  const [availableItems, popularCounts, reviewStats] = await Promise.all([
    MenuItem.find({ cafeId: objectId, isAvailable: true }).lean(),
    Order.aggregate([
      { $match: { cafeId: objectId, paymentStatus: { $in: ['partial', 'full'] }, status: { $ne: 'rejected' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemId', orderCount: { $sum: '$items.quantity' } } },
    ]),
    Review.aggregate([
      { $match: { cafeId: objectId } },
      { $group: { _id: '$itemId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]),
  ]);

  const orderCountById = new Map(popularCounts.map((entry) => [entry._id.toString(), entry.orderCount]));
  const ratingById = new Map(reviewStats.map((entry) => [entry._id.toString(), {
    averageRating: Math.round(entry.averageRating * 10) / 10,
    reviewCount: entry.reviewCount,
  }]));
  const rankedItems = availableItems
    .map((item) => ({ item, orderCount: orderCountById.get(item._id.toString()) || 0 }))
    .sort((first, second) => second.orderCount - first.orderCount || first.item.name.localeCompare(second.item.name));

  const popular = rankedItems.slice(0, 3).map(({ item, orderCount }) => toRecommendation(item, orderCount));
  const topFood = rankedItems.find(({ item }) => item.category !== 'Beverages');
  const topBeverage = rankedItems.find(({ item }) => item.category === 'Beverages');
  const bestReviewed = availableItems
    .map((item) => ({ item, rating: ratingById.get(item._id.toString()), orderCount: orderCountById.get(item._id.toString()) || 0 }))
    .filter(({ rating }) => rating)
    .sort((first, second) => second.rating.averageRating - first.rating.averageRating || second.rating.reviewCount - first.rating.reviewCount || second.orderCount - first.orderCount)[0];

  return {
    popular,
    pairing: topFood && topBeverage ? {
      food: toRecommendation(topFood.item, topFood.orderCount),
      beverage: toRecommendation(topBeverage.item, topBeverage.orderCount),
    } : null,
    bestReviewed: bestReviewed ? toRecommendation(bestReviewed.item, bestReviewed.orderCount, bestReviewed.rating) : null,
  };
};

module.exports = { getCafeRecommendations };
