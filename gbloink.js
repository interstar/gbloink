// Generate a random colour
function randomColour() {
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Calculate the Euclidean distance between two points
function dist(x1, y1, x2, y2) {
    const dx2 = (x1 - x2) ** 2;
    const dy2 = (y1 - y2) ** 2;
    return Math.sqrt(dx2 + dy2);
}

// Class representing a musical scale
class Scale {
    constructor(scale) {
        this.scale = scale;
    }

    transform(note) {
        const n = note % 12;
        let c = 0;
        while (this.scale[n + c] === 0) {
            c += 1;
        }
        return note + c;
    }
}

// Class for transforming y-coordinates into MIDI notes
class NoteCalculator {
    constructor() {
        this.scales = {
            chromatic: new Scale([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
            major: new Scale([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1]),
            minor: new Scale([1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1]),
            diminished: new Scale([1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1]),
            arab: new Scale([1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1]),
            debussy: new Scale([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]),
            gypsy: new Scale([1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1]),
            pent1: new Scale([1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0]),
            pent2: new Scale([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1])
        };

        this.current = 'chromatic';
    }

    setCurrent(current) {
        this.current = current;
    }

    transform(y) {
        const note = Math.floor(((400 - y) / 6) + 30);
        return this.scales[this.current].transform(note);
    }
}

const noteCalculator = new NoteCalculator();

// Wrapper around the HTML5 canvas API
class Html5Canvas {
    constructor(canvasId, width, height, mouseDownListener) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvasTag = canvasId;
        this.width = width;
        this.height = height;
    }

    background(col) {
        this.ctx.fillStyle = col;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    fillStyle(col) {
        this.ctx.fillStyle = col;
    }

    line(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    circle(cx, cy, r) {
        this.ctx.beginPath();
        const x = this.ctx.lineWidth;
        this.ctx.lineWidth = 5;
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
        this.ctx.stroke();
        this.ctx.lineWidth = x;
    }

    rect(x, y, w, h) {
        this.ctx.beginPath();
        const tmp = this.ctx.lineWidth;
        this.ctx.lineWidth = 3;
        this.ctx.rect(x, y, w, h);
        this.ctx.stroke();
        this.ctx.lineWidth = tmp;
    }
}

const MIDI = {
    // create three instances of the synthesizer
    synthRed: new WebAudioTinySynth(),
    synthGreen: new WebAudioTinySynth(),
    synthBlue: new WebAudioTinySynth(),

    // store the last note played on each channel
    lastNote: [null, null, null],

    // configure the synthesizers with different settings
    initialize: function() {
        this.synthRed.setProgram(0, 0); // acoustic grand piano
        this.synthGreen.setProgram(0, 24); // nylon guitar
        this.synthBlue.setProgram(0, 44); // tremolo strings
    },

    noteOn: function(channel, note, velocity, delay) {
        // send a noteOff message for the old note
        if (this.lastNote[channel] !== null) {
            this.noteOff(channel, this.lastNote[channel], 0);
        }

        // store the new note
        this.lastNote[channel] = note;

        switch(channel) {
            case 0:
                this.synthRed.noteOn(0, note, velocity, delay);
                break;
            case 1:
                this.synthGreen.noteOn(0, note, velocity, delay);
                break;
            case 2:
                this.synthBlue.noteOn(0, note, velocity, delay);
                break;
        }
    },


    noteOff: function(channel, note, delay) {
        switch(channel) {
            case 0:
                this.synthRed.noteOff(0, note, delay);
                break;
            case 1:
                this.synthGreen.noteOff(0, note, delay);
                break;
            case 2:
                this.synthBlue.noteOff(0, note, delay);
                break;
        }
    }
};

// initialize the MIDI object
MIDI.initialize();



let COUNTER = 0;

// Class representing a ball on the canvas
class Ball {
    constructor(x, y, colour, MIDI) {
        this.x = x;
        this.y = y;
        this.colour = colour;
        this.MIDI = MIDI;
        this.id = COUNTER;
        this.dx = 2;
        this.dy = 2;
        this.rad = 5;
        this.volume = 50;
        this.delay = 0.5; // default delay
        COUNTER += 1;
    }

    move(otherBalls, blocks) {
        let tx = this.x + this.dx;
        let ty = this.y + this.dy;
        let flag = false;

        if (tx < 3 || tx > 597) {
            this.dx = -this.dx;
            this.note();
            flag = true;
        }

        if (ty < 3 || ty > 397) {
            this.dy = -this.dy;
            this.note();
            flag = true;
        }

        if (flag) {
            return;
        }

        // balls collide other balls
        for (const another of otherBalls) {
            if (another.id === this.id) {
                continue;
            }
            if (another.hit(tx, this.y, this.rad)) {
                if (another.x < this.x) {
                    this.dx = Math.abs(this.dx);
                } else {
                    this.dx = -Math.abs(this.dx);
                }
                this.note();
                flag = true;
                continue;
            }

            if (another.hit(this.x, ty, this.rad)) {
                if (another.y < this.y) {
                    this.dy = Math.abs(this.dy);
                } else {
                    this.dy = -Math.abs(this.dy);
                }
                this.note();
                flag = true;
            }
        }

        // balls collide with blocks
        for (const b of blocks) {
            if (b.hit(tx + this.dx, ty)) {
                this.dx = -this.dx;
                this.note();
            }

            if (b.hit(tx, ty + this.dy)) {
                this.dy = -this.dy;
                this.note();
            }
        }

        this.x = tx;
        this.y = ty;
    }

    note() {
        const pitch = noteCalculator.transform(this.y);
        this.play(this.id, pitch, this.volume, 0);
    }



    play(channel, note, velocity, delay) {
        MIDI.noteOn(channel, note, velocity, 0);
        MIDI.noteOff(channel, note, this.delay);
    }


    draw(canvas) {
        canvas.ctx.beginPath();
        canvas.ctx.arc(this.x, this.y, this.rad, 0, 2 * Math.PI);
        canvas.ctx.fillStyle = this.colour;
        canvas.ctx.fill();
        canvas.ctx.stroke();
    }

    hit(x, y, rad) {
        return dist(x, y, this.x, this.y) < this.rad + rad;
    }
}

// Class representing a block on the canvas
class Block {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 5 + Math.random() * 50;
        this.h = 5 + Math.random() * 50;
        this.left = this.x - this.w / 2;
        this.top = this.y - this.h / 2;
        this.right = this.x + this.w / 2;
        this.bottom = this.y + this.h / 2;
        this.colour = randomColour();
    }

    hit(x, y) {
        if (x < this.left || x > this.right) {
            return false;
        }
        if (y < this.top || y > this.bottom) {
            return false;
        }
        return true;
    }

    draw(canvas) {
        canvas.ctx.beginPath();
        canvas.ctx.rect(this.left, this.top, this.w, this.h);
        canvas.ctx.fillStyle = this.colour;
        canvas.ctx.fill();
        canvas.ctx.lineWidth = 1;
        canvas.ctx.strokeStyle = 'white';
        canvas.ctx.stroke();
    }
}

// Class representing a control bar
class ControlBar {
    constructor(id, mouseUpCallback) {
        this.canvas = document.getElementById(id);
        this.canvas.addEventListener('mouseup', mouseUpCallback);
    }
}

// Class representing the game
class Game {
    constructor(canvasId, MIDI) {
        this.canvas = new Html5Canvas(canvasId, 600, 400);
        this.MIDI = MIDI;
        this.balls = [
            new Ball(200, 200, '#ff0000', this.MIDI),
            new Ball(300, 200, '#00ff00', this.MIDI),
            new Ball(400, 200, '#0000ff', this.MIDI),
        ];
        this.blocks = [];
        this.canvasId = canvasId;

        const eventToXY = event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const root = document.documentElement;
            const x = event.pageX - rect.left - root.scrollLeft;
            const y = event.pageY - rect.top - root.scrollTop;
            return [x, y];
        };

        const speedChangeFunction = ball => event => {
            const [x, y] = eventToXY(event);
            const speed = 1 + Math.floor((x / 170) * 5);
            ball.dx = speed * (ball.dx / Math.abs(ball.dx));
            ball.dy = speed * (ball.dy / Math.abs(ball.dy));
        };

        const redSpeedChange = speedChangeFunction(this.balls[0]);
        const redSpeed = new ControlBar('redball_speed', e => redSpeedChange(e));
        const greenSpeedChange = speedChangeFunction(this.balls[1]);
        const greenSpeed = new ControlBar('greenball_speed', e => greenSpeedChange(e));
        const blueSpeedChange = speedChangeFunction(this.balls[2]);
        const blueSpeed = new ControlBar('blueball_speed', e => blueSpeedChange(e));

        const volumeChangeFunction = ball => event => {
            const [x, y] = eventToXY(event);
            ball.volume = Math.floor((x / 170) * 127);
        };

        const redVolumeChange = volumeChangeFunction(this.balls[0]);
        const redVolume = new ControlBar('redball_volume', e => redVolumeChange(e));
        const greenVolumeChange = volumeChangeFunction(this.balls[1]);
        const greenVolume = new ControlBar('greenball_volume', e => greenVolumeChange(e));
        const blueVolumeChange = volumeChangeFunction(this.balls[2]);
        const blueVolume = new ControlBar('blueball_volume', e => blueVolumeChange(e));

        const instrumentChangeFunction = (ball, synth) => event => {
            const [x, y] = eventToXY(event);
            const program = Math.floor((x / 170) * 127);
            synth.setProgram(0, program);
        };

        const redInstrumentChange = instrumentChangeFunction(this.balls[0], MIDI.synthRed);
        const redInstrument = new ControlBar('redball_instrument', e => redInstrumentChange(e));
        const greenInstrumentChange = instrumentChangeFunction(this.balls[1], MIDI.synthGreen);
        const greenInstrument = new ControlBar('greenball_instrument', e => greenInstrumentChange(e));
        const blueInstrumentChange = instrumentChangeFunction(this.balls[2], MIDI.synthBlue);
        const blueInstrument = new ControlBar('blueball_instrument', e => blueInstrumentChange(e));

        const delayChangeFunction = ball => event => {
            const [x, y] = eventToXY(event);
            ball.delay = 0.05 + (x / 170) * 0.95;
        };

        const redDelayChange = delayChangeFunction(this.balls[0]);
        const redDelay = new ControlBar('redball_delay', e => redDelayChange(e));
        const greenDelayChange = delayChangeFunction(this.balls[1]);
        const greenDelay = new ControlBar('greenball_delay', e => greenDelayChange(e));
        const blueDelayChange = delayChangeFunction(this.balls[2]);
        const blueDelay = new ControlBar('blueball_delay', e => blueDelayChange(e));


        const mouseUp = event => {
            const rect = this.canvas.canvas.getBoundingClientRect();
            const root = document.documentElement;
            const x = event.pageX - rect.left - root.scrollLeft;
            const y = event.pageY - rect.top - root.scrollTop;
            this.userClicked(x, y);
        };

        this.canvas.canvas.addEventListener('mouseup', e => mouseUp(e));

        // preset blocks
        for (let i = 0; i <= 20; i++) {
            this.userClicked(i * 30, Math.floor(50 + Math.random() * 50));
            this.userClicked(i * 30, Math.floor(300 + Math.random() * 50));
        }
    }

    userClicked(x, y) {
        for (const b of this.blocks) {
            if (b.hit(x, y)) {
                this.removeBlock(b);
                return;
            }
        }

        this.blocks.push(new Block(x, y));
    }

    removeBlock(x) {
        this.blocks = this.blocks.filter(b => x !== b);
    }

    next() {
        this.canvas.background('black');
        this.balls.forEach(ball => ball.move(this.balls, this.blocks));
        this.blocks.forEach(block => block.draw(this.canvas));
        this.balls.forEach(ball => ball.draw(this.canvas));
    }
}

    
