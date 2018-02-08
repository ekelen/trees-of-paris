const mongoose = require('mongoose')

const treeSchema = new mongoose.Schema({
  id: { "type": String, index: true, unique: true, required: true },
  species: { "type": String, required: true },
  genus: { "type": String, required: true },
  commonName: { "type": String, required: true },

  street: { "type": String, required: true },
  arrondissement: { "type": Number, required: true },
  geometry: { "type": { type: String, required: true, default: "Point" }, "coordinates": [] },
  notable: { "type": Boolean, required: true },
  usage: { "type": String, required: true },
  circumference: { "type": Number, required: true, min: 1, max: 335},
  height: { "type": Number, required: true, max: 40 },
}, {collection: 'sandbox'});

treeSchema.virtual('fullName').get(function () {
  return this.genus + ' ' + this.species;
});
treeSchema.set('toObject', { virtuals: true });
treeSchema.set('toJSON', { virtuals: true });
treeSchema.index({ geometry: "2dsphere" });

module.exports = treeSchema
