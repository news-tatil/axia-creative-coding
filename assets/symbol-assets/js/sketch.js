let cnv,
    originalPreset,
    saveMP4 = false,
    saveFramesPNG = false,
    saveFramesSVG = false,
    processingZIP = false,
    mp4Encoder,
    frame_count = 0,
    totalFrames = 60,
    frameRateUi = 60,
    noise,
    pause = false,
    ico,
    bkp_settings,
    logo_svg = [],
    selo_svg = [],
    axis_logo,
    // axis_textura,
    img_textura,
    noise_seed = 0

const zip = new JSZip()

function preload() {
    logo_svg.push(loadXML("./assets/symbol-assets/svg/logo_01.svg"))
    logo_svg.push(loadXML("./assets/symbol-assets/svg/logo_02.svg"))
    logo_svg.push(loadXML("./assets/symbol-assets/svg/logo_03.svg"))
    logo_svg.push(loadXML("./assets/symbol-assets/svg/logo_04.svg"))

    selo_svg.push(loadXML("./assets/symbol-assets/svg/selo_01.svg"))
    selo_svg.push(loadXML("./assets/symbol-assets/svg/selo_02.svg"))
    selo_svg.push(loadXML("./assets/symbol-assets/svg/selo_03.svg"))

    img_textura = loadImage("./assets/symbol-assets/img/img.png")
}

function setup() {
    // cnv = createCanvas(windowWidth - 300, windowHeight, WEBGL)
    cnv = createCanvas(windowWidth - 300, windowHeight)
    cnv.position(300, 0)

    setupFFmpeg()
    bkp_settings = JSON.parse(JSON.stringify(ui_data))
    resetNoise()
    frameRate(parseInt(ui_data.fps))
    noStroke()

    setDesenhoDenditro()

    originalPreset = JSON.parse(JSON.stringify(ui_data))
    resetTotalFrames()
    makeLogo()
}

function draw() {
    push()
    if (axis_logo.bezierSelo.paths.length == 0) background(ui_data.background_color)
    else background(255)
    axis_logo.draw()
    

    if (saveMP4) save_frame_mp4()
    if (saveFramesPNG) save_frame_png()
    if (saveFramesSVG) save_frame_svg()
    if (!saveFramesPNG && !saveMP4 && !saveFramesSVG) frame_count = (frame_count + 1) % totalFrames
    // t += ui_data.velocidade * 0.001

    let y = height - 10
    let x = 10

    if (saveMP4 || saveFramesPNG || saveFramesSVG) {
        noStroke()
        if (frame_count % 10 == 0) frameRateUi = round(frameRate())
        push()
        fill(255, 0, 0)
        rect(x - 5, y + 5, 230, -65)
        pop()
        fill(255)
        rect(x, y - 25, norm(frame_count, 0, totalFrames) * 220, 10)
        fill(255)
        text("FRAME RATE: " + frameRateUi, x, y)
        y -= 15
        textSize(12)
        textLeading(12)
        push()
        fill(255, 0, 0)
        textSize(10)
        text(frame_count + " / " + totalFrames, x + 2, y - 2)
        pop()
        fill(255)
        text("SAVING\nKeep the tab open till the end.", x, y - 30)
    } else if (processingZIP) {
        push()
        fill(255, 0, 0)
        rect(x - 5, y + 5, 230, -35)
        pop()
        push()
        fill(255)
        y -= 15
        text(">> PROCESSING ZIP <<", x, y)
        pop()
        noLoop()
    }
    pop()
}

function keyReleased() {
    if (key == " ") pause = !pause
}

function mouseReleased() {
    if (ui_data.show_crop) rec_screen.mReleased()
    // rastro_bola.endMouseRecording()
}

function mousePressed() {
    if (ui_data.show_crop) rec_screen.mClick()
    // if (mouseOnScreen()) rastro_bola.startMouseRecording()
}

function windowResized() {
    resizeCanvas(windowWidth - 300, windowHeight)
    // camera(0, 0, 800)
    // perspective(2 * atan(height / 2 / 800), width / height, 10, 100000)
}

function rotateYVector(v, angle) {
    // v: p5.Vector, angle: radians
    let cosA = Math.cos(angle)
    let sinA = Math.sin(angle)
    return createVector(v.x * cosA + v.z * sinA, v.y, -v.x * sinA + v.z * cosA)
}

function rotateZVector(v, angle) {
    // v: p5.Vector, angle: radians
    let cosA = Math.cos(angle)
    let sinA = Math.sin(angle)
    return createVector(v.x * cosA - v.y * sinA, v.x * sinA + v.y * cosA, v.z)
}

function project3DTo2D(vector) {
    let v = rotateYVector(vector, axis_logo.rotation)
    v = rotateZVector(v, radians(ui_data.angulo_camera))
    // let v = vector.copy()
    let cameraDistance = parseFloat(ui_data.camera_distancia)
    let scale = cameraDistance / (cameraDistance + v.z)
    let x2D = v.x * scale
    let y2D = v.y * scale
    return createVector(x2D, y2D)
}

