
randomColour = () ->
        letters = '0123456789ABCDEF'.split('')
        color = '#'
        for i in [0,1,2,3,4,5]
            color += letters[Math.round(Math.random() * 15)]
        return color

dist = (x1,y1,x2,y2) ->
        dx2 = (x1-x2)*(x1-x2)
        dy2 = (y1-y2)*(y1-y2)
        return Math.sqrt(dx2+dy2)
        

class Scale
    constructor:(@scale) ->    
    transform:(note) ->
        n = note % 12
        c = 0
        while @scale[n+c] == 0
            c=c+1
        return note+c

class @NoteCalculator
    constructor:() ->
        @scales = {}
        @scales["chromatic"] = new Scale([1,1,1,1,1,1,1,1,1,1,1,1,1])
        @scales["major"]     = new Scale([1,0,1,0,1,1,0,1,0,1,0,1,1])
        @scales["minor"]     = new Scale([1,0,1,1,0,1,0,1,1,0,0,1,1])
        @scales["diminished"]= new Scale([1,0,1,1,0,1,0,1,1,0,1,0,1])
        @scales["arab"]      = new Scale([1,0,1,0,1,1,1,0,1,0,1,0,1])
        @scales["debussy"]   = new Scale([1,0,1,0,1,0,1,0,1,0,1,0,1])
        @scales["gypsy"]     = new Scale([1,0,1,1,0,0,1,1,1,0,1,0,1])
        @scales["pent1"]     = new Scale([1,0,1,0,0,1,0,1,0,1,0,0,0])
        @scales["pent2"]     = new Scale([1,0,0,1,0,1,0,1,0,0,1,0,1])
        
        
        
    setCurrent:(@current) ->
    transform:(y) -> 
        note = Math.floor(((400-y) / 6) + 30)
        return @scales[@current].transform(note)

@noteCalculator = new NoteCalculator();
         

class @Html5Canvas
    constructor: (@canvasId,@width,@height,@mouseDownListener) ->
        @canvas = document.getElementById(@canvasId)
        @ctx = @canvas.getContext("2d")
        @canvasTag = @canvasId
                          
    background:(col) ->
        @ctx.fillStyle=col
        @ctx.fillRect(0,0,@width,@height)

    fillStyle:(col) ->
        @ctx.fillStyle=col

    line:(x1,y1,x2,y2) ->
        @ctx.beginPath()
        @ctx.moveTo(x1,y1)
        @ctx.lineTo(x2,y2)
        @ctx.stroke()

    circle:(cx,cy,r) ->
        @ctx.beginPath()
        x = @ctx.lineWidth
        @ctx.lineWidth=5
        @ctx.arc(cx, cy, r, 0 , 2 * Math.PI, false)
        @ctx.stroke()
        @ctx.lineWidth = x
        
    rect:(x,y,w,h) ->
        @ctx.beginPath()
        tmp = @ctx.lineWidth
        @ctx.lineWidth=3

        @ctx.rect(x,y,w,h)
        @ctx.stroke()
        @ctx.lineWidth = tmp
    


COUNTER = 0
class @Ball
    constructor:(@x,@y,@colour,@MIDI) ->
        @id = COUNTER
        @dx = 3
        @dy = 3
        @rad = 5
        @volume = 50
        COUNTER = COUNTER + 1

    move:(otherBalls,blocks) ->        
        tx = @x+@dx
        ty = @y+@dy                
                
        flag = false
        if (tx<3) or (tx>597)
            @dx = -@dx
            @note()
            flag = true

        if (ty<3) or (ty>397)
            @dy = -@dy
            @note()
            flag = true
            
        if flag
            return
                    
        # balls collide other balls ... not working
        for another in otherBalls
            if another.id == @id 
                continue
            if another.hit(tx,@y)                
                @dx = -@dx
                @note()                
            if another.hit(@y,ty)
                @dy = -@dy
                @note()                
        
        
        for b in blocks
            if b.hit(tx+@dx,ty)
                @dx = -@dx
                @note()                
                
            if b.hit(tx,ty+@dy)
                @dy = -@dy
                @note()

        @x = tx
        @y = ty                

    note:() ->
        pitch = noteCalculator.transform(@y)
        @play(@id,pitch,@volume,0)

    play:(channel,note,velocity,delay   ) ->
        @MIDI.setVolume(0,127)
        @MIDI.noteOn(channel,note,velocity,delay)
        @MIDI.noteOff(channel,note,delay+0.75)                
                           
    draw:(canvas) ->
        canvas.ctx.beginPath()
        canvas.ctx.arc(@x,@y,@rad,0,2*Math.PI);
        canvas.ctx.fillStyle = @colour;
        canvas.ctx.fill();
        canvas.ctx.stroke();
                
    hit:(x,y) -> dist(x,y,@x,@y) < @rad+@rad
        
