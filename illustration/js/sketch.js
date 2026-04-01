let cnv,
    originalPreset,
    rec_screen,
    saveMP4 = false,
    saveFramesPNG = false,
    processingZIP = false,
    mp4Encoder,
    frame_count = 0,
    totalFrames = 60,
    frameRateUi = 60,
    noise,
    pause = false,
    bkp_settings,
    logo_svg = [],
    axis_textura,
    img,
    img_kind = "image",
    img_loaded = null,
    loaded_frames = [],
    clrs_texture = []

const zip = new JSZip()

function preload() {
    img = loadImage("assets/illustration/img/iStock-1139792571.jpg")
}

function setup() {
    cnv = createCanvas(windowWidth - 300, windowHeight)
    cnv.position(300, 0)
    cnv.drop(loadAsset)

    rec_screen = new Screen(ui_data.exportW, ui_data.exportH)

    setupFFmpeg()
    
    setDesenhoDenditro()
    updateColors()

    bkp_settings = JSON.parse(JSON.stringify(ui_data))
    resetNoise()
    frameRate(parseInt(ui_data.fps))
    noStroke()

    originalPreset = JSON.parse(JSON.stringify(ui_data))
    resetTotalFrames()
    assetLoaded()
}

function draw() {
    push()
    background(ui_data.selector_background)

    if (img_loaded) {
        if (!saveMP4 && !saveFramesPNG) axis_textura.draw()

        if (saveMP4) save_frame_mp4()
        if (saveFramesPNG) save_frame_png()
        if (!saveFramesPNG && !saveMP4) frame_count = (frame_count + 1) % totalFrames
    }

    // if (ui_data.show_crop) {
        rec_screen.update()
        rec_screen.draw()
    // }

    // t += ui_data.velocidade * 0.001

    let y = height - 10
    let x = 10

    if (saveMP4 || saveFramesPNG) {
        noStroke()
        if (frame_count % 10 == 0) frameRateUi = round(frameRate())
        push()
        fill(0, 0, 255)
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
        fill(0, 0, 255)
        textSize(10)
        text(frame_count + " / " + totalFrames, x + 2, y - 2)
        pop()
        fill(255)
        text("SALVANDO\nMantenha a aba aberta até o fim.", x, y - 30)
    } else if (processingZIP) {
        push()
        fill(0, 0, 255)
        rect(x - 5, y + 5, 230, -35)
        pop()
        push()
        fill(255)
        y -= 15
        text(">> PROCESSANDO ZIP <<", x, y)
        pop()
        noLoop()
    } else if (!img_loaded) {
        noStroke()
        if (frame_count % 10 == 0) frameRateUi = round(frameRate())
        push()
        fill(0, 0, 255)
        rect(x - 5, y + 5, 230, -65)
        pop()
        fill(255)
        rect(x, y - 25, norm(loaded_frames.length, 0, totalFrames) * 220, 10)
        fill(255)
        text("CARREGANDO: " + loaded_frames.length + "/" + totalFrames, x, y)
        y -= 15
        textSize(12)
        textLeading(12)
        push()
        fill(0, 0, 255)
        textSize(10)
        text(loaded_frames.length + " / " + totalFrames, x + 2, y - 2)
        pop()
        fill(255)
        text("CARREGANDO\nMantenha a aba aberta até o fim.", x, y - 30)
    }
    pop()
}

function keyReleased() {
    if (key == " ") pause = !pause
}

function mousePressed() {
    rec_screen.mClick()
}

function mouseReleased() {
    rec_screen.mReleased()
}

function windowResized() {
    resizeCanvas(windowWidth - 300, windowHeight)
    // camera(0, 0, 800)
    // perspective(2 * atan(height / 2 / 800), width / height, 10, 100000)
}

class Texture {
    constructor(opt) {
        this.faces = []
        this.opt = opt || {}
        this.frames = this.opt.img_textura
        // console.log(this.frames)

        this.setMask()

        this.createTexture()

        this.closest = this.findClosest()
    }


