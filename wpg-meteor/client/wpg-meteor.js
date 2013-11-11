var Pieces = new Meteor.Collection("pieces");

var piecesHandle = Meteor.subscribe('pieces', function() {
  //
});

Meteor.startup(function() {
  $(window).on('resize', function(e) {
    Session.set('viewWidth', $('.main-pane').width());
    Session.set('viewHeight', $('.main-pane').height());
  });
  Session.set('viewWidth', $('.main-pane').width());
  Session.set('viewHeight', $('.main-pane').height());
  
  $(document).on('keydown', function(e) {
    switch (e.which) {
      case 37:
        Session.set('mapX', Session.get('mapX')-10);
        break;
      case 39:
        Session.set('mapX', Session.get('mapX')+10);
        break;
      case 38:
        Session.set('mapY', Session.get('mapY')-10);
        break;
      case 40:
        Session.set('mapY', Session.get('mapY')+10);
        break;
      case 107:
        Session.set('zoom', Session.get('zoom')+5);
        break;
      case 109:
        Session.set('zoom', Session.get('zoom')-5);
        break;

    }
  });
});

Template.board.pieces = function() {
  return Pieces.find();
};

Session.setDefault('zoom', 0);
Session.setDefault('mapHeight', 2592);
Session.setDefault('mapWidth', 2592);
Session.setDefault('mapX', 2592/2);
Session.setDefault('mapY', 2592/2);

Deps.autorun(function() {
  var scale = Math.exp(Session.get('zoom')/50);
  var mapLeft = Session.get('viewWidth')/2-Session.get('mapX');
  var mapTop = Session.get('viewHeight')/2-Session.get('mapY');

  Session.set('mapMatrix', [scale, 0, 0, scale, mapLeft, mapTop]);
});

Template.board.mapMatrix = function() {
  return Session.get('mapMatrix').join(',');
}
Template.board.mapX = function() {
  return Session.get('mapX');
}
Template.board.mapY = function() {
  return Session.get('mapY');
}

Session.setDefault('viewWidth', 1000);
Session.setDefault('viewHeight', 600);


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

Session.setDefault('dragging', false);

Template.board.events({
  'click #zoomIn': function() {
    Session.set('zoom', Session.get('zoom')+5);
  },
  'click #zoomOut': function() {
    Session.set('zoom', Session.get('zoom')-5);
  },
});

Template.board.rendered = function() {
};

Template.piece.pieceMatrix = function() {
  
}

Template.piece.pieceLeft = function() {
  return this.x;
};

Template.piece.pieceTop = function() {
  return this.y
};
