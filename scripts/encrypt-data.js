const folderEncrypt = require("folder-encrypt");
require("dotenv").config({
  path: __dirname + "/../.env.local",
});

const password = process.env.ENCRYPT_PASS;

folderEncrypt
  .encrypt({
    password,
    input: "data",
  })
  .then(() => {
    console.log("encrypted!");
  })
  .catch((err) => {
    console.log(err);
  });
