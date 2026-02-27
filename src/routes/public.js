const express = require('express');
const { Op } = require('sequelize');
const { Post, Category, Tag, Comment, ViewEvent } = require('../models');
const { archiveStats, visiblePostWhere } = require('../services/blogService');

const router = express.Router();

router.use(async (req, _res, next) => {
  if (!req.path.startsWith('/admin')) {
    await ViewEvent.create({ path: req.path, ip: req.ip || 'unknown' });
  }
  next();
});

router.get('/', async (req, res) => {
  const posts = await Post.findAll({
    where: visiblePostWhere(),
    include: [Category, Tag],
    order: [['publishedAt', 'DESC']],
    limit: 10
  });
  res.render('public/index', { posts });
});

router.get('/categories/:slug', async (req, res) => {
  const category = await Category.findOne({ where: { slug: req.params.slug } });
  if (!category) return res.status(404).send('分类不存在');
  const posts = await Post.findAll({
    where: { ...visiblePostWhere(), CategoryId: category.id },
    include: [Category, Tag],
    order: [['publishedAt', 'DESC']]
  });
  res.render('public/list', { title: `分类：${category.name}`, posts });
});

router.get('/tags/:slug', async (req, res) => {
  const tag = await Tag.findOne({ where: { slug: req.params.slug } });
  if (!tag) return res.status(404).send('标签不存在');
  const posts = await tag.getPosts({
    where: visiblePostWhere(),
    include: [Category, Tag],
    order: [['publishedAt', 'DESC']]
  });
  res.render('public/list', { title: `标签：${tag.name}`, posts });
});

router.get('/archive/:month', async (req, res) => {
  const [year, month] = req.params.month.split('-');
  const posts = await Post.findAll({
    where: {
      ...visiblePostWhere(),
      publishedAt: {
        [Op.gte]: new Date(`${year}-${month}-01`),
        [Op.lt]: new Date(`${year}-${month}-31`)
      }
    },
    include: [Category, Tag],
    order: [['publishedAt', 'DESC']]
  });
  res.render('public/list', { title: `归档：${req.params.month}`, posts });
});

router.get('/archive', async (req, res) => {
  const archives = await archiveStats();
  res.render('public/archive', { archives });
});

router.get('/posts/:slug', async (req, res) => {
  const post = await Post.findOne({
    where: { slug: req.params.slug, ...visiblePostWhere() },
    include: [Category, Tag]
  });
  if (!post) return res.status(404).send('文章不存在');

  const comments = await Comment.findAll({
    where: { PostId: post.id, parentId: null },
    include: [{ model: Comment, as: 'replies' }],
    order: [['createdAt', 'DESC']]
  });
  res.render('public/post', { post, comments });
});

router.post('/posts/:slug/comments', async (req, res) => {
  const post = await Post.findOne({ where: { slug: req.params.slug } });
  if (!post) return res.status(404).send('文章不存在');
  await Comment.create({
    authorName: req.body.authorName,
    content: req.body.content,
    PostId: post.id,
    parentId: req.body.parentId || null
  });
  res.redirect(`/posts/${post.slug}`);
});

module.exports = router;