class Logo {
    constructor(opt) {
        // console.log(opt)
        this.opt = opt
        this.bezierPaths = this.processPaths(opt.bezierPaths)
        this.bezierSelo = this.processPaths(opt.bezierSelo)
        // console.log(this.bezierSelo)
        this.ico = null
        this.t = 0
        this.rotation = 0
        this.makeIco()

        this.box = this.calculateBoundingBox()
    }

    reset_times(){
        this.ico.reset_times()
    }

    calculateBoundingBox() {
        let minX = min(min(this.icoBox.x, this.bezierPaths.box.x), this.bezierSelo.box.x),
            minY = min(min(this.icoBox.y, this.bezierPaths.box.y), this.bezierSelo.box.y),
            maxX = max(max(this.icoBox.x2, this.bezierPaths.box.x2), this.bezierSelo.box.x2),
            maxY = max(max(this.icoBox.y2, this.bezierPaths.box.y2), this.bezierSelo.box.y2)
        return {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY,
            x2: maxX,
            y2: maxY,
        }
    }

    processPaths(paths) {
        let pathsBoxes = []

        let minX_all = 9999999,
            minY_all = 9999999,
            maxX_all = -9999999,
            maxY_all = -9999999

        for (let i = 0; i < paths.length; i++) {
            let path = paths[i]
            let minX = 9999999,
                minY = 9999999,
                maxX = -9999999,
                maxY = -9999999
            for (let j = 0; j < path.length; j++) {
                let section = path[j]
                let x = section[3].x
                let y = section[3].y

                minX = min(minX, x)
                minY = min(minY, y)
                maxX = max(maxX, x)
                maxY = max(maxY, y)
            }

            minX_all = min(minX_all, minX)
            minY_all = min(minY_all, minY)
            maxX_all = max(maxX_all, maxX)
            maxY_all = max(maxY_all, maxY)

            pathsBoxes.push({
                x: minX,
                y: minY,
                w: maxX - minX,
                h: maxY - minY,
                x2: maxX,
                y2: maxY,
            })
        }

        let box = {
            x: minX_all,
            y: minY_all,
            w: maxX_all - minX_all,
            h: maxY_all - minY_all,
            x2: maxX_all,
            y2: maxY_all,
        }

        let bezierPaths = []
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i]
            let box = pathsBoxes[i]
            let contour = false
            path.insideOtherBox = false
            for (let j = 0; j < paths.length; j++) {
                if (i === j) continue
                let otherBox = pathsBoxes[j]
                //check if the box is inside the other box
                if (box.x >= otherBox.x && box.y >= otherBox.y && box.x2 <= otherBox.x2 && box.y2 <= otherBox.y2)
                    contour = true
            }

            bezierPaths.push({ path: path, contour: contour })
        }

        return { paths: bezierPaths, box: box }
    }

    makeIco() {
        this.ico = new Ico(10)
        if (this.opt.div > 0) this.ico.subdivide(this.opt.div, this.opt.extraChance, this.opt.distributionType)
        this.ico.spherify(parseFloat(this.opt.raio))
        this.icoBox = {
            x: -270,
            y: -270,
            w: 540,
            h: 540,
            x2: 270,
            y2: 270,
        }
    }

    define_faces_pisca(){
        this.ico.define_faces_pisca()
    }

    drawSVG(c, paths) {
        c.push()
        // c.noFill()
        // c.stroke(255)
        // c.strokeWeight(1)
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i].path
            let contour = paths[i].contour
            let contourNext = paths[min(i + 1, paths.length - 1)].contour

            if (contour) c.beginContour()
            else c.beginShape()
            let x = path[0][0].x
            let y = path[0][0].y
            c.vertex(x, y)
            for (let j = 0; j < path.length; j++) {
                let section = path[j]
                if (section[1] == false) {
                    // STRAIGHT LINE
                    let x = section[3].x
                    let y = section[3].y
                    c.vertex(x, y)
                } else {
                    // BEZIER CURVE
                    c.bezierVertex(section[1].x, section[1].y, section[2].x, section[2].y, section[3].x, section[3].y)
                }
            }
            if (contour) c.endContour()
            if (!contourNext || i + 1 > paths.length - 1) c.endShape(CLOSE)
        }

        c.pop()
    }

    draw(c = cnv._pInst, saving = false) {
        this.rotation = map(frame_count, 0, totalFrames, TWO_PI, 0) % TWO_PI
        // c.translate(c.width * 0.5, c.height * 0.5)
        
        let sclSize = this.bezierSelo.paths.length > 0 ? 0.95 : 0.8

        let scaleX = (c.width * sclSize) / this.box.w
        let scaleY = (c.height * sclSize) / this.box.h
        let scale = min(scaleX, scaleY)
        let offsetX = (c.width - this.box.w * scale) / 2 - this.box.x * scale
        let offsetY = (c.height - this.box.h * scale) / 2 - this.box.y * scale

        c.push()
        c.translate(offsetX, offsetY)
        c.scale(scale)
        c.noStroke()

        c.fill(ui_data.background_color)
        this.drawSVG(c, this.bezierSelo.paths)

        
        c.fill(ui_data.fill_color)
        this.drawSVG(c, this.bezierPaths.paths)
        this.ico.draw(c, saving)



        if (ui_data.debug) {
            c.noFill()
            c.stroke(255, 0, 0)
            c.strokeWeight(2)
            c.circle(0, 0, 540)
            // c.circle(0, 0, 100)
            point(0, 0)
        }

        c.pop()

        // if (!pause) {
        //     this.t += ui_data.velocidade * 0.001
        //     this.rotation += ui_data.velocidade_rotacao * 0.001
        // }

        // if (ui_data.camera_posicao == "angulo") this.rotation = radians(ui_data.angulo_y)

        // console.log(`Frame: ${frame_count}, Rotation: ${this.rotation}, Total Frames: ${totalFrames}`)
    }
}



