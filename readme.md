## Oauth2

### Info

[The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)  
[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)  

#### Differences between OAuth 1.0a and 2.0

- access tokens are now subject to a time to live (TTL)/expiry time
- no more client-side cryptography

#### Oauth2 Terminology

- resource owner
- client
- authorization server
- resource server
- authorization grant
- access token
- scope
- consent
- back channel (highly secure chanel)
- front channel (less secure chanel)

#### Oauth2 Flows

| Flow                          | Channel       | Use case
| ----------------------------- |:-------------:| :---:
| authorization code            | front + back  | web app with backend server
| authorization code + PKCE     | front + back  | native mobile app
| implicit flow                 | front         | spa
| client credentials            | back          | microservices
| refresh token                 | back          |


### Oauth2 Authorization Code Example

[Oauth2 client sandbox](./client)  
[Oauth2 server sandbox](./server)  

![oauth2_authorization_code_flow]  

#### Authorization Grant

After the user visits the authorization page, the service shows the user an explanation of the request, including application name, scope, etc.   
If the user clicks “approve”, the server will redirect back to the app, with a “code” and the same “state” parameter you provided in the query string parameter.   
It is important to note that this is not an access token.     
The only thing you can do with the authorization code is to make a request to get an access token.

parameters:

- response_type=code  

    response_type is set to code indicating that you want an authorization code as the response.
    
- client_id  

    The client_id is the identifier for your app. You will have received a client_id when first registering your app with the service.
- redirect_uri (optional)  

    The redirect_uri may be optional depending on the API, but is highly recommended. This is the URL to which you want the user to be redirected after the authorization is complete. This must match the redirect URL that you have previously registered with the service.
- scope (optional)  

    Include one or more scope values (space-separated) to request additional levels of access. The values will depend on the particular service.
    e.g. "profile contacts"
    
- state  

    The state parameter serves two functions. When the user is redirected back to your app, whatever value you include as the state will also be included in the redirect. This gives your app a chance to persist data between the user being directed to the authorization server and back again, such as using the state parameter as a session key. This may be used to indicate what action in the app to perform after authorization is complete, for example, indicating which of your app’s pages to redirect to after authorization.
    
The state parameter also serves as a CSRF protection mechanism if it contains a random value per request. When the user is redirected back to your app, double check that the state value matches what you set it to originally.  

[Authorization Token Response](https://tools.ietf.org/html/rfc6749#section-4.1.2)  

#### Authorization Token exchange for an Access Token

Question: Why we have to do exchange the authorization code for an access token? Why we cannot just obtain access token without authorization code step?  
Answer: Because part of consent(until token exchange) goes through front channel so insecure

![oauth2_front_back]

parameters:

- grant_type (required)  

    The grant_type parameter must be set to “authorization_code”.
    
- code (required)  

    This parameter is for the authorization code received from the authorization server which will be in the query string parameter “code” in this request.
    
- redirect_uri (possibly required)  

    If the redirect URL was included in the initial authorization request, it must be included in the token request as well, and must be identical. Some services support registering multiple redirect URLs, and some require the redirect URL to be specified on each request. Check the service’s documentation for the specifics.
    
[Access Token Response](https://tools.ietf.org/html/rfc6749#section-4.2.2)

#### Refresh token

You can only get a Refresh Token if you are implementing the following flows:

    Authorization Code Flow
    Authorization Code Flow with Proof Key for Code Exchange (PKCE)
    Resource Owner Password Grant
    Device Authorization Flow

`offline_access` - OPTIONAL scope that defined in OpenID Connect as an OAuth Scope value 
to request offline access. This scope value requests that an OAuth 2.0 Refresh Token be 
issued that can be used to obtain an Access Token that grants access to the End-User's 
UserInfo Endpoint even when the End-User is not present (not logged in).

#### OpenID Connect Extension

![oauth2_open_id_connect_flow]   

Question: What for OpenID Connect?  
Answer: To solve oauth2 standardisation problems 
and make the most of authentication(e.g. login page) from authorization server 
for a client.

| oauth2 problem                                | openId connect solution
| --------------------------------------------- |:------------------------:
| no standard way to get user's information     | `/userinfo`
| no common set of scope                        | standard set of scope. E.g. `openid profile`

matrix to choose between them:

| server                | use oauth2 for authorization                  | use openId connect for authentication
| --------------------- | --------------------------------------------- | ---
| authorization server  | granting access to your api                   | making your accounts available in other systems    
| client                | getting access to user data in other system   | logging the user in

![openid_connect]     

[OpenID Connect Scopes](https://auth0.com/docs/scopes/current/oidc-scopes)  


## Additional info

[OAuth Libraries for Node.js](https://oauth.net/code/nodejs/)  
[OAuth 2.0 Simplified](https://www.oauth.com/)  
[Authorization Code Grant](https://www.oauth.com/oauth2-servers/server-side-apps/authorization-code/)  
[OAuth 2.0 and OpenID Connect in Plain English!](https://www.youtube.com/watch?v=0VWkQMr7r_c)  
[Test OAuth 2.0 requests and debug responses](https://oauthdebugger.com/)  
[Test OpenID Connect requests and debug responses](https://oidcdebugger.com/)  

### Bearer Token

    The Bearer Token default token in the OAuth 2.0 standard. 
    Warning! Token not encrypted therefore use TLS or SSL.
    
ways to pass bearer token:

- header field: `Authorization: Bearer 4ae6ce68-4c59-4313-94e2-fcc2932cf5ca`
- body as a form-encoded parameter `access_token` and `Content-Type: application/x-www.js-form-urlencoded`. To encode use `encodeURIComponent()`
- URI query parameter `access_token` (Warning! Might be logged hence insecure)

### Authentication vs Authorization

1. authentication = get identity by authentication
1. authorization = get resource by identity

![authentication_vs_authorization]


## Other flows

### Oauth2 Implicit Flow

![oauth2_implicit_flow]  

---

[oauth2_authorization_code_flow]: images/oauth2_authorization_code_flow.png
[oauth2_front_back]: images/oauth2_front_back.png
[oauth2_open_id_connect_flow]: images/oauth2_open_id_connect_flow.png
[oauth2_implicit_flow]: images/oauth2_implicit_flow.png
[openid_connect]: images/openid_connect.png
[authentication_vs_authorization]: images/authentication_vs_authorization.jpg
