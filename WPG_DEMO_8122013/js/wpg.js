
function Box() {
  this.img= new Image();
  this.x = 0;
  this.y = 0;
  this.w = 1;
  this.h = 1;
}

//Initialize a new Box, add it, and invalidate the canvas
function addRect( id,img, x, y, w, h) {
  var rect = new Box;
  rect.id = new String;
  rect.id = id;
  rect.img = new Image();
  rect.img.src= img;
  //rect.img.crossOrigin = "Anonymous";
  rect.x = x;
  rect.y = y;
  rect.w = w
  rect.h = h
  boxes.push(rect);
  invalidate();
}

// holds all our rectangles
var boxes = []; 
var canvas;
var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 10;  // how often, in milliseconds, we check to see if a redraw is needed

var isDrag = false;
var mx, my; // mouse coordinates

 // when set to true, the canvas will redraw everything
 // invalidate() just sets this to false right now
 // we want to call invalidate() whenever we make a change
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned into an array
var mySel; 
// The selection color and width. Right now we have a red selection with a small width
var mySelColor = '#CC0000';
var mySelWidth = 1;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context
var cloud;
var cloud_x;
// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function init() {
  canvas = document.getElementById('canvas');
  HEIGHT = canvas.height;
  WIDTH = canvas.width;
  ctx = canvas.getContext('2d');
  ghostcanvas = document.createElement('canvas');
  ghostcanvas.height = HEIGHT;
  ghostcanvas.width = WIDTH;
  gctx = ghostcanvas.getContext('2d');
  
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.onselectstart = function () { return false; }
  
  // fixes mouse co-ordinate problems when there's a border or padding
  // see getMouse for more detail
  if (document.defaultView && document.defaultView.getComputedStyle) {
    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  
  //clouds init 
  cloud = new Image();
  cloud.src = './img/cloud.png';
  cloud.onload = function(){
    var width = WIDTH;
    cloud_x = -cloud.width;
  };

  // make draw() fire every INTERVAL milliseconds
  //setInterval(drawcloud, 1);
  setInterval(draw, INTERVAL);
  
  // set our events. Up and down are for dragging,
  // double click is for making new boxes
  canvas.onmousedown = myDown;
  canvas.onmouseup = myUp;
  canvas.ondblclick = myDblClick;
  
  // add custom initialization here:


}
function drawcloud() {
  clear(ctx);
  ctx.drawImage(cloud, cloud_x, 0);
  update();
}

