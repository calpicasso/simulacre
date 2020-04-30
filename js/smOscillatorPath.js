
class SmOscillatorPath
{
	constructor (velocity)
	{
		this.position = createVector (0, 0, 0);
		this.angle = Math.random () * Math.PI * 2; // azimuth
		this.elevation = Math.random () * Math.PI; // inclination
		this.angularVelocity = velocity || 0.005;
		this.amplitude = Math.random () * 0.8;
		this.ampVar = this.amplitude;
		this.maxAmpDeviation = 0.1;
		this.trajectory = "3d";
		this.speed = 1.0;
		this.phase = 0;
		this.update ();
	}

	limitCoord (c)
	{
		const cs = Math.sign(c);
		const cv = Math.abs(c);
		return Math.min (this.maxDistance, Math.max (this.minDistance, cv)) * cs;
	}

	update () 
	{
		if (this.trajectory === 'square' )
		{
			this.position.x = Math.cos (this.angle + this.phase) * this.amplitude;	
			this.position.y = Math.sin (this.angle + this.phase) * this.amplitude;

			//squared to allow square
			if (this.minDistance && this.maxDistance) 
			{
				this.position.x = this.limitCoord (this.position.x);
				this.position.y = this.limitCoord (this.position.y);
			}
		}
		else 
		{
			this.position.x = Math.cos (this.angle + this.phase) * this.ampVar;
			this.position.y = Math.sin (this.angle + this.phase) * this.ampVar;
		}

		if (this.trajectory == "2d") 
		{
			this.position.z = 0;	
		} 
		else 
		{	 
			this.position.z = Math.sin (this.elevation) * this.ampVar;
		}
	}

	getCurrentAmplitude () { return this.ampVar; }
	getCurrentAngle () { return this.angle; }

	oscillate ()
	{
		this.angle += this.angularVelocity * this.speed;
		this.elevation += this.angularVelocity * 0.5 * this.speed;

		this.ampVar = this.amplitude + Math.sin ((millis() * 0.001) + this.phase) * this.maxAmpDeviation;
		this.ampVar = Math.min (Math.max(this.ampVar, 0.1), 1.0);
		
		this.update ();
	}
}