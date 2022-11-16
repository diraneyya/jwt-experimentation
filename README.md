# jwt-experimentation

## Server

1. clone the repo
1. `cd` into the server folder
1. if using `nvm`, switch to node 16.x
1. install the dependencies using `npm i`
1. start the dev server using `npm run dev`

### Routes

Currently there are the following routes
- `/public`: displays the public certificate for signing the JWT tokens
- `/private`: displays the private certificate for signing the JWT tokens
- `/signin`: the sigin route
- `/signedin`: the route to check if you signed in
