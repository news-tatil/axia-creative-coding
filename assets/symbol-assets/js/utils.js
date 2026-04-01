// function makeIco() {
//     ico = new Ico(10)
//     let div = parseInt(ui_data.num_divisoes)
//     let extraChance = parseFloat(ui_data.probabilidade_subdivisao) * 0.01
//     let distributionType = ui_data.subdivisao_versao
//     if (div > 0) ico.subdivide(div, extraChance, distributionType)
//     ico.spherify(parseFloat(ui_data.raio_esfera))
// }

function makeLogo() {
    let bezierPaths = []
    let bezierSelo = []

    if (ui_data.versao_logo != "null") {
        let svgData = logo_svg[parseInt(ui_data.versao_logo)].DOM.outerHTML
        bezierPaths = SVGtoBezier(svgData)

        const pos =
            ui_data.preset_cor == "pb_neg" || ui_data.preset_cor == "cor1_neg" || ui_data.preset_cor == "cor2_neg"
                ? false
                : true
        if (ui_data.versao_selo == 1 && ui_data.versao_logo != "3" && !pos) {
            let svgSelo = selo_svg[parseInt(ui_data.versao_logo)].DOM.outerHTML
            bezierSelo = SVGtoBezier(svgSelo)
        }
    }

    let opt = {
        div: parseInt(ui_data.num_divisoes),
        extraChance: parseFloat(ui_data.probabilidade_subdivisao) * 0.01,
        distributionType: ui_data.subdivisao_versao,
        raio: parseFloat(ui_data.raio_esfera),
        // bg_clr: ui_data.background_color,
        // fill_clr: ui_data.fill_color,
        bezierPaths: bezierPaths,
        bezierSelo: bezierSelo,
    }
    axis_logo = new Logo(opt)

    // let opt_textura = {
    //     img_textura: img_textura,
    //     div: parseInt(ui_data.tex_num_divisoes),
    // }
    // if (axis_textura) axis_textura.destroy()
    // axis_textura = new Texture(opt_textura)
}

function resetNoise(v = Date.now()) {
    noise_seed = v
    noise = new OpenSimplexNoise(v)
    if (axis_logo) axis_logo.define_faces_pisca()
}

function updateColors() {
    ui_data.fill_color = ui_data.selector_fill
    ui_data.background_color = ui_data.selector_background
    ui_left.refresh()
    makeLogo()
}

function presetCor() {
    if (ui_data.preset_cor == "pb_pos") {
        ui_left.data.selector_fill = "#000000"
        ui_left.data.selector_background = "#FFFFFF"
    } else if (ui_data.preset_cor == "pb_neg") {
        ui_left.data.selector_fill = "#FFFFFF"
        ui_left.data.selector_background = "#000000"
    } else if (ui_data.preset_cor == "cor1_neg") {
        ui_left.data.selector_fill = "#FFFFFF"
        ui_left.data.selector_background = "#0000FF"
    } else if (ui_data.preset_cor == "cor2_neg") {
        ui_left.data.selector_fill = "#FFFFFF"
        ui_left.data.selector_background = "#0A003C"
    } else if (ui_data.preset_cor == "cor1_pos") {
        ui_left.data.selector_fill = "#0A003C"
        ui_left.data.selector_background = "#FFFFFF"
    } else if (ui_data.preset_cor == "cor2_pos") {
        ui_left.data.selector_fill = "#0A003C"
        ui_left.data.selector_background = "#A0B4D2"
    }

    ui_data.fill_color = ui_data.selector_fill
    ui_data.background_color = ui_data.selector_background
    ui_left.refresh()
    makeLogo()
}

function setDesenhoDenditro() {
    ui_data.tam_forma = 83
    ui_data.denditro_curva = 1009
    ui_data.denditro_angulo_curva = 5
    ui_data.denditro_raio = 73
    ui_data.angulo_camera = -23
    ui_data.camera_distancia = 464
    ui_data.raio_esfera = 236
}

