function noteToFrequency(note) {
	return Math.pow(2, (note - 69) / 12) * 440.0;
}

/*
function CircularArray(size) {
	this.array = new Float32Array(size); 
	this.size = size;
	this.current = 0;

	this.get = function(size) {
	};
}; */

/*
var processor = context.createScriptProcessor(2048);
processor.onaudioprocess = onProcess;
function onProcess(e) {
  var leftIn = e.inputBuffer.getChannelData(0);
  var rightIn = e.inputBuffer.getChannelData(1);
  var leftOut = e.outputBuffer.getChannelData(0);
  var rightOut = e.outputBuffer.getChannelData(1);

  for (var i = 0; i < leftIn.length; i++) {
    // Flip left and right channels.
    leftOut[i] = leftIn[i];
    rightOut[i] = rightIn[i];
  }
}*/
var size = 44100;
var sinbuffer = context.createBuffer(1, size, 44100);
var data = sinbuffer.getChannelData(0);
for(var i = 0; i < size; i++) {
	data[i] = (Math.sin(Math.PI * i / size)+1) * 0.5;
}

function getSineCurve() {
	/*var curve1 = new Float32Array(size);
	var curve2 = new Float32Array(size);
	for(var i = 0; i < size; i++) {
		curve1[i] = (Math.sin(Math.PI * i / size)+1) * 0.5;
		curve2[i] = (Math.cos(Math.PI * i / size)+1) * 0.5;
	}*/

	var source = context.createBufferSource();
	source.loop = true; // Make sure that sound will repeat over and over again
	source.buffer = sinbuffer; // Assign our buffer to the source node buffer
	source.loopEnd = 44100;
	return source;
	/*var source = context.createAudioBuffer();
	source.setWaveTable(waveTable);
	source.loop = true;
	return source;*/
}
var nicewave = getSineCurve();
console.log(nicewave);
nicewave.start(0);

function Offsetter(scale, offset) {
	var t = {};
	t.processor = context.createScriptProcessor(4096, 1, 1);
	t.offset = offset;
	t.scale = scale;

	function onProcess(e) {
		//console.log("OFFSET: " + t.offset + ". Scale: " + t.scale);
		var input = e.inputBuffer.getChannelData(0);
		var output = e.outputBuffer.getChannelData(0);

		for(var i = 0; i < input.length; i++) {
			//output[i] = (input[i]+t.offset )*t.scale;
			console.log(output[i]);
		}
	};
	t.processor.onaudioprocess = onProcess;

	t.connectInput = function(source) {
		console.log(t.processor);
		source.connect(t.processor);
	}
	t.connectOutput = function(target) {

		t.processor.connect(target);
	}
	return t;
};
var offset = Offsetter(0.5, 1);

lfo = (function() {
	var obj = {};
	obj.osc = context.createOscillator();
	obj.scale = context.createGain();

	// Default values;
	obj.osc.frequency.value = 2;

	obj.setFrequency = function(frequency) {
		var f = Math.max(0.0000, Math.Min(1.0000, frequency));
		obj.osc.frequency.value = f;
	};
	obj.setScale = function(scale) {
		obj.scale.gain.value = scale;
	};
	obj.setType = function(type) {
		obj.osc.type = type;
	};
	obj.setWave = function(periodicWave) {
		obj.osc.setPeriodicWave(periodicWave);
	};
	obj.connectOutput = function(target) {
		obj.scale.connect(target);
	};
	return obj;
})();

vibrato = (function() {
	var obj = {};
	obj.vibrato = context.createOscillator();
	obj.vibrato.type = 'sine';
	obj.vibrato.frequency.value = 5;
	obj.vibratoGain = context.createGain();
	obj.vibratoGain.gain.value = 40;
	obj.vibrato.connect(obj.vibratoGain);

	obj.setFrequency = function(frequency) {
		obj.vibrato.frequency.value = frequency;
	}

	obj.setScale = function(scale) {
		obj.vibratoGain.gain.value = scale;
	}

	obj.start = function(time) {
		obj.vibrato.start(time);
	}

	obj.connectOutput = function(target) {
		obj.vibratoGain.connect(target);
	};
	return obj;
})();
vibrato.start(0);

tremolo = (function() {
	var obj = {};
	obj.tremolo = context.createOscillator();
	obj.tremolo.type = 'sine';
	obj.tremolo.frequency.value = 10;	// LFO
	obj.tremoloGain = context.createGain();
	obj.tremoloGain.gain.value = 1; // Depth
	obj.tremolo.connect(obj.tremoloGain);

	obj.setFrequency = function(frequency) {
		obj.tremolo.frequency.value = frequency;
	};

	obj.setDepth = function(depth) {
		obj.tremoloGain.gain.value = depth;
	};

	obj.start = function(time) {
		obj.tremolo.start(time);
	};

	obj.connectOutput = function(target) {
		obj.tremoloGain.connect(target);
	};

	return obj;
})();
tremolo.start(0);

delay = (function() {
	var obj = {};
	obj.delay = context.createDelay();
	obj.delay.delayTime.value = 0.2;
	obj.wet = context.createGain();
	obj.wet.gain.value = 0.5;
	obj.dry = context.createGain();
	obj.dry.gain.value = 0.5;
	obj.feedback = context.createGain();
	obj.feedback.gain.value = 0.7;
	obj.output = context.createGain();
	obj.output.gain.value = 1;

	obj.delay.connect(obj.wet);
	obj.delay.connect(obj.feedback);
	obj.feedback.connect(obj.delay);
	obj.dry.connect(obj.output);
	obj.wet.connect(obj.output);

	obj.setLevel = function(level) {
		var lvl = Math.max(0.00, Math.min(1.00, level));
		var wet = lvl;
		var dry = 1 - lvl;

		obj.wet.gain.value = wet;
		obj.dry.gain.value = dry;
	};
	obj.setDelay = function(time) {
		obj.delay.delayTime.value = time;
	};
	obj.connectInput = function(source) {
		source.connect(obj.delay);
		source.connect(obj.dry);
	};
	obj.connectOutput = function(target) {
		obj.output.connect(target);
	};

	return obj;
})();

