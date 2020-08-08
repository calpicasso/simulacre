

//========================================================================//

var canvas, audioContext, audioScene;

//========================================================================//


function mapX(x) {
	return map(x, -1, 1, 0, width);
}

function mapY(y) {
	return map(y, -1, 1, 0, height);
}

function mapZ(z) {
	return z;
}

const TWOPI = Math.PI * 2;
const allowZ = true, allowXY = false;

//========================================================================//

var APP_ = 
{
	useBinaural: true,
	sourceWidth: 40, // 360 = should be equivalent to full omnidirectional
	useSourceWidth: true,
	useResonanceAudio: false,
	useBufferSource: false,

	projectionIntensity: 0.0,
	projectionScale: 1.0,

	fullscreen: false,

	// used only for non-resonance webaudio
	
	stdDryGain: 0.5,
	stdWetGain: 0.5,
	bgAlpha: 64,
	thisTime: 0,
	startTimeMs: 0,
	lastUpdate: 0,
	started: false,
	showInfo: false,
	minUpdateDuration: 25,
	particles: [],
	globalGain: 7.0,
	globalSpeed: 1.28,

	timelineVisible: true,

	objects: 
	[
	// new SmObject({url: 'audio/me.m4a', mass: 1.0, gain: 0.99, 
	// 	trajectory: 'square', minDistance: 0.2, maxDistance: 0.4,
	// 	seq:[ 
	// 	{time: 0.0, dur: 120.0}
	// 	]
	// })

	new SmObject({url: 'audio/respi02.m4a', mass: 1.0, gain: 0.99, 
		seq:[ 
		{time: 0.0, dur: 20.0}, {time: 30.0, dur: 70}, {time: 120.0, dur: 40}, 
		{time: 190.0, dur: 50}, {time: 260.0, dur: 25} 
		]
	}),

	new SmObject({url: 'audio/gongy.m4a', mass: 1.0, gain: 0.9, 
		seq:[ {time: 18.0, dur: 30}, {time: 120.0, dur: 1.} ]
	}),

	new SmObject({url: 'audio/respi.m4a', mass: 1.3, gain: 1.1,
		seq:[ {time: 240, dur: 40} ]
	}),

	new SmObject({url: 'audio/gongyd.m4a', mass: 1.0, gain: 0.9, 
		seq:[ {time: 40.0, dur: 40.} , {time: 120.0, dur: 60.}]
	}),

	new SmObject({url: 'audio/myvoice.m4a', mass: 1.0, gain: 0.8, 
		seq:[ {time: 50.0, dur: 40}, {time: 150.0, dur: 30} ]
	}),

	new SmObject({url: 'audio/me.m4a', mass: 0.97, gain: 0.5, 
		seq:[ {time: 70.0, dur: 110} ]
	}),

	new SmObject({url: 'audio/bass.m4a', mass: 2.0, gain: 0.7, 
		seq:[ {time: 110.0, dur: 50} ]
		, trajectory: 'square',  minDistance: 0.001, maxDistance: 0.3
	}),

	new SmObject({url: 'audio/thismoment.m4a', mass: 1.3, gain: 0.2, 
		seq:[ {time: 110.0, dur: 30} ]
	}),

	new SmObject({url: 'audio/ambbgf.m4a', mass: 4, gain: 0.4, 
		seq:[ {time: 70.0, dur: 89.}, {time: 160.0, dur: 15} ]
	}),

	new SmObject({url: 'audio/winds.m4a', mass: 0.8, gain: 0.9, 
		seq:[ {time: 60.0, dur: 180} ]
	}),

	new SmObject({url: 'audio/elec.m4a', mass: 1.0, gain: 0.99, 
		seq:[ {time: 200.0, dur: 20} ]
	}),

	new SmObject({url: 'audio/echo.m4a', mass: 0.65, gain: 0.1, 
		seq:[ {time: 50.0, dur: 10}, {time: 70.0, dur: 15},
		{time: 234.0, dur: 40.} ]
	}),

	new SmObject({url: 'audio/hello.m4a', mass: 1.3, gain: 1.1, 
		seq:[ {time: 80.0, dur: 200} ]
	}),

	new SmObject({url: 'audio/hello.m4a', mass: 1.3, gain: 1.0, 
		seq:[ {time: 80.0 + 28., dur: 180} ]
	}),

	new SmObject({url: 'audio/longclick.m4a', mass: 1.0, gain: 0.99, 
		seq:[ {time: 120.0, dur: 120} ]
	}),

	new SmObject({url: 'audio/warble.m4a', mass: 0.15, gain: 0.045, 
		trajectory: 'square', seq:[ {time: 185, dur: 60} ], minDistance: 0.001, maxDistance: 0.4
	}),

	new SmObject({url: 'audio/warble-1100.m4a', mass: 0.2, gain: 0.025, 
		trajectory: 'square', seq:[ {time: 185, dur: 60} ], minDistance: 0.001, maxDistance: 0.6
	}),

	],

	getObjectName (idx) {
		return this.objects[idx].name;
	},

	toggleFullscreen: function ()
	{
		this.fullscreen = ! this.fullscreen;
		fullscreen(this.fullscreen);
	},

	toggleTimeline: function ()
	{
		this.timelineVisible = ! this.timelineVisible;
	},

	elapsedTime: function () {
		return millis() - this.startTimeMs;
	},

	restart: function  ()
	{
		this.gotoTime (0);
	},

	monitorSequence: function() 
	{
		if (! this.audioManager.ready ())
			return;

		// restart when done.
		if (this.elapsedTime() > this.maxDurationMs) {
			console.log ("finished");
			this.started = false;
		}
	},

	setPlayState: function (index, state) 
	{
		if (! APP_.audioManager.sourceIsPlaying(index)) {
			APP_.audioManager.play(index, state);
		}
	},

	stopAll: function () {
		APP_.audioManager.stopAll ();
	},

 	gotoTime: function(timeInMillis)
	{
		this.stopAll ();
		APP_.startTimeMs = millis () - (timeInMillis * 1000);
	},

	sourceIsNow: function (idx) {
		return this.objects[idx].getPlayState (this.elapsedTime());
	},

	getInitialGain: function (idx) {
		return this.objects[idx].initialGain;
	},

	getSourceGain: function (idx) {
		return this.objects[idx].gain;
	},

	setSourceGain: function (idx, v) {
		v = min(1.0, max(0, v));
		if (this.audioManager.ready()) {
			this.audioManager.setSourceGain(idx, v);
		}
		this.objects[idx].gain = v;
	},

	initializeObjects: function ()
	{
		var thismaxdur = 0;
		for (var i = 0; i < this.objects.length; ++i)
		{
			thismaxdur = max (thismaxdur, this.objects[i].getEndTime());
		}

		this.maxDurationMs = thismaxdur;
		if (this.maxDurationMs < 0) {
			this.maxDurationMs = 60000; // say it one minute
		}
		// console.log ("max duration is: " + nf(this.maxDurationMs/1000., 3, 2));
	},

	loadSamples: function (obj) {
		this.audioManager.addSamples (obj);
	},

	getParticle: function (idx) {
		return this.particles [idx];
	},

	addParticle: function (p) {
		this.particles.push (p);
	},

	getParticleCount: function () {
		return this.objects.length;
	},

	updateCanvas: function () {
		if (this.canvas !== undefined) {
			
			// this.canvas.position(x, y);
			var ww = min (windowWidth, windowHeight) - 20;

			var x = (windowWidth - ww) / 2;
			var y = (windowHeight - ww) / 2;

			this.canvas.position (x, y);

			resizeCanvas (ww, ww, true);
		}
	},

	// should not be touched dynamically
	gainOscillationFrequency: 0.01,

	updatePositions: function () {
		if (this.audioManager.ready()) 
		{
			var dur = millis() - this.lastUpdate;
			if (dur < this.minUpdateDuration)
				return;

			for (var i = 0, max = this.audioManager.sources.length;  i < max; ++i)
			{
				var part = this.getParticle(i); 
				part.speed = this.globalSpeed;
				var pp = part.position;
				var gain = this.getInitialGain (i) * map (Math.sin (this.gainOscillationFrequency * (millis() * 0.001) + part.phase), -1, 1, 0.1, 1.0);

				// yes y == z in that case
				this.audioManager.setSourcePositionN(i, pp.x, pp.z, pp.y);
				this.setSourceGain (i, gain);

				var playState = this.objects[i].getPlayState (this.elapsedTime());
				this.setPlayState (i, playState);
			}

			this.lastUpdate = millis();
		}
	},

	setGlobalGain: function (gainValue)
	{
		this.audioManager.outputGain.gain.setValueAtTime (gainValue, 
			this.audioManager.audioContext.currentTime);
	},

	audioReady: function () {
		return this.audioManager.ready();
	},

	resumeAudioManagerIfNeeded ()
	{
		if (this.audioManager.audioContext.state === 'suspended')
		{
			console.log ("audiocontext suspended. resuming...");
			this.audioManager.audioContext.resume();
		}
	},

	startAudio: function () {
		if (this.audioManager.ready() === false) 
		{
			this.resumeAudioManagerIfNeeded ();
			//console.log (this.audioManager.audioContext);

			this.audioManager.createAudioScene();
			this.setGlobalGain (this.globalGain);
			this.loadSamples (APP_.objects);
		}

		this.startTimeMs = millis();
		this.started = true;
	}
}