function ease(kind, p) {
    if (kind == "quad_in") return easeInQuad(p)
    else if (kind == "quad_out") return easeOutQuad(p)
    else if (kind == "cubic_in") return easeInCubic(p)
    else if (kind == "cubic_out") return easeOutCubic(p)
    else if (kind == "quart_in") return easeInQuart(p)
    else if (kind == "quart_out") return easeOutQuart(p)
    else if (kind == "expo_in") return easeInExpo(p)
    else if (kind == "expo_out") return easeOutExpo(p)
    else return p
}

function easeInQuart(t) {
    return t * t * t * t
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t) {
    return t * t
}

function easeOutQuad(t) {
    return 1 - Math.pow(1 - t, 2)
}

function easeInCubic(t) {
    return t * t * t
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
}

function easeInExpo(t) {
    return t === 0 ? 0 : Math.pow(2, 10 * (t - 1))
}

function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function checkDir(v0, v1, v2) {
    // Check if the points v0, v1, v2 are in clockwise order
    let cross = (v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x)
    return cross < 0 // If cross product is negative, points are in clockwise order
}

function rotateVectorAroundAxis(vector, axis, angle) {
    // Rodrigues' rotation formula
    let cosAngle = Math.cos(angle)
    let sinAngle = Math.sin(angle)

    // Ensure axis is normalized
    let normalizedAxis = axis.copy().normalize()

    // v_rot = v*cos(θ) + (k × v)*sin(θ) + k*(k·v)*(1-cos(θ))
    let term1 = p5.Vector.mult(vector, cosAngle)
    let term2 = p5.Vector.mult(p5.Vector.cross(normalizedAxis, vector), sinAngle)
    let term3 = p5.Vector.mult(normalizedAxis, p5.Vector.dot(normalizedAxis, vector) * (1 - cosAngle))

    return p5.Vector.add(p5.Vector.add(term1, term2), term3)
}

function resetTotalFrames() {
    totalFrames = parseInt(ui_data.rot_time) * parseInt(ui_data.fps)
}

function reset_time() {
    axis_logo.reset_times()
    frame_count = 0
}

function resetFps() {
    if (ui_data.fps < 1) {
        ui_data.fps = 1
    }
    frameRate(parseInt(ui_data.fps))
    resetTotalFrames()
}

function nameFile() {
    var date = new Date().toISOString()
    return "Eletrobras_" + date
}

function drawFrame(c) {
    c.push()
    // if (ui_data.transparent_background && !saveMP4) c.clear()
    // else c.background(ui_data.color_bg)
    if (ui_data.transparent_background || axis_logo.bezierSelo.paths.length != 0) c.clear()
    else c.background(ui_data.background_color)

    axis_logo.draw(c, true)

    c.pop()
}

// ///////////////// SVG //////////////////

// function save_svg() {
//     var cnv = createGraphics(width, height, SVG)
//     cnv.pixelDensity(1)
//     drawFrame(cnv)

//     cnv.save(nameFile() + ".svg")
// }

///////////////// SVG //////////////////

function save_svg() {
    var cnv = createGraphics(parseInt(ui_data.exportW), parseInt(ui_data.exportH), SVG)
    cnv.pixelDensity(1)
    drawFrame(cnv)

    cnv.save(nameFile() + ".svg")
}

///////////////// PNG //////////////////

function save_png() {
    var cnv = createGraphics(parseInt(ui_data.exportW), parseInt(ui_data.exportH))
    cnv.pixelDensity(1)
    drawFrame(cnv)

    cnv.save(nameFile() + ".png")
}

///////////////// MP4 with FFmpeg.wasm //////////////////

// Initialize FFmpeg at the beginning
let ffmpeg
// let frames = []  // removed: not used
let framePaths = []
let isFFmpegReady = false
let isCapturingFrame = false
let mp4WarmupFrames = 0

async function initFFmpeg() {
    try {
        ffmpeg = FFmpeg.createFFmpeg({
            log: false,
            corePath: new URL("./assets/symbol-assets/js/ffmpeg/ffmpeg-core.js", window.location.href).href,
        })
        await ffmpeg.load()
        isFFmpegReady = true
        console.log("FFmpeg.wasm loaded successfully")
    } catch (err) {
        console.error("Failed to load FFmpeg.wasm:", err)
        alert("Error loading video encoder. SharedArrayBuffer support required.")
    }
}

