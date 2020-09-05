import Token from '../models/token.js';
import OAuthError from '../errors/oautherror.js';
import handleError from '../errors/handler.js';

const authorize = async function (req, res, next) {
  let accessToken;

  // check the authorization header
  if (req.headers.authorization) {
    // validate the authorization header
    const parts = req.headers.authorization.split(' ');

    if (parts.length < 2) {
      // no access token got provided - cancel
      return next(new OAuthError('invalid_client', 'No client authentication provided'));
    }

    accessToken = parts[1];
  } else {
    // access token URI query parameter or entity body
    accessToken = req.query.access_token || req.body.access_token;
  }

  if (!accessToken) {
    // no access token got provided - cancel
    return next(new OAuthError('invalid_request', 'Access Token missing'));
  }

  try {
    const token = await Token.findOne({
      accessToken: accessToken,
    });

    if (!token) {
      // no token found - cancel
      console.log('no token found');

      return handleError(new OAuthError('invalid_token', 'Access Token invalid'), res);
    }

    if (token.consumed) {
      // the token got consumed already - cancel
      return handleError(new OAuthError('invalid_token', 'Access Token expired'), res);
    }

    if (token.count + 1 >= 5) {
      // consume all tokens - including the one used
      await Token.updateMany({
        userId: token.userId,
        consumed: false,
      }, {
        $set: {consumed: true},
      });
    } else {
      await Token.update({
        _id : token._id,
      }, {
        $inc : { count : 1},
      });
    }

    // ready to access protected resources
    next();
  } catch (err) {
    if (err) {
      return next(new OAuthError('invalid_token', 'Access Token invalid', err));
    }
  }
};

export default authorize;