function setupGraphics ()
{
	var radius = 0.7;
	var pcount = APP_.getParticleCount();

	for (var i = 0; i < pcount; ++i)
	{
		// the audio object
		var obj = APP_.objects [i];

		// the graphical object
		var part = new SmOscillatorPath ();

		part.angle = i / pcount * Math.PI * 2;

		// first object to start is at max amplitude
		part.phase = i == 0 ? (Math.PI * 0.5) : (Math.random() * (Math.PI * 2) / obj.mass);


		if (obj.trajectory === 'square') 
		{
			//part.angularVelocity = 0.001;
			part.trajectory = obj.trajectory;
			part.minDistance = obj.minDistance;
			part.maxDistance = obj.maxDistance;
			part.amplitude = (obj.amplitude === undefined) ? 1.0 : obj.amplitude;  // full
			part.maxAmpDeviation = 0;
		}
		else 
		{
			// objects with bigger mass will oscillate slower
			// and have a lesser amplitude, closer to the origin.
			part.amplitude = 0.15 + (Math.random () / (sq(obj.mass)) * 0.7);
		}

		part.angularVelocity *= (1. / obj.mass);

		if (Math.random() > 0.5)
			part.angularVelocity *= -1; 

		part.update();

		APP_.addParticle (part);
	}
}

