const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['Post', 'Comment', 'Story', 'Note'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  type: {
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap', 'think', 'care'],
    required: true
  }
});

reactionSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
reactionSchema.index({ targetType: 1, targetId: 1, type: 1 });

module.exports = mongoose.model('Reaction', reactionSchema);
