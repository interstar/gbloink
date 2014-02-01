
# This file : Interstar Scheduler
# Original Version. December 7th, 1998
# Updated 2010
# Converted to Coffee 2013


class @SchedulerObject
    constructor:(time) ->
        @gameRunning = false
        @list = []
        @time = time
   
    setTime:(time) -> 
        @stop()
        @time = time
        @start()
        
    start:() ->        
        @gameRunning = true
        f = => @next()
        @interval = window.setInterval(f, @time)
               
    stop:() -> 
        @gameRunning = false
        window.clearInterval(@interval)
    
    add:(sprite) -> @list.push(sprite)
    
    next:() ->
        if @gameRunning
            for sprite in @list
                sprite.next()
            



        

