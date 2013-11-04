var Pieces = new Meteor.Collection("pieces");

var piecesHandle = Meteor.subscribe('pieces', function() {
  //
});

Template.board.pieces = function() {
  return Pieces.find();
}

Template.board.greeting = function() { return Session.get('greeting'); }
Session.setDefault('greeting', 'hello world');

Template.sidebar.events({
  'click #createPiece': function() {
    Pieces.insert({x: (Math.random()*500), y: (Math.random()*500)});
  },
  'click .randomize': function() {
    Pieces.find().forEach(function (piece) {
      Pieces.update({_id: piece._id},{x:(Math.random()*500),y:(Math.random()*500)});
    });
  }
});