function setupAudio ()
{
	APP_.audioManager = new SmAudioManager (APP_.useResonanceAudio, APP_.useBufferSource);
	APP_.audioManager.options.defaultSourceWidth = APP_.sourceWidth;
	APP_.audioManager.options.useSourceWidth = APP_.useSourceWidth;
	APP_.initializeObjects ();
}

var gui;


function setupStartGui ()
{
	gui = new dat.GUI();

	//var advancedFold = gui.addFolder('Advanced');
	//advancedFold.add (AdvancedOptions, 'renderer', ['ResonanceAudio', 'PannerHRTF', 'EqualPower']);
}

function setupGui ()
{
	if (gui === undefined) {
		gui = new dat.GUI();
	} 

	var mainFold = gui.addFolder('Main');
	mainFold.open();
	mainFold.add( APP_, 'globalGain', 0.1, 10.0).name("Out Gain").listen().onChange(function ()
	{
		console.log ('change output gain', APP_.stdDryGain);
		APP_.setGlobalGain (APP_.globalGain);
	});

	mainFold.add( APP_, 'globalSpeed', 0.05, 2.0).listen();
	mainFold.add( APP_, 'bgAlpha', 10, 255).listen();

	if (APP_.audioManager.options.useResonance === false)
	{
		mainFold.add( APP_, 'stdDryGain', 0.0, 1.0).name ("dry").listen().onChange(function()
		{
			console.log ('change dry gain', APP_.stdDryGain);
			APP_.audioManager.dryGain.gain.value = APP_.stdDryGain;
		});		

		mainFold.add( APP_, 'stdWetGain', 0.0, 1.0).name ("wet").listen().onChange(function()
		{
			console.log ('change wet gain', APP_.stdWetGain);
			APP_.audioManager.convolverGain.gain.value = APP_.stdWetGain;
		});	
	}

	mainFold.add( APP_, 'sourceWidth', 0.0, 360.0).name ("source width").listen().onChange(function()
	{
		//console.log ('change wet gain', APP_.stdWetGain);
		APP_.audioManager.setSourcesWidth (APP_.sourceWidth);
	});	
	mainFold.add( APP_, 'showInfo').name("show info");
	mainFold.add( APP_, 'toggleTimeline').name ("show timeline");
	mainFold.add( APP_, 'toggleFullscreen').name ("fullscreen");
	mainFold.add( APP_, 'projectionIntensity', 0.0, 1.0);
	mainFold.add( APP_, 'projectionScale', 1.0, 5.0);
	mainFold.add( APP_, 'restart');

	// var smplFold = gui.addFolder('Samples');
	// for (var i = 0; i < APP_.objects.length; ++i)
	// {
	// 	var curobj = APP_.objects[i];
	// 	smplFold.add (curobj, 'playState').name(curobj.name).listen();
	// }

	gui.close();
}


