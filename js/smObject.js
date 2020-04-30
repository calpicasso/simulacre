class SmObject {

	// sequence is specified in seconds, format allow:
	// sequence: [ 
	// {time: 0, end: -1} // start at 0 then infinite
	// {time: 0, end: 30.1} // start at 0 then stop at 30.1 seconds
	// {time: 20, end: 21.1} // start at 0 then stop at 30.1 seconds
	// ]
	constructor (config)
	{
		this.url = config.url;
		this.trajectory = config.trajectory;

		const objgain = config.gain || 1.0;

		this.initialGain = objgain;
		this.gain = objgain;
		this.mass = config.mass || 1.0;
		
		this.minDistance = config.minDistance;
		this.maxDistance = config.maxDistance;

		this.isPlaying = false;

		this.name = undefined;
		this.source = undefined; // source object
		this.playState = false;

		const split = this.url.split('/');
		if (split.length > 0) {
			this.name = split [split.length-1];
		}

		if (config.seq !== undefined)
		{
			var sq = config.seq;
			var start = 0.0;
			for (var i = 0; i < sq.length; ++i)
			{
				var seq = sq [i];
				var curStart = seq.time || start;
				var curEnd = seq.dur || -1;
				this.addTimeRangeSeconds (curStart, curEnd);
				start = curEnd;
			}
		}
		else 
		{
			this.addTimeRangeSeconds (config.time || 0.0, config.dur || -1);
		}
	}

	getEndTime () 
	{
		var maxT = 0;
		for (var max = this.timeRange.length, i = 0; i < max; ++i)
		{
			if (this.timeRange[i].end < 0) {
				return -1; // infinite
			}
			else {
				maxT = Math.max (maxT, this.timeRange[i].end);
			}
		}
		return maxT;
	}

	// specified in seconds !
	addTimeRangeSeconds (start, duration)
	{
		this.addTimeRange (start * 1000, duration * 1000);
	}

	addTimeRange (startMillis, durationMillis)
	{
		if (this.timeRange === undefined)
			this.timeRange = [];

		console.log (this.name, "add timerange:" + startMillis + "," + durationMillis);

		this.timeRange.push ({start: startMillis, end: (startMillis+durationMillis)});
	}

	// in milliseconds;
	isInTimeRange (t)
	{
		for (var max = this.timeRange.length, i = 0; i < max; ++i)
		{
			var current = this.timeRange [i];
			if (t >=  current.start)
			{
				if (current.end < 0)
					return true; 
				else 
				{
					if (t < current.end)
						return true;
				}
			}
		}
		return false;
	}

	// in milliseconds
	getPlayState (currentTime)
	{
		return (this.playState = this.isInTimeRange (currentTime));
	}
}
