const Listing = require('../models/Listing');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { hasId } = require('../utils/id');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.createListing = async (req, res) => {
  try {
    const { title, description, price, currency, category, condition, location } = req.body;

    if (!title || !price) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'jolshaa/marketplace')
      );
      const results = await Promise.all(uploadPromises);
      images = results.map((r) => r.secure_url);
    }

    const listing = await Listing.create({
      seller: req.user._id,
      title,
      description: description || '',
      price: parseFloat(price),
      currency: currency || 'USD',
      images,
      category: category || 'other',
      condition: condition || 'good',
      location: location || '',
    });

    await listing.populate('seller', 'name profilePhoto');

    res.status(201).json({ listing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getListings = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;

    const query = { status: 'active' };

    if (category) query.category = category;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };

    const listings = await Listing.find(query)
      .populate('seller', 'name profilePhoto location')
      .sort(sortOption)
      .limit(50);

    res.json({ listings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name profilePhoto location phone');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.views += 1;
    await listing.save();

    res.json({ listing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, price, category, condition, location, status } = req.body;
    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (price !== undefined) listing.price = parseFloat(price);
    if (category !== undefined) listing.category = category;
    if (condition !== undefined) listing.condition = condition;
    if (location !== undefined) listing.location = location;
    if (status !== undefined) listing.status = status;

    await listing.save();
    res.json({ listing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markInterested = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const isInterested = hasId(listing.interested, req.user._id);
    if (!isInterested) {
      listing.interested.push(req.user._id);
    } else {
      listing.interested.pull(req.user._id);
    }
    await listing.save();

    res.json({ isInterested: !isInterested, interestedCount: listing.interested.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .populate('seller', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