function setupFFmpeg() {
    initFFmpeg().catch((err) => console.error("Failed to load FFmpeg.wasm:", err))
}

function create_encoder_mp4() {
    framePaths = []
    isCapturingFrame = false
    frame_count = 0
}

// Optional: adjust here if you want more warmup frames
const DEFAULT_WARMUP_FRAMES = 2

function start_rec_mp4() {
    if (!isFFmpegReady) {
        alert("FFmpeg is still loading. Please try again in a few seconds.")
        return
    }
    frameRateUi = 5
    resetTotalFrames()
    create_encoder_mp4()
    saveMP4 = !saveMP4
    if (saveMP4) {
        mp4WarmupFrames = DEFAULT_WARMUP_FRAMES
    } else {
        end_rec_mp4()
    }
}

function save_frame_mp4() {
    if (!saveMP4) return

    // Warmup frames (render only)
    if (mp4WarmupFrames > 0) {
        mp4WarmupFrames--
        const w0 = parseInt(ui_data.exportW)
        const h0 = parseInt(ui_data.exportH)
        const warm = createGraphics(w0, h0)
        warm.pixelDensity(1)
        drawFrame(warm)
        warm.remove()
        return
    }

    if (isCapturingFrame) return
    isCapturingFrame = true

    const w = parseInt(ui_data.exportW)
    const h = parseInt(ui_data.exportH)
    const displayIndex = frame_count + 1 // logical first = 1 (we will duplicate to 0000 later)

    const c = createGraphics(w, h)
    c.pixelDensity(1)
    drawFrame(c)

    c.elt.toBlob((blob) => {
        if (!blob) {
            console.warn("Blob null, skipping frame", displayIndex)
            isCapturingFrame = false
            c.remove()
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const frameName = `frame_${displayIndex.toString().padStart(4, "0")}.png`
            framePaths.push(frameName)
            ffmpeg.FS("writeFile", frameName, new Uint8Array(reader.result))
            frame_count++
            isCapturingFrame = false
            if (frame_count >= totalFrames) end_rec_mp4()
        }
        reader.readAsArrayBuffer(blob)
        c.remove()
    }, "image/png")
}

