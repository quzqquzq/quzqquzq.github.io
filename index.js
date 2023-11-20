
// The querySelector() method of the Element interface returns the first element that is a descendant of the element on which it is invoked that matches the specified group of selectors
const canvas = document.querySelector('canvas')

// The HTMLCanvasElement.getContext() method returns a drawing context on the canvas, or null if the context identifier is not supported, or the canvas has already been set to a different context mode.
// Later calls to this method on the same canvas element, with the same contextType argument, will always return the same drawing context instance as was returned the first time the method was invoked. It is not possible to get a different drawing context object on a given canvas element.
const c = canvas.getContext('2d')

// Full size
canvas.width = window.innerWidth
canvas.height = window.innerHeight

// Game constants
const ASTEROIDS_ON_SCREEN = 10
const ASTEROIDS_OVER_TIME = 0.3
const ASTEROID_SPEED = 3
const STAR_COUNT = 100
const STAR_SPEED = 0.1
const PLAYER_SPEED = 5

// Base object from which all other objects inherit
class SpaceObject {
    constructor(x, y, width, height, color) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.color = color
    }
    draw() {

        const shadowColor = 'rgba(255, 255, 255, 0.8)'
        const shadowBlur = 10
        const shadowOffsetX = 0
        const shadowOffsetY = 0

        c.shadowColor = shadowColor
        c.shadowBlur = shadowBlur
        c.shadowOffsetX = shadowOffsetX
        c.shadowOffsetY = shadowOffsetY

        // The CanvasRenderingContext2D.beginPath() method of the Canvas 2D API starts a new path by emptying the list of sub-paths. Call this method when you want to create a new path.
        // Note: To create a new sub-path, i.e., one matching the current canvas state, you can use CanvasRenderingContext2D.moveTo().
        c.beginPath()
        c.fillStyle = this.color
        // The CanvasRenderingContext2D.fillRect() method of the Canvas 2D API draws a rectangle that is filled according to the current fillStyle.
        // This method draws directly to the canvas without modifying the current path, so any subsequent fill() or stroke() calls will have no effect on it.
        c.fillRect(this.x, this.y, this.width, this.height)
        // The CanvasRenderingContext2D.closePath() method of the Canvas 2D API attempts to add a straight line from the current point to the start of the current sub-path. If the shape has already been closed or has only one point, this function does nothing.
        // This method doesn't draw anything to the canvas directly. You can render the path using the stroke() or fill()
        c.closePath()
    }

    // Assumes that the object is a rectangle
    intersects(object) {
        const x1 = this.x - (this.width / 2)
        const y1 = this.y - (this.height / 2)
        const x2 = this.x + (this.width / 2)
        const y2 = this.y + (this.height / 2)

        const x3 = object.x - (object.width / 2)
        const y3 = object.y - (object.height / 2)
        const x4 = object.x + (object.width / 2)
        const y4 = object.y + (object.height / 2)

        return (x1 < x4) && (x3 < x2) && (y1 < y4) && (y3 < y2)
    }

    // Checks if the object is out of canvas bounds, also considers the object's width and height
    outOfBounds() {
        return [
            this.x > canvas.width + this.width,
            this.x < 0 - this.width,
            this.y > canvas.height + this.height,
            this.y < 0 - this.height
        ]
    }
}

// Passive object that moves in a random direction
class Star extends SpaceObject {
    constructor(x, y, width, height, color, speed) {
        super(x, y, width, height, color)
        this.speed = speed
        this.dx = 0
        this.dy = 0
        this.angle = Math.random() * Math.PI * 2
    }

    // Draw method overriden to draw a circle instead of a rectangle
    draw() {
        c.beginPath()
        c.fillStyle = this.color
        c.arc(this.x, this.y, this.width, 0, Math.PI * 2)
        c.fill()
    }

    // Update method for stars, moves them in a random direction
    update() {
        this.x += this.speed * Math.cos(this.angle)
        this.y += this.speed * Math.sin(this.angle)
        // Call draw method
        this.draw()
    }
}

// Controller object that handles key presses for the player
class Controller {
    constructor() {
        this.left = false
        this.right = false
        this.up = false
        this.down = false
    }

