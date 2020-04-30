// ========================================================//
// Simple AudioManager class
// ========================================================//

// obj = new SmAudioManager ()
// obj.createAudioScene ();
// 

class SmAudioManager 
{
	constructor (shouldUseResonance, shouldUseBufferSource, binauralMode) {

		this.options = {
			useBufferSource: (shouldUseBufferSource === undefined) ? false : shouldUseBufferSource,
			binauralMode: (binauralMode === undefined) ? true : binauralMode,
			ambisonicOrder: 3, 
			material: 'brick', 
			dimension: 'medium',
			useResonance: (shouldUseResonance === undefined) ? true : shouldUseResonance,
			minDistance: ResonanceAudio.Utils.DEFAULT_MIN_DISTANCE,
			maxDistance: ResonanceAudio.Utils.DEFAULT_MAX_DISTANCE,
			useImpulseResponse: true,
			defaultSourceWidth: 40,
			useSourceWidth: true,
			impulseResponse: 'IRs/Halls/Hall_3.wav'
			//impulseResponse: 'IRs/Rooms/Room_3.wav'
		};

		if (this.options.binauralMode === false)
		{
			this.options.useResonance = false;
		}

		this.dimensions = {
			small: {
				width: 1.5, height: 2.4, depth: 1.3,
			},
			square: {
				width: 2.5, height: 2.5, depth: 2.5,
			},
			medium: {
				width: 4, height: 3.2, depth: 3.9,
			},
			large: {
				width: 8, height: 3.4, depth: 9,
			},
			huge: {
				width: 20, height: 10, depth: 20,
			},
		};

		this.materials = {
			brick: {
				left: 'brick-bare', right: 'brick-bare',
				up: 'brick-bare', down: 'wood-panel',
				front: 'brick-bare', back: 'brick-bare',
			},
			curtains: {
				left: 'curtain-heavy', right: 'curtain-heavy',
				up: 'wood-panel', down: 'wood-panel',
				front: 'curtain-heavy', back: 'curtain-heavy',
			},
			marble: {
				left: 'marble', right: 'marble',
				up: 'marble', down: 'marble',
				front: 'marble', back: 'marble',
			},
			outside: {
				left: 'transparent', right: 'transparent',
				up: 'transparent', down: 'grass',
				front: 'transparent', back: 'transparent',
			}
		};

		this.sources = [];
		this.positions = [];
		this.audioSources = [];
		this.sourcesState = [];
		this.audioReady = false;

		this.createAudioContext ();
	}

	ready () { return this.audioReady; }

	getCurrentRoom () {
		return this.dimensions[this.options.dimension];
	}

	getCurrentMaterial () {
		return this.materials [this.options.material];
	}

	applyRoom () {
		var curRoom = this.getCurrentRoom();
		var curMat    = this.getCurrentMaterial();
		if (curRoom !== undefined && curMat !== undefined)
		{
			this.audioScene.setRoomProperties (curRoom, curMat);
		}
	}

	createAudioContext ()
	{
		// create a default context and a default gain monitor node.
		var AudioContext = (window.AudioContext || window.webkitAudioContext);

		// latency hint set to playback because there is less interactivity
		// and we should maximise playback safety.
		this.audioContext = new AudioContext( { sampleRate: 44100, latencyHint: 'playback' } );

		this.outputGain = this.audioContext.createGain ();
		this.outputGain.connect (this.audioContext.destination);
	}

	createAudioScene () 
	{
		if (this.audioContext && this.audioReady === false) 
		{
			// listener position
			var listener_position = createVector(0.0, 0.0, 0.0);

			if (this.options.useResonance)
			{
				console.log ("create resonance audio scene configuration");

				this.audioScene = new ResonanceAudio (this.audioContext, {ambisonicOrder: this.options.ambisonicOrder});
				this.audioScene.output.connect(this.outputGain);

				this.audioScene.setListenerPosition (
					listener_position.x, 
					listener_position.y, 
					listener_position.z
				); // origin

				this.applyRoom ();
			}
			else // panner node
			{ 
				console.log ("create panner node configuration");

				this.samplesGain = this.audioContext.createGain(); // global gain object

				this.audioContext.listener.setPosition (
					listener_position.x, 
					listener_position.y, 
					listener_position.z
				); // origin

				var useConvolver = this.options.useImpulseResponse;
				
				if (useConvolver) 
				{
					this.loadConvolverSound (this.options.impulseResponse);
				}
				else 
				{
					this.samplesGain.connect (this.audioContext.destination);
				}
			}

			this.audioReady = true;
		}
	}

	loadConvolverSound(filename) 
	{
		console.log ("load impulse response: " + filename);

		var self = this;

		var request = new XMLHttpRequest();

		request.open("GET", filename, true);

		request.responseType = "arraybuffer";

		request.onload = function() 
		{
    		// Create a buffer and keep the channels unchanged.
    		self.audioContext.decodeAudioData (request.response, 

    			function (buffer) 
    			{
    				console.log ("IR info:", buffer.sampleRate, buffer.length, buffer.duration);
    				self.createConvolver (buffer);
    			}, 

    			function() 
    			{
    				console.log ("decoding failed. connect standard main gain to output." );
    				self.samplesGain.connect (this.audioContext.destination);
    			});
		};

		console.log ("send request");
		request.send();
	}