function initApp ()
{
	setupAudio ();
	setupGraphics ();
	setupGui();

	APP_.updatePositions();
}


function checkOptions () 
{
	var testExp = new RegExp('Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile' , 'i');
	var isMobile = false;

	if (testExp.test(navigator.userAgent))
	{
		isMobile = true;
	}

	var browserInfo = getBrowserInfo ();
	if (browserInfo !== undefined)
	{
		console.log(browserInfo);

		if (APP_.useBinaural === true)
		{
			if (browserInfo.name == "Chrome")
			{
				var va = browserInfo.version.split('.');
				var maj = parseFloat (va[0]);
				var min = parseFloat (va[1]);
				var vv =  parseFloat (va[2]);

				// seems to be the correct setup for resonance audio
				if (isMobile === false && maj >= 72 && min >= 0 && vv >= 3626)
				{

					APP_.useResonanceAudio = true;
					APP_.useBufferSource = false; // cracks+pops with resonance and buffer source (strange...)
				}
				else 
				{
					// fallback for other versions as i cannot test them...
					APP_.useResonanceAudio = false;
					APP_.useBufferSource = true;
				}
			}
			else if (browserInfo.name == "Safari")
			{
				APP_.useResonanceAudio = false; // does not work well and no room support on Safari.
				APP_.useBufferSource = true; // Safari seems to support better the buffer sources than the media source...
				APP_.sourceWidth = 81; // strange things happen when we tend to not use an omnidirectional source, 
				// and the engine may abruptely stop the playback without any error/notifications when we reduce the sourcewith
				// seems like 81 is an inbetween value supported, but it is completly empirical and i have no clue without proper 
				// technical feedback on this issue.

				// var va = browserInfo.version.split('.');
				// var maj = parseFloat (va[0]);
				// var min = parseFloat (va[1]);
				// var vv =  parseFloat (va[2]);

				// if (maj >= 12 && min >= 0 && vv >= 3)
				// 	APP_.useResonanceAudio = true;
			}
			else if (browserInfo.name == "Firefox")
			{
				APP_.useResonanceAudio = true;
				APP_.useBufferSource = false; 
			}
		}
		else 
		{
			APP_.useResonanceAudio = false;
			APP_.useBufferSource = true;
		}
	}

	// if the browser reach this code then it does support the app.
	var warning = document.getElementById("warning");
	if (warning !== undefined) {
		console.log ("remove warning div.");
		warning.style.visibility = "hidden";
		warning.remove();
	}
}

