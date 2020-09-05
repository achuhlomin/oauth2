## Getting started

#### Setup

1. Create Client
1. Create User

[Authorization Server API](./rest-api.http)

#### Mongodb

connect `mongo --host <host> --port 27017 oauth2`
    
        show collections
        db.tokens.find()

update client:
    
        db.clients.update(
                    { name : 'oauth2-client' },
                    { $set : { "scope" : "openid email offline_access" } }
                );
                
update user:

        db.users.update(
                            { _id : ObjectId('5efb2f7c2f53cec8716e3fed') },
                            { $addToSet : { "clients" : "b2170e4a-aee2-43a6-9510-783f92d46ee7" } }
                        );