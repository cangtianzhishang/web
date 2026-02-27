const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false }
});

const Post = sequelize.define('Post', {
  title: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  excerpt: { type: DataTypes.TEXT },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  status: { type: DataTypes.ENUM('draft', 'published', 'scheduled'), defaultValue: 'draft' },
  publishedAt: { type: DataTypes.DATE, allowNull: true }
});

const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  slug: { type: DataTypes.STRING(100), unique: true, allowNull: false }
});

const Tag = sequelize.define('Tag', {
  name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  slug: { type: DataTypes.STRING(100), unique: true, allowNull: false }
});

const PostTag = sequelize.define('PostTag', {});

const Comment = sequelize.define('Comment', {
  authorName: { type: DataTypes.STRING(120), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false }
});

const ViewEvent = sequelize.define('ViewEvent', {
  path: { type: DataTypes.STRING(255), allowNull: false },
  ip: { type: DataTypes.STRING(64), allowNull: false }
});

Category.hasMany(Post, { foreignKey: { allowNull: false } });
Post.belongsTo(Category);

Post.belongsToMany(Tag, { through: PostTag });
Tag.belongsToMany(Post, { through: PostTag });

Post.hasMany(Comment);
Comment.belongsTo(Post);
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });

module.exports = { sequelize, User, Post, Category, Tag, Comment, ViewEvent };