    // Sets the key state to true or false depending on the player's input
    keyListener(event) {
        const keyState = (event.type === 'keydown')
        switch (event.keyCode) {
            case 37: // left key
                controller.left = keyState
                break
            case 38: // up key
                controller.up = keyState
                break
            case 39: // right key
                controller.right = keyState
                break
            case 40: // down key
                controller.down = keyState
                break
        }
    }
}

// Main player object which user controls
class Player extends SpaceObject {
    constructor(x, y, width, height, color, speed, controller) {
        super(x, y, width, height, color)
        this.speed = speed
        this.dx = 0
        this.dy = 0
        this.controller = controller
    }

    //  Update method for player, moves it in a direction depending on the user input
    update() {
        this.dx = 0
        this.dy = 0
        if (this.controller.left) {
            this.dx = -this.speed
        }
        if (this.controller.right) {
            this.dx = this.speed
        }
        if (this.controller.up) {
            this.dy = -this.speed
        }
        if (this.controller.down) {
            this.dy = this.speed
        }
        this.x += this.dx
        this.y += this.dy
        // Checks if the player is out of canvas bounds, if so, moves it to the opposite side of the canvas
        this.chkBounds()
        // Call draw method
        this.draw()
    }

    // Checks if the player is out of canvas bounds, if so, moves it to the opposite side of the canvas
    chkBounds() {
        let outOfBounds = this.outOfBounds()
        if (outOfBounds[0]) {
            this.x = this.width * -1
        }
        if (outOfBounds[1]) {
            this.x = canvas.width
        }
        if (outOfBounds[2]) {
            this.y = this.height * -1
        }
        if (outOfBounds[3]) {
            this.y = canvas.height
        }
    }
}

// Main asteroid object which moves in a straight line and is spawned from the spawn areas
class Asteroid extends SpaceObject {
    constructor(x, y, width, height, color, speed, angle) {
        super(x, y, width, height, color)
        this.speed = speed
        this.angle = angle
    }
    // Update method for asteroids, moves them in a straight line
    update() {
        this.x += this.speed * Math.cos(this.angle)
        this.y += this.speed * Math.sin(this.angle)
        // Call draw method
        this.draw()
    }

}

// Enum for easier spawn area identification
const OuterCanvasArea = {
    BOTTOM: 0,
    TOP: 1,
    LEFT: 2,
    RIGHT: 3
};

// Converts degrees to radians
const degToRad = (deg) => {
    return deg * Math.PI / 180
}


// Returns a random angle between deg1 and deg2
const getRandAngle = (deg1, deg2) => {
    const rad1 = degToRad(deg1)
    const rad2 = degToRad(deg2)
    return Math.random() * (rad2 - rad1) + rad1
}

asteroids = []
stars = []

// Spawning some stars
for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const width = 1
    const height = 1
    const color = 'white'
    // The push() method adds the specified elements to the end of an array and returns the new length of the array.
    stars.push(new Star(x, y, width, height, color, STAR_SPEED))
}

// Spawn areas, located outside of the canvas, from which asteroids spawn
// Depending on the area, asteroids will move in a certain direction
class SpawnArea extends SpaceObject {
    constructor(x, y, width, height, id) {
        super(x, y, width, height, 'white')
        this.outerCanvasArea = id
    }

    draw() {
        // Call super draw method
        super.draw()

        // The CanvasRenderingContext2D.beginPath() method of the Canvas 2D API starts a new path by emptying the list of sub-paths. Call this method when you want to create a new path.
        // Note: To create a new sub-path, i.e., one matching the current canvas state, you can use
        c.beginPath()
        c.strokeStyle = 'black'
        c.lineWidth = 1

        // The CanvasRenderingContext2D.rect() method of the Canvas 2D API adds a rectangle to the current path.
        // Like other methods that modify the current path, this method does not directly render anything. To draw the rectangle onto a canvas, you can use the fill() or stroke() methods.
        // Note: To both create and render a rectangle in one step, use the fillRect() or strokeRect() methods.
        c.rect(this.x, this.y, this.width, this.height)

        // he CanvasRenderingContext2D.stroke() method of the Canvas 2D API strokes (outlines) the current or given path with the current stroke style.
        // Strokes are aligned to the center of a path; in other words, half of the stroke is drawn on the inner side, and half on the outer side.
        // The stroke is drawn using the non-zero winding rule , which means that path intersections will still get filled.
        // Params:
        c.stroke()
    }

