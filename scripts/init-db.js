const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { sequelize, User, Category, Tag } = require('../src/models');

dotenv.config();

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const existingAdmin = await User.findOne({ where: { username } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({ username, passwordHash });
      console.log(`Admin seeded: ${username}`);
    }

    const defaultCategories = ['技术文章', '随笔', '作品集'];
    for (const name of defaultCategories) {
      await Category.findOrCreate({ where: { name }, defaults: { slug: name } });
    }

    const defaultTags = ['Node.js', '前端', '后端', '生活'];
    for (const name of defaultTags) {
      await Tag.findOrCreate({ where: { name }, defaults: { slug: name.toLowerCase() } });
    }

    console.log('Database ready');
    process.exit(0);
  } catch (error) {
    console.error('DB init failed:', error);
    process.exit(1);
  }
})();
