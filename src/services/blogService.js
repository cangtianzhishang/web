const dayjs = require('dayjs');
const { Op, fn, col, literal } = require('sequelize');
const { Post, Category, Tag, Comment, ViewEvent } = require('../models');

function toSlug(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function visiblePostWhere() {
  return {
    [Op.or]: [
      { status: 'published' },
      { status: 'scheduled', publishedAt: { [Op.lte]: new Date() } }
    ]
  };
}

async function archiveStats() {
  return Post.findAll({
    attributes: [
      [fn('DATE_FORMAT', col('publishedAt'), '%Y-%m'), 'month'],
      [fn('COUNT', literal('*')), 'count']
    ],
    where: visiblePostWhere(),
    group: [fn('DATE_FORMAT', col('publishedAt'), '%Y-%m')],
    order: [[literal('month'), 'DESC']]
  });
}

async function dashboardStats() {
  const [postCount, commentCount, viewCount] = await Promise.all([
    Post.count(),
    Comment.count(),
    ViewEvent.count()
  ]);
  return { postCount, commentCount, viewCount, generatedAt: dayjs().format('YYYY-MM-DD HH:mm') };
}

module.exports = { toSlug, visiblePostWhere, archiveStats, dashboardStats };
