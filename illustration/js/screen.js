class Screen {
    constructor(w, h) {
        this.w = w
        this.h = h

        let propW = (width - 50) / this.w
        let propH = (height - 50) / this.h

        this.scale = min(propH, propW)
        this.wReal = this.w * this.scale
        this.hReal = this.h * this.scale

        let x = width * 0.5
        let y = height * 0.5
        this.pos = createVector(x, y)

        this.mOver = {
            mOnP: false,
            mOnT: false,
            mOn: false,
        }

        this.lockP = false
        this.lockT = false
    }

    checkMouse() {
        let m = createVector(mouseX, mouseY)
        let margem = 10

        let mOn =
            m.x > this.pos.x - this.wReal * 0.5 - margem &&
            m.x < this.pos.x + this.wReal * 0.5 + margem &&
            m.y > this.pos.y - this.hReal * 0.5 - margem &&
            m.y < this.pos.y + this.hReal * 0.5 + margem

        let mOnT =
            mOn &&
            ((m.x > this.pos.x - this.wReal * 0.5 - margem && m.x < this.pos.x - this.wReal * 0.5 + margem) ||
                (m.x > this.pos.x + this.wReal * 0.5 - margem && m.x < this.pos.x + this.wReal * 0.5 + margem) ||
                (m.y > this.pos.y - this.hReal * 0.5 - margem && m.y < this.pos.y - this.hReal * 0.5 + margem) ||
                (m.y > this.pos.y + this.hReal * 0.5 - margem && m.y < this.pos.y + this.hReal * 0.5 + margem))
                let mOnP = mOn && !mOnT
            //mOn &&
            // ((m.x > this.pos.x - margem && m.x < this.pos.x + margem) ||
            //     (m.y > this.pos.y - margem && m.y < this.pos.y + margem))

        return {
            mOnP: mOnP,
            mOnT: mOnT,
            mOn: mOn,
        }
    }

    mClick() {
        if (this.mOver.mOnP) this.lockP = true
        else if (this.mOver.mOnT) this.lockT = true
        return this.lockP || this.lockT
    }

    mReleased() {
        this.lockP = false
        this.lockT = false
    }

    update() {
        this.mOver = this.checkMouse()
        let mousePos = createVector(mouseX, mouseY)
        let vel = p5.Vector.sub(mousePos, createVector(pmouseX, pmouseY))
        if (this.lockP) this.pos.add(vel)
        else if (this.lockT) {
            let m_p = p5.Vector.sub(mousePos, this.pos)
            let propTela = this.w / this.h
            let propM = abs(m_p.x) / abs(m_p.y)

            if (propTela < propM) {
                this.scale = (abs(m_p.x) * 2) / this.w
            } else {
                this.scale = (abs(m_p.y) * 2) / this.h
            }
            this.wReal = this.w * this.scale
            this.hReal = this.h * this.scale
        }
    }

    draw() {
        let x1 = this.pos.x - this.wReal * 0.5
        let y1 = this.pos.y - this.hReal * 0.5
        let x2 = this.pos.x + this.wReal * 0.5
        let y2 = this.pos.y + this.hReal * 0.5

        push()
        fill(ui_data.selector_background)
        noStroke()
        beginShape()
        vertex(0, 0)
        vertex(width, 0)
        vertex(width, height)
        vertex(0, height)
        beginContour()
        vertex(x1, y1)
        vertex(x1, y2)
        vertex(x2, y2)
        vertex(x2, y1)
        endContour(CLOSE)
        endShape(CLOSE)
        pop()
        push()

        noFill()


        let ui_clr = color(255)
        if (ui_data.selector_background == "#FAF5F0" || ui_data.selector_background == "#A0B4D2") ui_clr = color(0, 0, 255)
        // else if (ui_data.selector_background == "#A0B4D2") ui_clr = color(0)
        // else if (ui_data.selector_background == "#0000FF") ui_clr = color(255)
        // else if () ui_clr = color(255, 255, 0)

        if (this.mOver.mOnT || this.mOver.mOnP) {
            stroke(ui_clr)
            if (this.mOver.mOnT) strokeWeight(5)
            else strokeWeight(3)
            translate(this.pos.x, this.pos.y)
            rectMode(CENTER)
            rect(0, 0, this.wReal, this.hReal)
            if (this.mOver.mOnP) strokeWeight(3)
            else strokeWeight(1)
            line(-this.wReal * 0.5, 0, this.wReal * 0.5, 0)
            line(0, -this.hReal * 0.5, 0, this.hReal * 0.5)
        } else stroke(ui_clr, 150)

        pop()
    }
}
