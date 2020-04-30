//============================================================//
// SmBufferSource class : only for small buffers, cache & read from memory
//============================================================//

class SmBufferSource
{
	constructor (url, ctx)
	{
		this.playState = false;
		if (url && ctx)
			this.setup (url, ctx);	
	}

	bufferDecoded (b)
	{
		this.audioBuffer = b; // AudioBuffer
	}

	createBufferRequest (url)
	{
		var request = new XMLHttpRequest();

		request.open("GET", url, true);
		request.responseType = "arraybuffer";

		var self = this;

		request.onload = function () {
    		self.audioContext.decodeAudioData (request.response,
    			function (b) { self.bufferDecoded (b); },
    			function (err) { console.error('decodeAudioData error', error);}
    		);
		};

 		request.onerror = function() {
    		console.log ('Request.onError: XHR failure');
  		};

  		return request;
	}

	setup (url, audioContext) 
	{
		if (url && audioContext) 
		{
			this.audioContext = audioContext;
			this.source = audioContext.createGain ();
			this.playState = false;

			var request = this.createBufferRequest(url);
			request.send ();
		}
	}

	// cannot be greater than 1.0
	setGain (g) {
		this.source.gain.value = g;
	}

	isPlaying () {
		return (this.playState === true);
	}

	play ()
	{
		if (this.audioBuffer && this.playState === false)
		{
			var self = this;
			this.bufferSource = this.audioContext.createBufferSource();
			this.bufferSource.buffer = this.audioBuffer;
			this.bufferSource.onended = (event) => {
				self.bufferSourceEnded();
			};
			this.bufferSource.connect (this.source);
			this.bufferSource.start();
			this.playState = true;
		}
	}

	bufferSourceEnded () 
	{
		this.playState = false;
		this.bufferSource = undefined;
	}

	stop () 
	{
		if (this.playState === true) 
		{
			// premature stop
			if (this.bufferSource) {
				this.bufferSource.stop();
			}
			
			this.bufferSourceEnded ();
		}
	}

} // end of VxBufferSource


//============================================================//
// SmAudioSource class : cache & read from streaming/disk I/O involved
// better for large audio files.
//============================================================//

class SmAudioSource 
{
	constructor(url, ctx) 
	{
		if (url && ctx)
			this.setup (url, ctx);
	}

	setup (url, audioContext) {
		if (url && audioContext) {
			var core = document.createElement('audio');
			core.src = url;
			core.crossOrigin = 'anonymous';
			core.loop = false;
			core.volume = 1.0;
			core.load();
			this.audioContext = audioContext;
			this.core = core;
			this.media = audioContext.createMediaElementSource(this.core);
			this.source = audioContext.createGain ();
			this.media.connect (this.source);
		}
	}

	// cannot be greater than 1.0
	setGain (g) {
		//this.source.gain.value = g;
		this.source.gain.linearRampToValueAtTime(Math.min(1.,Math.max(0,g)), 
			this.audioContext.currentTime + 0.01);
	}

	isPlaying () {
		return ! this.core.paused;
	}

	play ()
	{
		if (this.core && ! this.isPlaying())
			this.core.play();
	}

	stop () {
		if (this.core && this.isPlaying()) {
			this.core.pause();
		}
	}
}
