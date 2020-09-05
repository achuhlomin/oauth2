import express from 'express';
import jwt from 'jsonwebtoken';
import RefreshToken from '../lib/models/refreshtoken.js';
import Token from '../lib/models/token.js';
import AuthCode from '../lib/models/authcode.js';
import Client from '../lib/models/client.js';
import User from '../lib/models/user.js';
import IdToken from '../lib/models/idtoken.js';
import OAuthError from '../lib/errors/oautherror.js';
import errorHandler from '../lib/errors/handler.js';
import authorize from '../lib/middleware/authorize.js';

const router = express.Router();

router.get('/authorize', async function(req, res, next) {
  const responseType = req.query.response_type;
  const clientId = req.query.client_id;
  const redirectUri = req.query.redirect_uri;
  const scope = req.query.scope;
  const state = req.query.state;
  const modal = Boolean(req.query.modal);

  if (!responseType) {
    return next(new OAuthError('invalid_request', 'Missing parameter: response_type'));
  }

  if (responseType !== 'code') {
    return next(new OAuthError('unsupported_response_type', 'Response type not supported'));
  }

  if (!clientId) {
    return next(new OAuthError('invalid_request', 'Missing parameter: client_id'));
  }

  try {
    const client = await Client.findOne({ clientId: clientId });

    if (!client) {
      return next(new OAuthError('invalid_client', 'Invalid client provided, client malformed or client unknown'));
    }

    if (redirectUri !== client.redirectUri) {
      return next(new OAuthError('invalid_client', 'Invalid client provided, client malformed or client unknown'));
    }

    if (client.scope.includes('openid') && !scope) {
      return next(new OAuthError('invalid_request', 'Missing parameter: scope'));
    }

    if (client.scope.includes('openid') && !scope.includes('openid')) {
      return next(new OAuthError('invalid_scope', 'Provided scope is invalid, unknown, or malformed'));
    }

    if (scope.split(' ').sort().join(' ') !== client.scope.split(' ').sort().join(' ')) {
      return next(new OAuthError('invalid_scope', 'Scope is missing or not well-defined'));
    }

    req.session.name = client.name;
    req.session.scope = scope;
    req.session.clientId = clientId;
    req.session.redirectUri = redirectUri;
    req.session.state = state;
    req.session.modal = modal;

    return res.render('login', {
      name: client.name,
      scope,
    });
  } catch (err) {
    next(new OAuthError('invalid_client', 'Invalid client provided, client malformed or client unknown', err));
  }
});

router.post('/login', async function(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const { name, scope, clientId, redirectUri, state, modal } = req.session;

  try {
    // todo: for the time being do manual update in mongo for consent
    const user = await User.findOne({ email: email, password: password, clients: clientId });

    if (!user) {
      return res.render('login', {
        name,
        scope,
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
      });
    }

    const authCode = new AuthCode({
      clientId,
      redirectUri,
      userId: user.userId,
    });

    await authCode.save();

    const response = {
      state: state,
      code: authCode.code,
    };

    if (redirectUri && modal) {
      const redirect = encodeURIComponent(`${redirectUri}?code=${response.code}${state ? `&state=${state}` : ''}`);

      return res.render('login', {
        redirect,
      });
    } else if (redirectUri) {
      const redirect = `${redirectUri}?code=${response.code}${state ? `&state=${state}` : ''}`;

      return res.redirect(redirect);
    } else {
      return res.json(response);
    }
  } catch (err) {
    return res.render('login', {
      name,
      scope,
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });
  }
});

router.post('/token', async function(req, res) {
  const grantType = req.body.grant_type;

  if (!grantType) {
    return errorHandler(new OAuthError('invalid_request', 'Missing parameter: grant_type'), res);
  }

  if (grantType === 'authorization_code') {
    await getAccessTokenByAuthorizationCode(req, res);
  } else if (grantType === 'refresh_token') {
    await getAccessTokenByRefreshToken(req, res);
  } else {
    errorHandler(new OAuthError('unsupported_grant_type', 'Grant type not supported'), res);
  }
});

router.post('/register_client', function(req, res, next) {
  const client = new Client({
    name: req.body.name,
    redirectUri: req.body.redirect_uri,
    scope: 'openid email offline_access',
  });

  client.save(function(err) {
    if (err) {
      next(new Error('Client name exists already'));
    } else {
      return res.json(client);
    }
  });
});

router.post('/register_user', function(req, res, next) {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
    clients: req.body.clients.split(' '),
  });

  user.save(function(err) {
    if (err) {
      next(new Error('Username exists already'));
    } else {
      return res.json(user);
    }
  });
});

