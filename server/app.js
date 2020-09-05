import express from 'express';
import cors from 'cors';
import path from 'path';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import mongoose from 'mongoose';
import oauthRoutes from './routes';
import config from './config.js';

const mongodbHost = config.mongodbHost || 'localhost';

mongoose.connect(`mongodb://${mongodbHost}/oauth2`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
const __dirname = path.resolve();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'oauth2-server-unpredictable-secret',
  name: 'oauth2-server-sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 10 * 60 * 1000,
    secure: config.nodeEnv !== 'development',
    httpOnly: true,
    sameSite: 'strict',
  },
}));

app.use('/', [oauthRoutes]);

app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;