function setup() 
{
	checkOptions();

	if (APP_.useResonanceAudio) 
	{
		console.log ("Resonance Audio Render Mode Activated");
	}
	else 
	{
		console.log ("Resonance Audio Render Mode Deactivated: Use Standard Panner Node with HRTF");
	}

	APP_.canvas = createCanvas (windowWidth, windowHeight);
	APP_.updateCanvas();
	//APP_.canvas.parent('sketch');

	smooth();
	noiseSeed(13);
	ellipseMode (CENTER);

	//setupStartGui();

	initApp();
}

function windowResized ()
{
	APP_.updateCanvas ();
}

function keyPressed ()
{
	if (key == 'i') {
		APP_.showInfo = ! APP_.showInfo;
	}
}

function getObjectInfo (i)
{
	var thisPosition = APP_.audioManager.positions[i];
	var info = APP_.getObjectName(i) + ", " + nf(APP_.getSourceGain(i), 1, 2);
	if (thisPosition) {
		info += " ("
		+ nf (thisPosition.x, 2, 2) + ","
		+ nf (thisPosition.y, 2, 2) + ","
		+ nf (thisPosition.z, 2, 2) + 
		")";
	}

	// // + nf(p.getCurrentAmplitude(), 2, 2) + ", " 
	// // + nf(p.getCurrentAngle (), 2, 2) + ")"

	
	return info;
}

function drawParticles ()
{

	// update particles position and draw them

	var am = APP_.audioManager;
	var maxM = APP_.objects.length;

	for (var i = 0, max = APP_.getParticleCount(); i < max; ++i)
	{
		var p = APP_.getParticle(i);
		var pos = p.position;

		var scaleZ = map (p.position.z, -1, 1, 0.5, 2.0);
		var projectionZ = map (APP_.projectionIntensity, 0.0, 1.0, 1.0, scaleZ * 0.5 * APP_.projectionScale);

		const mposx = mapX (p.position.x);
		const mposy = mapY (p.position.y / projectionZ);

		const audioReady = am.ready () && am.sourceIsPlaying(i);
		noStroke();

		var drawNames = true;
		if (p.trajectory == 'square')
		{
			if (audioReady) 
			{
				stroke (255, 100);
				
				//line (mposx - 10, mposy, mposx + 10, mposy);
				//line (mposx, mposy - 10, mposx, mposy + 10);

				//colorMode(HSB, 255, 255, 255, 255);
				//fill (map(scaleZ, 0.5, 2.0, 50, 255), 255, 200, 100 + Math.sin (millis() / 100) * 100);
				noFill();
				rect (mposx - 4, mposy - 4, 8, 8);

				//noFill();
				line (mapX(0), mapY(0), mposx, mposy);

				ellipse (mposx, mposy, 2);
				colorMode (RGB);
			}
			else 
			{
				drawNames = false;
			}
		}
		else // standard sound particle
		{
			if (audioReady) 
			{
				colorMode(HSB, 255, 255, 255, 255);
				fill (map(scaleZ, 0.5, 2.0, 50, 255), 255, 200, 100 + Math.sin (millis() / 100) * 100);
				colorMode (RGB);
				scaleZ *= APP_.getSourceGain (i);
				ellipse (mposx, mposy, 20 * scaleZ);
				fill (255, 0, 0, 200); // red for playing ones
			}
			else
				fill (255, 100); // white for non playing ones

			// draw the mini ellipse
			ellipse (mposx, mposy, 2);

			// draw the trajectory (for the std)
			noFill();
			stroke (255, 40);

			var ellipseSize = map (p.getCurrentAmplitude(), 0, 1, 0, min(width, height));
			ellipse (width/2, height/2, ellipseSize, ellipseSize / projectionZ);
		}

		if (drawNames) 
		{
			noStroke();

			textSize(11);

			var tx = mposx+10;
			var ty = mposy-10;

			if (audioReady)
			{
				//fill (255, 100, 100, 70);
				fill (255, 255, 255, 200);
			}
			else
				fill (255, 255, 255, 70);

			text (nf(i, 2, 0), tx, ty);

			if (APP_.showInfo === true) 
			{
				var oi = getObjectInfo(i);
				fill (255, 255, 255, 200);
				text (oi, tx, ty + 10);
			}
		}

		p.oscillate();
	};
}