    // Spawns an asteroid in the spawn area and gives it appropriate speed and angle
    spawnAsteroid() {
        // Math.random() returns a random number between 0 and 1
        const x = Math.random() * this.width + this.x
        const y = Math.random() * this.height + this.y
        const width = 50
        const height = 50
        const speed = Math.random() * ASTEROID_SPEED + 1
        const grayColor = Math.floor(Math.random() * 100) + 100
        const color = `rgb(${grayColor}, ${grayColor}, ${grayColor})`
        let angle = 0
        if ( this.outerCanvasArea === OuterCanvasArea.BOTTOM) {
            // getRandAngle returns a random angle between deg1 and deg2
            angle = getRandAngle(200, 340)
        }
        if ( this.outerCanvasArea === OuterCanvasArea.TOP) {
            // getRandAngle returns a random angle between deg1 and deg2
            angle = getRandAngle(20, 160)
        }
        if ( this.outerCanvasArea === OuterCanvasArea.LEFT) {
            // getRandAngle returns a random angle between deg1 and deg2
            angle = getRandAngle(275, 360) + getRandAngle(5, 80)
        }
        if ( this.outerCanvasArea === OuterCanvasArea.RIGHT) {
            // getRandAngle returns a random angle between deg1 and deg2
            angle = getRandAngle(95, 175) + getRandAngle(5, 85)
        }
        // The push() method adds the specified elements to the end of an array and returns the new length of the array.
        asteroids.push(new Asteroid(x, y, width, height, color, speed, angle))
    }


}

// Spawn areas, offset by pixel to make it more visible
const spawnAreaLeft = new SpawnArea(-100, 0, 101,  canvas.width,  OuterCanvasArea.LEFT)
const spawnAreaRight = new SpawnArea(canvas.width - 1, 0, 100, canvas.height,  OuterCanvasArea.RIGHT)
const spawnAreaTop = new SpawnArea(0, -100, canvas.width, 101,  OuterCanvasArea.TOP)
const spawnAreaBottom = new SpawnArea(0, canvas.height - 1, canvas.width, 100,  OuterCanvasArea.BOTTOM)

// Initialize controller
const controller = new Controller()

// Initialize player object
const player = new Player(canvas.width / 2, canvas.height / 2, 50, 50, 'red', PLAYER_SPEED, controller)

// Add event listeners for key presses and releases
window.addEventListener('keydown', controller.keyListener)
window.addEventListener('keyup', controller.keyListener)

// Some game time variables
let lastTime = 0
let deltaTime = 0
let totalTime = 0
let gameOver = false

