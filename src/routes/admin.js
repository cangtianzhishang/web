const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Post, Category, Tag } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { dashboardStats, toSlug } = require('../services/blogService');

const router = express.Router();

router.get('/login', (_req, res) => {
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ where: { username: req.body.username } });
  if (!user) return res.render('admin/login', { error: '用户名或密码错误' });
  const ok = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok) return res.render('admin/login', { error: '用户名或密码错误' });
  req.session.adminUserId = user.id;
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/', requireAdmin, async (_req, res) => {
  const stats = await dashboardStats();
  res.render('admin/dashboard', { stats });
});

router.get('/posts', requireAdmin, async (_req, res) => {
  const posts = await Post.findAll({ include: [Category, Tag], order: [['updatedAt', 'DESC']] });
  res.render('admin/posts', { posts });
});

router.get('/posts/new', requireAdmin, async (_req, res) => {
  const categories = await Category.findAll();
  const tags = await Tag.findAll();
  res.render('admin/post-form', { post: null, categories, tags });
});

router.get('/posts/:id/edit', requireAdmin, async (req, res) => {
  const [post, categories, tags] = await Promise.all([
    Post.findByPk(req.params.id, { include: [Tag] }),
    Category.findAll(),
    Tag.findAll()
  ]);
  res.render('admin/post-form', { post, categories, tags });
});

router.post('/posts', requireAdmin, async (req, res) => {
  const slug = toSlug(req.body.slug || req.body.title);
  const post = await Post.create({
    title: req.body.title,
    slug,
    excerpt: req.body.excerpt,
    content: req.body.content,
    status: req.body.status,
    publishedAt: req.body.publishedAt || null,
    CategoryId: req.body.categoryId
  });

  if (req.body.tags) {
    const tagIds = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
    await post.setTags(tagIds);
  }
  res.redirect('/admin/posts');
});

router.put('/posts/:id', requireAdmin, async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  await post.update({
    title: req.body.title,
    slug: toSlug(req.body.slug || req.body.title),
    excerpt: req.body.excerpt,
    content: req.body.content,
    status: req.body.status,
    publishedAt: req.body.publishedAt || null,
    CategoryId: req.body.categoryId
  });
  const tagIds = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [];
  await post.setTags(tagIds);
  res.redirect('/admin/posts');
});

router.delete('/posts/:id', requireAdmin, async (req, res) => {
  await Post.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/posts');
});

module.exports = router;
