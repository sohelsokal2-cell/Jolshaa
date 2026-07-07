const Review = require('../models/Review');
const Page = require('../models/Page');

exports.createReview = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    const userId = req.user._id.toString();
    if (!pg.followers.some(f => f.toString() === userId)) {
      return res.status(403).json({ message: 'You must follow this page before writing a review' });
    }

    const { rating, reviewText, recommends } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existing = await Review.findOne({ page: pg._id, reviewer: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this page. Edit your existing review instead.' });
    }

    const review = await Review.create({
      page: pg._id,
      reviewer: req.user._id,
      rating,
      reviewText: reviewText || '',
      recommends: recommends !== undefined ? recommends : true,
    });

    await review.populate('reviewer', 'name profilePhoto');

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this page' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own review' });
    }

    const { rating, reviewText, recommends } = req.body;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      review.rating = rating;
    }
    if (reviewText !== undefined) review.reviewText = reviewText;
    if (recommends !== undefined) review.recommends = recommends;
    review.editedAt = new Date();

    await review.save();
    await review.populate('reviewer', 'name profilePhoto');

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own review' });
    }

    await Review.findByIdAndDelete(review._id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPageReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    const reviews = await Review.find({ page: pg._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewer', 'name profilePhoto');

    const total = await Review.countDocuments({ page: pg._id });

    const allRatings = await Review.find({ page: pg._id }).select('rating recommends');
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;
    const recommendCount = allRatings.filter(r => r.recommends).length;

    const myReview = await Review.findOne({ page: pg._id, reviewer: req.user._id }).populate('reviewer', 'name profilePhoto');

    res.json({
      reviews,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      averageRating: Number(averageRating.toFixed(1)),
      recommendCount,
      myReview: myReview || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserReviewsGiven = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ reviewer: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('page', 'name profilePhoto category');

    const total = await Review.countDocuments({ reviewer: req.params.id });

    res.json({
      reviews,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
