// used here to make a request to the Google Maps Geocoding API from our backend
const axios = require("axios");
const HttpError = require("../models/http-error");

// API Key for authenticating requests to the service.
const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
  const response = await axios.get(
    //make a GET request to the Google Maps Geocoding API endpoint
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location for the specific address.",
      422
    );
    throw error;
  }

  // If the data is valid, the function extracts the coordinates from the first result in the response.
  // The Google Maps API returns an array of results
  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordsForAddress;