async function end_rec_mp4() {
    frameRateUi = 60
    frameRate(parseInt(ui_data.fps))
    saveMP4 = false
    noLoop()

    const isTransparent = ui_data.transparent_background || axis_logo.bezierSelo.paths.length != 0
    const format = isTransparent ? "mov" : "mp4"
    const outputFile = `output.${format}`

    const statusElement = document.createElement("div")
    statusElement.style.position = "fixed"
    statusElement.style.top = "50%"
    statusElement.style.left = "50%"
    statusElement.style.transform = "translate(-50%, -50%)"
    statusElement.style.background = "rgba(0, 0, 0, 0.7)"
    statusElement.style.color = "white"
    statusElement.style.padding = "20px"
    statusElement.style.borderRadius = "10px"
    statusElement.style.zIndex = "9999"
    statusElement.innerHTML = `Encoding ${isTransparent ? "transparent MOV" : "MP4"} video... Please wait.`
    document.body.appendChild(statusElement)

    const cleanupTemp = () => {
        framePaths.forEach((p) => {
            try {
                ffmpeg.FS("unlink", p)
            } catch {}
        })
        try {
            ffmpeg.FS("unlink", outputFile)
        } catch {}
        framePaths = []
    }

    try {
        let ffmpegArgs
        if (isTransparent) {
            ffmpegArgs = [
                "-framerate",
                ui_data.fps,
                "-start_number",
                "1",
                "-i",
                "frame_%04d.png",
                "-c:v",
                "png",
                "-pix_fmt",
                "rgba",
                "-movflags",
                "+faststart",
                outputFile,
            ]
        } else {
            // Duplicate first frame as frame_0000.png (QuickTime / Figma preroll)
            try {
                const first = ffmpeg.FS("readFile", "frame_0001.png")
                ffmpeg.FS("writeFile", "frame_0000.png", first)
            } catch (e) {
                console.warn("Could not duplicate first frame:", e)
            }
            const fpsInt = parseInt(ui_data.fps)

            if (ui_data.qualidade_mp4 == "alta") {
                ffmpegArgs = [
                    "-framerate",
                    ui_data.fps,
                    "-start_number",
                    "0",
                    "-i",
                    "frame_%04d.png",
                    "-c:v",
                    "libx264",
                    "-crf",
                    "16",
                    "-preset",
                    "medium",
                    "-tune",
                    "animation",
                    "-g",
                    String(fpsInt),
                    "-keyint_min",
                    String(fpsInt),
                    "-bf",
                    "0",
                    "-x264-params",
                    `keyint=${fpsInt}:min-keyint=${fpsInt}:scenecut=0:open-gop=0:bframes=0:ref=3`,
                    "-pix_fmt",
                    "yuv420p",
                    "-profile:v",
                    "high",
                    "-level",
                    "4.0",
                    "-color_primaries",
                    "bt709",
                    "-color_trc",
                    "bt709",
                    "-colorspace",
                    "bt709",
                    "-movflags",
                    "+faststart",
                    outputFile,
                ]
            } else if (ui_data.qualidade_mp4 == "media") {
                ffmpegArgs = [
                    "-framerate",
                    ui_data.fps,
                    "-start_number",
                    "0",
                    "-i",
                    "frame_%04d.png",
                    "-c:v",
                    "libx264",
                    "-crf",
                    "23",
                    "-preset",
                    "fast",
                    "-tune",
                    "animation",
                    "-g",
                    String(fpsInt),
                    "-keyint_min",
                    String(fpsInt),
                    "-bf",
                    "0",
                    "-x264-params",
                    `keyint=${fpsInt}:min-keyint=${fpsInt}:scenecut=0:bframes=0`,
                    "-pix_fmt",
                    "yuv420p",
                    "-movflags",
                    "+faststart",
                    outputFile,
                ]
            } else {
                // Low quality
                ffmpegArgs = [
                    "-framerate",
                    ui_data.fps,
                    "-start_number",
                    "0",
                    "-i",
                    "frame_%04d.png",
                    "-c:v",
                    "libx264",
                    "-crf",
                    "28",
                    "-preset",
                    "veryfast",
                    "-g",
                    String(fpsInt * 2),
                    "-pix_fmt",
                    "yuv420p",
                    "-threads",
                    "1",
                    "-movflags",
                    "+faststart",
                    outputFile,
                ]
            }
        }

        await ffmpeg.run(...ffmpegArgs)

        const data = ffmpeg.FS("readFile", outputFile)
        const mimeType = isTransparent ? "video/quicktime" : "video/mp4"
        const blob = new Blob([data.buffer], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = nameFile() + "." + format
        a.click()
        URL.revokeObjectURL(url)
        cleanupTemp()
    } catch (error) {
        console.error("FFmpeg encoding error:", error)
        alert(`Error encoding ${format.toUpperCase()} video.`)
    } finally {
        document.body.removeChild(statusElement)
        frame_count = 0
        loop()
    }
}

///////////////// PNG frames //////////////////

function start_rec_png() {
    // makeLogo()
    resetTotalFrames()
    frameRate(5)
    frameRateUi = 1
    // frame_count = 0
    reset_time()
    saveFramesPNG = !saveFramesPNG
    if (!saveFramesPNG) {
        // frame_count = 0
        reset_time()
        frameRate(parseInt(ui_data.fps))
        zip.remove("png")
    }
}

function save_frame_png() {
    var canvas = createGraphics(parseInt(ui_data.exportW), parseInt(ui_data.exportH))
    canvas.pixelDensity(1)
    drawFrame(canvas)

    canvas.elt.toBlob((blob) => {
        zip.folder("png").file("ELETROBRAS_" + ("000" + frame_count).slice(-4) + ".png", blob)
    })

    canvas.remove()
    if (frame_count < totalFrames - 1) frame_count++
    else end_rec_png()
}

function end_rec_png() {
    processingZIP = true
    zip.generateAsync({ type: "blob" }).then(function (content) {
        processingZIP = false
        saveAs(content, nameFile() + ".zip")
        zip.remove("png")
        loop()
    })
    saveFramesPNG = false
    frame_count = 0
    frameRate(parseInt(ui_data.fps))
}

///////////////// SVG frames //////////////////

function start_rec_svg() {
    // makeLogo()
    resetTotalFrames()
    // frameRate(5)
    frameRateUi = 1
    // frame_count = 0
    reset_time()
    saveFramesSVG = !saveFramesSVG
    if (!saveFramesSVG) {
        // frame_count = 0
        reset_time()
        frameRate(parseInt(ui_data.fps))
        zip.remove("svg")
    }
}

function save_frame_svg() {
    // Correct: width, height, renderer
    const w = parseInt(ui_data.exportW)
    const h = parseInt(ui_data.exportH)
    const canvas = createGraphics(w, h, SVG)
    canvas.pixelDensity(1)
    drawFrame(canvas)

    // Try new API first
    let svgString = ""
    try {
        if (canvas._renderer && canvas._renderer.svg) {
            svgString = new XMLSerializer().serializeToString(canvas._renderer.svg)
        } else if (canvas.elt) {
            // Older fallback paths
            if (canvas.elt.svg) {
                svgString = new XMLSerializer().serializeToString(canvas.elt.svg)
            } else if (canvas.elt.ctx && canvas.elt.ctx.getSvg) {
                svgString = canvas.elt.ctx.getSvg().outerHTML
            }
        }
    } catch (e) {
        console.warn("SVG extraction failed:", e)
    }

    if (!svgString) {
        console.warn("Empty SVG frame; skipping content for frame", frame_count)
        svgString = "<!-- empty svg frame " + frame_count + " -->"
    }

    // Use frame_count (nFrames was undefined)
    zip.folder("svg").file("ELETROBRAS_" + ("000" + frame_count).slice(-4) + ".svg", svgString)

    canvas.remove()

    if (frame_count < totalFrames - 1) frame_count++
    else end_rec_svg()
}

function end_rec_svg() {
    processingZIP = true
    zip.generateAsync({ type: "blob" }).then(function (content) {
        processingZIP = false
        saveAs(content, nameFile() + ".zip")
        zip.remove("svg")
        loop()
    })
    saveFramesSVG = false
    frame_count = 0
    frameRate(parseInt(ui_data.fps))
}

///////////////// PRESETS //////////////////

function savePreset() {
    let mergedData = Object.assign({}, { ui_data: ui_data, noise_seed: noise_seed })
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mergedData))
    let downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", nameFile() + ".json")
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    //saves ui_data to a .json file
}

