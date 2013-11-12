var Pieces = new Meteor.Collection("pieces");

var piecesHandle = Meteor.subscribe('pieces', function() {
  //
});

var map;
var boardLayer;
var unitLayer;
var polyLayer;
var polyControl;

var markers = {};

Meteor.startup(function() {
  boardLayer = new OpenLayers.Layer.Image("board", "/WP_Map_mockup.png",
    new OpenLayers.Bounds(0,0, 2592,2592),
    new OpenLayers.Size(2592,2592),
    {layers: 'basic'}
  );

  polyLayer = new OpenLayers.Layer.Vector("polyLayer");

  polyControl = new OpenLayers.Control.DrawFeature(polyLayer,
      OpenLayers.Handler.Polygon);

  unitLayer = new OpenLayers.Layer.Markers("units");

  map = new OpenLayers.Map({
    div: 'board',
    layers: [boardLayer, unitLayer, polyLayer],
    maxExtent: new OpenLayers.Bounds(0,0, 2592,2592),
    maxResolution: 2592/256,
    restrictExtent: new OpenLayers.Bounds(0,0, 2592,2592),
  });

  map.addControl(new OpenLayers.Control.MousePosition());
  map.addControl(polyControl);
  
  polyControl.activate();

  var size = new OpenLayers.Size(64,64);
  var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
  var icon = new OpenLayers.Icon('/WPGsoldier.png', size, offset);

  Pieces.find().observe({
    added: function(newDocument) {
      markers[newDocument._id] = new OpenLayers.Marker(
        new OpenLayers.LonLat(newDocument.x,newDocument.y),icon.clone());
      unitLayer.addMarker(markers[newDocument._id]);
    },
    changed: function(newDocument, oldDocument) {
      var newLonLat = new OpenLayers.LonLat(newDocument.x, newDocument.y);
      var newPx = map.getLayerPxFromLonLat(newLonLat);
      markers[oldDocument._id].moveTo(newPx);
    },
    removed: function(oldDocument) {
    }
  });
});


Template.board.pieces = function() {
  return Pieces.find();
};

Template.sidebar.events({
  'click #createPiece': function() {
    Pieces.insert({x: (Math.random()*2592), y: (Math.random()*2592)});
  },
  'click #randomize': function() {
    Pieces.find().forEach(function (piece) {
      Pieces.update({_id: piece._id},
        {x:(Math.random()*2592),y:(Math.random()*2592)});
    });
  }
});

