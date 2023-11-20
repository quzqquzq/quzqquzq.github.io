const canvas = document.querySelector('canvas')
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


        c.beginPath()
        c.fillStyle = this.color
        c.fillRect(this.x, this.y, this.width, this.height)
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
    draw() {
        c.beginPath()
        c.fillStyle = this.color
        c.arc(this.x, this.y, this.width, 0, Math.PI * 2)
        c.fill()
    }

    update() {
        this.x += this.speed * Math.cos(this.angle)
        this.y += this.speed * Math.sin(this.angle)
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
        this.chkBounds()
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
    update() {
        this.x += this.speed * Math.cos(this.angle)
        this.y += this.speed * Math.sin(this.angle)
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

const degToRad = (deg) => {
    return deg * Math.PI / 180
}

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
        super.draw()
        c.beginPath()
        c.strokeStyle = 'black'
        c.lineWidth = 1
        c.rect(this.x, this.y, this.width, this.height)
        c.stroke()
    }

    // Spawns an asteroid in the spawn area and gives it appropriate speed and angle
    spawnAsteroid() {
        const x = Math.random() * this.width + this.x
        const y = Math.random() * this.height + this.y
        const width = 50
        const height = 50
        const speed = Math.random() * ASTEROID_SPEED + 1
        const grayColor = Math.floor(Math.random() * 100) + 100
        const color = `rgb(${grayColor}, ${grayColor}, ${grayColor})`
        let angle = 0
        if ( this.outerCanvasArea === OuterCanvasArea.BOTTOM) {
            angle = getRandAngle(200, 340)
        }
        if ( this.outerCanvasArea === OuterCanvasArea.TOP) {
            angle = getRandAngle(20, 160)
        }
        if ( this.outerCanvasArea === OuterCanvasArea.LEFT) {
            angle = getRandAngle(275, 360) + getRandAngle(5, 80)
        }
        if ( this.outerCanvasArea === OuterCanvasArea.RIGHT) {
            angle = getRandAngle(95, 175) + getRandAngle(5, 85)
        }
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
    const minutes = Math.floor(totalElapsedTime / 60000)
    const seconds = Math.floor((totalElapsedTime - minutes * 60000) / 1000)
    const ms = Math.floor((totalElapsedTime - minutes * 60000 - seconds * 1000))
    const formattedTime = `${minutes}:${seconds}:${ms}`
    return formattedTime
}

const bestTime = localStorage.getItem('bestTime')
// Main game loop
function gameLoop(timeStamp) {

    // Check if game is over, it can be over only if the player intersects with an asteroid
    // so play collision sound and save best time to local storage
    if (gameOver) {
        // save best time to local storage
        const bestTime = localStorage.getItem('bestTime')
        if (bestTime) {
            if (totalTime > bestTime) {
                localStorage.setItem('bestTime', totalTime)
            }
        } else {
            localStorage.setItem('bestTime', totalTime)
        }
        // Must allow in browser in order to work
        const crashSound = new Audio('sound.ogg')
        crashSound.play()
        return
    }

    // Update time variables
    deltaTime = timeStamp - lastTime
    lastTime = timeStamp
    c.clearRect(0, 0, canvas.width, canvas.height)
    totalTime += deltaTime
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
        c.fillText(`Najbolje vrijeme: ${getTime(bestTime)}`, canvas.width - 370, 50)
    } else {
        c.font = '2em Arial'
        c.fillStyle = 'white'
        c.fillText(`Najbolje vrijeme: 0:0:000`, canvas.width - 370, 50)
    }
    c.font = '2em Arial'
    c.fillStyle = 'white'
    c.fillText(`Vrijeme: ${getTime(totalTime)}`, canvas.width - 250, 100)


    // Replace asteroids that are out of bounds with new ones and increase difficulty over time by spawning more asteroids
    if (asteroids.length < ASTEROIDS_ON_SCREEN + (totalTime / 1000) * ASTEROIDS_OVER_TIME) {
        const rand = Math.floor(Math.random() * 4)
        switch (rand) {
            case 0:
                spawnAreaLeft.spawnAsteroid()
                break
            case 1:
                spawnAreaRight.spawnAsteroid()
                break
            case 2:
                spawnAreaTop.spawnAsteroid()
                break
            case 3:
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
        stars.push(new Star(x, y, width, height, color, STAR_SPEED))
    }

    // Delete objects that are out of bounds
    asteroids = asteroids.filter((asteroid) => !asteroid.outOfBounds().some((val) => val))
    stars = stars.filter((star) => !star.outOfBounds().some((val) => val))

    // Check if player intersects with an asteroid and if so, set gameOver to true
    gameOver = asteroids.some((asteroid) => player.intersects(asteroid))
}


requestAnimationFrame(gameLoop)