function loadPresetData(data) {
    console.log(data)
    // Load the preset data into the UI
    let bkp_presets_denditros = ui_data.presets_denditros
    let bkp_preset_cor = ui_data.preset_cor
    let bkp_preset_tamanho = ui_data.preset_tamanho
    // let bkp_camera_posicao = ui_data.camera_posicao
    let bkp_versao_logo = ui_data.versao_logo

    ui_data = Object.assign(ui_data, data.data.ui_data)

    // Restore the previous preset selection
    ui_data.presets_denditros = bkp_presets_denditros
    ui_data.preset_cor = bkp_preset_cor
    ui_data.preset_tamanho = bkp_preset_tamanho
    // ui_data.camera_posicao = bkp_camera_posicao
    ui_data.versao_logo = bkp_versao_logo
    // Refresh the UI elements
    console.log(ui_data)
    ui_left.refresh()
    // presetTamanho()
    // presetCor()
    // makeLogo()

    resetNoise(data.data.noise_seed)
}

function resetPreset() {
    loadPresetData({ data: { ui_data: bkp_settings, noise_seed: noise_seed } })
}

// function setPreset() {
//     loadPresetData({ data: presetsJSON[parseInt(ui_data.presets_denditros)] })
// }

function loadImage(v) {
    if (v.type == "image") {
        img_textura = loadImage(v.data, () => {
            makeLogo()
        })
    }
}
