var scheduler;

window.onload = function () {
    scheduler = new SchedulerObject(50);
    noteCalculator.setCurrent("major");      

    var game = new Game("canvasId",MIDI);
    scheduler.add(game);
    
    console.log("YYY");
	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function() {
		    console.log("XXX");
            scheduler.start();
            MIDI.setVolume(0,127)
            MIDI.noteOn(0,58,50,0)
            MIDI.noteOff(0,58,0.75)                
 
		}
	});
};

