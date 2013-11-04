Pieces = new Meteor.Collection("pieces");

Meteor.publish('pieces', function() {
  return Pieces.find();
});