// make function save time
const getTime = (totalElapsedTime) => {
    // The Math.floor() static method always rounds down and returns the largest integer less than or equal to a given number
    const minutes = Math.floor(totalElapsedTime / 60000)
    const seconds = Math.floor((totalElapsedTime - minutes * 60000) / 1000)
    const ms = Math.floor((totalElapsedTime - minutes * 60000 - seconds * 1000))
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`
}

// The getItem() method of the Storage interface, when passed a key name, will return that key's value, or null if the key does not exist, in the given Storage object
const bestTime = localStorage.getItem('bestTime')
// Main game loop
function gameLoop(timeStamp) {

    // Check if game is over, it can be over only if the player intersects with an asteroid
    // so play collision sound and save best time to local storage
    if (gameOver) {
        // save best time to local storage
        // The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists
        const bestTime = localStorage.getItem('bestTime')
        if (bestTime) {
            if (totalTime > bestTime) {
                // The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists
                localStorage.setItem('bestTime', totalTime)
            }
        } else {
            // The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists
            localStorage.setItem('bestTime', totalTime)
        }
        // Must allow in browser in order to work
        // const crashSound = new Audio('sound.ogg')
        // crashSound.play()
        return
    }

    // Update time variables
    deltaTime = timeStamp - lastTime
    lastTime = timeStamp
    // The CanvasRenderingContext2D.clearRect() method of the Canvas 2D API erases the pixels in a rectangular area by setting them to transparent black.
    // Note: Be aware that clearRect() may cause unintended side effects if you're not using paths properly . Make sure to call beginPath() before starting to draw new items after calling clearRect(
    c.clearRect(0, 0, canvas.width, canvas.height)
    totalTime += deltaTime

    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser calls a specified function to update an animation right before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    // Note: Your callback routine must itself call requestAnimationFrame() again if you want to animate another frame at the next repaint.
    requestAnimationFrame(gameLoop)

    // Draw spawn areas
    spawnAreaLeft.draw()
    spawnAreaRight.draw()
    spawnAreaTop.draw()
    spawnAreaBottom.draw()

    // Update and render all objects
    stars.forEach((star) => star.update())
    asteroids.forEach((asteroid, index) => asteroid.update())
    player.update()

    // Render time, must be rendered here because it is must always be visible
    if (bestTime) {
        c.font = '2em Arial'
        c.fillStyle = 'white'
        // The CanvasRenderingContext2D method fillText(), part of the Canvas 2D API, draws a text string at the specified coordinates, filling the string's characters with the current fillStyle. An optional parameter allows specifying a maximum width for the rendered text, which the user agent  will achieve by condensing the text or by using a lower font size.
        c.fillText(`Najbolje vrijeme: ${getTime(bestTime)}`, canvas.width - 370, 50)
    } else {
        c.font = '2em Arial'
        c.fillStyle = 'white'
        // The CanvasRenderingContext2D method fillText(), part of the Canvas 2D API, draws a text string at the specified coordinates, filling the string's characters with the current fillStyle. An optional parameter allows specifying a maximum width for the rendered text, which the user agent  will achieve by condensing the text or by using a lower font size.
        c.fillText(`Najbolje vrijeme: 00:00:000`, canvas.width - 370, 50)
    }
    c.font = '2em Arial'
    c.fillStyle = 'white'
    c.fillText(`Vrijeme: ${getTime(totalTime)}`, canvas.width - 250, 100)


    // Replace asteroids that are out of bounds with new ones and increase difficulty over time by spawning more asteroids
    if (asteroids.length < ASTEROIDS_ON_SCREEN + (totalTime / 1000) * ASTEROIDS_OVER_TIME) {
        // Floor returns the largest integer less than or equal to a given number
        const rand = Math.floor(Math.random() * 4)
        switch (rand) {
            case 0:
                // Call spawnAsteroid which spawns an asteroid in the left spawn area and gives it appropriate speed and angle to the right
                spawnAreaLeft.spawnAsteroid()
                break
            case 1:
                // Call spawnAsteroid which spawns an asteroid in the right spawn area and gives it appropriate speed and angle to the left
                spawnAreaRight.spawnAsteroid()
                break
            case 2:
                // Call spawnAsteroid which spawns an asteroid in the top spawn area and gives it appropriate speed and angle to the bottom
                spawnAreaTop.spawnAsteroid()
                break
            case 3:
                // Call spawnAsteroid which spawns an asteroid in the bottom spawn area and gives it appropriate speed and angle to the top
                spawnAreaBottom.spawnAsteroid()
                break
        }
    }

    // Replace stars that are out of bounds with new ones
    if (stars.length < STAR_COUNT) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const width = 1
        const height = 1
        const color = 'white'
        // The push() method adds the specified elements to the end of an array and returns the new length of the array
        stars.push(new Star(x, y, width, height, color, STAR_SPEED))
    }

    // Delete objects that are out of bounds
    // The filter() method creates a shallow copy  of a portion of a given array, filtered down to just the elements from the given array that pass the test implemented by the provided function.
    // The some() method tests whether at least one element in the array passes the test implemented by the provided function. It returns true if, in the array, it finds an element for which the provided function returns true; otherwise it returns false. It doesn't modify the arra
    asteroids = asteroids.filter((asteroid) => !asteroid.outOfBounds().some((val) => val))
    stars = stars.filter((star) => !star.outOfBounds().some((val) => val))

    // Check if player intersects with an asteroid and if so, set gameOver to true
    gameOver = asteroids.some((asteroid) => player.intersects(asteroid))
}

// The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser calls a specified function to update an animation right before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
// Note: Your callback routine must itself call requestAnimationFrame() again if you want to animate another frame at the next repaint. requestAnimationFrame() is 1 shot.
requestAnimationFrame(gameLoop)
