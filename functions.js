function noteToFrequency(note) {
	return Math.pow(2, (note - 69) / 12) * 440.0;
}

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
		var s = 0.2;
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
		
		// SETUP OSC
		obj.osc = context.createOscillator();
		obj.osc.type = 'square';
		obj.osc.frequency.value = freq;
		obj.osc.detune.value = 0;
		
		// Connect out
		obj.osc.connect(obj.adsr);
		obj.adsr.connect(obj.output);
		
		// Activate
		obj.osc.start(t);
		//setTimeout(function() {
		//	obj.osc.disconnect();
		//}, Math.floor(((t + a + d + s + r) - obj.context.currentTime) * 1000));
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
		console.log("CREATE KEYBOARD");	
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
		console.log("BINDKEYS");
		console.log(obj.letters);
		obj.letters.forEach(function(letter, i) {
			console.log("Binding letter: " + letter + " and i: " + i);
			Mousetrap.bind(letter, function(e) {
				obj._noteOn(obj.lowestNote + i);
			}, 'keydown');
			Mousetrap.bind(letter, function(e) {
				obj._noteOff(obj.lowestNote + i);
			}, 'keyup');
		});

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