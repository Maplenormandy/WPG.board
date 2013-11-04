var Pieces = new Meteor.Collection("pieces");

var piecesHandle = Meteor.subscribe('pieces', function() {
  //
});

Template.board.pieces = function() {
  return Pieces.find();
}

Template.board.greeting = function() { return Session.get('greeting'); };
Session.setDefault('greeting', 'hello world');

Session.setDefault('slider', 0);

Template.board.mapScaling = function() {
  return Math.exp(Session.get('slider')/50);
};

Template.sidebar.events({
  'click #createPiece': function() {
    Pieces.insert({x: (Math.random()*500), y: (Math.random()*500)});
  },
  'click #randomize': function() {
    Pieces.find().forEach(function (piece) {
      Pieces.update({_id: piece._id},{x:(Math.random()*500),y:(Math.random()*500)});
    });
  }
});

Template.sidebar.rendered = function() {
  if (! $('#slider-vertical').data('uiSlider')) {
    $('#slider-vertical').slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      value: 0,
      slide: function(event, ui) {
        Session.set('slider', ui.value);
      }
    });
  }
};