flanger = (function() {
	var obj = {};
	// Nodes
	obj.delay = context.createDelay();
	obj.wet = context.createGain();
	obj.dry = context.createGain();
	obj.feedback = context.createGain();
	obj.output = context.createGain();

	obj.lfo = context.createOscillator();
	obj.lfoScale = context.createGain();

	// Parameter setup
	obj.delay.delayTime.value = 1.0;
	obj.wet.gain.value = 1.0;
	obj.dry.gain.value = 0.0;
	obj.feedback.gain.value = 0.6;
	obj.output.gain.value = 1.0;

	obj.lfo.frequency.value = 3;
	obj.lfoScale.gain.value = 1;

	// Connect
	obj.delay.connect(obj.wet);
	obj.delay.connect(obj.feedback);
	obj.feedback.connect(obj.delay);

	//offset.connectInput(obj.lfo);
	//offset.connectOutput(obj.lfoScale);
	//nicewave.connect(obj.lfoScale);
	obj.lfo.connect(obj.lfoScale);
	obj.lfoScale.connect(obj.delay.delayTime);
	
	obj.dry.connect(obj.output);
	obj.wet.connect(obj.output);

	obj.lfo.start(0);

	obj.connectInput = function(source) {
		source.connect(obj.dry);
		source.connect(obj.delay);
	};
	obj.connectOutput = function(target) {
		obj.output.connect(target);
	};
	return obj;
})();


squareVoice = (function() {
	var obj = {};
	console.log("Creating object");
	
	obj.create = function(context, frequency, detune) {
		obj.context = context;
		obj.frequency = frequency;
		obj.detune = detune;

		obj.output = context.createGain();
		obj.output.gain.value = 1.0;
		return 
	}
	
	obj.start = function(time, freq) {
		console.log("START");
		// Setup params
		var a = 0.001;
		var d = 0.1;
		var s = 0.5;
		var r = 0.1;
		var t = time;
		
		// SETUP 
		obj.adsr = context.createGain();
		obj.adsr.gain.value = 1;
		obj.adsr.gain.linearRampToValueAtTime(0, t + 0);
		obj.adsr.gain.linearRampToValueAtTime(1.0, t + a);
		obj.adsr.gain.linearRampToValueAtTime(0.2, t + a + d);
		obj.adsr.gain.linearRampToValueAtTime(0.2, t + a + d + s);
		obj.adsr.gain.linearRampToValueAtTime(0.0, t + a + d + s + r);
		
		// Vibrato osc 8D
		
		console.log(obj.vibrato);
		console.log(obj.vibratoGain);

		// SETUP OSC
		obj.osc = context.createOscillator();
		obj.osc.type = 'square';
		obj.osc.frequency.value = freq;
		
		// Connect out
		obj.osc.connect(obj.adsr);
		obj.adsr.connect(obj.output);
		vibrato.connectOutput(obj.osc.detune);
		//tremolo.connectOutput(obj.output.gain);
		//delay.connectInput(obj.adsr);
		//delay.connectOutput(obj.output);
		//flanger.connectInput(obj.adsr);
		//flanger.connectOutput(obj.output);
		
		// Activate
		obj.osc.start(t);
		
	};

	obj.stop = function(time) { 
		obj.output.gain.setValueAtTime(0, time);
		setTimeout(function() {
			obj.osc.disconnect();
		}, Math.floor((time - obj.context.currentTime) * 1000));
	}

	obj.connect = function(target) {
		console.log("CONNECT");
		obj.output.connect(target);
	}

	return obj;
})();



keyboard = (function() {
	// Keybpard basd on the Supersaw Synth from noisehack.com (http://noisehack.com/how-to-build-supersaw-synth-web-audio-api/)
	var obj = {}
	obj.create = function(params) {
		params = params || {}
		obj.lowestNote = params.lowestNote || 48;
		obj.letters = params.letters || "awsedftgyhujkolp".split('');
		obj.noteOn = params.noteOn || function(note) { console.log("noteOn: " + note); };
		obj.noteOff = params.noteOff || function(note) { console.log("noteOff: " + note); };
		obj.keysPressed = {};
		obj.render();
		obj.bindKeys();
		obj.bindMouse();
	}

	obj._noteOn = function(note) {
		if (obj.keysPressed[note]) {
			return;
		}
		obj.keysPressed[note] = true;
		obj.noteOn(note);
	}

	obj._noteOff = function(note) {
		if (!obj.keysPressed[note]) {
			return;
		}
		obj.keysPressed[note] = false;
		obj.noteOff(note);
	}
	
	obj.bindKeys = function() {
		// Bind letters
		obj.letters.forEach(function(letter, i) {
			Mousetrap.bind(letter, function(e) {
				obj._noteOn(obj.lowestNote + i);
			}, 'keydown');
			Mousetrap.bind(letter, function(e) {
				obj._noteOff(obj.lowestNote + i);
			}, 'keyup');
		});

		// Bind octave changer
		Mousetrap.bind('z', function(e) {
			obj.lowestNote -= 12;
		});

		Mousetrap.bind('x', function(e) {
			obj.lowestNote += 12;
		});
	}

	obj.bindMouse = function() {
		var i = 0;
		for(letter in obj.letters) {
			
		}
	}

	obj.render = function() {

	}
	return obj;
})();