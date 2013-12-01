var Pieces = new Meteor.Collection("pieces");

var piecesHandle = Meteor.subscribe('pieces', function() {
  //
});

var map;
var board = {};
var units = {};
var draw = {};

var unitLib = {};
var allTypes = new Array();

function setupUnit(name, level, icon) {
  unitLib[name] = {
    level: level,
    style: OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default'])
  };
  unitLib[name].style.pointRadius = 16;
  unitLib[name].style.externalGraphic = "/units/" + icon;
  unitLib[name].style.graphicOpacity = .7;
  allTypes.push(name);
}
function setupDraw(name, handler) {
  draw[name] = {
    control: new OpenLayers.Control.DrawFeature(board["land"].vector,
      handler)
  };

  map.addControl(draw[name].control);
}
function setupLayer(level, path) {
  board[level] = {
    map: new OpenLayers.Layer.Zoomify(level, path,
      new OpenLayers.Size(2592,2592),
      {zIndex:0}
    ),
    units: new OpenLayers.Layer.Vector(level+"-unit", {zIndex:1}),
    vector: new OpenLayers.Layer.Vector(level+"-vector", {zIndex:2})
  };

  if (map) {
    map.addLayer(board[level].map);
    map.addLayer(board[level].units);
    map.addLayer(board[level].vector);
  }
}

var activeLayer;
function setActiveLayer(level) {
  board[level].map.setVisibility(true);
  map.setBaseLayer(board[level].map);
  board[level].units.setOpacity(1.0);
  board[level].vector.setOpacity(1.0);
  for (var d in draw) {
    draw[d].control.layer = board[level].vector;
  }
  for (var l in board) {
    if (l != level) {
      board[l].map.setVisibility(false);
      board[l].units.setOpacity(0.2);
      board[l].vector.setOpacity(0.2);
    }
  }
  activeLayer = level;
}
function setActiveControl(name) {
  if (name != "") {
    draw[name].control.activate();
  }
  for (var n in draw) {
    if (n != name) {
      draw[n].control.deactivate();
    }
  }
}

var mx, my;

Meteor.startup(function() {
  setupUnit("soldier", "land", "wpg-tsold.png");
  setupUnit("tank", "land", "wpg-ttank.png");
  setupUnit("airplane", "air", "wpg-taplane.png");
  setupUnit("stealth bomber", "air", "wpg-tstealthb.png");
  setupUnit("submarine", "under", "wpg-tsubmarine.png");
  setupUnit("helicopter", "air", "wpg-theli.png");
  setupUnit("satellite", "space", "wpg-tsat.png");

  setupLayer("land", "/maps/WP_Map_bridges-01/");

  map = new OpenLayers.Map({
    div: 'board',
    layers: [board.land.map, board.land.units, board.land.vector],
    maxExtent: new OpenLayers.Bounds(0,0, 2592,2592),
    maxResolution: Math.pow(2, board.land.map.numberOfTiers-1),
    numZoomLevels: board.land.map.numberOfTiers,
    units: 'pixels'
  });

  setupLayer("under", "/maps/Underwater_with_outlines-01/");
  setupLayer("air", "/maps/Air_no_clouds/");
  setupLayer("space", "/maps/Space-01/");

  setupDraw("select", OpenLayers.Handler.Polygon);
  setupDraw("movepath", OpenLayers.Handler.Path);

  setupDraw("polyfill", OpenLayers.Handler.Polygon);
  setupDraw("line", OpenLayers.Handler.Path);

  draw.select.control.events.register('featureadded', {}, function(event) {
    var sumx = 0;
    var sumy = 0;
    var n = 0;
    Pieces.find().forEach(function(piece) {
      if (unitLib[piece.type].level == activeLayer) {
        if (event.feature.geometry.intersects(units[piece._id].geometry)) {
          n = n + 1;
          sumx = sumx + piece.x;
          sumy = sumy + piece.y;
          units[piece._id].style.graphicOpacity = 1;
        } else {
          units[piece._id].style.graphicOpacity = .7;
        }
      } else {
        units[piece._id].style.graphicOpacity = .7;
      }
    });
    event.feature.destroy();
    board[activeLayer].units.redraw();
    if (n > 0) {
      setActiveControl("movepath");
      mx = sumx / n;
      my = sumy / n;
      draw.movepath.control.insertXY(mx,my);
    }
  });
  draw.movepath.control.events.register('featureadded', {}, function(event) {
    var movingPieces = [];
    Pieces.find().forEach(function(piece) {
      if (unitLib[piece.type].level == activeLayer
          && units[piece._id].style.graphicOpacity == 1) {       
        movingPieces.push({
          id: piece._id,
          x: piece.x - mx,
          y: piece.y - my
        });
      }
    });
    var tween = new OpenLayers.Tween(OpenLayers.Easing.Linear.easeIn);
    var tween2 = new OpenLayers.Tween(OpenLayers.Easing.Linear.easeIn);

    var comp = event.feature.geometry.components;
    var i = -1;

    var callbacks = {
      eachStep: function(value) {
        for(var j in movingPieces) {
          var pos = {
          
            x: value.x + movingPieces[j].x,
            y: value.y + movingPieces[j].y
          }
          Pieces.update({_id: movingPieces[j].id},
            {
              $set: pos
            });
        }
      },
    };

    setActiveControl("");

    callbacks.done = function() {

      i = i+1;
      if (i < comp.length) {
        var from;
        if (i == 0) {
          from = { x: mx, y: my }
        } else {
          from = {
            x: comp[i-1].x,
            y: comp[i-1].y
          };
        }
        var to = {
          x: comp[i].x,
          y: comp[i].y
        };
        var duration = Math.sqrt(
          Math.pow(from.x-to.x,2) +
          Math.pow(from.y-to.y,2)
        ) >>> 2;
        if (duration <= 0) {
          duration = 1;
        }
        var swap = tween;
        tween = tween2;
        tween2 = swap;
        tween.start(from, to, duration, {callbacks: callbacks});
      } else {
        event.feature.destroy();
        setActiveControl("select");
      }
    };

    callbacks.done();
  });

  setActiveLayer("land");
  setActiveControl("select");

  map.addControl(new OpenLayers.Control.MousePosition());
  
//  polyControl.activate();

  Pieces.find().observe({
    added: function(newDoc) {
      var newPt = new OpenLayers.Geometry.Point(newDoc.x,newDoc.y);
      units[newDoc._id] = new OpenLayers.Feature.Vector(newPt, null,
        OpenLayers.Util.extend({}, unitLib[newDoc.type].style));
      board[unitLib[newDoc.type].level].units.addFeatures([units[newDoc._id]]);
    },
    changed: function(newDoc, oldDoc) {
      var newLonLat = new OpenLayers.LonLat(newDoc.x, newDoc.y);
      units[oldDoc._id].move(newLonLat);
    },
    removed: function(oldDoc) {
      units[oldDoc._id].destroy();
      delete units[oldDoc._id];
    }
  });
});

Template.sidebar.events({
  'click #createPiece': function() {
    var type = allTypes[(Math.random()*allTypes.length)>>>0];
    Pieces.insert({x: (Math.random()*2592), y: (Math.random()*2592), type: type});
  },
  'click #removePieces': function() {
    Pieces.find().forEach(function(piece) {
      Pieces.remove({_id: piece._id});
    });
  },
  'click .wpg-level': function(event) {
    setActiveLayer(event.target.name);
  },
  'click .wpg-draw': function(event) {
    setActiveControl(event.target.name);
  },
});

