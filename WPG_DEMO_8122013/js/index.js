var canvas;
var ctx;
 
var background;
var width = 300;
var height = 200;
 
var cloud;
var cloud_x;
 
function init() {
	land();
}


function land() {
	canvas = document.getElementById("land");
	width = canvas.width;
	height = canvas.height;
	ctx = canvas.getContext("2d");
 
	// init background 
	background = new Image();
	background.src = './img/WP_Map_mockup.png';
 
	// init cloud
	cloud = new Image();
	cloud.src = 'http://silveiraneto.net/wp-content/uploads/2011/06/cloud.png';
	cloud.onload = function(){
		cloud_x = -cloud.width;
	};
 
	return setInterval(main_loop, 10);
}
 

function update(){
	cloud_x += 0.3;
	if (cloud_x > width ) {
		cloud_x = -cloud.width;
	}
}
 
function draw() {
	ctx.drawImage(background,0,0);
	ctx.drawImage(cloud, cloud_x, 0);
}
 
function main_loop() {
	draw();
	update();
}
 
init();