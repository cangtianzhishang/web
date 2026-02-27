const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const dayjs = require('dayjs');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const viewData = require('./middleware/viewData');

dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false
  })
);
app.use(viewData);

app.locals.dayjs = dayjs;

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send('服务器错误');
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Blog running on http://localhost:${port}`);
});