//wipes the canvas context
function clear(c) {
  c.clearRect( 0, 0, WIDTH, HEIGHT);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function draw() {
  drawcloud();
  if (1) {
    // draw all boxes
    var l = boxes.length;
    for (var i = 0; i < l; i++) {
        drawshape(ctx, boxes[i]);
    }
    
    // draw selection
    // right now this is just a stroke along the edge of the selected box
    if (mySel != null) {
      ctx.strokeStyle = mySelColor;
      ctx.lineWidth = mySelWidth;
      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
      showinfo(mySel.id);
    }
    canvasValid = true;
  }

}

//moving clouds
function update(){
  cloud_x += 0.3;
  if (cloud_x > WIDTH ) {
    cloud_x = -cloud.width;
    clear(ctx);
  }
}

function showinfo(id) {
  blockallinfo();
  document.getElementById(id+'-info').style.display = "block";
}

function blockallinfo() {
  document.getElementById('soldier-info').style.display = "none";
  document.getElementById('farm-info').style.display = "none";
  document.getElementById('nuclear-power-info').style.display = "none";
}

// Draws a single shape to a single context
// draw() will call this with the normal canvas
// myDown will call this with the ghost canvas
function drawshape(context, shape) {
  // We can skip the drawing of elements that have moved off the screen:
  if (shape.x > WIDTH || shape.y > HEIGHT) return; 
  if (shape.x + shape.w < 0 || shape.y + shape.h < 0) return;
  context.drawImage(shape.img, shape.x, shape.y, shape.w,shape.h);
}

// Happens when the mouse is moving inside the canvas
function myMove(e){
  if (isDrag){
    getMouse(e);
    mySel.x = mx - offsetx;
    mySel.y = my - offsety;   
    
    // something is changing position so we better invalidate the canvas!
    invalidate();
  }
}

// Happens when the mouse is clicked in the canvas
function myDown(e){
  getMouse(e);
  clear(gctx);
  var l = boxes.length;
  for (var i = l-1; i >= 0; i--) {
    // draw shape onto ghost context
    drawshape(gctx, boxes[i]);
    
    // get image data at the mouse x,y pixel
    var imageData = gctx.getImageData(mx, my, 1, 1);
    var index = (mx + my * imageData.width) * 4;
    
    // if the mouse pixel exists, select and break
    if (imageData.data[3] > 0) {
      mySel = boxes[i];
      mySel.id = boxes[i].id;
      offsetx = mx - mySel.x;
      offsety = my - mySel.y;
      mySel.x = mx - offsetx;
      mySel.y = my - offsety;
      isDrag = true;
      canvas.onmousemove = myMove;
      invalidate();
      clear(gctx);
      return;
    }
    
  }
  // havent returned means we have selected nothing
  mySel = null;
  // clear the ghost canvas for next time
  clear(gctx);
  // invalidate because we might need the selection border to disappear
  invalidate();
}

function myUp(){
  isDrag = false;
  canvas.onmousemove = null;
}

// adds a new node
function myDblClick(e, targetField) {
  getMouse(e);
  // for this method width and height determine the starting X and Y, too.
  // so I left them as vars in case someone wanted to make them args for something and copy this code
  var width = 20;
  var height = 20;
  //addRect("soldier",'./img/WPGsoldier.png',mx - (width / 2), my - (height / 2), width, height);
  var w = window.open('popup.html','_blank','width=400,height=400,scrollbars=1');
  // pass the targetField to the pop up window
  w.targetField = targetField;
  w.focus();
}

    function setSearchResult(targetField, returnValue){
        var width = 20;
        var height = 20;
        //targetField.value = returnValue;
        if (returnValue == 'soldier') {
          addRect("soldier",'./img/WPGsoldier.png',mx - (width / 2), my - (height / 2), width, height);
        };
        if (returnValue == 'farm') {
          addRect("farm",'./img/WPGfarm.png',mx - (width / 2), my - (height / 2), width, height);
        };
        if (returnValue == 'aircraft') {
          addRect("aircraft",'./img/WPGaircraft.png',mx - (width / 2), my - (height / 2), width, height);
        };
        window.focus();
    }



function invalidate() {
  canvasValid = false;
}

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
function getMouse(e) {
      var element = canvas, offsetX = 0, offsetY = 0;

      if (element.offsetParent) {
        do {
          offsetX += element.offsetLeft;
          offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
      }

      // Add padding and border style widths to offset
      offsetX += stylePaddingLeft;
      offsetY += stylePaddingTop;

      offsetX += styleBorderLeft;
      offsetY += styleBorderTop;

      mx = e.pageX - offsetX;
      my = e.pageY - offsetY
}

function displayResult() {
  clear(ctx);
  boxes = [];
  if (document.getElementById("all").checked) {
    drawall();
    $("#all-crises").prop("checked", false);
    $("#all-transportation").prop("checked", false);
    $("#all-power-energy").prop("checked", false);
    $("#all-plants-manufacturing").prop("checked", false);
    uncheckcrises();
    unchecktransportation();
    uncheckpowerenergy();
    uncheckplants();
  }
  if (document.getElementById("all-crises").checked) {
    drawallCrises();
    uncheckcrises();
  };
  if (document.getElementById("all-transportation").checked) {
    drawallTransportation();
    unchecktransportation();
  };
  if (document.getElementById("all-power-energy").checked) {
    drawallPowerEnergy();
    uncheckpowerenergy();
  };
  if (document.getElementById("all-plants-manufacturing").checked) {
    drawallPlantsManufacturing();
    uncheckplants();
  };
  if (document.getElementById("crises-1").checked) {
    addRect("crises","./img/WP_icon_base_dkgreen.png",150, 50, 20, 20);
  };
  if (document.getElementById("soldier").checked) {
    addRect("soldier","./img/WPGsoldier.png",260, 200, 40, 40);
  };
  if (document.getElementById("aircraft").checked) {
    addRect("aircraft","./img/WPGaircraft.png",200, 290, 40, 40); 
  };
  if (document.getElementById("nuclear-power-plant").checked) {
    addRect("nuclear-power","./img/WP_icon_nuclearpower.png",100, 100, 40, 40);
  };
  if (document.getElementById("farm").checked) {
    addRect("farm","./img/WPGfarm.png",110, 80, 40, 40);
  };
}

function drawallCrises() {
  addRect("crises","./img/WP_icon_base_dkgreen.png",150, 50, 20, 20);
  addRect("crises","./img/WP_icon_base_dkgreen.png",100, 50, 20, 20);
  addRect("crises","./img/WP_icon_base_dkgreen.png",180, 150, 20, 20); 
}

function drawallTransportation() {
  addRect("soldier","./img/WPGsoldier.png",260, 200, 40, 40);
  addRect("aircraft","./img/WPGaircraft.png",200, 290, 40, 40); 
}

function drawallPowerEnergy() {
  addRect("nuclear-power","./img/WP_icon_nuclearpower.png",100, 100, 40, 40);
  addRect("nuclear-power","./img/WP_icon_nuclearpower.png",80, 200, 40, 40);
}

function drawallPlantsManufacturing() {
  addRect("farm","./img/WPGfarm.png",110, 80, 40, 40);
  addRect("farm","./img/WPGfarm.png",210, 230, 40, 40);
}

function drawall() {
  drawallCrises();
  drawallTransportation();
  drawallPowerEnergy();
  drawallPlantsManufacturing();
}

function uncheckcrises() {
    $("#crises-1").prop("checked", false);
    $("#crises-2").prop("checked", false);
    $("#crises-3").prop("checked", false);
}

function unchecktransportation(){
    $("#soldier").prop("checked", false);
    $("#aircraft").prop("checked", false);
    $("#stealth-bomber").prop("checked", false);
    $("#helicopter").prop("checked", false);
    $("#ship").prop("checked", false);
    $("#transport-ship").prop("checked", false);
    $("#oil-tanker").prop("checked", false);
    $("#submarine").prop("checked", false);
    $("#truck").prop("checked", false);
    $("#tank").prop("checked", false);
}

function uncheckpowerenergy() {
    $("#hydroelectric-plant").prop("checked", false);
    $("#solar-power-plant").prop("checked", false);
    $("#oil-rig").prop("checked", false);
    $("#oil-production-facility").prop("checked", false);
    $("#nuclear-power-plant").prop("checked", false);
    $("#wind-generator").prop("checked", false);
}

function uncheckplants() {
    $("#chemical-plant").prop("checked", false);
    $("#silicon-plant").prop("checked", false);
    $("#nuclear-processing-plant").prop("checked", false);
    $("#medical-research-facility").prop("checked", false);
    $("#oil-refinery").prop("checked", false);
    $("#food-processing-plant").prop("checked", false);
    $("#software-hardware-manufacturing").prop("checked", false);
    $("#entertainment-complex").prop("checked", false);
    $("#metro-city-university-area").prop("checked", false);
    $("#farm").prop("checked", false);
}

/*function zoomIn() {
  clear(ctx);
  clear(gctx);
  ctx.scale(2,2);
  draw();
  ctx.restore();
}


function zoomOut() {
  var l = boxes.length;
  ctx.scale(0.5,0.5);
  clear(ctx);
  clear(gctx);
  for (var i = 0; i < l; i++) {
        drawshape(ctx, boxes[i]);
  }
  
}*/


  
