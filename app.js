const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

// init app object
const app = express();

// parse any incoming requests body and extract any JSON data which is in there
// convert it to regular javascript data structure (objects, array)
app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

// middleware to avoid CORS error, attach certain headers to the responses it sends back to the client that allow CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

// we need to make sure express only reach this middleware when request start as api/places
app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// this middleware is only reached if we have some request which didn't get a response before
// that can be a request we don't want to handle
// app.use((req, res, next) => {
//   const error = new HttpError("Could not find this route.", 404);
//   throw error;
// });

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) {
    // We can send one response in total, so if a response has already been sent,
    return next(error); // then we return next and forword the error but won't send a response
  }
  res.status(error.code || 500); // status 500: something went wrong on server
  res.json({ message: error.message || "An unknown error occurred!" });
});

// start the connection, if connected, listen on certain port
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@refresher.ccp8yfv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000, "0.0.0.0");
  })
  .catch((err) => {
    console.log(err);
  });