class Ico {
    //   Tri[] faces;
    constructor(k = 10) {
        let phi = 1.6180339887498948482 // Golden Ratio
        k *= 0.5
        let kphi = k * phi

        let xy_lt = createVector(-kphi, -k, 0)
        let xy_rt = createVector(kphi, -k, 0)
        let xy_rb = createVector(kphi, k, 0)
        let xy_lb = createVector(-kphi, k, 0)

        let yz_tf = createVector(0, -kphi, k)
        let yz_bf = createVector(0, kphi, k)
        let yz_tb = createVector(0, -kphi, -k)
        let yz_bb = createVector(0, kphi, -k)

        let zx_fl = createVector(-k, 0, kphi)
        let zx_bl = createVector(-k, 0, -kphi)
        let zx_fr = createVector(k, 0, kphi)
        let zx_br = createVector(k, 0, -kphi)

        this.faces = []

        let v = []

        v[0] = yz_tf
        v[1] = zx_fr
        v[2] = zx_fl
        this.faces[0] = new Tri(v)
        v[2] = xy_rt
        this.faces[1] = new Tri(v)
        v[0] = xy_rb
        this.faces[2] = new Tri(v)
        v[1] = zx_br
        this.faces[3] = new Tri(v)
        v[0] = yz_tb
        this.faces[4] = new Tri(v)
        v[1] = yz_tf
        this.faces[5] = new Tri(v)
        v[2] = xy_lt
        this.faces[6] = new Tri(v)
        v[0] = zx_fl
        this.faces[7] = new Tri(v)
        v[1] = xy_lb
        this.faces[8] = new Tri(v)
        v[2] = yz_bf
        this.faces[9] = new Tri(v)
        v[1] = zx_fr
        this.faces[10] = new Tri(v)
        v[0] = xy_rb
        this.faces[11] = new Tri(v)
        v[1] = yz_bb
        this.faces[12] = new Tri(v)
        v[2] = zx_br
        this.faces[13] = new Tri(v)
        v[0] = zx_bl
        this.faces[14] = new Tri(v)
        v[1] = yz_tb
        this.faces[15] = new Tri(v)
        v[2] = xy_lt
        this.faces[16] = new Tri(v)
        v[1] = xy_lb
        this.faces[17] = new Tri(v)
        v[2] = yz_bb
        this.faces[18] = new Tri(v)
        v[0] = yz_bf
        this.faces[19] = new Tri(v)

        // this.pisca = false
        // this.frame_pisca = 0
        this.t_pisca = 0
        this.freq_pisca = 60

        this.faces_pisca = []
        this.n_pisca = 0

        // this.duration_ascende = 30
        // this.duration_fade = 30
        // this.n_face_pisca = 0
        this.calc_freq_pisca()
        
        // this.t_pisca = floor(this.freq_pisca /2)
    }

    subdivide(n, extraChance, distributionType) {
        let f = this.faces.slice()
        this.faces = []

        for (let t of f) {
            this.faces = this.faces.concat(t.subdivide(n, extraChance, distributionType))
        }
        // console.log(this.faces.length + " faces")
    }

    spherify(n) {
        for (let i = 0; i < this.faces.length; i++) {
            if (this.faces[i] != null) {
                this.faces[i].v[0].setMag(n)
                this.faces[i].v[1].setMag(n)
                this.faces[i].v[2].setMag(n)
                // this.faces[i].center.setMag(n)
                this.faces[i].calcCenter()
                // this.faces[i].calcControlPoints()
            }
        }
    }

    reset_times(){
        this.n_pisca = 0
        this.t_pisca = 0

        for(let i =0; i< this.faces.length; i++){
            let f = this.faces[i]
            f.pisca = false
            f.frame_pisca = 0
        }
    }