router.get('/server_value', authorize, function(req, res) {
  return res.json({
    value: `Congratulations! Protected resource is obtained. ${randomIntInterval(1, 100)}`,
  });
});

// todo
router.get('/userinfo', authorize, function(req, res) {
  return res.send('Protected resource');
});

async function getAccessTokenByAuthorizationCode(req, res) {
  const authCode = req.body.code;
  const redirectUri = req.body.redirect_uri;
  const clientId = req.body.client_id;
  const clientSecret = req.body.client_secret;

  let code;

  try {
    code = await AuthCode.findOne({ code: authCode });

    if (!code) {
      return errorHandler(new OAuthError('invalid_request', 'Parameter malformed or invalid'), res);
    }

    if (code.consumed) {
      return errorHandler(new OAuthError('invalid_grant', 'Authorization Code expired'), res);
    }

    code.consumed = true;

    await code.save();

    if (code.redirectUri !== redirectUri) {
      return errorHandler(new OAuthError('invalid_grant', 'Redirect URI does not match'), res);
    }
  } catch (err) {
    errorHandler(new OAuthError('invalid_request', 'Parameter malformed or invalid', err), res);
  }

  try {
    const client = await Client.findOne({ clientId, clientSecret });

    if (!client) {
      return errorHandler(new OAuthError('invalid_client', 'Invalid client provided, client malformed or client unknown'), res);
    }

    const response = await getAccessTokenResponse({
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      scope: client.scope,
      userId: code.userId,
      redirectUri: client.redirectUri,
    });

    return res.json(response);
  } catch (err) {
    return errorHandler(new OAuthError('invalid_client', 'Invalid client provided, client malformed or client unknown', err), res);
  }
}

async function getAccessTokenByRefreshToken(req, res) {
  const refreshToken = req.body.refresh_token;

  if (!refreshToken) {
    return errorHandler(new OAuthError('invalid_request', 'Missing parameter: refresh_token'), res);
  }

  let currentRefreshToken;

  try {
    currentRefreshToken = await RefreshToken.findOne({ token: refreshToken });

    if (!currentRefreshToken) {
      return errorHandler(new OAuthError('invalid_grant', 'Refresh Token invalid, malformed or expired'), res);
    }

    // consume all previous refresh tokens
    await RefreshToken.update({
      userId: currentRefreshToken.userId,
      consumed: false,
    }, {
      $set: {consumed: true},
    });
  } catch (err) {
    errorHandler(new OAuthError('invalid_grant', 'Refresh Token invalid, malformed or expired', err), res);
  }

  try {
    const client = await Client.findOne({ clientId: currentRefreshToken.clientId });

    if (!client) {
      return errorHandler(new OAuthError('invalid_client', 'Invalid client provided, client malformed or client unknown'), res);
    }

    const response = await getAccessTokenResponse({
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      scope: client.scope,
      userId: currentRefreshToken.userId,
      redirectUri: client.redirectUri,
    });

    return res.json(response);
  } catch (err) {
    return errorHandler(new OAuthError('invalid_client', 'Invalid client provided, client malformed or client unknown', err), res);
  }
}

async function getAccessTokenResponse({
  clientId,
  clientSecret,
  scope,
  userId,
  redirectUri,
}) {
  let newRefreshToken;

  const newTokenParams = {
    userId,
  };

  if (scope.includes('offline_access')) {
    newRefreshToken = new RefreshToken({
      userId,
      clientId,
    });

    await newRefreshToken.save();

    newTokenParams.refreshToken = newRefreshToken.token;
  }

  let newIdToken;

  if (scope.includes('openid')) {
    const user = await User.findOne({ userId: userId, clients: clientId });
    const email = scope.includes('email') ? user.email : null;

    newIdToken = new IdToken({
      iss: redirectUri,
      aud: clientId,
      email,
    });

    await newIdToken.save();

    newTokenParams.idToken = newIdToken.sub;
  }

  const newToken = new Token(newTokenParams);

  await newToken.save();

  const response = {
    access_token: newToken.accessToken,
    expires_in: newToken.expiresIn,
    token_type: newToken.tokenType,
    scope,
  };

  if (scope.includes('offline_access')) {
    response.refresh_token = newToken.refreshToken;
  }

  if (scope.includes('openid')) {
    response.id_token = jwt.sign({
      iat: Number(newIdToken.iat),
      exp: Number(newIdToken.exp),
      sub: newIdToken.sub,
      iss: newIdToken.iss,
      aud: newIdToken.aud,
      email: newIdToken.email,
    }, clientSecret);
  }

  return response;
}

function randomIntInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default router;