class @Block
    constructor:(@x,@y) ->
        @w = 5+Math.random()*50
        @h = 5+Math.random()*50
        @left = @x-@w/2
        @top = @y-@h/2
        @right = @x+@w/2
        @bottom = @y+@h/2
        @colour = randomColour()

    hit:(x,y) ->
        if (x < @left) or (x > @right) 
            return false
        if (y < @top) or (y > @bottom)
            return false
        return true

    draw:(canvas) ->
        canvas.ctx.beginPath()
        canvas.ctx.rect(@left,@top,@w,@h)
        canvas.ctx.fillStyle = @colour
        canvas.ctx.fill()
        canvas.ctx.lineWidth = 1
        canvas.ctx.strokeStyle = 'white'
        canvas.ctx.stroke()

class @ControlBar
    constructor:(@id,@mouseUpCallback) ->
        @canvas = document.getElementById(@id)
        @canvas.addEventListener("mouseup",(e) -> mouseUpCallback(e))

class @Game
    constructor:(@canvasId,@MIDI) ->
        @canvas = new Html5Canvas(@canvasId,600,400)
        @balls = [new Ball(200,200,"#ff0000",@MIDI), 
                  new Ball(300,200,"#00ff00",@MIDI), 
                  new Ball(400,200,"#0000ff",@MIDI)]

        eventToXY = (event) ->
            rect = event.currentTarget.getBoundingClientRect()
            root = document.documentElement
            x = event.pageX - rect.left - root.scrollLeft
            y = event.pageY - rect.top - root.scrollTop
            return [x,y]

        speedChangeFunction = (ball) ->
            (event) ->
                [x,y] = eventToXY(event)
                speed = 1+Math.floor((x/170)*5)
                ball.dx = speed * (ball.dx/Math.abs(ball.dx))
                ball.dy = speed * (ball.dy/Math.abs(ball.dy))

        redSpeedChange = speedChangeFunction(@balls[0])                        
        @redSpeed = new ControlBar("redball_speed", (e) -> redSpeedChange(e))
        greenSpeedChange = speedChangeFunction(@balls[1])
        @greenSpeed = new ControlBar("greenball_speed", (e) -> greenSpeedChange(e))
        blueSpeedChange = speedChangeFunction(@balls[2])
        @blueSpeed = new ControlBar("blueball_speed", (e) -> blueSpeedChange(e))
        
        volumeChangeFunction = (ball) ->
            (event) ->
                [x,y] = eventToXY(event)
                ball.volume = Math.floor((x/170)*127)
                
        redVolumeChange = volumeChangeFunction(@balls[0])
        @redVolume = new ControlBar("redball_volume",(e) -> redVolumeChange(e))
        greenVolumeChange = volumeChangeFunction(@balls[1])
        @greenVolume = new ControlBar("greenball_volume",(e) -> greenVolumeChange(e))
        blueVolumeChange = volumeChangeFunction(@balls[2])
        @blueVolume = new ControlBar("blueball_volume",(e) -> blueVolumeChange(e))
                        
        game = this
 
        @blocks = []

        mouseUp = (event) =>
            rect = @canvas.canvas.getBoundingClientRect()
            root = document.documentElement
            x = event.pageX - rect.left - root.scrollLeft
            y = event.pageY - rect.top - root.scrollTop
            game.userClicked(x,y)

        @canvas.canvas.addEventListener("mouseup",(e) -> mouseUp(e))
        
        # preset blocks
        for i in [0..20]
            @userClicked(i*30,Math.floor(50+Math.random()*50))
            @userClicked(i*30,Math.floor(300+Math.random()*50))

    userClicked:(x,y) ->
        for b in @blocks
            if b.hit(x,y)
                @removeBlock(b)
                return

        @blocks.push(new Block(x,y))
    
    removeBlock:(x) ->
        @blocks = (b for b in @blocks when x != b)
        

    next:() ->       
        for b in @balls
            b.move(@balls,@blocks)
        
        @canvas.background("black")

        for b in @blocks        
            b.draw(@canvas)
            
        for b in @balls
            b.draw(@canvas)
        
    