    pickRandomFace(n , a) {
        let randomFaceIndex = floor(random(0, this.faces.length))

        if (this.faces_pisca.length > 1){
            if (randomFaceIndex == this.faces_pisca[this.faces_pisca.length-1]){
                return this.pickRandomFace(n + 1, a)
            }
        }
        //check if the face is facing the camera
        let face = this.faces[randomFaceIndex]
        if (face != null) {
            let toCamera = face.getFacingCamera(a)
            // if (toCamera > 0.8 && face.energy > 0) {
            // let maxEnergy = parseFloat(ui_data.tam_forma) * 0.01
            
            let energy = face.getEnergy(face.center, a)
            let pos_center = rotateYVector(face.center, a)
            let z = pos_center.z

            // console.log({
            //     randomFaceIndex,
            //     energy,
            //     pos_center,
            //     z
            // })
            if (!face.pisca && energy > 0 && toCamera > 0.8 && z < 0) {
                return randomFaceIndex
            }
        }
        if (n == 50) return randomFaceIndex
        return this.pickRandomFace(n + 1, a)
    }

    calc_freq_pisca() {
        let num_piscadas = parseInt(ui_data.num_pisca)
        this.freq_pisca = floor(totalFrames / (num_piscadas - 1))
    }

    define_faces_pisca(){
        this.faces_pisca = []

        let frames_pisca = []
        let total = 0
        for (let i = 0; i < parseInt(ui_data.num_pisca); i ++){
            let r = random(0.5, 1)
            frames_pisca.push(r)
            total += r
            
        }

        let total2 = 0
        let dur_pisca = parseInt(ui_data.duration_ascende) + parseInt(ui_data.duration_fade)
        for (let i = 0; i < parseInt(ui_data.num_pisca); i ++){
            let passo = frames_pisca[i]
            total2 += passo

            let frame = floor(map(total2, 0, total, 0, totalFrames - dur_pisca))

            let a = map (frame, 0, totalFrames, TWO_PI, 0)
            let n_face_pisca = this.pickRandomFace(0, a)
            
            this.faces_pisca.push({
                n_face_pisca: n_face_pisca,
                frame_pisca: frame
            })
        }
        frame_count = 0
        this.n_pisca = 0
        this.t_pisca = 0
    }

    update_pisca() {
        // if (!this.pisca){
        this.t_pisca++
        if (this.faces_pisca.length != parseInt(ui_data.num_pisca)) this.define_faces_pisca()
        
        if (frame_count === this.faces_pisca[this.n_pisca].frame_pisca) {
            // this.pisca = true
            
            this.t_pisca = 0
            let n_face_pisca = this.faces_pisca[this.n_pisca].n_face_pisca
            this.faces[n_face_pisca].comeca_pisca()
            this.calc_freq_pisca()
            this.n_pisca = (this.n_pisca + 1) % parseInt(ui_data.num_pisca)
        } 
    }

    draw(c, saving) {
        if (ui_data.pisca == "pisca" && !saving) this.update_pisca()

        const camAngleY = axis_logo.rotation
        const camAngleZ = radians(ui_data.angulo_camera)

        const sorted = this.faces
            .filter(f => f != null)
            .map((f, i) => {
                let v = rotateYVector(f.center, camAngleY)
                v = rotateZVector(v, camAngleZ)
                return { face: f, z: v.z, i }
            })
            // Draw far (larger z) first, near (more negative z) last
            .sort((a, b) => b.z - a.z || a.i - b.i)

        for (let i = 0; i < sorted.length; i++) {
            sorted[i].face.draw(c)
        }
    }
}

class Tri {
    constructor(vertices) {
        this.v = []
        for (let i = 0; i < 3; i++) {
            this.v.push(vertices[i].copy())
        }

        this.calcCenter()
        // this.calcControlPoints()

        this.seed = random(1000)
        // this.t = 0
        this.energy = 0
        // this.pisca = false

        this.pisca = false
        this.frame_pisca = 0
    }

    comeca_pisca() {
        this.pisca = true
    }

    update_pisca() {
        this.frame_pisca++
        if (this.frame_pisca > parseInt(ui_data.duration_ascende) + parseInt(ui_data.duration_fade)) {
            this.pisca = false
            this.frame_pisca = 0
        }
    }

    get_p() {
        // let p = norm(this.frame_pisca, 0, this.duration_pisca)
        let p = 0
        if (this.frame_pisca < parseInt(ui_data.duration_ascende)) {
            p = 1 - map(this.frame_pisca, 0, parseInt(ui_data.duration_ascende), 0, 1, true)
            // p = easeOutQuart(p)
            p = ease(ui_data.ascende_easing, p)
        } else {
            p = map(
                this.frame_pisca,
                parseInt(ui_data.duration_ascende),
                parseInt(ui_data.duration_ascende) + parseInt(ui_data.duration_fade),
                0,
                1,
                true
            )
            // p = easeInQuart(p)
            p = ease(ui_data.apaga_easing, p)
        }

        return p
    }

