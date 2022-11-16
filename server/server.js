import * as url from "url";
import { readFileSync } from "fs";
import { readFile } from "node:fs/promises";
import path from "path";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";

const fastify = Fastify({
  logger: true,
});

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// register cookie plugin
fastify.register(cookie, {});

// secret as an object of RSA keys (without passphrase)
// the files are loaded as strings
fastify.register(jwt, {
  secret: {
    private: readFileSync(path.join(__dirname, "/private.key"), "utf8"),
    public: readFileSync(path.join(__dirname, "/public.key"), "utf8"),
  },
  sign: { algorithm: "RS256" },
  cookie: {
    cookieName: "token",
    signed: false,
  },
});

fastify.get("/public", async function (request, reply) {
  return await readFile(path.join(__dirname, "/public.key"), "utf8");
});

fastify.get("/private", async function (request, reply) {
  return await readFile(path.join(__dirname, "/private.key"), "utf8");
});

// Declare a route
fastify.get("/signin", async function (request, reply) {
  reply.type("text/html");
  if (
    !request?.query?.name ||
    typeof request?.query?.name !== "string" ||
    request.query.name.length <= 3
  )
    return `
        <h1>Error signing in</h1>
        <p>Please pass a GET parameter named "name" and provide the value of the
        username you would like to be logged in using.</p>
        <p>This name will be used in the making of a custom JWT token that proves
        that you are logged in as that user.</p>
        <p>The username should be more than 3 characters long</p>
        <p><em>Why not log in as "superman"?</em></p>
    `;

  const token = await reply.jwtSign({
    signedIn: true,
    name: request.query.name,
  });
  reply.setCookie("token", token, {
    //   domain: 'localhost:3000',
    //   path: '/',
    //   secure: false, // send cookie over HTTPS only
    //   httpOnly: true,
    //   sameSite: true // alternative CSRF protection
  });

  return `
    <h1>Manual Instructions</h1>
    <p>In order to access the signedin route '/signedin', you will need to use Postman
    or a similar API tester to use the GET http verb and while passing the following
    HTTP header to the server:</p>
    <code>Authentication: Bearer &lt;token&gt;</code>
    <h2>Token</h2>
    <textarea style="width: 100%; height: 25%; overflow-y: scroll"
    >${token}</textarea>
    <h1>Using Cookies</h1>
    <p>Instead of doing the above, we can also use the cookies in the browser. Using
    Chrome check the cookie called "token" which was created. After that go to the
    <a href="/signedin">signedin route "/signed"</a> on the server to see the login
    message.</p>
    <p>After that, try to clear the cookie and do the same, again.</p>
  `;
});

fastify.get("/signedin", async function (request, reply) {
  console.log(request.cookies);

  reply.type("text/html");
  try {
    const loginData = await request.jwtVerify();
    if (loginData.signedIn === true)
      return `
            <h1>Congratulations! You are signed in as "${loginData.name}"</h1>
        `;
  } catch (error) {
    return `
            <h1>You are not signed in!</h1>
            <p>Did you forget to sign in using the signin route "/signin", or, did you clear
            the cookie manually?</p>
            <p>If using Postman or Thunder Client, did you remember to send an Authentication
            header to this route? check the <a href="signin">signin route '/signin'</a> for 
            instructions.</p>
            <p> The error message given by the JWT fastify library is:</p>
            <blockquote>"<em>${error}</em>"<blockquote>
        `;
  }
});

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