    createTexture(){
        // let center = createVector(0, 0)
        // let radius = max(width, height)
        // for (let i = 0; i < 6; i++) {
        //     let v1 = createVector(radius, 0).rotate((TWO_PI / 6) * i)
        //     let v2 = createVector(radius, 0).rotate((TWO_PI / 6) * (i + 1))

        //     this.faces.push(new Tri([center, v1, v2]))
        // }
        // this.subdivide(this.opt.div)

        let w = this.opt.res
        let h = this.opt.res
        let cols = width/w
        let rows = height/h
        let radius = max(w, h) * 0.5

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let x = map(i, 0, cols, -width*0.5, width*0.5)
                let y = map(j, 0, rows, -height*0.5, height*0.5)
                this.makeTri(x, y, radius)
            }
        }
    }

    makeTri(x,y,r){
        let verts = []
        for (let i = 0; i < 3; i++) {
            let angle = map(i, 0, 3, 0, TWO_PI) - HALF_PI
            let vx = x + cos(angle) * r
            let vy = y + sin(angle) * r
            verts.push(createVector(vx, vy))
        }
        this.faces.push(new Tri(verts))
    }
    

    findClosest(target = rec_screen ? rec_screen.pos : createVector(0, 0)) {
        // Convert target from canvas space to texture-local space (origin at canvas center)
        const canvasCenter = createVector(width * 0.5, height * 0.5)
        const localTarget = p5.Vector.sub(target, canvasCenter)

        let closest = null
        let smallerDist = Infinity
        for (let f of this.faces) {
            // Compare in local space
            const d = p5.Vector.sub(f.center, localTarget).magSq()
            if (d < smallerDist) {
                smallerDist = d
                closest = f
            }
        }
        return closest
    }

    destroy() {
        this.mask.remove()
    }

    setMask(c = cnv._pInst) {
        if (this.mask) this.destroy()
        let frame = this.frames[frame_count % this.frames.length]
        // console.log("Setting mask with frame: " + (frame_count % this.frames.length) + " - " + frameRate())

        this.mask = createGraphics(c.width, c.height)
        this.mask.pixelDensity(1)
        this.mask.background(255)

        let img_w = frame.width
        let img_h = frame.height

        let img_prop = img_w / img_h
        let canvas_prop = c.width / c.height

        let scale = 1
        if (img_prop > canvas_prop) {
            // Image is wider than canvas
            scale = c.width / img_w
        } else {
            // Image is taller than canvas
            scale = c.height / img_h
        }
        let img_w_scaled = img_w * scale
        let img_h_scaled = img_h * scale

        let offsetX = (c.width - img_w_scaled) / 2
        let offsetY = (c.height - img_h_scaled) / 2
        this.mask.image(frame, offsetX, offsetY, img_w_scaled, img_h_scaled)
    }

    subdivide(n) {
        let f = this.faces.slice()
        this.faces = []

        for (let t of f) {
            this.faces = this.faces.concat(t.subdivide(n, 1, "none"))
        }
        // console.log(this.faces.length + " faces")
    }


    calcScale() {
        // Use the closest triangle's size (distance from its center to one vertex)
        const tri = this.closest || this.findClosest()
        const triRadius = tri && tri.tri_size ? tri.tri_size : 1

        // Target radius: half of the screen diagonal to cover the whole rectangle
        const w = rec_screen ? rec_screen.wReal : width
        const h = rec_screen ? rec_screen.hReal : height
        const targetRadius = 0.5 * min(w, h)

        let s = targetRadius / triRadius
        if (!isFinite(s) || s <= 0) s = 1

        return s
    }

    draw(c = cnv._pInst) {
        c.push()
        let scl = 1
        if (ui_data.motion_on == "movimenta") {
            let maxScale = this.calcScale()
            let a = map(frame_count, 0, totalFrames, 0, TWO_PI)
            scl = map(cos(a), -1, 1, 0, 1, true)
            scl = pow(scl, 4) // Squaring to make it more pronounced
            scl = map(scl, 0, 1, 1, maxScale, true)
        }

        if (rec_screen.lockP || rec_screen.lockT) this.closest = this.findClosest(rec_screen.pos)

        // let center = createVector(width * 0.5, height * 0.5)
        let center = rec_screen.pos.copy()
        let closest = this.closest.center.copy().mult(scl)
        center.sub(closest)

        c.translate(center.x, center.y)
        // c.noFill()
        // c.stroke(255,0,0)
        c.noStroke()
        // c.fill(ui_data.fill_color)
        // c.strokeWeight(1)

        if (totalFrames > 1 && img_loaded) {
            this.setMask(cnv._pInst)
        }

        this.mask.loadPixels()
        let min_max = ui_data.tex_levels.split(",").map(Number)

        c.scale(scl)

        let rec_p1 = rec_screen.pos.copy().sub(createVector(rec_screen.wReal, rec_screen.hReal).mult(0.5))
        let rec_p2 = rec_screen.pos.copy().add(createVector(rec_screen.wReal, rec_screen.hReal).mult(0.5))

        for (let i = 0; i < this.faces.length; i++) {
            let f = this.faces[i]
            let pos = f.center.copy().mult(scl).add(center)
            let v1 = f.v[0].copy().mult(scl).add(center)
            let v2 = f.v[1].copy().mult(scl).add(center)
            let v3 = f.v[2].copy().mult(scl).add(center)
            const inside = (p) => p.x >= rec_p1.x-150 && p.x <= rec_p2.x+150 && p.y >= rec_p1.y-150 && p.y <= rec_p2.y+150
            if (!inside(v1) && !inside(v2) && !inside(v3)) continue

            let pixel_number =
                constrain(round(pos.x), 0, this.mask.width - 1) +
                constrain(round(pos.y), 0, this.mask.height - 1) * this.mask.width
            let alpha =
                (this.mask.pixels[pixel_number * 4] +
                    this.mask.pixels[pixel_number * 4 + 1] +
                    this.mask.pixels[pixel_number * 4 + 2]) /
                3

            if (ui_data.tex_versao === "positiva") alpha = 255 - alpha

            let e = map(alpha, min_max[0], min_max[1], 0, 1, true)
            // c.push()
            // if (f === this.closest) c.stroke(255,0,0)
            f.draw2D(c, e)
            // c.pop()
        }

        c.pop()
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
        this.tri_size = p5.Vector.sub(this.center, this.v[0]).mag()
        this.seed = random(1000)
        this.t = 0
        this.pisca = false
        this.energy = 1
    }

    calcCenter() {
        this.center = p5.Vector.add(this.v[0], this.v[1])
        this.center.add(this.v[2])
        this.center.div(3)
        this.r =
            (p5.Vector.sub(this.v[0], this.center).mag() * (parseFloat(ui_data.tam_forma) * 0.01)) /
            parseInt(ui_data.denditro_raio)
        // this.normal = p5.Vector.cross(
        //     p5.Vector.sub(this.v[1], this.v[0]),
        //     p5.Vector.sub(this.v[2], this.v[0])
        // ).normalize()
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
        this.energy = lerp(this.energy, e, 0.25)
        let num_colors = clrs_texture.length
        let n_clr = min(floor(this.energy * num_colors), num_colors - 1)
        let color_deditro = clrs_texture[n_clr]

        c.fill(color_deditro)

        // let energy = 0
        let maxEnergy = parseFloat(ui_data.tam_forma) * 0.01
        let minEnergy = min(parseFloat(ui_data.tex_tamMin) * 0.01, maxEnergy - 0.01)

        let energy = map(this.energy, 1, 0, minEnergy, maxEnergy)
        if (ui_data.selector_background == "#FAF5F0" || (ui_data.tex_cor_versao == "mono" && ui_data.selector_background == "#A0B4D2")) energy = map(energy, minEnergy, maxEnergy, maxEnergy, minEnergy)


        // if (energy > 0) {
        let v0 = p5.Vector.lerp(this.center, this.v[0], energy)
        let v1 = p5.Vector.lerp(this.center, this.v[1], energy)
        let v2 = p5.Vector.lerp(this.center, this.v[2], energy)

        if (checkDir(v0, v1, v2)) {
            // If the points are not in clockwise order, reverse them
            ;[v0, v1, v2] = [v2, v1, v0]
        }

        let curva = parseFloat(ui_data.denditro_curva) * 0.001
        let ang_curva = radians(parseFloat(ui_data.denditro_angulo_curva))

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
        // }


        // c.push()
        // c.noFill()
        // c.strokeWeight(3)
        // c.stroke(255,0,0)
        // c.point(this.center.x, this.center.y)
        // c.pop()
    }
}