    calcCenter() {
        this.center = p5.Vector.add(this.v[0], this.v[1])
        this.center.add(this.v[2])
        this.center.div(3)
        this.r =
            (p5.Vector.sub(this.v[0], this.center).mag() * (parseFloat(ui_data.tam_forma) * 0.01)) /
            parseInt(ui_data.denditro_raio)
        this.normal = p5.Vector.cross(
            p5.Vector.sub(this.v[1], this.v[0]),
            p5.Vector.sub(this.v[2], this.v[0])
        ).normalize()
    }

    subdivide(n, extraChance, distributionType) {
        let out = []
        let triangleIndex = 0

        for (let i = 0; i < 2 * n; i++) {
            let tl = p5.Vector.lerp(this.v[0], this.v[1], i / (2 * n))
            let bl = p5.Vector.lerp(this.v[0], this.v[1], (i + 1) / (2 * n))
            let tr = p5.Vector.lerp(this.v[2], this.v[1], i / (2 * n))
            let br = p5.Vector.lerp(this.v[2], this.v[1], (i + 1) / (2 * n))

            for (let j = 0; j < 4 * n - 1 - 2 * i; j++) {
                let g = []
                if (j % 2 === 0) {
                    g[0] = p5.Vector.lerp(tl, tr, j / (2 * (2 * n - i)))
                    g[1] = p5.Vector.sub(bl, br).mag() > 1 ? p5.Vector.lerp(bl, br, (j - j / 2) / (2 * n - i - 1)) : bl
                    g[2] = p5.Vector.lerp(tl, tr, (j + 2) / (2 * (2 * n - i)))
                } else {
                    g[0] = p5.Vector.lerp(bl, br, (j - (j + 1) / 2) / (2 * n - i - 1))
                    g[1] = p5.Vector.lerp(tl, tr, (j + 1) / (2 * (2 * n - i)))
                    g[2] = p5.Vector.lerp(bl, br, (1 + j - (j + 1) / 2) / (2 * n - i - 1))
                }

                let triangle = new Tri(g)
                let shouldSubdivide = false

                // Different distribution patterns
                switch (distributionType) {
                    case "random":
                    default:
                        // Fallback to random
                        shouldSubdivide = random() < extraChance
                        break

                    case "none":
                        // No subdivision
                        shouldSubdivide = false
                        break
                }

                if (shouldSubdivide) {
                    // Add an extra subdivision round with n=1
                    let extraSubdivisions = triangle.subdivide(1, 0, "none") // Prevent infinite recursion
                    out = out.concat(extraSubdivisions)
                } else {
                    out.push(triangle)
                }
                triangleIndex++
            }
        }
        return out
    }

