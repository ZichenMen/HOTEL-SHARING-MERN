const mongoose = require("mongoose");

const Schema = mongoose.Schema; // access the schema method in mongoose

const placeSchema = new Schema({
  // blueprint of object
  // required:true means must not empty
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // always should be a URL pointing to a file
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  // ref: establish the connection between the current schema and another schema
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

// model will return a special function later
module.exports = mongoose.model("Place", placeSchema); //collections name would be places