var seq_x = 10, seq_y, seq_w, seq_h;

function mouseInSeq ()
{
	if (mouseX >= seq_x && mouseX <= seq_x + seq_w
	 	&& mouseY >= seq_y && mouseY <= seq_y + seq_h)
	{
		var xtime = ((mouseX - seq_x) / seq_w) *  APP_.maxDurationMs + APP_.startTimeMs;
		APP_.thisTime = xtime;
	}
}

function drawSequenceTime ()
{
	if (! APP_.timelineVisible)
		return;

	textSize (11);
	noFill ();
	stroke (255, 70);

	var offsetx = 10;
	var w = width - 20;
	var h = 5;
	var dur = APP_.maxDurationMs;
	var curt = APP_.started ? APP_.elapsedTime() : 0;
	var cursorx = (curt / dur * w) + offsetx;
	var cursory = height - h - 10;

	seq_x = offsetx;
	seq_y = cursory;
	seq_w = w;
	seq_h = h;


	rect (offsetx, cursory, width - 20, h);

	noStroke();
	fill (255, 200);
	rect (cursorx, cursory, 2, h);

	text (nf(curt / 1000., 3, 2), cursorx, cursory - 10);
}

function drawListener () 
{
	var w = 10;
	var cx = width/2;
	var cy = height/2;

	noFill();
	stroke (255);
	line (cx-w, cy, cx+w, cy);
	line (cx, cy-w, cx, cy+w);

	if (APP_.listenerImage !== undefined) 
	{
		var ratio = max (9, 3000 / max(width, height));
		//console.log('ratio', ratio);
		var iw = APP_.listenerImage.width / ratio;
		var ih = APP_.listenerImage.height / ratio;
		image (APP_.listenerImage, cx - (iw/2), cy - (ih/2), iw, ih);
	}
}

function mouseClicked ()
{
	// restrict only to the canvas
	if (mouseX >= 0 && mouseX < width && 
		mouseY >= 0 && mouseY < height)
	{
		if (! APP_.started) 
		{
			console.log ('!!!! again !!!!');
			APP_.startAudio();
			APP_.restart();
			//APP_.gotoTime (178);
			return;
		}

		//mouseInSeq ();
	}
}

function preload ()
{
	// var img = loadImage('img/brainbw.jpg', function() {
	// 	APP_.listenerImage = img;
	// });
}

function draw() 
{
	background(0, APP_.bgAlpha);

	drawListener ();
	if (APP_.started === true)
	{
		drawParticles();
		APP_.updatePositions();

		APP_.monitorSequence();
		drawSequenceTime ();	
	}
	else 
	{
		textAlign(CENTER, CENTER);

		if (1)
		{
			const msg = APP_.useResonanceAudio ? 
				"Using Resonance Audio HRTF Mode" :
				"Using PannerNode HRTF Mode (Resonance deactivated)";

			const bmsg = APP_.useBufferSource ?
				"Using BufferSource" :
				"Using MediaSource"; 

			textSize (11);
			fill (255);
			noStroke();
			text (msg + " (v"+getVersionString()+")", width/2 - 200, height/2 + 70, 400);
		}

		stroke (200);
		fill (255, 40);
		textSize (30);
		
		text ("Touch to Start", width/2 - 200, height/2 +40, 400);
		textAlign(LEFT, CENTER);
	}

	// noFill ();
	// stroke (255, 70);
	// rect (0, 0, width-1, height-1);
}

function getVersionString () { return "0.3"; }

console.log ("Simulacre v"+getVersionString());