    // Calculate the minimum altitude of the triangle (v0, v1, v2)
    // Altitude from a vertex is the perpendicular distance from that vertex to the opposite side
    triangleAltitude(a, b, c) {
        // a, b, c are p5.Vector
        // Altitude from a to line (b,c)
        let base = p5.Vector.sub(c, b).mag()
        let area = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) * 0.5
        return (2 * area) / base
    }

    checkDir3D(v0, v1, v2) {
        // Check if the points v0, v1, v2 are in clockwise order in 3D
        let cross = p5.Vector.cross(p5.Vector.sub(v1, v0), p5.Vector.sub(v2, v0))
        return cross.z < 0 // If cross product is negative, points are in clockwise order
    }

    checkDir(v0, v1, v2) {
        // Check if the points v0, v1, v2 are in clockwise order
        let cross = (v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x)
        return cross < 0 // If cross product is negative, points are in clockwise order
    }

    draw2D(c, e) {
        let maxEnergy = parseFloat(ui_data.tam_forma) * 0.01
        let energy = e * maxEnergy // Default to 1 if no energy is provided
        // let energy = maxEnergy
        // let res = ui_data.res_noise * 0.0001
        // let min_max = ui_data.min_max_noise.split(",").map(Number)
        // let energy = map(
        //     noise.noise3D(this.center.x * res, this.center.y * res, t),
        //     min_max[0] * 0.01,
        //     min_max[1] * 0.01,
        //     0,
        //     maxEnergy,
        //     true
        // )

        if (energy > 0) {
            let v0 = p5.Vector.lerp(this.center, this.v[0], energy)
            let v1 = p5.Vector.lerp(this.center, this.v[1], energy)
            let v2 = p5.Vector.lerp(this.center, this.v[2], energy)

            if (checkDir(v0, v1, v2)) {
                // If the points are not in clockwise order, reverse them
                ;[v0, v1, v2] = [v2, v1, v0]
            }

            let curva = parseFloat(ui_data.denditro_curva) * 0.001
            // let dir_curva = parseFloat(ui_data.denditro_angulo_curva) * 0.1
            let ang_curva = radians(parseFloat(ui_data.denditro_angulo_curva))

            // if (!checkDir(v0,v1,v2)) ang_curva *= -1

            // let minRadius = ui_data.camera_posicao == "angulo" ? parseFloat(ui_data.min_radius) * 0.001 : 0

            // ang_curva = clockwise ? -ang_curva : ang_curva

            c.beginShape()

            let c_v0 = p5.Vector.sub(v0, this.center)

            let c_v0_90 = c_v0.copy().rotate(HALF_PI).normalize().mult(-this.r)

            let p00 = p5.Vector.add(v0, c_v0_90)
            // let c0_ = c_v0.copy().mult(-curva).add(c_v0_90.copy().mult(dir_curva)).add(p00)
            // let c0_ = c_v0.copy().mult(-curva)//.rotate(-ang_curva).add(p00)

            let c0_base = c_v0.copy().mult(-curva)
            let c0_ = c0_base.copy().rotate(ang_curva)
            c0_.add(p00)

            let c00 = p5.Vector.add(p00, c_v0.copy().normalize().mult(this.r))
            let p01 = p5.Vector.add(v0, c_v0_90.copy().mult(-1))
            let c01 = p5.Vector.add(p01, c_v0.copy().normalize().mult(this.r))

            let p = p00
            c.vertex(p.x, p.y)
            let c0 = c00
            let c1 = c01
            p = p01
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)

            let c02base = c_v0.copy().mult(-curva)
            let c02 = c02base.copy().rotate(-ang_curva)
            c02.add(p01)

            let c_v1 = p5.Vector.sub(v1, this.center)
            let c_v1_90 = c_v1.copy().rotate(HALF_PI).normalize().mult(-this.r)
            // real_radius = project3DTo2D(c_v1_90.copy().mult(2)).mag()
            // if (abs(real_radius) < minRadius) c_v1_90.mult(map(abs(real_radius), 0, minRadius, 20, 1))

            let p10 = p5.Vector.add(v1, c_v1_90)
            // let c1_ = c_v1.copy().mult(-curva).rotate(-ang_curva).add(p10)
            let c1_base = c_v1.copy().mult(-curva)
            let c1_ = c1_base.copy().rotate(ang_curva)
            c1_.add(p10)

            let c10 = p5.Vector.add(p10, c_v1.copy().normalize().mult(this.r))
            let p11 = p5.Vector.add(v1, c_v1_90.copy().mult(-1))
            let c11 = p5.Vector.add(p11, c_v1.copy().normalize().mult(this.r))

            p = p10
            c0 = c02
            c1 = c1_
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            p = p11
            c0 = c10
            c1 = c11
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            // let c12 = c_v1.copy().mult(-curva).rotate(ang_curva).add(p11)
            let c12base = c_v1.copy().mult(-curva)
            let c12 = c12base.copy().rotate(-ang_curva)
            c12.add(p11)

            let c_v2 = p5.Vector.sub(v2, this.center)
            let c_v2_90 = c_v2.copy().rotate(HALF_PI).normalize().mult(-this.r)
            // real_radius = project3DTo2D(c_v2_90.copy().mult(2)).mag()
            // if (abs(real_radius) < minRadius) c_v2_90.mult(map(abs(real_radius), 0, minRadius, 20, 1))

            let p20 = p5.Vector.add(v2, c_v2_90)
            // let c2_ = c_v2.copy().mult(-curva).rotate(-ang_curva).add(p20)
            let c2_base = c_v2.copy().mult(-curva)
            let c2_ = c2_base.copy().rotate(ang_curva)
            c2_.add(p20)
            let c20 = p5.Vector.add(p20, c_v2.copy().normalize().mult(this.r))
            let p21 = p5.Vector.add(v2, c_v2_90.copy().mult(-1))
            let c21 = p5.Vector.add(p21, c_v2.copy().normalize().mult(this.r))

            p = p20
            c0 = c12
            c1 = c2_
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            p = p21
            c0 = c20
            c1 = c21
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            // let c22 = c_v2.copy().mult(-curva).rotate(ang_curva).add(p21)
            let c22base = c_v2.copy().mult(-curva)
            let c22 = c22base.copy().rotate(-ang_curva)
            c22.add(p21)

            p = p00
            c0 = c22
            c1 = c0_
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            c.endShape(CLOSE)
        }
    }

    checkRadius(radius_v, v_center, minRadius, dir_rot) {
        let radius_2d = project3DTo2D(radius_v.copy())
        let v_center_2d = project3DTo2D(v_center.copy()).rotate(HALF_PI).normalize()
        let real_radius = radius_2d.dot(v_center_2d)

        if (abs(real_radius) < minRadius) {
            //multiply minRadius by -1 if ralRadius is negative
            if (dir_rot == false) minRadius *= -1
            // Get the 2D center vector and create a perpendicular vector
            let v_center_2d = project3DTo2D(v_center.copy())
            let perpendicular_2d = v_center_2d
                .copy()
                .rotate(HALF_PI - radians(30))
                .setMag(minRadius)

            // Convert the 2D correction back to 3D space
            // We need to find a 3D vector that projects to our desired 2D perpendicular

            // Get camera direction and up vector
            let cameraDir = rotateYVector(createVector(0, 0, 1), -axis_logo.rotation)
            let cameraUp = rotateYVector(createVector(0, 1, 0), -axis_logo.rotation)
            let cameraRight = p5.Vector.cross(cameraUp, cameraDir).normalize()

            // Create 3D vector from 2D perpendicular
            let radius_3d = p5.Vector.mult(cameraRight, perpendicular_2d.x)
            radius_3d.add(p5.Vector.mult(cameraUp, perpendicular_2d.y))

            return radius_3d
        }

        return radius_v
    }

    getEnergy(center, angle = map(frame_count, 0, totalFrames, TWO_PI, 0)) {
        let maxEnergy = parseFloat(ui_data.tam_forma) * 0.01
        let energy = 0
        if (ui_data.versao == "aleatorio") {
            let res = ui_data.res_noise * 0.0001
            let min_max = ui_data.min_max_noise.split(",").map(Number)

            // let angle = map(frame_count, 0, totalFrames, 0, TWO_PI)
            let raioNoise = parseFloat(ui_data.vel_noise) * 0.1
            let xNoise = cos(angle) * raioNoise
            let yNoise = sin(angle) * raioNoise
            energy = map(
                noise.noise4D(center.x * res, center.y * res, center.z * res + xNoise, yNoise),
                min_max[0] * 0.01,
                min_max[1] * 0.01,
                0,
                maxEnergy,
                true
            )
        } else {
            let raio = parseFloat(ui_data.raio_esfera)
            let min_max = ui_data.min_max_regular.split(",").map(Number)
            min_max = min_max.map((v) => v * 0.01 * raio)

            // Create a custom angle for energy mapping (independent of rotation and camera)
            let energyAngle = radians(ui_data.angulo_energia || 0) // Add this to your UI controls
            let energyAxis = createVector(sin(energyAngle), cos(energyAngle), 0) // Custom axis direction

            // Get the original triangle center by applying inverse transformations
            let originalCenter = rotateYVector(center, angle)
            originalCenter = rotateZVector(originalCenter, radians(ui_data.angulo_camera))

            // Project the original triangle center onto the custom energy axis
            let energyProjection = p5.Vector.dot(originalCenter, energyAxis)

            energy = map(energyProjection, min_max[0], min_max[1], maxEnergy, 0, true)
        }

        if (ui_data.desenho_frente_fundo == "frente") {
            let pos_center = rotateYVector(center, angle)
            let z = pos_center.z
            let frente_fundo = ui_data.frente_fundo.split(",").map(Number)
            let radius = parseFloat(ui_data.raio_esfera)
            let min = frente_fundo[0] * radius * 0.01
            let max = frente_fundo[1] * radius * 0.01
            if (z > min) {
                energy *= map(z, min, max, 1, 0, true)
            }
        } else if (ui_data.desenho_frente_fundo == "fundo") {
            let pos_center = rotateYVector(center, angle)
            let z = pos_center.z
            let frente_fundo = ui_data.frente_fundo.split(",").map(Number)
            let radius = parseFloat(ui_data.raio_esfera)
            let min = frente_fundo[0] * radius * 0.01
            let max = frente_fundo[1] * radius * 0.01
            if (z < max) {
                energy *= map(z, min, max, 0, 1, true)
            }
        }
        return energy
    }

    getFacingCamera(a) {
        let cameraDir = rotateYVector(createVector(0, 0, 1), -a)
        let normalDir = this.normal.copy().normalize()
        let facingCamera = abs(p5.Vector.dot(normalDir, cameraDir))
        return facingCamera
        // if (facingCamera < parseInt(ui_data.area_min) * 0.01) return
    }

    draw(c) {
        c.push()
        this.energy = this.getEnergy(this.center)

        if (this.pisca) {
            this.update_pisca()
            let p = this.get_p()
            let clr = lerpColor(ui_data.pisca_color, ui_data.fill_color, p)
            c.fill(clr)
        }

        if (this.energy > 0) {
            let v0 = p5.Vector.lerp(this.center, this.v[0], this.energy)
            let v1 = p5.Vector.lerp(this.center, this.v[1], this.energy)
            let v2 = p5.Vector.lerp(this.center, this.v[2], this.energy)

            let dir_rot = this.checkDir3D(v0, v1, v2)

            let curva = parseFloat(ui_data.denditro_curva) * 0.001
            let ang_curva = radians(parseFloat(ui_data.denditro_angulo_curva))
            let controle_pontas = this.r * 1.5

            // if (!checkDir(v0,v1,v2)) ang_curva *= -1

            let minRadius = 0

            c.beginShape()

            let c_v0 = p5.Vector.sub(v0, this.center)

            let c_v0_90 = p5.Vector.cross(this.normal, c_v0).normalize().mult(-this.r)

            //check for minimum radius
            c_v0_90 = this.checkRadius(c_v0_90, c_v0, minRadius, dir_rot)

            let p00 = p5.Vector.add(v0, c_v0_90)
            // let c0_ = c_v0.copy().mult(-curva).add(c_v0_90.copy().mult(dir_curva)).add(p00)
            // let c0_ = c_v0.copy().mult(-curva)//.rotate(-ang_curva).add(p00)

            let c0_base = c_v0.copy().mult(-curva)
            let c0_ = rotateVectorAroundAxis(c0_base, this.normal, ang_curva)
            c0_.add(p00)

            let c00 = p5.Vector.add(p00, c_v0.copy().normalize().mult(controle_pontas))
            let p01 = p5.Vector.add(v0, c_v0_90.copy().mult(-1))
            let c01 = p5.Vector.add(p01, c_v0.copy().normalize().mult(controle_pontas))

            let p = project3DTo2D(p00)
            c.vertex(p.x, p.y)
            let c0 = project3DTo2D(c00)
            let c1 = project3DTo2D(c01)
            p = project3DTo2D(p01)
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)

            // let c02 = c_v0.copy().mult(-curva).add(c_v0_90.copy().mult(-dir_curva)).add(p01)
            // let c02 = c_v0.copy().mult(-curva).rotate(ang_curva).add(p01)
            let c02base = c_v0.copy().mult(-curva)
            let c02 = rotateVectorAroundAxis(c02base, this.normal, -ang_curva)
            c02.add(p01)

            let c_v1 = p5.Vector.sub(v1, this.center)
            let c_v1_90 = p5.Vector.cross(this.normal, c_v1).normalize().mult(-this.r)
            c_v1_90 = this.checkRadius(c_v1_90, c_v1, minRadius, dir_rot)
            // real_radius = project3DTo2D(c_v1_90.copy().mult(2)).mag()
            // if (abs(real_radius) < minRadius) c_v1_90.mult(map(abs(real_radius), 0, minRadius, 20, 1))

            let p10 = p5.Vector.add(v1, c_v1_90)
            // let c1_ = c_v1.copy().mult(-curva).rotate(-ang_curva).add(p10)
            let c1_base = c_v1.copy().mult(-curva)
            let c1_ = rotateVectorAroundAxis(c1_base, this.normal, ang_curva)
            c1_.add(p10)

            let c10 = p5.Vector.add(p10, c_v1.copy().normalize().mult(controle_pontas))
            let p11 = p5.Vector.add(v1, c_v1_90.copy().mult(-1))
            let c11 = p5.Vector.add(p11, c_v1.copy().normalize().mult(controle_pontas))

            p = project3DTo2D(p10)
            c0 = project3DTo2D(c02)
            c1 = project3DTo2D(c1_)
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            p = project3DTo2D(p11)
            c0 = project3DTo2D(c10)
            c1 = project3DTo2D(c11)
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            // let c12 = c_v1.copy().mult(-curva).rotate(ang_curva).add(p11)
            let c12base = c_v1.copy().mult(-curva)
            let c12 = rotateVectorAroundAxis(c12base, this.normal, -ang_curva)
            c12.add(p11)

            let c_v2 = p5.Vector.sub(v2, this.center)
            let c_v2_90 = p5.Vector.cross(this.normal, c_v2).normalize().mult(-this.r)
            c_v2_90 = this.checkRadius(c_v2_90, c_v2, minRadius, dir_rot)
            // real_radius = project3DTo2D(c_v2_90.copy().mult(2)).mag()
            // if (abs(real_radius) < minRadius) c_v2_90.mult(map(abs(real_radius), 0, minRadius, 20, 1))

            let p20 = p5.Vector.add(v2, c_v2_90)
            // let c2_ = c_v2.copy().mult(-curva).rotate(-ang_curva).add(p20)
            let c2_base = c_v2.copy().mult(-curva)
            let c2_ = rotateVectorAroundAxis(c2_base, this.normal, ang_curva)
            c2_.add(p20)
            let c20 = p5.Vector.add(p20, c_v2.copy().normalize().mult(controle_pontas))
            let p21 = p5.Vector.add(v2, c_v2_90.copy().mult(-1))
            let c21 = p5.Vector.add(p21, c_v2.copy().normalize().mult(controle_pontas))

            p = project3DTo2D(p20)
            c0 = project3DTo2D(c12)
            c1 = project3DTo2D(c2_)
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            p = project3DTo2D(p21)
            c0 = project3DTo2D(c20)
            c1 = project3DTo2D(c21)
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            // let c22 = c_v2.copy().mult(-curva).rotate(ang_curva).add(p21)
            let c22base = c_v2.copy().mult(-curva)
            let c22 = rotateVectorAroundAxis(c22base, this.normal, -ang_curva)
            c22.add(p21)

            p = project3DTo2D(p00)
            c0 = project3DTo2D(c22)
            c1 = project3DTo2D(c0_)
            c.bezierVertex(c0.x, c0.y, c1.x, c1.y, p.x, p.y)
            // c.vertex(p.x, p.y)
            c.endShape(CLOSE)
        }
        c.pop()
    }
}