	createConvolver (inputBuffer)
	{
		console.log ("create convolver node !");

		// samplesGain (samples + nodepanner)  => drygain                      => (+) output gain => end
		//								   \=> convolver => convolver gain  => /

		this.convolver = this.audioContext.createConvolver();
		this.convolver.buffer = inputBuffer;

		this.dryGain = this.audioContext.createGain ();
		this.dryGain.gain.value = 0.5;

		this.samplesGain.connect (this.convolver);
		this.samplesGain.connect (this.dryGain);

		if (this.convolverGain === undefined) {	
			this.convolverGain = this.audioContext.createGain ();
			this.convolverGain.gain.value = 0.5;
		}

		this.convolver.connect (this.convolverGain);
		this.convolverGain.gain.value = 1.0;

		this.convolverGain.connect (this.outputGain);
		this.dryGain.connect (this.outputGain);
	}

	map (x, min, max, omin, omax)
	{
		return ((x - min) / (max-min)) * (omax-omin) + omin;
	}

	// position should be ranging from -1, +1 in each dimensions!
	setSourcePositionN (index, x, y, z)
	{
		var cr = this.getCurrentRoom();
		var xs = this.map (x, -1, 1, -cr.width/2, cr.width/2);
		var ys = this.map (y, -1, 1, -cr.height/2, cr.height/2);
		var zs = this.map (z, -1, 1, -cr.depth/2, cr.depth/2);

		//console.log ("new pos("+index+"):"+xs+","+ys+","+zs);

		this.setSourcePosition (index, xs, ys, zs);
	}

	setSourceGain (index, amp) 
	{
		//this.sources [index].gain = min (max (amp, 0.0), 1.0);
		this.audioSources[index].setGain (amp);
	}

	toRadians (deg)
	{
		return deg * Math.PI / 180;
	}

	toDegrees (rad)
	{
		return rad / Math.PI * 180;
	}

	resetOrientation (idx, x, y, z)
	{
		var tx = -x;
		var tz = -z;
		var ty = -y;

		if (isNaN(tx))
			tx=0;
		if (isNaN(ty))
			ty=0;
		if (isNaN(tz))
			tz=0;

		// var mag = Math.sqrt((tx*tx)+(tz*tz)+(ty*ty));
		// if (isNaN(mag))
		// 	mag = 1.0;

		// // normalize
		//tx = tx/mag;
		//ty = ty/mag;
		//tz = tz/mag;

		//console.log ("ty:"+ty);

		if (this.options.useResonance)
		{
			this.sources[idx].setOrientation (tx, -ty, tz, 0, 1, 0);
		}
		else 
		{
			var panner = this.sources[idx];
			if (panner.orientationX)
			{
				panner.orientationX.setValueAtTime(tx, this.audioContext.currentTime);
				panner.orientationY.setValueAtTime(-ty, this.audioContext.currentTime);
				panner.orientationZ.setValueAtTime(tz, this.audioContext.currentTime);
			}
			else 
			{
				// Warning: setting y orientation seems to break audio...!!!!
				panner.setOrientation (tx, -ty, tz);
			}
		}
	}

	// in meters !!!
	setSourcePosition (index, x, y, z)
	{
		this.sources [index].setPosition (x, y, z);
		this.resetOrientation(index, x, y, z);
		this.positions [index].set (x, y, z);
	}

	addSource (core, node) {
		console.log ("add new source: "+node);
		this.sources.push (node);
		this.audioSources.push (core);
		this.positions.push (createVector(0, 0, 0));
		this.setSourceWidth (this.sources.length-1, this.options.defaultSourceWidth);
	}

	sourceIsPlaying (index) {
		return this.audioSources[index].isPlaying();
	}

	createSourceFrom (options)
	{
		var sound = this.options.useBufferSource ? 
			new SmBufferSource (options.url, this.audioContext) :
			new SmAudioSource (options.url, this.audioContext);

		sound.setGain (options.initialGain);

		if (this.options.useResonance) {
			if (this.audioScene) 
			{
				var srcNode = this.audioScene.createSource();
				sound.source.connect (srcNode.input);

				this.addSource (sound, srcNode);
			}
		}
		else // panner node
		{
			
			var pannerNode = this.audioContext.createPanner();

  			pannerNode.panningModel = this.options.binauralMode ? 'HRTF' : 'equalpanner';
  			// equalpanner default.
  			pannerNode.distanceModel = 'inverse';
  			pannerNode.refDistance = this.options.minDistance;
  			pannerNode.maxDistance = this.options.maxDistance;

  			sound.source.connect (pannerNode);

  			pannerNode.connect (this.samplesGain);

  			this.addSource (sound, pannerNode);
		}
	}

	setSourceWidth (index, value)
	{
		if (this.options.useSourceWidth === false)
			return;

		var s = this.sources[index];
		if (s !== undefined)
		{
			if (this.options.useResonance)
			{
				s.setSourceWidth(value);
			}
			else 
			{
				s.coneInnerAngle = value;
				s.coneOuterAngle = 180;
				s.coneOuterGain = 0.05;
				//console.log ("set source width", index, value);
			}
		}
	}

	setSourcesWidth (value)
	{
		for (var i = 0; i < this.sources.length; ++i)
		{
			this.setSourceWidth (i, value);
		}
	}

	stopAll () {
		for (var i = 0; i < this.audioSources.length; ++i)
			this.play (i, false);
	}

	play (index, state)
	{
		if (state === true)
			this.audioSources[index].play();
		else
			this.audioSources[index].stop();
	}

	addSamples (options)
	{
		console.log ('add samples');
		for (var i = 0; i < options.length; ++i)
		{
			this.createSourceFrom (options[i]);
		}	
	}

	normalizeGains () {
		for (var i = 0; i < this.sources.length; ++i) {
			this.sources[i].gain = 1 / this.sources.length * 0.9;
		}
	}
}
